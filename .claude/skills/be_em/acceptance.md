# EM Module Acceptance Checklist

Use this checklist to verify compliance with EM module implementation standards.

---

## Entity Implementation Rules

### EM-ENT-001: Entity Naming Convention

| Status | Rule |
|--------|------|
| [ ] | Entity name prefixed with `em`: `@Entity(name = "emSchemaField")` |
| [ ] | Sequence name follows pattern: `em_id_<entity_snake_case>` |
| [ ] | Allocation size: 50 for runtime entities, 1 for config entities |

### EM-ENT-002: Required Fields

| Status | Rule |
|--------|------|
| [ ] | `EmSchemaField.alias` is unique within schema |
| [ ] | `EmSchemaField.schema` reference is not null |
| [ ] | `EmSchemaStructure.field` reference is not null |
| [ ] | `EmSchemaStructure.schema` reference is not null |
| [ ] | Non-ROOT structures have `parent` reference |

### EM-ENT-003: Relationship Patterns

| Status | Rule |
|--------|------|
| [ ] | All relationships use `FetchType.LAZY` (except specified EAGER) |
| [ ] | No `@OneToMany` relationships (query from child side) |
| [ ] | Self-referencing `parent` in EmSchemaStructure is properly handled |

---

## Service Implementation Rules

### EM-SVC-001: Service Method Usage

| Status | Rule |
|--------|------|
| [ ] | Use `EmSchemaService` for schema operations |
| [ ] | Use `EmSchemaFieldService` for field operations |
| [ ] | Use `EmSchemaStructureService` for structure operations |
| [ ] | Use `EmSchemaFieldValueService` for field value operations |
| [ ] | Use `EmSchemaRuntimeService` for runtime creation |

### EM-SVC-002: Transaction Patterns

| Status | Rule |
|--------|------|
| [ ] | Use `*NewTransaction` methods for independent operations |
| [ ] | Use `*Commit` methods when immediate persistence required |
| [ ] | Use `createOrUpdate*` methods for merge operations |

### EM-SVC-003: Validation

| Status | Rule |
|--------|------|
| [ ] | Check `schema.isEditable()` before modifications |
| [ ] | Handle `EmRuntimeException` appropriately |
| [ ] | Validate structure hierarchy (no circular references) |

---

## Versioning Rules

### EM-VER-001: Version Lifecycle

| Status | Rule |
|--------|------|
| [ ] | Only modify schemas in DRAFT status |
| [ ] | Set `lockedAt` and `lockedBy` when activating |
| [ ] | Link `previousVersion` when creating new version |
| [ ] | Transition through proper lifecycle states |

### EM-VER-002: Version Transitions

| Status | Rule |
|--------|------|
| [ ] | DRAFT → REVIEW (submit for review) |
| [ ] | REVIEW → DRAFT (revision needed) |
| [ ] | REVIEW → ACTIVE (approve) |
| [ ] | ACTIVE → DEPRECATED (phase out) |
| [ ] | DEPRECATED → ARCHIVED (archive) |

---

## Inheritance Rules

### EM-INH-001: Schema Inheritance

| Status | Rule |
|--------|------|
| [ ] | EXTENSION schemas have valid `baseSchema` reference |
| [ ] | STANDARD schemas can be used as base |
| [ ] | Check `schema.hasBaseSchema()` before accessing base |

### EM-INH-002: Field Inheritance

| Status | Rule |
|--------|------|
| [ ] | INHERITED fields reference `baseField` |
| [ ] | OVERRIDDEN fields reference `baseField` |
| [ ] | OVERRIDDEN fields have `overriddenProperties` JSON |
| [ ] | EXTENDED fields have no `baseField` reference |

### EM-INH-003: Structure Inheritance

| Status | Rule |
|--------|------|
| [ ] | INHERITED structures reference `baseStructure` |
| [ ] | OVERRIDDEN structures reference `baseStructure` |
| [ ] | EXTENDED structures have no `baseStructure` reference |

---

## Choice Structure Rules

### EM-CHO-001: Choice Configuration

| Status | Rule |
|--------|------|
| [ ] | CHOICE structures have `choiceResolution` set |
| [ ] | DISCRIMINATOR resolution has `discriminatorField` |
| [ ] | DISCRIMINATOR resolution has `discriminatorValue` on options |
| [ ] | LOGIC resolution has `choiceLogic` reference |

### EM-CHO-002: Choice Options

| Status | Rule |
|--------|------|
| [ ] | Choice options have CHOICE parent |
| [ ] | Choice options are mutually exclusive |
| [ ] | At least 2 options for CHOICE structure |

---

## Runtime Rules

### EM-RUN-001: Runtime Creation

| Status | Rule |
|--------|------|
| [ ] | Use `EmSchemaRuntimeService.createSchemaRuntime()` |
| [ ] | All structures have field assignments |
| [ ] | Non-ROOT structures have parents |
| [ ] | Hibernate proxies are resolved |

### EM-RUN-002: Runtime Data

| Status | Rule |
|--------|------|
| [ ] | Use `addRootNode()` for root nodes |
| [ ] | Use `addChildNode()` for child nodes |
| [ ] | Add messages for validation errors |
| [ ] | Check message severity before processing |

### EM-RUN-003: Serialization

| Status | Rule |
|--------|------|
| [ ] | Only serialize IDs, not entity references |
| [ ] | Use `structureId` and `fieldId` for JSON |
| [ ] | Resolve references during deserialization |

---

## API Rules

### EM-API-001: Controller Implementation

| Status | Rule |
|--------|------|
| [ ] | Extend `ObjectCrudController` for standard CRUD |
| [ ] | Use proper request mapping paths |
| [ ] | Return DTOs, not entities |

### EM-API-002: Custom Endpoints

| Status | Rule |
|--------|------|
| [ ] | `/runtime` endpoint returns `EmSchemaRuntimeDto` |
| [ ] | `/copy` endpoint uses `EmSchemaTypeService.copy()` |

---

## Code Quality Rules

### EM-QUA-001: Error Handling

| Status | Rule |
|--------|------|
| [ ] | Throw `EmRuntimeException` for domain errors |
| [ ] | Include meaningful error messages |
| [ ] | Log errors appropriately |

### EM-QUA-002: Documentation

| Status | Rule |
|--------|------|
| [ ] | Service methods have Javadoc |
| [ ] | Complex logic has inline comments |
| [ ] | Public APIs are documented |

---

## Checklist Summary

| Category | Rule Count |
|----------|------------|
| Entity Implementation | 3 rules |
| Service Implementation | 3 rules |
| Versioning | 2 rules |
| Inheritance | 3 rules |
| Choice Structures | 2 rules |
| Runtime | 3 rules |
| API | 2 rules |
| Code Quality | 2 rules |
| **Total** | **20 rules** |

---

## Verification Commands

### Check Entity Compliance

```bash
# Check entity naming
grep -r "@Entity" backend/src/main/java/com/mvs/backend/em/model/

# Check sequence naming
grep -r "@SequenceGenerator" backend/src/main/java/com/mvs/backend/em/model/
```

### Check Service Usage

```bash
# Find direct repository usage (should use services)
grep -r "Repository" backend/src/main/java/com/mvs/backend/em/controller/
```

### Run Tests

```bash
# Run EM module tests
./gradlew test -PincludeTags=integration --tests "com.mvs.backend.em.*"
```

---

## Common Violations

| Violation | Resolution |
|-----------|------------|
| Direct repository access in controller | Use service methods |
| Modifying non-DRAFT schema | Check `isEditable()` first |
| Missing `baseField` on OVERRIDDEN field | Set reference to base field |
| Circular parent-child reference | Validate hierarchy before save |
| Missing `discriminatorValue` | Set value for DISCRIMINATOR choice |
| Entity reference in serialized JSON | Use IDs only |
