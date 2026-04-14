# EA Module Entities

This document describes all JPA entities in the EA (Entity Analyze) module.

---

## Entity Relationship Diagram

```
┌─────────────┐
│  EaProject  │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────────┐    1:N    ┌───────────────────┐    1:N    ┌──────────────────────┐
│  EaSourceFile   │──────────►│  EaAnalysisResult │──────────►│  EaDataQualityResult │
└─────────────────┘           └─────────┬─────────┘           └──────────────────────┘
       │                                │ 1:N
       │                                ▼
       │                       ┌─────────────┐    1:N    ┌─────────────────┐
       │                       │  EaColumn   │──────────►│  EaColumnValue  │
       │                       └──────┬──────┘           └─────────────────┘
       │                              │
       │                    ┌─────────┼─────────┐
       │                    ▼                   ▼
       │          ┌───────────────────┐  ┌──────────────────┐
       │          │EaColumnRelationship│  │  EaChoicePattern │
       │          └───────────────────┘  └──────────────────┘
       │
       ▼
┌─────────────────┐    1:N    ┌──────────────────────┐
│  EaModelDraft   │──────────►│  EaModelDraftField   │
└─────────────────┘           └──────────────────────┘

┌──────────────────────┐    1:N    ┌─────────────────────────┐    1:N    ┌────────────────────┐
│  EaImportConfigDraft │──────────►│  EaImportStructureDraft │──────────►│  EaImportFieldDraft │
└──────────────────────┘           └─────────────────────────┘           └──────────┬─────────┘
                                                                                    │ 1:N
                                                                                    ▼
                                                                    ┌─────────────────────────────┐
                                                                    │  EaImportValueMappingDraft  │
                                                                    └─────────────────────────────┘
```

---

## EaProject

Root container for analysis projects.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `name` | String | @NotNull, max 120 | Project name |
| `alias` | String | @NotNull, max 80 | Technical alias |
| `description` | String | TEXT | Project description |
| `status` | EaProjectStatus | @NotNull, Enum | Project lifecycle status |
| `domainContext` | String | max 255 | Domain context for analysis hints |
| `errorDetails` | String | TEXT | Error details if status is ERROR |

**Table:** `eaProject`
**Sequence:** `ea_id_project`

---

## EaSourceFile

Uploaded file metadata and parsing results.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `project` | EaProject | @NotNull, FK | Parent project |
| `document` | DmDocument | FK | Document in DM module |
| `name` | String | @NotNull, max 255 | Original filename |
| `fileType` | EaFileType | Enum | Detected file type (CSV, XLSX, etc.) |
| `encoding` | String | max 50 | Detected encoding (UTF-8, ISO-8859-1) |
| `delimiter` | String | max 10 | Detected delimiter for CSV/TSV |
| `fileSize` | Long | - | File size in bytes |
| `rowCount` | Integer | - | Total row count |
| `hasHeader` | Boolean | - | Whether file has header row |
| `headerRowIndex` | Integer | - | Index of header row (0-based) |
| `headerConfidence` | Double | - | Confidence score for header detection |

**Table:** `eaSourceFile`
**Sequence:** `ea_id_source_file`

---

## EaAnalysisResult

Analysis execution results for a source file.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `sourceFile` | EaSourceFile | @NotNull, FK | Source file that was analyzed |
| `analyzedAt` | LocalDateTime | - | Timestamp of analysis |
| `columnCount` | Integer | - | Number of columns detected |
| `analyzedRowCount` | Integer | - | Number of rows analyzed |
| `overallQualityScore` | Double | - | Overall data quality percentage |
| `duplicatePercentage` | Double | - | Percentage of duplicate rows |
| `analysisConfig` | String | TEXT | JSON configuration used for analysis |
| `sampleDataJson` | String | TEXT | JSON sample data (first 100 rows) |

**Table:** `eaAnalysisResult`
**Sequence:** `ea_id_analysis_result`

---

## EaColumn

Column-level analysis data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `analysisResult` | EaAnalysisResult | @NotNull, FK | Parent analysis result |
| `columnIndex` | Integer | @NotNull | Column index (0-based) |
| `detectedHeader` | String | max 255 | Header detected from file |
| `name` | String | max 120 | Confirmed/edited name |
| `alias` | String | max 80 | Technical alias |
| `dataType` | EaDataType | Enum | Detected data type |
| `dataTypeConfidence` | Double | - | Confidence score for type detection |
| `nullable` | Boolean | - | Whether column allows nulls |
| `nullPercentage` | Double | - | Percentage of null values |
| `isUnique` | Boolean | - | Whether all values are unique |
| `uniqueValueCount` | Integer | - | Count of distinct values |
| `hasValueList` | Boolean | - | Whether column has enumerable values |
| `minLength` | Integer | - | Minimum string length |
| `maxLength` | Integer | - | Maximum string length |
| `avgLength` | Double | - | Average string length |
| `minValue` | String | max 255 | Minimum value (for numerics/dates) |
| `maxValue` | String | max 255 | Maximum value (for numerics/dates) |
| `dateFormat` | String | max 50 | Detected date format pattern |
| `decimalPrecision` | Integer | - | Decimal places for DECIMAL type |
| `relationshipType` | EaRelationshipType | Enum | Detected key relationship |
| `primaryKeyScore` | Double | - | Score indicating PK potential |
| `piiType` | EaPiiType | Enum | Type of PII if detected |
| `sensitivityLevel` | EaSensitivityLevel | Enum | Data sensitivity level |
| `qualityScore` | Double | - | Column-level quality score |
| `invalidPercentage` | Double | - | Percentage of invalid values |
| `invalidExamples` | String | TEXT | Sample invalid values |
| `statisticsJson` | String | TEXT | JSON with additional statistics |

**Table:** `eaColumn`
**Sequence:** `ea_id_column`

---

## EaColumnValue

Value frequency analysis for columns with value lists.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `column` | EaColumn | @NotNull, FK | Parent column |
| `value` | String | @NotNull, max 1024 | The distinct value |
| `technicalName` | String | max 80 | Generated technical name |
| `frequency` | Integer | - | Occurrence count |
| `percentage` | Double | - | Percentage of total |
| `sortOrder` | Integer | - | Display order |

**Table:** `eaColumnValue`
**Sequence:** `ea_id_column_value`

---

## EaColumnRelationship

Detected FK/PK relationships between columns.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `sourceColumn` | EaColumn | @NotNull, FK | Source column (FK) |
| `targetColumn` | EaColumn | FK | Target column (PK) |
| `relationshipType` | EaRelationshipType | Enum | Type of relationship |
| `confidence` | Double | - | Detection confidence |
| `valueOverlapPercentage` | Double | - | Percentage of value overlap |
| `description` | String | max 512 | Relationship description |

**Table:** `eaColumnRelationship`
**Sequence:** `ea_id_column_relationship`

---

## EaDataQualityResult

Data quality metrics for an analysis.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `analysisResult` | EaAnalysisResult | @NotNull, FK | Parent analysis result |
| `totalRows` | Integer | - | Total row count |
| `fullDuplicateCount` | Integer | - | Fully duplicate rows |
| `partialDuplicateCount` | Integer | - | Partially duplicate rows |
| `duplicatePercentage` | Double | - | Duplicate percentage |
| `invalidRowCount` | Integer | - | Rows with validation errors |
| `inconsistencyCount` | Integer | - | Data inconsistencies |
| `whitespaceIssueCount` | Integer | - | Whitespace problems |
| `specialCharIssueCount` | Integer | - | Special character issues |
| `overallQualityScore` | Double | - | Overall quality percentage |
| `detailsJson` | String | TEXT | Detailed metrics as JSON |

**Table:** `eaDataQualityResult`
**Sequence:** `ea_id_data_quality_result`

---

## EaChoicePattern

XOR (mutually exclusive) column patterns.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `columnA` | EaColumn | @NotNull, FK | First column in pattern |
| `columnB` | EaColumn | @NotNull, FK | Second column in pattern |
| `status` | EaChoicePatternStatus | Enum | Pattern status |
| `confidence` | Double | - | Detection confidence |
| `aFilledBEmptyPercentage` | Double | - | % where A filled, B empty |
| `aEmptyBFilledPercentage` | Double | - | % where A empty, B filled |
| `bothFilledPercentage` | Double | - | % where both are filled |

**Table:** `eaChoicePattern`
**Sequence:** `ea_id_choice_pattern`

---

## EaModelDraft

Generated schema draft for export to EM module.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `project` | EaProject | @NotNull, FK | Parent project |
| `name` | String | @NotNull, max 120 | Schema name |
| `alias` | String | @NotNull, max 80 | Schema alias |
| `description` | String | TEXT | Schema description |
| `namespace` | String | max 255 | Schema namespace |
| `status` | EaModelDraftStatus | @NotNull, Enum | Draft status |
| `exportedSchema` | EmSchema | FK | Reference to exported EmSchema |
| `exportedAt` | LocalDateTime | - | Export timestamp |
| `validationResultJson` | String | TEXT | Validation results as JSON |

**Table:** `eaModelDraft`
**Sequence:** `ea_id_model_draft`

---

## EaModelDraftField

Field definitions within a model draft.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `modelDraft` | EaModelDraft | @NotNull, FK | Parent model draft |
| `sourceColumn` | EaColumn | FK | Source column from analysis |
| `name` | String | @NotNull, max 120 | Field name |
| `alias` | String | @NotNull, max 80 | Field alias |
| `description` | String | max 512 | Field description |
| `sourceDataType` | EaDataType | Enum | Original data type |
| `targetFieldType` | String | max 50 | Target EM field type |
| `length` | Integer | - | Field length |
| `decimals` | Integer | - | Decimal precision |
| `nullable` | Boolean | - | Whether field is nullable |
| `hasValueList` | Boolean | - | Whether field has value list |
| `valueListJson` | String | TEXT | Value list as JSON |
| `sortOrder` | Integer | - | Field order |

**Table:** `eaModelDraftField`
**Sequence:** `ea_id_model_draft_field`

---

## EaImportConfigDraft

Import configuration draft for export to EI module.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `project` | EaProject | @NotNull, FK | Parent project |
| `name` | String | @NotNull, max 120 | Configuration name |
| `alias` | String | @NotNull, max 80 | Configuration alias |
| `description` | String | TEXT | Configuration description |
| `status` | EaImportConfigStatus | @NotNull, Enum | Configuration status |
| `targetObjectType` | String | max 120 | Target entity type alias |
| `exportedImportType` | EiImportType | FK | Reference to exported EiImportType |
| `exportedAt` | LocalDateTime | - | Export timestamp |

**Table:** `eaImportConfigDraft`
**Sequence:** `ea_id_import_config_draft`

---

## EaImportStructureDraft

Import structure hierarchy within a configuration.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `importConfigDraft` | EaImportConfigDraft | @NotNull, FK | Parent configuration |
| `name` | String | @NotNull, max 120 | Structure name |
| `alias` | String | @NotNull, max 80 | Structure alias |
| `targetObjectType` | String | max 120 | Target entity type |
| `searchStrategy` | String | max 255 | Record matching strategy |
| `searchFieldsJson` | String | TEXT | Search fields as JSON |
| `sortOrder` | Integer | - | Structure order |

**Table:** `eaImportStructureDraft`
**Sequence:** `ea_id_import_structure_draft`

---

## EaImportFieldDraft

Field mappings within an import structure.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `importStructureDraft` | EaImportStructureDraft | @NotNull, FK | Parent structure |
| `sourceColumn` | EaColumn | FK | Source column from analysis |
| `sourceColumnName` | String | max 255 | Source column name |
| `targetAttribute` | String | max 120 | Target entity attribute |
| `mappingConfidence` | EaFieldMappingConfidence | Enum | Mapping confidence level |
| `similarityScore` | Double | - | Name similarity score |
| `transformation` | String | max 512 | Transformation expression |
| `defaultValue` | String | max 255 | Default value if source is empty |
| `required` | Boolean | - | Whether field is required |
| `sortOrder` | Integer | - | Field order |

**Table:** `eaImportFieldDraft`
**Sequence:** `ea_id_import_field_draft`

---

## EaImportValueMappingDraft

Value transformations for import fields.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, Sequence | Primary key |
| `importFieldDraft` | EaImportFieldDraft | @NotNull, FK | Parent field draft |
| `sourceValue` | String | @NotNull, max 1024 | Source value to match |
| `targetValue` | String | max 1024 | Target value to transform to |
| `sortOrder` | Integer | - | Mapping order |

**Table:** `eaImportValueMappingDraft`
**Sequence:** `ea_id_import_value_mapping_draft`
