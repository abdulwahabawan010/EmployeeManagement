# Acceptance Checklist: Document Management (DM)

Use this checklist to verify compliance with DM module standards.

## Service Usage

- [ ] Document operations use `DmDocumentService`
- [ ] Storage operations use `DmDocumentStorageService`
- [ ] Assignment operations use `DmDocumentAssignmentService`

## Storage Handling

- [ ] Storage handlers are not accessed directly
- [ ] Appropriate storage type is used (`db` or `azure`)

## MIME Type Validation

- [ ] MIME types are validated via `DmDocumentType.mimeTypes`
- [ ] MIME type validation is not bypassed

## Best Practices

- [ ] Documents are not stored without `DmDocumentType`
- [ ] Entity linking uses `DmDocumentAssignmentService`
- [ ] Document content is read via service methods
