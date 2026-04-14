# EM Module Entities

## Entity Relationship Diagram

```
EmSchemaType
    │
    └──< EmSchema
            │
            ├──< EmSchemaField ────< EmSchemaFieldComment
            │       │
            │       └──< EmSchemaFieldValue ────< EmSchemaFieldValueComment
            │
            └──< EmSchemaStructure (self-referencing parent-child)
```

---

## EmSchema

**Entity Name:** `emSchema`
**Sequence:** `em_id_schema`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchema.java`

The root entity representing a schema/configuration template.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `name` | String | Schema name |
| `schemaType` | EmSchemaType | Reference to schema type |
| `version` | String | Version identifier |
| `system` | ImSystem | Reference to IM module system |

### Inheritance Configuration (Feature 3)

| Field | Type | Description |
|-------|------|-------------|
| `schemaScope` | EmSchemaScope | STANDARD or EXTENSION |
| `baseSchema` | EmSchema | Parent schema for EXTENSION schemas |
| `organization` | String | Organization/company name |
| `organizationCode` | String | Organization code (e.g., VU-Nummer) |

### Version Configuration (Feature 2)

| Field | Type | Description |
|-------|------|-------------|
| `versionStatus` | EmSchemaVersionStatus | DRAFT, REVIEW, ACTIVE, DEPRECATED, ARCHIVED |
| `validFrom` | LocalDate | Start date for version validity |
| `validTo` | LocalDate | End date for version validity |
| `previousVersion` | EmSchema | Reference to prior schema version |
| `lockedAt` | LocalDateTime | Timestamp when schema was approved/activated |
| `lockedBy` | User | User who locked the schema |

### Processing Status

| Field | Type | Description |
|-------|------|-------------|
| `status` | EmSchemaStatus | OK or ERROR |
| `statusErrorMessage` | String | Error description if status is ERROR |

### Helper Methods

```java
boolean isEditable()    // Returns true if versionStatus is DRAFT
boolean isLocked()      // Returns true if ACTIVE, DEPRECATED, or ARCHIVED
boolean isUsable()      // Returns true if ACTIVE or DEPRECATED
boolean isStandard()    // Returns true if schemaScope is STANDARD
boolean isExtension()   // Returns true if schemaScope is EXTENSION
boolean hasBaseSchema() // Checks if extension has valid base schema
```

---

## EmSchemaType

**Entity Name:** `emSchemaType`
**Sequence:** `em_id_schema_type`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaType.java`

Represents schema type definitions.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `name` | String | Type name |
| `alias` | String | Type alias |

### Interfaces

Implements: `EntityName`, `EntityAlias`

---

## EmSchemaField

**Entity Name:** `emSchemaField`
**Sequence:** `em_id_schema_field`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaField.java`

Represents fields within a schema.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `schema` | EmSchema | Parent schema reference (ManyToOne) |
| `alias` | String | Field alias (unique within schema) |
| `name` | String | Field display name |
| `namespace` | String | XML/namespace information |
| `description` | String | Field description |
| `fieldType` | FieldType | Reference to CC module FieldType |
| `fieldTypeInternal` | EmSchemaFieldTypeInternal | SIMPLE or COMPLEX |
| `fieldTypeExternal` | String | External system field type |
| `hasValueList` | Boolean | Indicates if field has predefined values |

### External Mapping Fields

| Field | Type | Description |
|-------|------|-------------|
| `externalFieldName` | String | Mapping to external system field |
| `versionedExternalFieldName` | String | Versioned external field name |

### GDV-Related Fields

| Field | Type | Description |
|-------|------|-------------|
| `length` | Integer | Field length |
| `minLength` | Integer | Minimum length |
| `decimals` | Integer | Number of decimal places |
| `additionalExternalData` | String | Additional external data |
| `additionalExternalKey` | String | Additional key |

### Inheritance Configuration

| Field | Type | Description |
|-------|------|-------------|
| `fieldScope` | EmSchemaFieldScope | STANDARD, INHERITED, EXTENDED, OVERRIDDEN |
| `baseField` | EmSchemaField | Reference to inherited/overridden field |
| `overriddenProperties` | String | JSON list of overridden property names |

### Helper Methods

```java
boolean isStandardField()   // Checks if STANDARD scope
boolean isInheritedField()  // Checks if INHERITED scope
boolean isExtendedField()   // Checks if EXTENDED scope
boolean isOverriddenField() // Checks if OVERRIDDEN scope
```

---

## EmSchemaStructure

**Entity Name:** `emSchemaStructure`
**Sequence:** `em_id_schema_structure`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaStructure.java`

Represents structural hierarchy and composition of fields.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `schema` | EmSchema | Parent schema (ManyToOne) |
| `field` | EmSchemaField | Referenced field (ManyToOne) |
| `parent` | EmSchemaStructure | Parent structure (ManyToOne, self-referencing) |
| `structureType` | EmSchemaStructureType | ROOT, PARENT_CHILD, or CHOICE |
| `name` | String | Structure name |
| `namespace` | String | XML namespace |
| `priority` | Integer | Processing priority |
| `cardinality` | EmSchemaCardinality | ONE_TO_ONE, ONE_TO_MANY, ZERO_TO_ONE, ZERO_TO_MANY |

### Occurrence Rules

| Field | Type | Description |
|-------|------|-------------|
| `minOccurrence` | Integer | Minimum occurrences |
| `maxOccurrence` | Integer | Maximum occurrences |
| `subStructure` | String | GDV sub-structure info |
| `startPos` | Integer | Start position in line |
| `endPos` | Integer | End position in line |
| `defaultValue` | FieldValue | Reference to default FieldValue |

### Choice Configuration (Feature 1)

| Field | Type | Description |
|-------|------|-------------|
| `choiceResolution` | EmSchemaChoiceResolution | AUTO, DISCRIMINATOR, LOGIC |
| `discriminatorField` | EmSchemaField | Field used to determine choice |
| `discriminatorValue` | String | Value that activates this choice |
| `choiceLogic` | Logic | Reference to Logic module for complex choice resolution |

### Inheritance Configuration

| Field | Type | Description |
|-------|------|-------------|
| `structureScope` | EmSchemaStructureScope | STANDARD, INHERITED, EXTENDED, OVERRIDDEN |
| `baseStructure` | EmSchemaStructure | Reference to inherited/overridden structure |

### Helper Methods

```java
boolean isChoice()              // Checks if CHOICE type
boolean isChoiceOption()        // Checks if parent is CHOICE
boolean isStandardStructure()   // Checks if STANDARD scope
boolean isInheritedStructure()  // Checks if INHERITED scope
boolean isExtendedStructure()   // Checks if EXTENDED scope
boolean isOverriddenStructure() // Checks if OVERRIDDEN scope
EmSchemaStructure copy()        // Creates a copy of the structure
DataTypeRecord getDataTypeForAttribute(String) // Returns DataTypeRecord for attribute
```

---

## EmSchemaFieldValue

**Entity Name:** `emSchemaFieldValue`
**Sequence:** `em_id_schema_field_value`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaFieldValue.java`

Represents predefined values for a field.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `schema` | EmSchema | Parent schema (ManyToOne) |
| `field` | EmSchemaField | Parent field (ManyToOne) |
| `fieldValue` | FieldValue | Reference to CC module FieldValue (ManyToOne, EAGER) |
| `label` | String | Display label |
| `description` | String | Value description |

### Interfaces

Implements: `EntityDataTypeProvider`

---

## EmSchemaFieldComment

**Entity Name:** `emSchemaFieldComment`
**Sequence:** `em_id_schema_field_comment`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaFieldComment.java`

Stores comments for fields.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `schemaField` | EmSchemaField | Reference to EmSchemaField (ManyToOne) |
| `comment` | String | Comment text |

### Interfaces

Implements: `EntityComment`

---

## EmSchemaFieldValueComment

**Entity Name:** `emSchemaFieldValueComment`
**Sequence:** `em_id_schema_field_value_comment`
**Location:** `/backend/src/main/java/com/mvs/backend/em/model/EmSchemaFieldValueComment.java`

Stores comments for field values.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `schemaFieldValue` | EmSchemaFieldValue | Reference to EmSchemaFieldValue (ManyToOne) |
| `comment` | String | Comment text |

### Interfaces

Implements: `EntityComment`

---

## Repository Layer

All repositories extend `JpaRepository` and `RevisionRepository` (for audit history):

| Repository | Entity | Custom Methods |
|-----------|--------|----------------|
| `EmSchemaRepository` | EmSchema | `findByName(String name)` |
| `EmSchemaTypeRepository` | EmSchemaType | `findAllByAlias(String alias)` |
| `EmSchemaFieldRepository` | EmSchemaField | `findAllBySchema(EmSchema)` |
| `EmSchemaStructureRepository` | EmSchemaStructure | `findAllBySchema(EmSchema)`, `findByName(String)`, `findAllBySchemaAndField(EmSchema, EmSchemaField)` |
| `EmSchemaFieldValueRepository` | EmSchemaFieldValue | `findAllBySchema(EmSchema)` |
| `EmSchemaFieldCommentRepository` | EmSchemaFieldComment | - |
| `EmSchemaFieldValueCommentRepository` | EmSchemaFieldValueComment | - |

---

## Access Layer

All access classes extend `ObjectAccess<Entity>` for single-entity access patterns:

| Access Class | Entity | getText() |
|-------------|--------|-----------|
| `EmSchemaAccess` | EmSchema | `schema.name` |
| `EmSchemaFieldAccess` | EmSchemaField | `field.name` |
| `EmSchemaStructureAccess` | EmSchemaStructure | `structure.name` |
| `EmSchemaTypeAccess` | EmSchemaType | `type.name` |
| `EmSchemaFieldValueAccess` | EmSchemaFieldValue | `fieldValue.id.toString()` |
| `EmSchemaFieldCommentAccess` | EmSchemaFieldComment | `comment.id.toString()` |
| `EmSchemaFieldValueCommentAccess` | EmSchemaFieldValueComment | `valueComment.id.toString()` |
