---
name: be_ea
description: "Backend: Expert guidance on Entity Analyze (EA) module for data file analysis, schema generation, and import configuration. Use when working with file uploads, data profiling, column analysis, PII detection, model draft generation, or import configuration export to EM/EI modules."
---

# EA (Entity Analyze) Module

## Overview

The EA module provides comprehensive data file analysis and profiling capabilities. It analyzes uploaded CSV, Excel, and JSON files to detect data types, identify patterns, detect PII, assess data quality, and generate schema definitions (EM) and import configurations (EI) for seamless data integration.

## Quick Reference

| Resource | Content |
|----------|---------|
| [entities.md](entities.md) | Core entities and relationships |
| [enums.md](enums.md) | All enumeration types |
| [services.md](services.md) | Service layer methods |
| [api-endpoints.md](api-endpoints.md) | REST API documentation |
| [analysis-workflow.md](analysis-workflow.md) | Analysis pipeline and algorithms |
| [acceptance.md](acceptance.md) | Compliance verification checklist |

---

## When to Use This Skill

Use when:
- Uploading and parsing data files (CSV, Excel, JSON)
- Analyzing column data types and patterns
- Detecting PII (Personally Identifiable Information)
- Assessing data quality metrics
- Generating model drafts for EM module
- Creating import configurations for EI module
- Detecting relationships between columns (PK, FK)
- Working with value lists and frequency analysis

---

## Core Entities

| Entity | Table Prefix | Purpose |
|--------|--------------|---------|
| **EaProject** | `eaProject` | Root container for analysis projects |
| **EaSourceFile** | `eaSourceFile` | Uploaded file metadata |
| **EaAnalysisResult** | `eaAnalysisResult` | Analysis execution results |
| **EaColumn** | `eaColumn` | Column-level analysis data |
| **EaColumnValue** | `eaColumnValue` | Value frequency analysis |
| **EaColumnRelationship** | `eaColumnRelationship` | FK/PK relationships |
| **EaDataQualityResult** | `eaDataQualityResult` | Quality metrics |
| **EaChoicePattern** | `eaChoicePattern` | XOR column patterns |
| **EaModelDraft** | `eaModelDraft` | Generated schema draft |
| **EaModelDraftField** | `eaModelDraftField` | Draft field definitions |
| **EaImportConfigDraft** | `eaImportConfigDraft` | Import configuration draft |
| **EaImportStructureDraft** | `eaImportStructureDraft` | Import structure hierarchy |
| **EaImportFieldDraft** | `eaImportFieldDraft` | Field mappings |
| **EaImportValueMappingDraft** | `eaImportValueMappingDraft` | Value transformations |

See [entities.md](entities.md) for detailed documentation.

---

## Key Features

### Feature 1: File Parsing
Multi-format file parsing with automatic detection.

```java
// Supported formats
EaFileType.CSV   // Comma-separated values
EaFileType.XLSX  // Excel 2007+
EaFileType.XLS   // Excel 97-2003
EaFileType.JSON  // JSON arrays
EaFileType.TSV   // Tab-separated values

// Auto-detection
- Encoding: BOM detection + UTF-8/ISO-8859-1 fallback
- Delimiter: Frequency analysis for ,;|\t
```

### Feature 2: Data Type Detection
Comprehensive type detection with confidence scoring.

```java
// Detection priority (highest to lowest)
UUID > IBAN > EMAIL > URL > PHONE > DATETIME > DATE > DECIMAL > INTEGER > BOOLEAN > STRING

// Example
DataTypeResult result = dataTypeDetectionService.detectDataType(values);
// Returns: dataType=EMAIL, confidence=0.95
```

### Feature 3: PII Detection
Automatic identification of sensitive data.

```java
// PII Types detected
EaPiiType.NAME, EMAIL, PHONE, ADDRESS, FINANCIAL,
         ID_NUMBER, HEALTH, BIRTHDATE, IP_ADDRESS

// Detection methods
- Header keyword matching (German + English)
- Data type inference (EMAIL, IBAN → FINANCIAL)
- Pattern recognition
```

### Feature 4: Relationship Detection
Automatic FK/PK and hierarchy detection.

```java
// Relationship types
EaRelationshipType.PRIMARY_KEY      // Unique identifier
EaRelationshipType.FOREIGN_KEY      // References another column
EaRelationshipType.COMPOSITE_KEY    // Multi-column key
EaRelationshipType.PARENT_REFERENCE // Hierarchical relationship

// Detection methods
- Naming pattern analysis (_id, Id suffix)
- Value overlap analysis (80% threshold)
- Uniqueness scoring
```

### Feature 5: Export to EM/EI
Generate schemas and import configurations.

```java
// Export to Entity Mapping (EM)
EaModelDraft draft = modelDraftService.generateDraft(projectId);
modelDraftService.exportToEm(draft.getId());

// Export to Entity Import (EI)
EaImportConfigDraft config = importConfigService.generateDraft(projectId, targetType);
importConfigService.exportToEi(config.getId());
```

---

## Primary Entry Points

| Service | Purpose |
|---------|---------|
| `EaProjectService` | Project lifecycle management |
| `EaSourceFileService` | File upload and preview |
| `EaAnalysisService` | Main analysis orchestration |
| `EaColumnAnalysisService` | Column-level analysis |
| `EaDataTypeDetectionService` | Type detection algorithms |
| `EaRelationshipDetectionService` | PK/FK detection |
| `EaDataQualityService` | Quality metrics |
| `EaModelDraftService` | Schema draft generation |
| `EaImportConfigDraftService` | Import config generation |

See [services.md](services.md) for detailed API documentation.

---

## API Endpoints

| Endpoint | Controller |
|----------|------------|
| `/mvsa/ea/eaProjects` | EaProjectController |
| `/mvsa/ea/eaSourceFiles` | EaSourceFileController |
| `/mvsa/ea/eaAnalysisResults` | EaAnalysisResultController |
| `/mvsa/ea/eaColumns` | EaColumnController |
| `/mvsa/ea/eaColumnValues` | EaColumnValueController |
| `/mvsa/ea/eaModelDrafts` | EaModelDraftController |
| `/mvsa/ea/eaModelDraftFields` | EaModelDraftFieldController |
| `/mvsa/ea/eaImportConfigDrafts` | EaImportConfigDraftController |
| `/mvsa/ea/eaImportStructureDrafts` | EaImportStructureDraftController |
| `/mvsa/ea/eaImportFieldDrafts` | EaImportFieldDraftController |

**Custom Endpoints:**
- `POST /mvsa/ea/eaSourceFiles/upload/{projectId}` - Upload file
- `GET /mvsa/ea/eaSourceFiles/preview/{id}?rowLimit=100` - Preview file
- `POST /mvsa/ea/eaAnalysisResults/startAnalysis/{sourceFileId}` - Start analysis
- `POST /mvsa/ea/eaColumns/confirmHeader/{id}` - Confirm header
- `POST /mvsa/ea/eaModelDrafts/generate/{projectId}` - Generate model draft
- `GET /mvsa/ea/eaModelDrafts/validate/{id}` - Validate draft
- `POST /mvsa/ea/eaModelDrafts/exportToEm/{id}` - Export to EM
- `POST /mvsa/ea/eaImportConfigDrafts/generate/{projectId}` - Generate import config
- `POST /mvsa/ea/eaImportConfigDrafts/exportToEi/{id}` - Export to EI

See [api-endpoints.md](api-endpoints.md) for detailed documentation.

---

## Module Dependencies

| Module | Relationship |
|--------|--------------|
| **DM** | EaSourceFile references DmDocument for file storage |
| **EM** | EaModelDraft exports to EmSchema |
| **EI** | EaImportConfigDraft exports to EiImportType |

---

## Key Constants

```java
MAX_PREVIEW_ROWS = 1000          // Preview row limit
MAX_ANALYSIS_ROWS = 10000        // Analysis row limit
VALUE_LIST_THRESHOLD = 50        // Max unique values for value list
HEADER_CONFIDENCE_THRESHOLD = 0.8 // Header detection threshold
CHOICE_PATTERN_THRESHOLD = 0.9   // XOR pattern detection threshold
FK_VALUE_OVERLAP_THRESHOLD = 0.8 // FK detection threshold
```

---

## Best Practices

### DO:
- Use `EaAnalysisService.analyzeSourceFile()` for full analysis pipeline
- Validate drafts before export with `validateDraft()`
- Use project status to track workflow progress
- Review PII detection results for compliance
- Check data quality scores before proceeding

### DON'T:
- Don't bypass the analysis pipeline for partial analysis
- Don't export drafts without validation
- Don't ignore PII detection warnings
- Don't skip data quality assessment
- Don't manually modify analysis results

---

## Analysis Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────►│   Parse     │────►│   Analyze   │
│    File     │     │    File     │     │   Columns   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │   Detect    │           │   Detect    │           │   Assess    │
             │    Types    │           │   PII/PKs   │           │   Quality   │
             └─────────────┘           └─────────────┘           └─────────────┘
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               ▼
                                        ┌─────────────┐
                                        │   Generate  │
                                        │   Drafts    │
                                        └─────────────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                      ▼
             ┌─────────────┐                                        ┌─────────────┐
             │  Export to  │                                        │  Export to  │
             │     EM      │                                        │     EI      │
             └─────────────┘                                        └─────────────┘
```

See [analysis-workflow.md](analysis-workflow.md) for detailed pipeline documentation.

---

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
