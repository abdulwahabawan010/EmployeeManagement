# EA Module Analysis Workflow

This document describes the complete analysis pipeline in the EA (Entity Analyze) module.

---

## Overview

The EA module follows a sequential pipeline for analyzing uploaded data files:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────►│   Parse     │────►│   Analyze   │────►│  Generate   │
│    File     │     │    File     │     │   Columns   │     │   Drafts    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
 EaSourceFile        Rows/Cols           EaColumn          EaModelDraft
                                        EaColumnValue   EaImportConfigDraft
```

---

## Phase 1: File Upload

### Trigger
- User uploads file via frontend
- API: `POST /mvsa/ea/eaSourceFiles/upload/{projectId}`

### Process

```
1. Validate project exists and is in DRAFT status
2. Update project status to UPLOADING
3. Detect file type from extension and content
4. Store file in DM module (DmDocument)
5. Create EaSourceFile record
6. Return to DRAFT status (ready for analysis)
```

### File Type Detection

```java
// Detection order:
1. Check magic bytes (file signature)
2. Check file extension
3. Fallback to extension-based detection

// Supported magic bytes:
XLSX: 0x50 0x4B (PK - ZIP archive)
XLS:  0xD0 0xCF (OLE Compound Document)
JSON: 0x5B or 0x7B ([ or {)
CSV:  Text-based, no magic bytes
```

### Encoding Detection

```java
// Detection order:
1. Check for BOM (Byte Order Mark)
   - UTF-8 BOM: 0xEF 0xBB 0xBF
   - UTF-16 LE: 0xFF 0xFE
   - UTF-16 BE: 0xFE 0xFF
2. Try UTF-8 parsing
3. Fallback to ISO-8859-1
```

### Delimiter Detection (CSV/TSV)

```java
// Frequency analysis:
1. Read first 5 rows
2. Count occurrences of: , ; | \t
3. Select delimiter with consistent count across rows
4. Default to comma if inconclusive
```

---

## Phase 2: File Parsing

### Trigger
- Part of analysis phase
- Called by `EaAnalysisService.analyzeSourceFile()`

### Process

```
1. Get file content from DmDocument
2. Determine parser based on file type
3. Parse rows up to MAX_ANALYSIS_ROWS (10,000)
4. Detect header row
5. Return List<List<String>> of data
```

### Header Detection Algorithm

```java
HeaderDetectionResult detectHeader(List<List<String>> rows) {
    if (rows.isEmpty()) return noHeader();

    List<String> firstRow = rows.get(0);
    List<String> secondRow = rows.size() > 1 ? rows.get(1) : null;

    double score = 0.0;

    // Check 1: First row contains header keywords
    for (String cell : firstRow) {
        if (isHeaderKeyword(cell)) score += 0.2;
    }

    // Check 2: Type differences between rows
    if (secondRow != null) {
        for (int i = 0; i < firstRow.size(); i++) {
            if (isDifferentType(firstRow.get(i), secondRow.get(i))) {
                score += 0.15;
            }
        }
    }

    // Check 3: First row has no nulls
    if (firstRow.stream().noneMatch(String::isEmpty)) {
        score += 0.1;
    }

    return new HeaderDetectionResult(
        score >= HEADER_CONFIDENCE_THRESHOLD,
        0,
        Math.min(score, 1.0)
    );
}
```

### Header Keywords

```
German: id, name, bezeichnung, beschreibung, datum, status, typ,
        nummer, adresse, email, telefon, preis, menge, betrag

English: id, name, description, date, status, type, number,
         address, email, phone, price, quantity, amount
```

---

## Phase 3: Column Analysis

### Trigger
- Called for each column during analysis
- `EaColumnAnalysisService.analyzeColumn()`

### Process

```
For each column:
1. Extract column values from all data rows
2. Calculate basic statistics
3. Detect data type with confidence
4. Detect PII type
5. Build value list (if unique values <= 50)
6. Calculate quality score
7. Detect PK potential
```

### Data Type Detection Pipeline

```
Input: List<String> values

1. Filter out null and empty values
2. Try each type pattern in priority order:
   UUID → IBAN → EMAIL → URL → PHONE → DATETIME → DATE →
   DECIMAL → INTEGER → BOOLEAN → STRING

3. For each type:
   - Calculate match percentage
   - If >= 80%, return with confidence

4. If no match >= 80%, default to STRING
```

### PII Detection Pipeline

```
Input: String columnHeader, List<String> values

1. Check header against PII keyword list
   - NAME keywords → PiiType.NAME
   - EMAIL keywords → PiiType.EMAIL
   - etc.

2. If no keyword match, infer from data type:
   - EMAIL type → PiiType.EMAIL
   - PHONE type → PiiType.PHONE
   - IBAN type → PiiType.FINANCIAL

3. Assign sensitivity level based on PII type
```

### Value List Generation

```java
if (uniqueValueCount <= VALUE_LIST_THRESHOLD) {  // 50
    Map<String, Integer> frequency = new HashMap<>();
    for (String value : values) {
        frequency.merge(value, 1, Integer::sum);
    }

    List<EaColumnValue> valueList = frequency.entrySet()
        .stream()
        .sorted(comparing(Entry::getValue).reversed())
        .map(e -> createColumnValue(e.getKey(), e.getValue(), totalCount))
        .toList();

    column.setHasValueList(true);
    return valueList;
}
```

---

## Phase 4: Relationship Detection

### Trigger
- After all columns are analyzed
- `EaRelationshipDetectionService.detectRelationships()`

### Primary Key Detection

```
Score calculation:
1. Base score = 0.0

2. Uniqueness check:
   - If 100% unique values: +0.4
   - If > 95% unique: +0.2

3. Null check:
   - If 0% nulls: +0.3
   - If < 5% nulls: +0.1

4. Name pattern check:
   - Contains "id" or ends with "_id": +0.2

5. Type check:
   - INTEGER or UUID: +0.1

If score >= 0.8: Mark as PRIMARY_KEY
```

### Foreign Key Detection

```
For each pair of columns (A, B):
1. Skip if A == B
2. Skip if B is not a potential PK

3. Calculate value overlap:
   overlap = |values(A) ∩ values(B)| / |values(A)|

4. If overlap >= 0.8 (FK_VALUE_OVERLAP_THRESHOLD):
   - Create EaColumnRelationship
   - Set sourceColumn = A
   - Set targetColumn = B
   - Set relationshipType = FOREIGN_KEY
   - Set confidence = overlap
```

---

## Phase 5: Choice Pattern Detection

### Trigger
- After relationship detection
- `EaChoicePatternService.detectChoicePatterns()`

### Detection Algorithm

```
For each pair of columns (A, B):
1. Initialize counters:
   - aFilledBEmpty = 0
   - aEmptyBFilled = 0
   - bothFilled = 0
   - total = 0

2. For each row:
   aHasValue = row[A] is not empty
   bHasValue = row[B] is not empty

   if (aHasValue && !bHasValue) aFilledBEmpty++
   if (!aHasValue && bHasValue) aEmptyBFilled++
   if (aHasValue && bHasValue) bothFilled++
   total++

3. Calculate percentages:
   pctANotB = aFilledBEmpty / total
   pctBNotA = aEmptyBFilled / total
   pctBoth = bothFilled / total

4. If (pctANotB + pctBNotA) >= 0.9 && pctBoth <= 0.1:
   - Create EaChoicePattern
   - Set status = DETECTED
   - Set confidence = (pctANotB + pctBNotA)
```

---

## Phase 6: Data Quality Analysis

### Trigger
- After column analysis
- `EaDataQualityService.analyzeQuality()`

### Quality Metrics

```
1. Completeness (30% weight):
   score = (totalValues - nullValues) / totalValues

2. Validity (30% weight):
   score = validValues / totalValues
   (based on detected data type)

3. Consistency (20% weight):
   score = 1 - (formatVariations / uniqueFormats)

4. Issue-Free (20% weight):
   score = 1 - (whitespaceIssues + specialCharIssues) / totalValues

Overall = sum(score * weight)
```

### Duplicate Detection

```
1. Create hash of each row (all columns concatenated)
2. Count occurrences of each hash
3. fullDuplicates = rows with hash count > 1
4. duplicatePercentage = fullDuplicates / totalRows * 100
```

---

## Phase 7: Draft Generation

### Model Draft Generation

```
1. Create EaModelDraft:
   - name = project.name + " Schema"
   - alias = project.alias + "_schema"
   - status = DRAFT

2. For each EaColumn in analysis result:
   Create EaModelDraftField:
   - name = column.name or column.detectedHeader
   - alias = generateAlias(name)
   - sourceDataType = column.dataType
   - targetFieldType = mapToEmType(column.dataType)
   - length = calculateLength(column)
   - decimals = column.decimalPrecision
   - nullable = column.nullable
   - hasValueList = column.hasValueList
```

### Import Config Generation

```
1. Create EaImportConfigDraft:
   - name = project.name + " Import"
   - alias = project.alias + "_import"
   - status = MAPPING_REQUIRED
   - targetObjectType = user-specified

2. Create EaImportStructureDraft:
   - name = "Main Structure"
   - alias = "main"
   - targetObjectType = same as config

3. For each EaColumn in analysis result:
   Create EaImportFieldDraft:
   - sourceColumn = column
   - sourceColumnName = column.name
   - sortOrder = index
   - (targetAttribute left empty for auto-mapping)
```

---

## Phase 8: Export

### Export to EM Module

```
1. Validate draft (name, alias, unique field aliases)
2. Create EmSchema from EaModelDraft
3. Create EmSchemaField for each EaModelDraftField
4. Update draft status = EXPORTED
5. Set draft.exportedSchema = created schema
6. Set draft.exportedAt = now
7. Update project status = COMPLETED
```

### Export to EI Module

```
1. Validate all required mappings are complete
2. Create EiImportType from EaImportConfigDraft
3. Create EiImportStructure for each EaImportStructureDraft
4. Create EiImportField for each EaImportFieldDraft
5. Update config status = EXPORTED
6. Set config.exportedImportType = created type
7. Set config.exportedAt = now
```

---

## Status Flow Summary

```
Project:
DRAFT → UPLOADING → DRAFT → ANALYZING → ANALYZED → MODELING → COMPLETED
                                                        ↓
                                                      ERROR

Model Draft:
DRAFT → APPROVED → EXPORTED

Import Config:
DRAFT → MAPPING_REQUIRED → READY_FOR_REVIEW → APPROVED → EXPORTED
```

---

## Key Constants

```java
MAX_PREVIEW_ROWS = 1000          // Preview row limit
MAX_ANALYSIS_ROWS = 10000        // Analysis row limit
VALUE_LIST_THRESHOLD = 50        // Max unique values for value list
HEADER_CONFIDENCE_THRESHOLD = 0.8 // Header detection threshold
CHOICE_PATTERN_THRESHOLD = 0.9   // XOR pattern detection threshold
FK_VALUE_OVERLAP_THRESHOLD = 0.8 // FK detection threshold
DATA_TYPE_CONFIDENCE_THRESHOLD = 0.8 // Type detection threshold
```
