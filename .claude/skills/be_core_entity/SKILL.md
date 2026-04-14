---
name: be_core_entity
description: "Backend: Expert guidance on JPA entity architecture including base classes, sequence naming, annotations, enums, and extension interfaces. Use when creating entities, defining JPA annotations, implementing entity patterns, or understanding entity naming conventions. Covers AuditableEntity, ConfigurableEntity, AlphaBaseEnum, and @UiEnumValueInfo."
---

# Entity Architecture Documentation

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/core/entity/documentation.md`

## When to Use This Skill

Use when:
- Creating new JPA entities
- Defining JPA annotations
- Understanding sequence naming conventions
- Implementing base classes
- Creating extension interfaces
- Understanding entity naming conventions

## Critical Rules

### Entity Naming
- **ALWAYS** prefix entity name with module code: `@Entity(name = "{moduleCode}{EntityName}")`
- Example: `@Entity(name = "tmTicket")`, `@Entity(name = "crCustomer")`

### Sequence Naming
- **ALWAYS** use full names: `{module}_id_{entity_name_snake_case}`
- **NEVER** abbreviate sequence names
- Example: `tm_id_ticket`, `cr_id_customer`

### Allocation Size
- Config entities: `allocationSize = 1`
- Runtime entities: `allocationSize = 50`

### Relationships
- **NEVER** use `@OneToMany` relationships
- **ALWAYS** use `FetchType.LAZY` for all relationships

### Enums
- **ALWAYS** implement `AlphaBaseEnum`
- **ALWAYS** use `@Enumerated(EnumType.ORDINAL)`
- **ALWAYS** annotate values with `@UiEnumValueInfo`
- **MANDATORY** `@UiEnumValueInfo` attributes:
  - `uiLabel` - Display label in **German**. For technical enums, add English meaning in brackets (e.g., `"Ausstehend (Pending)"`)
  - `uiDescription` - Description text in **German**. For technical enums, add English meaning in brackets
  - `uiImage` - FontAwesome icon (e.g., `fa-solid fa-user`, `fa-solid fa-ban`)
  - `uiColor` - PrimeNG text color (e.g., `gray-800`, `red-800`, `green-800`)
  - `uiBackgroundColor` - PrimeNG background color (e.g., `gray-200`, `red-200`, `green-200`)

## Base Classes

### AuditableEntity
For runtime entities with audit trail:
```java
public class MyEntity extends AuditableEntity {
    // Inherits: id, createdDate, createdBy, lastModifiedDate, lastModifiedBy
}
```

### ConfigurableEntity
For configuration entities:
```java
public class MyConfigEntity extends ConfigurableEntity {
    // Inherits: id, entityStatus
}
```

## Enum Pattern

```java
public enum MyStatusEnum implements AlphaBaseEnum {

    @UiEnumValueInfo(uiLabel = "Aktiv", uiImage = "fa-solid fa-check", uiBackgroundColor = "green-200", uiColor = "green-800")
    active,

    @UiEnumValueInfo(uiLabel = "Inaktiv", uiImage = "fa-solid fa-xmark", uiBackgroundColor = "gray-200", uiColor = "gray-800")
    inactive;
}

// Technical enum example with English in brackets
public enum ImportStatusEnum implements AlphaBaseEnum {

    @UiEnumValueInfo(uiLabel = "Ausstehend (Pending)", uiImage = "fa-solid fa-clock", uiBackgroundColor = "yellow-200", uiColor = "yellow-800")
    pending,

    @UiEnumValueInfo(uiLabel = "Verarbeitung (Processing)", uiImage = "fa-solid fa-spinner", uiBackgroundColor = "blue-200", uiColor = "blue-800")
    processing;
}
```

### Reference Example
See `com.mvs.backend.cr.enums.CustomerRestrictionType` for a complete implementation.

## Entity Example

```java
@Entity(name = "tmTicket")
public class Ticket extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tm_id_ticket")
    @SequenceGenerator(name = "tm_id_ticket", sequenceName = "tm_id_ticket", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private TicketType type;

    @Enumerated(EnumType.ORDINAL)
    private TmStatusEnum status;
}
```

## JPA Metamodel Generator

The project uses a JavaScript-based metamodel generator (`scripts/generate-metamodel.js`) to create static metamodel classes for JPA entities. These `_` suffixed classes contain static String constants for all entity field names, enabling type-safe attribute references.

### Generated Output

For each entity, a corresponding metamodel class is generated in the `model/desc/` sub-package:

```java
// backend/src/main/java/com/mvs/backend/tm/model/desc/Ticket_.java
package com.mvs.backend.tm.model.desc;

public abstract class Ticket_ {
    public static final String ID = "id";
    public static final String TYPE = "type";
    public static final String STATUS = "status";

    // Inherited from AuditableEntity
    public static final String CREATED_BY = "createdBy";
    public static final String CREATED_DATE = "createdDate";
    public static final String LAST_MODIFIED_BY = "lastModifiedBy";
    public static final String LAST_MODIFIED_DATE = "lastModifiedDate";
}
```

### Usage

```bash
# Generate all missing metamodel classes
node scripts/generate-metamodel.js

# Preview what would be generated (dry-run)
node scripts/generate-metamodel.js --dry-run

# Generate for specific module
node scripts/generate-metamodel.js --module tm

# Force regenerate all classes (overwrite existing)
node scripts/generate-metamodel.js --force

# Exclude inherited fields from base classes
node scripts/generate-metamodel.js --no-inherited
```

### Using Metamodel Constants

Import and use the generated constants for type-safe attribute references:

```java
import com.mvs.backend.tm.model.desc.Ticket_;

// In criteria queries
root.get(Ticket_.STATUS);
root.get(Ticket_.CREATED_DATE);

// In specifications
cb.equal(root.get(Ticket_.TYPE), ticketType);
```

## Automated Checks

The following checks are automated via `scripts/check-entity.js`:

| Rule ID | Name | Description | Auto-fixable |
|---------|------|-------------|--------------|
| ENTITY-001 | Entity Name Prefix | Entity name must be prefixed with module code | No |
| ENTITY-002 | Sequence Naming Convention | Sequence must use format `{module}_id_{entity_snake_case}` | No |
| ENTITY-003 | No @OneToMany Relationships | @OneToMany is forbidden | No |
| ENTITY-004 | FetchType.LAZY Required | All relationships must use FetchType.LAZY | Yes |
| ENTITY-005 | Enum Implements AlphaBaseEnum | Enums must implement AlphaBaseEnum | No |
| ENTITY-006 | Enum Uses ORDINAL | @Enumerated must use EnumType.ORDINAL | Yes |
| ENTITY-007 | Enum Values Have @UiEnumValueInfo | All enum values need @UiEnumValueInfo | No |
| ENTITY-008 | Allocation Size Configuration | Config=1, Runtime=50 | Yes |
| ENTITY-009 | Extends Base Class | Must extend AuditableEntity or ConfigurableEntity | No |
| ENTITY-010 | Sequence Generator Configuration | Proper @GeneratedValue and @SequenceGenerator | No |

### Usage

```bash
# Check a directory
node scripts/check-entity.js backend/src/main/java/

# Check specific category
node scripts/check-entity.js --category enums backend/src/

# Output as JSON
node scripts/check-entity.js --json backend/ > report.json

# List all rules
node scripts/check-entity.js --list-rules
```

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
