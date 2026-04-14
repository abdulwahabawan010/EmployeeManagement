---
name: be_im
description: "Backend: Expert guidance on Import Management (IM) module for data imports, CSV/Excel/JSON parsing, batch imports, and import validation. Use when working with data imports, CSV/Excel/JSON parsing, batch imports, or import validation."
---

# IM (Import) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/im/documentation.md`

## When to Use This Skill

Use when:
- Working with data imports
- Parsing CSV/Excel/JSON
- Implementing batch imports
- Handling import validation

## File Types Supported

- `CSV` - Semicolon-delimited
- `XLS` - Excel format
- `XML` - XML format
- `JSON` - JSON format

## Core Entities

- **ImImport** - Master import record
- **ImImportRecord** - Individual record
- **ImSystem** - External system config
- **ImEntityExternal** - External mapping

## Key Services

### ImImportDataFactoryService
```java
ImImportDataService getImportDataService(String importService)
void executeImportAsync(ImImportRequest request)
void executeImportSync(ImImportRequest request)
```

### ImImportService
```java
ImImport createImport(ImImportRequest request)
ImImportRecord createRecord(ImImport, Long recordId, String externalId)
void updateRecordStatus(ImImportRecord, ImImportRecordStatusEnum, String message)
```

## Implementation Pattern

```java
@Autowired ImImportDataFactoryService factoryService;

ImImportRequest request = new ImImportRequest(
    "contractImport",
    importType,
    importSubType,
    ImImportAction.CREATE,
    fileContent,
    ImFileTypeEnum.CSV,
    Map.of()
);

// Async execution
factoryService.executeImportAsync(request);
```

## Custom Import Service

```java
@Service
public class MyEntityImportDataService implements ImImportDataService {
    @Override
    public void validate(ProvidedDataDtoList data) {
        // Validation logic
    }

    @Override
    public void processImport(ImImport import, ProvidedDataDtoList data) {
        // Process each row
    }
}
```

## Best Practices

### DO:
- Use ImImportDataFactoryService for import orchestration
- Validate data before processing
- Track individual record status

### DON'T:
- Don't parse files manually - use data providers
- Don't skip validation
- Don't ignore processing errors

## Primary Entry Point
`ImImportDataFactoryService` for imports, `ImImportService` for tracking

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)