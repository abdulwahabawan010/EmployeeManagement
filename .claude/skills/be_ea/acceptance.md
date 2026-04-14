# EA Module Acceptance Checklist

This document provides a compliance verification checklist for EA module implementations.

---

## Entity Checklist

### EaProject

- [ ] Entity extends `AuditableEntity`
- [ ] Implements `EntityName`, `EntityAlias`, `EntityDescription`
- [ ] Sequence name follows pattern: `ea_id_project`
- [ ] Table name is `eaProject`
- [ ] `@UiEntityInfo(uiNoValueList = true)` annotation present
- [ ] `@Audited` annotation present
- [ ] All fields have `@UiFieldInfo` annotations with German labels

### EaSourceFile

- [ ] Entity extends `AuditableEntity`
- [ ] Implements `EntityName`
- [ ] Has `@ManyToOne` to `EaProject`
- [ ] Has `@ManyToOne` to `DmDocument` (optional)
- [ ] Sequence name follows pattern: `ea_id_source_file`
- [ ] All FK fields have proper `@JoinColumn` and `@Audited(modifiedColumnName)` annotations

### EaAnalysisResult

- [ ] Entity extends `AuditableEntity`
- [ ] Has `@ManyToOne` to `EaSourceFile`
- [ ] Sequence name follows pattern: `ea_id_analysis_result`
- [ ] JSON fields use `@Column(columnDefinition = "TEXT")`

### EaColumn

- [ ] Entity extends `AuditableEntity`
- [ ] Implements `EntityName`, `EntityAlias`
- [ ] Has `@ManyToOne` to `EaAnalysisResult`
- [ ] All enum fields use `@Enumerated(EnumType.ORDINAL)`
- [ ] Sequence name follows pattern: `ea_id_column`

### EaModelDraft

- [ ] Entity extends `AuditableEntity`
- [ ] Implements `EntityName`, `EntityAlias`, `EntityDescription`
- [ ] Has `@ManyToOne` to `EaProject`
- [ ] Has optional `@ManyToOne` to `EmSchema`
- [ ] Sequence name follows pattern: `ea_id_model_draft`

### EaImportConfigDraft

- [ ] Entity extends `AuditableEntity`
- [ ] Implements `EntityName`, `EntityAlias`, `EntityDescription`
- [ ] Has `@ManyToOne` to `EaProject`
- [ ] Has optional `@ManyToOne` to `EiImportType`
- [ ] Sequence name follows pattern: `ea_id_import_config_draft`

---

## Enum Checklist

### All Enums

- [ ] Implement `AlphaBaseEnum` interface
- [ ] Located in `com.mvs.backend.ea.enums` package
- [ ] No explicit ordinal values assigned
- [ ] Values are in logical order

### Required Enums

- [ ] `EaProjectStatus` - project lifecycle states
- [ ] `EaFileType` - supported file types
- [ ] `EaDataType` - detected data types
- [ ] `EaPiiType` - PII classification
- [ ] `EaSensitivityLevel` - data sensitivity
- [ ] `EaRelationshipType` - column relationships
- [ ] `EaChoicePatternStatus` - pattern detection status
- [ ] `EaModelDraftStatus` - draft lifecycle
- [ ] `EaImportConfigStatus` - config lifecycle
- [ ] `EaFieldMappingConfidence` - mapping confidence levels

---

## Service Checklist

### EaProjectService

- [ ] Uses `@RequiredArgsConstructor` for injection
- [ ] `updateStatus()` method updates project status
- [ ] Error status stores error details

### EaSourceFileService

- [ ] `uploadFile()` validates project exists
- [ ] File is stored in DM module
- [ ] File type is auto-detected
- [ ] Encoding is auto-detected

### EaAnalysisService

- [ ] `analyzeSourceFile()` is `@Transactional`
- [ ] Updates project status to ANALYZING at start
- [ ] Updates project status to ANALYZED on success
- [ ] Updates project status to ERROR on failure with details
- [ ] Coordinates all analysis sub-services

### EaDataTypeDetectionService

- [ ] Detection priority is correct (UUID first, STRING last)
- [ ] Confidence threshold is 0.8
- [ ] All patterns are correct regex
- [ ] German date formats are supported

### EaRelationshipDetectionService

- [ ] PK detection considers uniqueness, nullability, naming
- [ ] FK detection uses 80% value overlap threshold
- [ ] Creates bidirectional relationships correctly

### EaModelDraftService

- [ ] `generateDraft()` creates fields from all columns
- [ ] `validateDraft()` checks required fields
- [ ] `validateDraft()` checks unique aliases
- [ ] `exportToEm()` validates before export

### EaImportConfigDraftService

- [ ] `generateDraft()` creates structures and fields
- [ ] Sets status to MAPPING_REQUIRED after generation
- [ ] `exportToEi()` validates all required mappings

---

## Controller Checklist

### All Controllers

- [ ] Extend `ObjectCrudController<DtoDetail, Long>`
- [ ] Use `@RequiredArgsConstructor`
- [ ] `@RestController` annotation present
- [ ] `@RequestMapping("/mvsa/ea/{entity}")` pattern

### Custom Endpoints

- [ ] `EaSourceFileController.uploadFile()` handles multipart upload
- [ ] `EaSourceFileController.getPreview()` returns preview data
- [ ] `EaAnalysisResultController.startAnalysis()` triggers analysis
- [ ] `EaModelDraftController.generate()` creates draft
- [ ] `EaModelDraftController.validate()` returns validation result
- [ ] `EaModelDraftController.exportToEm()` exports to EM module
- [ ] `EaImportConfigDraftController.generate()` creates config
- [ ] `EaImportConfigDraftController.exportToEi()` exports to EI module

---

## Access Layer Checklist

### All Access Classes

- [ ] Located in `com.mvs.backend.ea.access` package
- [ ] Extend appropriate base Access class
- [ ] Override `getEntityClass()` method

### All DTOs

- [ ] Located in `com.mvs.backend.ea.access.dto` package
- [ ] Named `{Entity}DtoDetail`
- [ ] Extend appropriate base DTO class
- [ ] All fields match entity fields

---

## Repository Checklist

### All Repositories

- [ ] Located in `com.mvs.backend.ea.model.repo` package
- [ ] Extend `JpaRepository<Entity, Long>`
- [ ] Custom query methods follow naming conventions

### Required Custom Methods

- [ ] `EaSourceFileRepository.findAllByProject()`
- [ ] `EaAnalysisResultRepository.findBySourceFile()`
- [ ] `EaColumnRepository.findAllByAnalysisResult()`
- [ ] `EaColumnValueRepository.findAllByColumn()`
- [ ] `EaModelDraftRepository.findAllByProject()`
- [ ] `EaModelDraftFieldRepository.findAllByModelDraftOrderBySortOrder()`
- [ ] `EaImportConfigDraftRepository.findAllByProject()`
- [ ] `EaImportStructureDraftRepository.findAllByImportConfigDraftOrderBySortOrder()`
- [ ] `EaImportFieldDraftRepository.findAllByImportStructureDraftOrderBySortOrder()`

---

## Integration Checklist

### DM Module Integration

- [ ] Files are stored as DmDocument
- [ ] File content is retrieved via DmDocumentService
- [ ] Document reference is maintained in EaSourceFile

### EM Module Integration

- [ ] EaModelDraft exports to EmSchema
- [ ] EaModelDraftField exports to EmSchemaField
- [ ] Type mapping is correct (EaDataType → EM field type)
- [ ] Exported schema reference is stored

### EI Module Integration

- [ ] EaImportConfigDraft exports to EiImportType
- [ ] EaImportStructureDraft exports to EiImportStructure
- [ ] EaImportFieldDraft exports to EiImportField
- [ ] Exported import type reference is stored

---

## Data Quality Checklist

### Quality Metrics

- [ ] Completeness score (null percentage)
- [ ] Validity score (type conformance)
- [ ] Consistency score (format uniformity)
- [ ] Duplicate detection

### Quality Score Calculation

- [ ] Overall score is weighted average
- [ ] Weights sum to 1.0
- [ ] Score is percentage (0-100)

---

## Security Checklist

### PII Detection

- [ ] German keywords are supported
- [ ] English keywords are supported
- [ ] Data-based inference works (EMAIL, PHONE, IBAN)
- [ ] Sensitivity levels are auto-assigned

### File Validation

- [ ] File type is validated
- [ ] File size is limited (50MB default)
- [ ] Malicious content is rejected
- [ ] Encoding is properly handled

---

## Performance Checklist

### Analysis Limits

- [ ] MAX_ANALYSIS_ROWS = 10,000
- [ ] MAX_PREVIEW_ROWS = 1,000
- [ ] VALUE_LIST_THRESHOLD = 50

### Transaction Management

- [ ] Long operations are properly transactional
- [ ] Read-only methods use `@Transactional(readOnly = true)`
- [ ] Status updates are atomic

---

## Error Handling Checklist

### Service Layer

- [ ] Errors update project status to ERROR
- [ ] Error details are stored in project.errorDetails
- [ ] RuntimeExceptions are thrown with meaningful messages

### Controller Layer

- [ ] Exceptions return 400 with CoreApiResponseDto
- [ ] Not found returns 404
- [ ] Internal errors return 500

---

## Frontend Integration Checklist

### Services Required

- [ ] EaProjectService
- [ ] EaSourceFileService
- [ ] EaAnalysisResultService
- [ ] EaColumnService
- [ ] EaColumnValueService
- [ ] EaModelDraftService
- [ ] EaModelDraftFieldService
- [ ] EaImportConfigDraftService
- [ ] EaImportStructureDraftService
- [ ] EaImportFieldDraftService

### DTOs Required

- [ ] EaProjectDto
- [ ] EaSourceFileDto
- [ ] EaAnalysisResultDto
- [ ] EaColumnDto
- [ ] EaColumnValueDto
- [ ] EaModelDraftDto
- [ ] EaModelDraftFieldDto
- [ ] EaImportConfigDraftDto
- [ ] EaImportStructureDraftDto
- [ ] EaImportFieldDraftDto

### Enums Required (Frontend)

- [ ] EaProjectStatus
- [ ] EaFileType
- [ ] EaDataType
- [ ] EaPiiType
- [ ] EaSensitivityLevel
- [ ] EaRelationshipType
- [ ] EaModelDraftStatus
- [ ] EaImportConfigStatus
- [ ] EaFieldMappingConfidence
