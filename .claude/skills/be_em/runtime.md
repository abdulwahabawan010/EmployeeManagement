# EM Module Runtime Data Structures

Runtime structures provide in-memory representations of schemas optimized for data processing.

All runtime classes are located in `/backend/src/main/java/com/mvs/backend/em/service/data/`

---

## Overview

```
EmSchemaRuntime (Schema definition at runtime)
    │
    ├── fields: Map<Long, EmSchemaField>
    ├── structures: List<EmSchemaStructure>
    ├── rootStructures: List<EmSchemaStructure>
    └── structureDown: Map<Long, List<EmSchemaStructure>>

EmSchemaRuntimeData (Actual data instance)
    │
    ├── schema: EmSchemaRuntime
    ├── rootNodes: List<EmSchemaRuntimeDataNode>
    └── messages: List<EmSchemaRuntimeMessage>

EmSchemaRuntimeDataNode (Single data node)
    │
    ├── structure: EmSchemaStructure
    ├── field: EmSchemaField
    ├── value: Object
    └── children: List<EmSchemaRuntimeDataNode>
```

---

## EmSchemaRuntime

In-memory representation of a schema optimized for execution.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/data/EmSchemaRuntime.java`

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | EmSchema | The source schema |
| `fields` | Map<Long, EmSchemaField> | Field lookup by ID |
| `schemaFieldValues` | Map<Long, List<EmSchemaFieldValue>> | Field values indexed by field ID |
| `structures` | List<EmSchemaStructure> | All structures |
| `structureMap` | Map<Long, EmSchemaStructure> | Structure lookup by ID |
| `rootStructures` | List<EmSchemaStructure> | Entry points (ROOT type) |
| `structureDown` | Map<Long, List<EmSchemaStructure>> | Parent → children navigation |
| `fieldValues` | Map<Long, RetrievedFieldValue> | Predefined values from CC module |

### Key Methods

```java
// Get structure by ID
EmSchemaStructure getStructureById(long id)

// Get direct children of a structure
List<EmSchemaStructure> getChildrenStructures(EmSchemaStructure structure)

// Get field value from CC module
RetrievedFieldValue getFieldValue(FieldValue fieldValue)

// Find path from root to structure
EmSchemaStructure findStructureWithinRoot(EmSchemaStructure root, EmSchemaStructure target)

// Get field by ID or entity
EmSchemaField getField(Long id)
EmSchemaField getField(EmSchemaField field)

// Debug output
void printHierarchy()
```

### Initialization Behavior

During construction, EmSchemaRuntime:

1. **Converts Hibernate proxies** - Resolves lazy-loaded field/parent references
2. **Validates structures** - Ensures all structures have field assignments
3. **Validates hierarchy** - Ensures non-ROOT structures have parents
4. **Throws HgRuntimeException** - For structural violations

### Usage Example

```java
// Create runtime from schema
EmSchemaRuntime runtime = runtimeService.createSchemaRuntime(schema);

// Navigate structure hierarchy
for (EmSchemaStructure root : runtime.getRootStructures()) {
    List<EmSchemaStructure> children = runtime.getChildrenStructures(root);
    for (EmSchemaStructure child : children) {
        EmSchemaField field = runtime.getField(child.getField());
        // Process field...
    }
}

// Get field by ID
EmSchemaField field = runtime.getField(123L);

// Get predefined values for a field
List<EmSchemaFieldValue> values = runtime.getSchemaFieldValues().get(field.getId());
```

---

## EmSchemaRuntimeData

Runtime data instance for specific data content.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/data/EmSchemaRuntimeData.java`

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | EmSchemaRuntime | Reference to runtime schema |
| `rootNodes` | List<EmSchemaRuntimeDataNode> | Top-level data nodes |
| `messages` | List<EmSchemaRuntimeMessage> | Validation/processing messages |

### Key Methods

```java
// Add validation message
void addMessage(EmMessageSeverity severity, String message)

// Find nodes by structure
List<EmSchemaRuntimeDataNode> getNodes(EmSchemaStructure structure)

// Create root data node
EmSchemaRuntimeDataNode addRootNode(EmSchemaStructure structure, Object value)

// Create child data node
EmSchemaRuntimeDataNode addChildNode(
    EmSchemaRuntimeDataNode parent,
    EmSchemaStructure structure,
    Object value
)

// Debug output
void printHierarchy()
```

### Usage Example

```java
// Create runtime data
EmSchemaRuntimeData data = new EmSchemaRuntimeData(runtime);

// Add root node
EmSchemaStructure rootStructure = runtime.getRootStructures().get(0);
EmSchemaRuntimeDataNode rootNode = data.addRootNode(rootStructure, "Root Value");

// Add child nodes
EmSchemaStructure childStructure = runtime.getChildrenStructures(rootStructure).get(0);
EmSchemaRuntimeDataNode childNode = data.addChildNode(rootNode, childStructure, "Child Value");

// Add validation message
data.addMessage(EmMessageSeverity.WARNING, "Field 'name' is empty");

// Check for errors
boolean hasErrors = data.getMessages().stream()
    .anyMatch(m -> m.severity() == EmMessageSeverity.ERROR);
```

---

## EmSchemaRuntimeDataNode

Single node in runtime data hierarchy.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/data/EmSchemaRuntimeDataNode.java`

### Key Fields

| Field | Type | Serialized | Description |
|-------|------|------------|-------------|
| `structure` | EmSchemaStructure | No | Structure reference (resolved from DB) |
| `structureId` | Long | Yes | Structure ID for serialization |
| `field` | EmSchemaField | No | Field reference (resolved from DB) |
| `fieldId` | Long | Yes | Field ID for serialization |
| `value` | Object | Yes | Actual data value |
| `parent` | EmSchemaRuntimeDataNode | No | Parent node (calculated) |
| `children` | List<EmSchemaRuntimeDataNode> | Yes | Child nodes |

### Key Methods

```java
// Find nodes by structure (traverse down)
List<EmSchemaRuntimeDataNode> getNodes(EmSchemaStructure structure)

// Find nodes by structure (traverse up)
List<EmSchemaRuntimeDataNode> getNodesUp(EmSchemaStructure structure)

// Check if has direct child with field
boolean hasDirectChild(EmSchemaField field)

// Find parent by structure
EmSchemaRuntimeDataNode getParent(EmSchemaStructure structure)
```

### JSON Serialization

Only `structureId`, `fieldId`, `value`, and `children` are serialized. The `structure`, `field`, and `parent` references are resolved during deserialization using the EmSchemaRuntime.

```json
{
  "structureId": 123,
  "fieldId": 456,
  "value": "Sample Value",
  "children": [
    {
      "structureId": 124,
      "fieldId": 457,
      "value": "Child Value",
      "children": []
    }
  ]
}
```

### Usage Example

```java
// Navigate data hierarchy
EmSchemaRuntimeDataNode rootNode = data.getRootNodes().get(0);
for (EmSchemaRuntimeDataNode child : rootNode.getChildren()) {
    Object value = child.getValue();
    EmSchemaField field = child.getField();

    // Check for nested children
    if (child.hasDirectChild(nestedField)) {
        List<EmSchemaRuntimeDataNode> nestedNodes = child.getNodes(nestedStructure);
    }
}

// Find parent
EmSchemaRuntimeDataNode parent = childNode.getParent(parentStructure);
```

---

## EmSchemaRuntimeMessage

Immutable message record for validation/processing feedback.

**Location:** `/backend/src/main/java/com/mvs/backend/em/service/data/EmSchemaRuntimeMessage.java`

```java
public record EmSchemaRuntimeMessage(
    EmMessageSeverity severity,
    String message
) {}
```

### Severity Levels

| Severity | Description |
|----------|-------------|
| `WARNING` | Non-critical issue, processing continues |
| `ERROR` | Validation error, processing may continue |
| `FATAL` | Critical error, processing stops |

### Usage Example

```java
// Add messages
data.addMessage(EmMessageSeverity.WARNING, "Optional field missing");
data.addMessage(EmMessageSeverity.ERROR, "Required field is null");
data.addMessage(EmMessageSeverity.FATAL, "Invalid structure hierarchy");

// Check messages
for (EmSchemaRuntimeMessage msg : data.getMessages()) {
    if (msg.severity() == EmMessageSeverity.FATAL) {
        throw new ProcessingException(msg.message());
    }
}
```

---

## DTOs for API Responses

### EmSchemaRuntimeDto

```java
public class EmSchemaRuntimeDto {
    private EmSchemaDtoDetail schema;
    private Map<Long, EmSchemaFieldDtoDetail> fields;
    private Map<Long, EmSchemaStructureDtoDetail> structures;
}
```

### EmSchemaRuntimeDataDto

```java
public class EmSchemaRuntimeDataDto {
    private EmSchemaRuntimeDto runtime;
    private List<EmSchemaRuntimeDataNodeDto> rootNodes;
    private List<EmSchemaRuntimeMessageDto> messages;
}
```

### EmSchemaRuntimeDataNodeDto

```java
public class EmSchemaRuntimeDataNodeDto {
    private Long structureId;
    private Long fieldId;
    private Object value;
    private EmSchemaRuntimeDataNodeDto parent;
    private List<EmSchemaRuntimeDataNodeDto> children;
}
```

### EmSchemaRuntimeMessageDto

```java
public class EmSchemaRuntimeMessageDto {
    private EmMessageSeverity severity;
    private String message;
}
```

---

## Runtime Processing Flow

```
1. Load Schema
   └── EmSchemaService.findSchemaById(id)

2. Create Runtime
   └── EmSchemaRuntimeService.createSchemaRuntime(schema)
       ├── Load all fields
       ├── Load all structures
       ├── Build lookup maps
       └── Resolve field values

3. Create Runtime Data
   └── new EmSchemaRuntimeData(runtime)
       └── Initialize with empty root nodes

4. Populate Data
   ├── data.addRootNode(structure, value)
   └── data.addChildNode(parent, structure, value)

5. Validate
   └── data.addMessage(severity, message)

6. Convert to DTO
   └── EmDtoService.convert(data)
       └── Returns EmSchemaRuntimeDataDto

7. Serialize/Deserialize
   ├── EmSchemaRuntimeService.serializeRuntimeDataNode(node)
   └── EmSchemaRuntimeService.deserializeRuntimeDataNode(json, runtime)
```

---

## Best Practices

### DO:
- Use EmSchemaRuntime for all runtime operations
- Use lookup maps for O(1) access
- Add validation messages during processing
- Serialize only IDs, not entity references

### DON'T:
- Don't modify the schema during runtime processing
- Don't store entity references in serialized data
- Don't ignore FATAL messages
- Don't create circular parent-child relationships in data nodes
