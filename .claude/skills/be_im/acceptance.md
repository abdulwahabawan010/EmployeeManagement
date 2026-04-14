# Acceptance Checklist: Import Management (IM)

Use this checklist to verify compliance with IM module standards.

## Service Usage

- [ ] Import orchestration uses `ImImportDataFactoryService`
- [ ] Import tracking uses `ImImportService`

## File Handling

- [ ] Files are not parsed manually - data providers are used
- [ ] Supported file types: CSV, XLS, XML, JSON
- [ ] CSV files use semicolon delimiter

## Validation

- [ ] Data is validated before processing
- [ ] Validation is not skipped

## Status Tracking

- [ ] Individual record status is tracked
- [ ] Processing errors are not ignored

## Custom Import Implementation

- [ ] Custom imports implement `ImImportDataService`
- [ ] `validate()` method is implemented
- [ ] `processImport()` method is implemented

## Best Practices

- [ ] `ImImportDataFactoryService` is used for import orchestration
- [ ] Async execution is used for large imports
- [ ] Record status updates use `updateRecordStatus()`
