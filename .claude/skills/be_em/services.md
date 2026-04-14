# EM Module Services

All services are located in `/backend/src/main/java/com/mvs/backend/em/service/`

---

## EmSchemaService

Manages schema lifecycle.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaService.java`

### Key Methods

```java
// Create with new transaction
EmSchema createSchemaNewTransaction(EmSchema schema)

// Save with new transaction
EmSchema saveSchemaNewTransaction(EmSchema schema)

// Create with commit
EmSchema createSchemaCommit(EmSchema schema)

// Find by ID or throw EmRuntimeException
EmSchema findSchemaById(Long id)
```

### Dependencies

- `EmSchemaRepository`
- `GenericDataService`

### Usage Example

```java
@Autowired
private EmSchemaService schemaService;

// Create new schema
EmSchema schema = new EmSchema();
schema.setName("My Schema");
schema.setSchemaType(schemaType);
schema.setVersionStatus(EmSchemaVersionStatus.DRAFT);
schema = schemaService.createSchemaNewTransaction(schema);

// Find existing schema
EmSchema existing = schemaService.findSchemaById(123L);
```

---

## EmSchemaFieldService

Manages field definitions.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaFieldService.java`

### Key Methods

```java
// Merge create/update - compares by alias to avoid duplicates
void createOrUpdateSchemaFields(List<EmSchemaField> fields, EmSchema schema)

// Create with new transaction
List<EmSchemaField> createFieldsNewTransaction(List<EmSchemaField> fields)

// Create fields
List<EmSchemaField> createFields(List<EmSchemaField> fields)

// Create with commit
List<EmSchemaField> createFieldsCommit(List<EmSchemaField> fields)

// Retrieve all fields for schema
List<EmSchemaField> findAllSchemaFields(EmSchema schema)
```

### Behavior

- Compares existing fields by alias to avoid duplicates
- Only saves new fields that don't exist by alias
- Uses batch operations for performance

### Usage Example

```java
@Autowired
private EmSchemaFieldService fieldService;

// Create new field
EmSchemaField field = new EmSchemaField();
field.setSchema(schema);
field.setAlias("customerName");
field.setName("Customer Name");
field.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);

List<EmSchemaField> fields = List.of(field);
fieldService.createOrUpdateSchemaFields(fields, schema);

// Get all fields
List<EmSchemaField> allFields = fieldService.findAllSchemaFields(schema);
```

---

## EmSchemaStructureService

Manages structural hierarchy.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaStructureService.java`

### Key Methods

```java
// Merge create/update
void createOrUpdateSchemaStructure(List<EmSchemaStructure> structures, EmSchema schema)

// Create structures
List<EmSchemaStructure> createStructure(List<EmSchemaStructure> structures)

// Create with commit
List<EmSchemaStructure> createStructureCommit(List<EmSchemaStructure> structures)

// Get all structures for schema
List<EmSchemaStructure> findAllSchemaStructures(EmSchema schema)

// Get structures for specific field
List<EmSchemaStructure> findAllBySchemaAndEmSchemaField(EmSchema schema, EmSchemaField field)
```

### Usage Example

```java
@Autowired
private EmSchemaStructureService structureService;

// Create root structure
EmSchemaStructure root = new EmSchemaStructure();
root.setSchema(schema);
root.setField(rootField);
root.setStructureType(EmSchemaStructureType.ROOT);
root.setName("Root");
root.setCardinality(EmSchemaCardinality.ONE_TO_ONE);

// Create child structure
EmSchemaStructure child = new EmSchemaStructure();
child.setSchema(schema);
child.setField(childField);
child.setParent(root);
child.setStructureType(EmSchemaStructureType.PARENT_CHILD);
child.setName("Child Element");
child.setCardinality(EmSchemaCardinality.ZERO_TO_MANY);

structureService.createOrUpdateSchemaStructure(List.of(root, child), schema);
```

---

## EmSchemaFieldValueService

Manages field value definitions.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaFieldValueService.java`

### Key Methods

```java
// Merge create/update
void createOrUpdateSchemaFieldValue(List<EmSchemaFieldValue> values, EmSchema schema)

// Create with new transaction
List<EmSchemaFieldValue> createFieldValuesNewTransaction(List<EmSchemaFieldValue> values)

// Create field values
List<EmSchemaFieldValue> createFieldValues(List<EmSchemaFieldValue> values)

// Create with commit
List<EmSchemaFieldValue> createFieldValuesCommit(List<EmSchemaFieldValue> values)

// Get all field values for schema
List<EmSchemaFieldValue> findAllSchemaFieldValues(EmSchema schema)
```

### Usage Example

```java
@Autowired
private EmSchemaFieldValueService fieldValueService;

// Create field value
EmSchemaFieldValue value = new EmSchemaFieldValue();
value.setSchema(schema);
value.setField(statusField);
value.setFieldValue(ccFieldValue); // From CC module
value.setLabel("Active");
value.setDescription("The entity is active");

fieldValueService.createOrUpdateSchemaFieldValue(List.of(value), schema);
```

---

## EmSchemaTypeService

Advanced schema type management with comprehensive copy functionality.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaTypeService.java`

### Key Methods

```java
// Find by ID
EmSchemaType findById(Long id)

// Find by alias
EmSchemaType getByAlias(String alias)

// Get structures using GenericDataService
List<EmSchemaStructure> getStructures(EmSchema schema)

// Create schema type
EmSchemaType createSchemaType(String name, String alias)

// Create with commit
EmSchemaType createSchemaTypeCommit(String name, String alias)

// Deep copy entire schema hierarchy
EmSchemaType copy(EiImportType importType)
```

### Deep Copy Operation

The `copy()` method performs a comprehensive deep copy of:

1. **Schema Type** (with "- Copy" suffix and unique alias)
2. **All Schemas**
3. **Import Type**
4. **All Fields** with proper schema mapping
5. **All Structures** with deterministic parent-child ordering
6. **All Field Comments**
7. **All Field Values**
8. **All Field Value Comments**

Uses `LinkedHashMap` to maintain entity ID mappings for proper reference resolution.

### Helper Methods

```java
// Query helpers
List<EmSchema> findSchemasByImportType(EiImportType importType)
List<EmSchemaField> findSchemaFieldsByImportType(EiImportType importType)
List<EmSchemaStructure> findSchemaStructuresByImportType(EiImportType importType)
List<EmSchemaFieldComment> findSchemaFieldCommentsByImportType(EiImportType importType)
List<EmSchemaFieldValue> findSchemaFieldValuesByImportType(EiImportType importType)
List<EmSchemaFieldValueComment> findSchemaFieldValueCommentsByImportType(EiImportType importType)

// Calculate hierarchy depth
int getDepth(EmSchemaStructure structure)
```

### Usage Example

```java
@Autowired
private EmSchemaTypeService schemaTypeService;

// Create new schema type
EmSchemaType type = schemaTypeService.createSchemaTypeCommit("GDV Schema", "gdv-schema");

// Deep copy with all related entities
EiImportType importType = ...;
EmSchemaType copiedType = schemaTypeService.copy(importType);
```

---

## EmSchemaRuntimeService

Creates runtime representations of schemas for execution.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmSchemaRuntimeService.java`

### Key Methods

```java
// Build complete runtime model
EmSchemaRuntime createSchemaRuntime(EmSchema schema)

// Convert runtime data node to JSON
String serializeRuntimeDataNode(EmSchemaRuntimeDataNode node)

// Parse JSON to runtime data node with entity resolution
EmSchemaRuntimeDataNode deserializeRuntimeDataNode(String json, EmSchemaRuntime runtime)
```

### createSchemaRuntime Process

1. Loads all fields
2. Loads all field values with eager FieldValue loading
3. Loads all structures with eager field/parent/defaultValue loading
4. Collects default FieldValue instances
5. Retrieves field value details via FieldService

### Usage Example

```java
@Autowired
private EmSchemaRuntimeService runtimeService;

// Create runtime
EmSchemaRuntime runtime = runtimeService.createSchemaRuntime(schema);

// Access runtime data
Map<Long, EmSchemaField> fields = runtime.getFields();
List<EmSchemaStructure> rootStructures = runtime.getRootStructures();

// Serialize/deserialize data
String json = runtimeService.serializeRuntimeDataNode(dataNode);
EmSchemaRuntimeDataNode restored = runtimeService.deserializeRuntimeDataNode(json, runtime);
```

---

## EmDtoService

Converts runtime data to DTOs for API responses.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/EmDtoService.java`

### Key Methods

```java
// Convert runtime to DTO
EmSchemaRuntimeDto convert(EmSchemaRuntime runtime)

// Convert runtime data to DTO
EmSchemaRuntimeDataDto convert(EmSchemaRuntimeData data)

// Convert node to DTO
EmSchemaRuntimeDataNodeDto convert(
    EmSchemaRuntimeDataNode node,
    EmSchemaRuntimeDataNodeDto parentNode,
    Map<Long, EmSchemaFieldDtoDetail> fieldMap,
    Map<Long, EmSchemaStructureDtoDetail> structureMap
)
```

### Usage Example

```java
@Autowired
private EmDtoService dtoService;

// Convert runtime to DTO for API response
EmSchemaRuntime runtime = runtimeService.createSchemaRuntime(schema);
EmSchemaRuntimeDto dto = dtoService.convert(runtime);
```

---

## Service Transaction Patterns

### Transaction Variants

| Method Suffix | Behavior |
|---------------|----------|
| `*NewTransaction` | Runs in new transaction, propagation REQUIRES_NEW |
| `*Commit` | Commits immediately after operation |
| (no suffix) | Uses existing transaction context |

### When to Use Each

| Pattern | Use Case |
|---------|----------|
| `NewTransaction` | Independent operations that should commit regardless of outer transaction |
| `Commit` | Operations that need immediate persistence |
| Default | Operations within an existing transaction boundary |

---

## Error Handling

### EmRuntimeException

Custom RuntimeException with HTTP 406 (Not Acceptable) status.

```java
// Thrown for:
// - Schema not found
// - Validation errors
// - JSON processing errors

try {
    EmSchema schema = schemaService.findSchemaById(123L);
} catch (EmRuntimeException e) {
    // Handle not found
    String message = e.getMessage();
}
```

---

## Best Practices

### DO:
- Use `createOrUpdate*` methods for merge operations
- Use service methods instead of direct repository access
- Use runtime service for data processing
- Handle EmRuntimeException appropriately

### DON'T:
- Don't bypass service layer for entity operations
- Don't modify locked schemas
- Don't create structures without proper parent references
- Don't forget to set required fields before saving
