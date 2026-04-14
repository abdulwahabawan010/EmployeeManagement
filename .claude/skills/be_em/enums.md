# EM Module Enumerations

All enums are located in `/backend/src/main/java/com/mvs/backend/em/enums/`

---

## EmSchemaScope

Defines whether a schema is a base schema or extends another schema.

```java
public enum EmSchemaScope implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Standard")
    STANDARD,    // Base schema (can be extended)

    @UiEnumValueInfo(label = "Extension")
    EXTENSION    // Extends a base schema, adds/overrides elements
}
```

### Usage

```java
// Check if schema is a base schema
if (schema.getSchemaScope() == EmSchemaScope.STANDARD) {
    // Can be used as base for extensions
}

// Check if schema extends another
if (schema.getSchemaScope() == EmSchemaScope.EXTENSION) {
    EmSchema baseSchema = schema.getBaseSchema();
}

// Helper methods on EmSchema
schema.isStandard()    // true if STANDARD
schema.isExtension()   // true if EXTENSION
```

---

## EmSchemaStatus

Processing status of a schema.

```java
public enum EmSchemaStatus implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "OK")
    OK,       // Normal status

    @UiEnumValueInfo(label = "Error")
    ERROR     // Error state
}
```

### Usage

```java
if (schema.getStatus() == EmSchemaStatus.ERROR) {
    String errorMessage = schema.getStatusErrorMessage();
}
```

---

## EmSchemaVersionStatus

Lifecycle state of a schema version.

```java
public enum EmSchemaVersionStatus implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Draft")
    DRAFT,        // Under development, fully editable

    @UiEnumValueInfo(label = "Review")
    REVIEW,       // Submitted for review, limited editing

    @UiEnumValueInfo(label = "Active")
    ACTIVE,       // In production, locked

    @UiEnumValueInfo(label = "Deprecated")
    DEPRECATED,   // No longer recommended, still usable

    @UiEnumValueInfo(label = "Archived")
    ARCHIVED      // Historical reference only, not usable
}
```

### Lifecycle Flow

```
DRAFT → REVIEW → ACTIVE → DEPRECATED → ARCHIVED
  │                           │
  └─── (can go back) ─────────┘
```

### Usage

```java
// Check editability
if (schema.getVersionStatus() == EmSchemaVersionStatus.DRAFT) {
    // Can modify schema
}

// Helper methods on EmSchema
schema.isEditable()  // true if DRAFT
schema.isLocked()    // true if ACTIVE, DEPRECATED, or ARCHIVED
schema.isUsable()    // true if ACTIVE or DEPRECATED
```

### State Transitions

| From | Allowed To |
|------|-----------|
| DRAFT | REVIEW, (deleted) |
| REVIEW | DRAFT, ACTIVE |
| ACTIVE | DEPRECATED |
| DEPRECATED | ARCHIVED |
| ARCHIVED | (terminal state) |

---

## EmSchemaFieldScope

Scope of a field within the inheritance hierarchy.

```java
public enum EmSchemaFieldScope implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Standard")
    STANDARD,     // Field defined in base schema

    @UiEnumValueInfo(label = "Inherited")
    INHERITED,    // Inherited from base schema, unchanged

    @UiEnumValueInfo(label = "Extended")
    EXTENDED,     // Newly added in extension schema

    @UiEnumValueInfo(label = "Overridden")
    OVERRIDDEN    // Overrides properties from base field
}
```

### Usage

```java
// Check field scope
if (field.getFieldScope() == EmSchemaFieldScope.OVERRIDDEN) {
    EmSchemaField baseField = field.getBaseField();
    String overriddenProps = field.getOverriddenProperties(); // JSON array
}

// Helper methods on EmSchemaField
field.isStandardField()   // true if STANDARD
field.isInheritedField()  // true if INHERITED
field.isExtendedField()   // true if EXTENDED
field.isOverriddenField() // true if OVERRIDDEN
```

---

## EmSchemaStructureScope

Scope of a structure within the inheritance hierarchy.

```java
public enum EmSchemaStructureScope implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Standard")
    STANDARD,     // Structure defined in base schema

    @UiEnumValueInfo(label = "Inherited")
    INHERITED,    // Inherited from base schema, unchanged

    @UiEnumValueInfo(label = "Extended")
    EXTENDED,     // Newly added in extension schema

    @UiEnumValueInfo(label = "Overridden")
    OVERRIDDEN    // Overrides properties from base structure
}
```

### Usage

```java
// Check structure scope
if (structure.getStructureScope() == EmSchemaStructureScope.EXTENDED) {
    // This is a new structure added in the extension
}

// Helper methods on EmSchemaStructure
structure.isStandardStructure()   // true if STANDARD
structure.isInheritedStructure()  // true if INHERITED
structure.isExtendedStructure()   // true if EXTENDED
structure.isOverriddenStructure() // true if OVERRIDDEN
```

---

## EmSchemaStructureType

Type of structural relationship.

```java
public enum EmSchemaStructureType implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Root")
    ROOT,          // Root structure (no parent, entry point)

    @UiEnumValueInfo(label = "Parent-Child")
    PARENT_CHILD,  // Standard parent-child relationship

    @UiEnumValueInfo(label = "Choice")
    CHOICE         // Only one child option valid at runtime
}
```

### Usage

```java
// Check if structure is a root
if (structure.getStructureType() == EmSchemaStructureType.ROOT) {
    // This is an entry point for the schema
}

// Check if structure represents a choice
if (structure.getStructureType() == EmSchemaStructureType.CHOICE) {
    // Children are mutually exclusive options
    EmSchemaChoiceResolution resolution = structure.getChoiceResolution();
}

// Helper methods on EmSchemaStructure
structure.isChoice()        // true if CHOICE type
structure.isChoiceOption()  // true if parent is CHOICE
```

---

## EmSchemaCardinality

Defines occurrence constraints for structures.

```java
public enum EmSchemaCardinality implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "1:1")
    ONE_TO_ONE,     // Exactly one (required, single)

    @UiEnumValueInfo(label = "1:M")
    ONE_TO_MANY,    // One or more (required, multiple)

    @UiEnumValueInfo(label = "0:1")
    ZERO_TO_ONE,    // Zero or one (optional, single)

    @UiEnumValueInfo(label = "0:M")
    ZERO_TO_MANY    // Zero or more (optional, multiple)
}
```

### Cardinality Properties

| Cardinality | onlyOne | minOne | Description |
|-------------|---------|--------|-------------|
| ONE_TO_ONE | true | true | Required single value |
| ONE_TO_MANY | false | true | Required, multiple allowed |
| ZERO_TO_ONE | true | false | Optional single value |
| ZERO_TO_MANY | false | false | Optional, multiple allowed |

### Usage

```java
// Check if field is required
EmSchemaCardinality card = structure.getCardinality();
boolean required = (card == EmSchemaCardinality.ONE_TO_ONE ||
                    card == EmSchemaCardinality.ONE_TO_MANY);

// Check if multiple values allowed
boolean multiple = (card == EmSchemaCardinality.ONE_TO_MANY ||
                    card == EmSchemaCardinality.ZERO_TO_MANY);
```

---

## EmSchemaChoiceResolution

Method for resolving which choice option to select.

```java
public enum EmSchemaChoiceResolution implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Auto")
    AUTO,            // Automatic resolution based on present data

    @UiEnumValueInfo(label = "Discriminator")
    DISCRIMINATOR,   // Based on discriminator field value

    @UiEnumValueInfo(label = "Logic")
    LOGIC            // Based on Logic module evaluation
}
```

### Usage

```java
// Check resolution method
if (structure.getChoiceResolution() == EmSchemaChoiceResolution.DISCRIMINATOR) {
    EmSchemaField discriminatorField = structure.getDiscriminatorField();
    String discriminatorValue = structure.getDiscriminatorValue();
}

if (structure.getChoiceResolution() == EmSchemaChoiceResolution.LOGIC) {
    Logic choiceLogic = structure.getChoiceLogic();
    // Evaluate logic block to determine choice
}
```

### Resolution Strategies

| Resolution | When to Use |
|-----------|-------------|
| AUTO | Data can determine choice automatically |
| DISCRIMINATOR | A specific field value identifies the choice |
| LOGIC | Complex conditions require Logic module evaluation |

---

## EmSchemaFieldTypeInternal

Internal field type classification.

```java
public enum EmSchemaFieldTypeInternal implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Simple")
    SIMPLE,    // Simple/primitive field (leaf node)

    @UiEnumValueInfo(label = "Complex")
    COMPLEX    // Complex field (can contain children)
}
```

### Usage

```java
// Determine if field can have children
if (field.getFieldTypeInternal() == EmSchemaFieldTypeInternal.COMPLEX) {
    // This field represents a structure that can contain other fields
}

// Simple fields are leaf nodes
if (field.getFieldTypeInternal() == EmSchemaFieldTypeInternal.SIMPLE) {
    // This field holds actual data values
}
```

---

## EmMessageSeverity

Severity level for schema runtime messages.

```java
public enum EmMessageSeverity implements AlphaBaseEnum {
    @UiEnumValueInfo(label = "Warning")
    WARNING,   // Non-critical issue

    @UiEnumValueInfo(label = "Error")
    ERROR,     // Validation error

    @UiEnumValueInfo(label = "Fatal")
    FATAL      // Critical error preventing processing
}
```

### Usage

```java
// Add message to runtime data
runtimeData.addMessage(EmMessageSeverity.ERROR, "Field value is invalid");

// Check for errors
boolean hasErrors = runtimeData.getMessages().stream()
    .anyMatch(m -> m.severity() == EmMessageSeverity.ERROR ||
                   m.severity() == EmMessageSeverity.FATAL);
```

---

## Enum Best Practices

### DO:
- Always use `@UiEnumValueInfo` for UI labels
- Use helper methods on entities when available
- Check cardinality before allowing multiple values
- Validate version status before modifications

### DON'T:
- Don't hardcode enum ordinal values
- Don't compare enums with strings
- Don't allow direct status transitions (use service methods)
