---
name: be_em
description: "Backend: Expert guidance on Entity Mapping (EM) module for schema definitions, field mappings, structural hierarchies, inheritance, versioning, and choice structures. Use when working with schemas, schema fields, schema structures, field values, or schema runtime."
---

# EM (Entity Mapping) Module

## Overview

The EM module provides a comprehensive schema definition and mapping system for external data integration. It supports hierarchical structures, field-level mappings, value lists, inheritance between schemas, and versioning workflows.

## Quick Reference

| Resource | Content |
|----------|---------|
| [entities.md](entities.md) | Core entities and relationships |
| [enums.md](enums.md) | All enumeration types |
| [services.md](services.md) | Service layer methods |
| [runtime.md](runtime.md) | Runtime data structures |
| [examples.md](examples.md) | Usage patterns and code examples |
| [acceptance.md](acceptance.md) | Compliance verification checklist |

---

## When to Use This Skill

Use when:
- Creating or managing schema definitions
- Defining field mappings for external systems
- Building structural hierarchies (parent-child relationships)
- Implementing choice structures (mutually exclusive options)
- Working with schema inheritance and extensions
- Managing schema versioning and lifecycle
- Working with field value lists
- Creating schema runtime representations

---

## Core Entities

| Entity | Table Prefix | Purpose |
|--------|--------------|---------|
| **EmSchema** | `emSchema` | Root schema/configuration template |
| **EmSchemaType** | `emSchemaType` | Schema type definitions |
| **EmSchemaField** | `emSchemaField` | Field definitions within schema |
| **EmSchemaStructure** | `emSchemaStructure` | Structural hierarchy and composition |
| **EmSchemaFieldValue** | `emSchemaFieldValue` | Predefined values for fields |
| **EmSchemaFieldComment** | `emSchemaFieldComment` | Comments on fields |
| **EmSchemaFieldValueComment** | `emSchemaFieldValueComment` | Comments on field values |

See [entities.md](entities.md) for detailed documentation.

---

## Key Features

### Feature 1: Choice Structures
Mutually exclusive child options within a structure.

```java
// Choice resolution methods
EmSchemaChoiceResolution.AUTO         // Data-driven selection
EmSchemaChoiceResolution.DISCRIMINATOR // Field value determines choice
EmSchemaChoiceResolution.LOGIC        // Logic module evaluation
```

### Feature 2: Schema Versioning
Lifecycle management for schema versions.

```java
// Version lifecycle
DRAFT → REVIEW → ACTIVE → DEPRECATED → ARCHIVED

// Key methods
schema.isEditable()  // true if DRAFT
schema.isLocked()    // true if ACTIVE, DEPRECATED, ARCHIVED
schema.isUsable()    // true if ACTIVE or DEPRECATED
```

### Feature 3: Schema Inheritance
Extend base schemas with customizations.

```java
// Scope values
EmSchemaScope.STANDARD   // Base schema
EmSchemaScope.EXTENSION  // Extends base schema

// Field/Structure scopes
STANDARD   // In base schema
INHERITED  // Unchanged from base
EXTENDED   // Newly added
OVERRIDDEN // Modified from base
```

---

## Primary Entry Points

| Service | Purpose |
|---------|---------|
| `EmSchemaService` | Schema lifecycle management |
| `EmSchemaFieldService` | Field definition management |
| `EmSchemaStructureService` | Structure hierarchy management |
| `EmSchemaFieldValueService` | Field value management |
| `EmSchemaRuntimeService` | Runtime schema compilation |
| `EmSchemaTypeService` | Schema type and deep copy operations |

See [services.md](services.md) for detailed API documentation.

---

## API Endpoints

| Endpoint | Controller |
|----------|------------|
| `/mvsa/em/emSchemas` | EmSchemaController |
| `/mvsa/em/emSchemaTypes` | EmSchemaTypeController |
| `/mvsa/em/emSchemaFields` | EmSchemaFieldController |
| `/mvsa/em/emSchemaStructures` | EmSchemaStructureController |
| `/mvsa/em/emSchemaFieldValues` | EmSchemaFieldValueController |
| `/mvsa/em/emSchemaFieldComments` | EmSchemaFieldCommentController |
| `/mvsa/em/emSchemaFieldValueComments` | EmSchemaFieldValueCommentController |

**Custom Endpoints:**
- `POST /mvsa/em/emSchemas/{id}/runtime` - Get schema runtime
- `GET /mvsa/em/emSchemaTypes/copy/{id}` - Deep copy schema type

---

## Module Dependencies

| Module | Relationship |
|--------|--------------|
| **IM** | EmSchema references ImSystem |
| **CC** | EmSchemaField → FieldType; EmSchemaStructure/FieldValue → FieldValue |
| **LG** | EmSchemaStructure → Logic (for LOGIC choice resolution) |
| **EI** | EmSchemaTypeService integrates with EiImportType |
| **UM** | EmSchema tracks User (lockedBy) |

---

## Best Practices

### DO:
- Use service methods for CRUD operations
- Use schema versioning for production changes
- Use inheritance for organization-specific extensions
- Define field values for predefined options
- Set proper cardinality for structures

### DON'T:
- Don't modify ACTIVE or locked schemas directly
- Don't create circular parent-child relationships
- Don't use COMPLEX field type for leaf fields
- Don't bypass service methods for entity creation

---

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
