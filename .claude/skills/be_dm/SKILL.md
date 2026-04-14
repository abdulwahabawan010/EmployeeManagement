---
name: be_dm
description: "Backend: Expert guidance on Document Management (DM) module including document storage, classification, assignment, and Azure Form Recognizer integration. Use when working with documents, document types, storage, generation, or document groups."
---

# DM (Document Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/dm/documentation.md`

## When to Use This Skill

Use when:
- Working with documents
- Managing document types
- Implementing storage
- Handling document generation
- Managing document groups

## Core Entities

- **DmDocument** (`dmDocument`) - Core document record
- **DmDocumentType** (`dmDocumentType`) - Classification
- **DmDocumentStorage** (`dmDocumentStorage`) - Storage backend
- **DmDocumentAssignment** (`dmDocumentAssignment`) - Entity links
- **DmFormRecognizerType** (`dmFormRecognizerType`) - OCR config

## Storage Types

- `db` - Database storage
- `azure` - Azure Blob Storage

## Key Services

### DmDocumentService
```java
DmDocument createDocument(DmDocumentCreateRequest)
byte[] readDocumentContent(DmDocument)
void analyzeDocument(DmDocument)
```

### DmDocumentStorageService
```java
DmDocument createDocument(DmDocumentStorage, byte[] content, DmMimeType)
void deleteDocument(DmDocument)
DmDocumentBinaryData readDocument(DmDocument)
```

### DmDocumentAssignmentService
```java
DmDocumentAssignment createAssignment(DmDocument, ObjectType, Long objectId)
List<DmDocumentAssignment> getAssignmentsForEntity(ObjectType, Long objectId)
```

## Implementation Pattern

```java
// Upload document
DmDocument doc = storageService.createDocument(storage, fileContent, mimeType);
doc.setDocumentType(documentType);
entityManager.persist(doc);

// Assign to entity
DmDocumentAssignment assignment = assignmentService.createAssignment(
    document, objectType, entityId
);
```

## Best Practices

### DO:
- Use DmDocumentStorageService for all storage operations
- Validate MIME types via DmDocumentType.mimeTypes
- Use DmDocumentAssignmentService for entity linking

### DON'T:
- Don't access storage handlers directly
- Don't bypass MIME type validation
- Don't store documents without DmDocumentType

## Primary Entry Point
`DmDocumentService` for documents, `DmDocumentAssignmentService` for assignments

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
