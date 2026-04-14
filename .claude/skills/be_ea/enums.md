# EA Module Enums

This document describes all enumeration types in the EA (Entity Analyze) module.

---

## EaProjectStatus

Project lifecycle status.

```java
public enum EaProjectStatus implements AlphaBaseEnum {
    DRAFT,      // Initial state, ready for file upload
    UPLOADING,  // File upload in progress
    ANALYZING,  // Analysis in progress
    ANALYZED,   // Analysis complete, ready for modeling
    MODELING,   // Model draft generation in progress
    COMPLETED,  // Project completed (exported)
    ERROR       // Error occurred during processing
}
```

### State Transitions

```
DRAFT → UPLOADING → ANALYZING → ANALYZED → MODELING → COMPLETED
          ↓             ↓            ↓           ↓
        ERROR        ERROR        ERROR       ERROR
```

---

## EaFileType

Supported file types for analysis.

```java
public enum EaFileType implements AlphaBaseEnum {
    CSV,   // Comma-separated values
    XLSX,  // Excel 2007+ (Open XML)
    XLS,   // Excel 97-2003 (BIFF)
    JSON,  // JSON arrays
    TSV    // Tab-separated values
}
```

### File Type Detection

| Extension | MIME Type | EaFileType |
|-----------|-----------|------------|
| .csv | text/csv | CSV |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | XLSX |
| .xls | application/vnd.ms-excel | XLS |
| .json | application/json | JSON |
| .tsv | text/tab-separated-values | TSV |

---

## EaDataType

Detected data types for columns.

```java
public enum EaDataType implements AlphaBaseEnum {
    STRING,    // Generic text
    INTEGER,   // Whole numbers
    DECIMAL,   // Numbers with decimal places
    BOOLEAN,   // true/false, yes/no, 1/0
    DATE,      // Date only
    DATETIME,  // Date with time
    EMAIL,     // Email addresses
    PHONE,     // Phone numbers
    URL,       // Web URLs
    IBAN,      // International Bank Account Numbers
    UUID       // Universally Unique Identifiers
}
```

### Detection Priority

Types are detected in this order (higher priority first):

1. UUID
2. IBAN
3. EMAIL
4. URL
5. PHONE
6. DATETIME
7. DATE
8. DECIMAL
9. INTEGER
10. BOOLEAN
11. STRING (default)

### Mapping to EM Field Types

| EaDataType | EM Field Type |
|------------|---------------|
| STRING | String |
| INTEGER | Integer |
| DECIMAL | Decimal |
| BOOLEAN | Boolean |
| DATE | Date |
| DATETIME | DateTime |
| EMAIL | String |
| PHONE | String |
| URL | String |
| IBAN | String |
| UUID | String |

---

## EaPiiType

Types of Personally Identifiable Information.

```java
public enum EaPiiType implements AlphaBaseEnum {
    NONE,       // No PII detected
    NAME,       // Person names
    ADDRESS,    // Physical addresses
    EMAIL,      // Email addresses
    PHONE,      // Phone numbers
    FINANCIAL,  // Bank accounts, credit cards
    ID_NUMBER,  // National IDs, passport numbers
    HEALTH,     // Medical/health data
    BIRTHDATE,  // Birth dates
    IP_ADDRESS  // IP addresses
}
```

### PII Detection Keywords (German + English)

| PII Type | Keywords |
|----------|----------|
| NAME | name, vorname, nachname, firstname, lastname |
| EMAIL | email, e-mail, mail |
| PHONE | phone, telefon, mobile, handy |
| ADDRESS | address, adresse, street, straße, plz, zip |
| FINANCIAL | iban, bic, konto, account, bank |
| ID_NUMBER | ssn, sozialversicherung, passport, ausweis |
| BIRTHDATE | geburtsdatum, birthdate, dob, birthday |
| HEALTH | diagnosis, medication, krankheit |

---

## EaSensitivityLevel

Data sensitivity classification.

```java
public enum EaSensitivityLevel implements AlphaBaseEnum {
    NONE,      // No sensitivity
    LOW,       // Low sensitivity (public data)
    MEDIUM,    // Medium sensitivity (internal data)
    HIGH,      // High sensitivity (confidential)
    CRITICAL   // Critical sensitivity (PII, financial)
}
```

### Auto-Assignment Rules

| Condition | Sensitivity Level |
|-----------|-------------------|
| PII Type = NONE | NONE |
| PII Type = NAME | MEDIUM |
| PII Type = EMAIL | MEDIUM |
| PII Type = PHONE | MEDIUM |
| PII Type = ADDRESS | MEDIUM |
| PII Type = FINANCIAL | CRITICAL |
| PII Type = ID_NUMBER | CRITICAL |
| PII Type = HEALTH | CRITICAL |
| PII Type = BIRTHDATE | HIGH |
| PII Type = IP_ADDRESS | LOW |

---

## EaRelationshipType

Column relationship types.

```java
public enum EaRelationshipType implements AlphaBaseEnum {
    NONE,              // No relationship detected
    PRIMARY_KEY,       // Unique identifier for the record
    FOREIGN_KEY,       // References another column/table
    COMPOSITE_KEY,     // Part of a multi-column key
    PARENT_REFERENCE   // Hierarchical parent reference
}
```

### Detection Criteria

| Relationship | Criteria |
|--------------|----------|
| PRIMARY_KEY | Unique values, no nulls, ID-like naming |
| FOREIGN_KEY | 80%+ value overlap with a PK column |
| COMPOSITE_KEY | Multiple columns form unique combination |
| PARENT_REFERENCE | Self-referencing ID column |

---

## EaChoicePatternStatus

Status of choice (XOR) pattern detection.

```java
public enum EaChoicePatternStatus implements AlphaBaseEnum {
    NONE,       // No pattern detected
    DETECTED,   // Pattern auto-detected
    CONFIRMED   // Pattern confirmed by user
}
```

---

## EaModelDraftStatus

Model draft lifecycle status.

```java
public enum EaModelDraftStatus implements AlphaBaseEnum {
    DRAFT,     // Draft created, editable
    APPROVED,  // Approved for export
    EXPORTED   // Exported to EM module
}
```

### State Transitions

```
DRAFT → APPROVED → EXPORTED
```

---

## EaImportConfigStatus

Import configuration lifecycle status.

```java
public enum EaImportConfigStatus implements AlphaBaseEnum {
    DRAFT,             // Initial draft
    MAPPING_REQUIRED,  // Field mappings need completion
    READY_FOR_REVIEW,  // Mappings complete, ready for review
    APPROVED,          // Approved for export
    EXPORTED           // Exported to EI module
}
```

### State Transitions

```
DRAFT → MAPPING_REQUIRED → READY_FOR_REVIEW → APPROVED → EXPORTED
```

---

## EaFieldMappingConfidence

Confidence level for auto-mapped fields.

```java
public enum EaFieldMappingConfidence implements AlphaBaseEnum {
    HIGH,    // > 90% name similarity
    MEDIUM,  // 70-90% name similarity
    LOW,     // 50-70% name similarity
    MANUAL   // Manually mapped by user
}
```

### Confidence Thresholds

| Confidence | Similarity Score |
|------------|------------------|
| HIGH | >= 0.90 |
| MEDIUM | >= 0.70 and < 0.90 |
| LOW | >= 0.50 and < 0.70 |
| MANUAL | User-defined |

---

## Usage Examples

### Checking Project Status

```java
EaProject project = projectService.getDefinedProject(projectId);

if (project.getStatus() == EaProjectStatus.ANALYZED) {
    // Ready to generate model draft
    modelDraftService.generateDraft(projectId);
}

if (project.getStatus() == EaProjectStatus.ERROR) {
    // Handle error
    String errorDetails = project.getErrorDetails();
}
```

### Working with PII Types

```java
EaColumn column = columnService.getColumn(columnId);

if (column.getPiiType() != EaPiiType.NONE) {
    // Column contains sensitive data
    if (column.getSensitivityLevel() == EaSensitivityLevel.CRITICAL) {
        // Flag for compliance review
    }
}
```

### Checking Relationship Types

```java
List<EaColumn> columns = columnService.getColumnsForAnalysisResult(result);

List<EaColumn> primaryKeys = columns.stream()
    .filter(c -> c.getRelationshipType() == EaRelationshipType.PRIMARY_KEY)
    .toList();

List<EaColumn> foreignKeys = columns.stream()
    .filter(c -> c.getRelationshipType() == EaRelationshipType.FOREIGN_KEY)
    .toList();
```
