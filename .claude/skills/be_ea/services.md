# EA Module Services

This document describes all services in the EA (Entity Analyze) module.

---

## Service Overview

| Service | Purpose |
|---------|---------|
| `EaProjectService` | Project lifecycle management |
| `EaSourceFileService` | File upload and storage |
| `EaFileParserService` | Multi-format file parsing |
| `EaFileUploadService` | File upload handling |
| `EaFileValidationService` | File validation |
| `EaHeaderDetectionService` | Header row detection |
| `EaAnalysisService` | Main analysis orchestration |
| `EaColumnAnalysisService` | Column-level analysis |
| `EaColumnService` | Column entity management |
| `EaDataTypeDetectionService` | Data type detection algorithms |
| `EaRelationshipDetectionService` | PK/FK detection |
| `EaChoicePatternService` | XOR pattern detection |
| `EaDataQualityService` | Quality metrics calculation |
| `EaModelDraftService` | Model draft generation/validation |
| `EaModelDraftGenerationService` | Detailed draft generation |
| `EaModelDraftValidationService` | Draft validation |
| `EaModelDraftExportService` | Export to EM module |
| `EaImportConfigDraftService` | Import config generation |
| `EaImportConfigGenerationService` | Detailed config generation |
| `EaImportConfigExportService` | Export to EI module |
| `EaImportFieldMappingService` | Field mapping assistance |
| `EaImportSearchStrategyService` | Search strategy generation |
| `EaToEmTypeMapper` | EA to EM type mapping |
| `EaOpenAiService` | AI-assisted analysis |

---

## EaProjectService

Project lifecycle and status management.

### Methods

```java
// Get project by ID
Optional<EaProject> getProject(Long id)

// Get project by ID or throw exception
EaProject getDefinedProject(Long id)

// Update project status
void updateStatus(Long projectId, EaProjectStatus status)

// Update project status with error details
void updateStatus(Long projectId, EaProjectStatus status, String errorDetails)

// Save project
EaProject save(EaProject project)
```

---

## EaSourceFileService

File upload, storage, and preview.

### Methods

```java
// Upload file to project
EaSourceFile uploadFile(Long projectId, MultipartFile file)

// Get file preview
Map<String, Object> getPreview(Long sourceFileId, int rowLimit)

// Get source files for project
List<EaSourceFile> getSourceFilesForProject(EaProject project)

// Save source file
EaSourceFile save(EaSourceFile sourceFile)
```

### Preview Response Structure

```json
{
  "sourceFile": { /* EaSourceFile DTO */ },
  "rows": [
    ["value1", "value2", "value3"],
    ["value4", "value5", "value6"]
  ],
  "rowCount": 100,
  "columnCount": 3
}
```

---

## EaFileParserService

Multi-format file parsing with auto-detection.

### Methods

```java
// Parse file for analysis (up to MAX_ANALYSIS_ROWS)
List<List<String>> parseForAnalysis(byte[] content, EaSourceFile sourceFile)

// Parse file for preview (up to specified limit)
List<List<String>> parseForPreview(byte[] content, EaSourceFile sourceFile, int rowLimit)

// Detect file type from content/filename
EaFileType detectFileType(String filename, byte[] content)

// Detect encoding
String detectEncoding(byte[] content)

// Detect CSV delimiter
String detectDelimiter(byte[] content, String encoding)
```

### Supported Formats

| Format | Extension | Parser |
|--------|-----------|--------|
| CSV | .csv | Apache Commons CSV |
| TSV | .tsv | Apache Commons CSV (tab delimiter) |
| XLSX | .xlsx | Apache POI XSSF |
| XLS | .xls | Apache POI HSSF |
| JSON | .json | Jackson ObjectMapper |

---

## EaHeaderDetectionService

Automatic header row detection.

### Methods

```java
// Detect header in rows
HeaderDetectionResult detectHeader(List<List<String>> rows)
```

### HeaderDetectionResult

```java
public record HeaderDetectionResult(
    boolean hasHeader,
    int headerRowIndex,
    double confidence
) {}
```

### Detection Algorithm

1. Compare first row against subsequent rows
2. Check for type differences (header text vs data)
3. Check for keyword patterns (ID, Name, Date, etc.)
4. Calculate confidence based on multiple heuristics

---

## EaAnalysisService

Main analysis orchestration - coordinates all analysis steps.

### Methods

```java
// Analyze source file (main entry point)
@Transactional
EaAnalysisResult analyzeSourceFile(Long sourceFileId)
```

### Analysis Pipeline

1. Get file content from DM module
2. Parse file using `EaFileParserService`
3. Detect header using `EaHeaderDetectionService`
4. Analyze each column using `EaColumnAnalysisService`
5. Detect PK potential using `EaRelationshipDetectionService`
6. Detect FK relationships between columns
7. Detect choice patterns using `EaChoicePatternService`
8. Analyze data quality using `EaDataQualityService`
9. Update project status

---

## EaColumnAnalysisService

Column-level analysis including type detection, statistics, and PII detection.

### Methods

```java
// Analyze single column
ColumnAnalysisResult analyzeColumn(List<String> values, int columnIndex, String header)
```

### ColumnAnalysisResult

```java
public record ColumnAnalysisResult(
    EaColumn column,
    List<EaColumnValue> valueList
) {}
```

### Analysis Steps

1. Calculate basic statistics (min/max/avg length, null count)
2. Detect data type using `EaDataTypeDetectionService`
3. Detect PII type from header keywords and data patterns
4. Build value list if unique values <= 50
5. Calculate uniqueness and quality scores

---

## EaDataTypeDetectionService

Data type detection with confidence scoring.

### Methods

```java
// Detect data type from values
DataTypeResult detectDataType(List<String> values)

// Detect date format pattern
String detectDateFormat(List<String> values)

// Detect decimal precision
Integer detectDecimalPrecision(List<String> values)
```

### DataTypeResult

```java
public record DataTypeResult(
    EaDataType dataType,
    double confidence
) {}
```

### Detection Priority

```
UUID > IBAN > EMAIL > URL > PHONE > DATETIME > DATE > DECIMAL > INTEGER > BOOLEAN > STRING
```

### Pattern Matching

| Type | Pattern |
|------|---------|
| UUID | `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-...$` |
| IBAN | `^[A-Z]{2}\d{2}[A-Z0-9]{4,}$` |
| EMAIL | `^[a-zA-Z0-9._%+-]+@...` |
| URL | `^(https?|ftp)://...` |
| PHONE | `^[+]?[0-9\s\-()]{7,20}$` |
| DATE | Various patterns (ISO, DE, US, JP) |
| DATETIME | Various patterns with time component |
| BOOLEAN | `^(true|false|yes|no|ja|nein|1|0)$` |
| INTEGER | `^-?\d+$` |
| DECIMAL | `^-?\d+([.,]\d+)?$` |

---

## EaRelationshipDetectionService

Primary key and foreign key detection.

### Methods

```java
// Detect if column is potential primary key
PrimaryKeyResult detectPrimaryKey(EaColumn column, List<String> values)

// Detect FK relationships between columns
List<EaColumnRelationship> detectRelationships(
    List<EaColumn> columns,
    Map<EaColumn, List<String>> columnValues
)
```

### PrimaryKeyResult

```java
public record PrimaryKeyResult(
    boolean isPrimaryKey,
    double confidence
) {}
```

### Detection Criteria

**Primary Key:**
- Column is unique (100% distinct values)
- No null values
- Column name contains "id" or ends with "_id"
- Integer or UUID type preferred

**Foreign Key:**
- Value overlap >= 80% with another column
- Target column is potential PK
- Naming pattern matches (_id suffix, references)

---

## EaChoicePatternService

Detection of XOR (mutually exclusive) column patterns.

### Methods

```java
// Detect choice patterns between columns
List<EaChoicePattern> detectChoicePatterns(
    List<EaColumn> columns,
    List<List<String>> dataRows
)
```

### Detection Algorithm

1. For each pair of columns
2. Calculate mutual exclusivity:
   - % where A filled, B empty
   - % where A empty, B filled
   - % where both filled
3. If sum of first two >= 90%, flag as choice pattern

---

## EaDataQualityService

Data quality assessment and scoring.

### Methods

```java
// Analyze quality for analysis result
EaDataQualityResult analyzeQuality(
    EaAnalysisResult analysisResult,
    List<List<String>> dataRows
)

// Calculate quality score for single column
Double calculateColumnQualityScore(EaColumn column)
```

### Quality Metrics

| Metric | Description |
|--------|-------------|
| Completeness | % of non-null values |
| Validity | % of values matching expected type |
| Consistency | Uniformity of formats |
| Uniqueness | For key columns |
| Duplicates | Row-level duplicate detection |

### Scoring Formula

```
Quality = (Completeness * 0.3) + (Validity * 0.3) +
          (Consistency * 0.2) + (NoIssues * 0.2)
```

---

## EaModelDraftService

Model draft generation, validation, and export.

### Methods

```java
// Generate model draft from analysis
@Transactional
EaModelDraft generateDraft(Long projectId)

// Validate draft before export
@Transactional(readOnly = true)
Map<String, Object> validateDraft(Long draftId)

// Export draft to EM module
@Transactional
EaModelDraft exportToEm(Long draftId)

// Get drafts for project
List<EaModelDraft> getModelDraftsForProject(EaProject project)

// Get fields for draft
List<EaModelDraftField> getFieldsForDraft(EaModelDraft draft)
```

### Validation Rules

- Draft name is required
- Draft alias is required
- At least one field is required
- Field names are required
- Field aliases must be unique

### Type Mapping

| EA Type | EM Field Type |
|---------|---------------|
| STRING, EMAIL, PHONE, URL, IBAN, UUID | String |
| INTEGER | Integer |
| DECIMAL | Decimal |
| BOOLEAN | Boolean |
| DATE | Date |
| DATETIME | DateTime |

---

## EaImportConfigDraftService

Import configuration generation and export.

### Methods

```java
// Generate import config draft
@Transactional
EaImportConfigDraft generateDraft(Long projectId, String targetObjectType)

// Export config to EI module
@Transactional
EaImportConfigDraft exportToEi(Long configId)

// Get configs for project
List<EaImportConfigDraft> getImportConfigDraftsForProject(EaProject project)

// Get structures for config
List<EaImportStructureDraft> getStructuresForConfig(EaImportConfigDraft config)

// Get fields for structure
List<EaImportFieldDraft> getFieldsForStructure(EaImportStructureDraft structure)
```

### Generation Flow

1. Create EaImportConfigDraft with target object type
2. Create EaImportStructureDraft for main structure
3. Generate EaImportFieldDraft for each analyzed column
4. Set status to MAPPING_REQUIRED

---

## EaImportFieldMappingService

Automatic field mapping based on name similarity.

### Methods

```java
// Auto-map fields to target attributes
void autoMapFields(EaImportStructureDraft structure, String targetObjectType)

// Calculate field similarity
double calculateSimilarity(String sourceField, String targetAttribute)
```

### Mapping Algorithm

1. Get target entity metadata
2. For each source column:
   - Calculate name similarity with each target attribute
   - Use Levenshtein distance and token matching
   - Assign highest match with confidence score
3. Set mapping confidence (HIGH, MEDIUM, LOW, MANUAL)

---

## EaOpenAiService

AI-assisted analysis features.

### Methods

```java
// Get AI suggestions for data type
String suggestDataType(String columnName, List<String> sampleValues)

// Get AI suggestions for field mapping
String suggestFieldMapping(String sourceColumn, List<String> targetAttributes)

// Analyze data quality issues
String analyzeQualityIssues(EaColumn column, List<String> sampleValues)
```

### Configuration

```java
@Configuration
public class EaOpenAiConfig {
    @Value("${ea.openai.enabled:false}")
    boolean enabled;

    @Value("${ea.openai.model:gpt-4}")
    String model;
}
```
