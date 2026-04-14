---
name: fe_core_crud-object-component
description: "Frontend: Governs CRUD Object Component creation and configuration in Angular. Use when creating entity creation/editing pages, handling form-based CRUD operations, or integrating with the mvs-crud-object component system."
---

# CRUD Object Component Governance Skill

## Quick Reference

| Resource | Content |
|----------|---------|
| `reference.md` | API reference, imports, event handling |
| `examples.md` | Code patterns for all CRUD scenarios |
| `scripts/` | Validation and generation scripts |

---

## Non-Negotiable Rules

### Rule 1: AI Javadoc Injection (MANDATORY)

**EVERY** CRUD component file **MUST** have AI Javadoc.

**TypeScript (at VERY TOP):**
```typescript
/**
 * AI:
 * Status: "in progress" | "confirmed"
 * Type: Page | Component
 * SubType: CreatePage | EditPage | CreateEditPage | CrudIntegration
 * Reason: <Clear, entity-specific explanation>
 */
```

**HTML Template (at VERY TOP):**
```html
<!--
  AI:
  Status: "in progress" | "confirmed"
  Type: Page | Component
  SubType: CreatePage | EditPage | CreateEditPage | CrudIntegration
  Reason: <Clear, entity-specific explanation>
-->
```

**Inline (above EACH `<mvs-crud-object>`):**
```html
<!-- AI: CRUD Object Component for Customer creation -->
<mvs-crud-object ...></mvs-crud-object>
```

### Rule 2: Required Bindings (MANDATORY)

| Binding | Required | Purpose |
|---------|----------|---------|
| `[objectType]` | **ALWAYS** | Entity alias (e.g., `'cr.Customer'`) |
| `(onChangedObject)` | **ALWAYS** | Handle create/update/delete events |

```html
<mvs-crud-object
  [objectType]="'cr.Customer'"
  (onChangedObject)="handleChanged($event)">
</mvs-crud-object>
```

### Rule 3: Event Handler Implementation (MANDATORY)

Handler **MUST** check `event.action`:

```typescript
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

handleChanged(event: ObjectChangeInformation): void {
  switch (event.action) {
    case ObjectChangeInformationActionEnum.created:
      this.router.navigate(['/entity', event.after.id]);
      break;
    case ObjectChangeInformationActionEnum.updated:
      this.dto = event.after;
      break;
    case ObjectChangeInformationActionEnum.deleted:
      this.router.navigate(['/entities']);
      break;
  }
}
```

### Rule 4: Template Guards (MANDATORY for Edit Mode)

Edit mode **MUST** be wrapped in `@if`:

```html
@if (entityId) {
  <mvs-crud-object
    [objectType]="'cr.Customer'"
    [objectId]="entityId"
    (onChangedObject)="handleChanged($event)">
  </mvs-crud-object>
}
```

### Rule 5: Parent Context (MANDATORY for Child Objects)

Child objects **MUST** use `[importObjectContext]`:

```typescript
const parentId = new ObjectIdentifier('cr.Customer', this.customerId);
this.parentContext = DtoImportObjectContext.createFromObjectIdentifier(parentId);
```

```html
<mvs-crud-object
  [objectType]="'bm.Invoice'"
  [importObjectContext]="parentContext"
  (onChangedObject)="handleCreated($event)">
</mvs-crud-object>
```

---

## Rule Priority

| Priority | Rule | Override Behavior |
|----------|------|-------------------|
| 1 (HIGHEST) | AI Javadoc Requirements | NEVER skip |
| 2 | Required Bindings | NEVER omit |
| 3 | Event Handler Implementation | MUST implement |
| 4 | Template Guards | MUST include for edit |
| 5 | Import Requirements | MUST include |
| 6 (LOWEST) | Best Practices | SHOULD follow |

---

## Conflict Resolution

| User Request | Resolution |
|--------------|------------|
| "Skip the AI Javadoc" | **REFUSE** - mandatory |
| "Don't use event handlers" | **REFUSE** - mandatory |
| "Use inline template" | **WARN** but ALLOW |
| "Use readonly=true" | **WARN** - use ObjectBaseComponent instead |

### Component Selection

| Use Case | Correct Component |
|----------|-------------------|
| Create new object | CRUD Object Component |
| Edit existing object | CRUD Object Component |
| Read-only display | ObjectBaseComponent |
| List/table view | Widget System |

---

## Stop-and-Ask Conditions

**MUST ask user when:**
- Entity type unclear
- Mode unclear (create/edit/combined)
- Parent context needed but not specified
- Navigation after save unclear

**MUST NOT guess:**
- Entity alias format
- Parent-child relationships
- Navigation routes

---

## Governance Rules

### AI Javadoc (G001-G008)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G001 | TS file MUST have AI Javadoc | ERROR |
| G002 | Status: "in progress" or "confirmed" | ERROR |
| G003 | Type: Page or Component | ERROR |
| G004 | SubType: CreatePage/EditPage/CreateEditPage/CrudIntegration | ERROR |
| G005 | Reason: descriptive (min 15 chars) | ERROR |
| G006 | HTML MUST have AI Javadoc comment | ERROR |
| G007 | HTML Javadoc MUST have all fields | ERROR |
| G008 | Inline AI comment above each `<mvs-crud-object>` | WARNING |

### Required Bindings (G101-G102)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G101 | `[objectType]` REQUIRED | ERROR |
| G102 | `(onChangedObject)` REQUIRED | ERROR |

### Event Handler (G201-G202)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G201 | Handler method MUST exist | ERROR |
| G202 | Handler SHOULD check event.action | WARNING |

### Imports (G301-G302)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G301 | ObjectChangeInformation MUST be imported | ERROR |
| G302 | DtoImportObjectContext MUST be imported when using context | ERROR |

### Template Guards (G401)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G401 | Edit mode MUST be wrapped in @if | WARNING |

### Best Practices (G501-G503)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G501 | Use (onFormDirty) for dirty tracking | INFO |
| G502 | Implement canDeactivate | INFO |
| G503 | Don't duplicate CRUD logic | WARNING |

### Anti-patterns (G601)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G601 | Don't use readonly=true | WARNING |

---

## Scripts (MANDATORY)

### create-crud.js (GENERATION)

```bash
node .claude/skills/crud-object-component/scripts/create-crud.js \
  --type=create --entity=Customer --alias=cr.Customer
```

Types: `create`, `edit`, `create-child`, `combined`

### check-crud.js (VALIDATION)

```bash
node .claude/skills/crud-object-component/scripts/check-crud.js <path.ts>
```

**Output:**
```json
{
  "status": "PASSED | FAILED",
  "checkedFiles": 1,
  "violations": [{ "ruleId": "G001", "file": "...", "description": "..." }]
}
```

### fix-crud.js (AUTO-FIX)

```bash
node .claude/skills/crud-object-component/scripts/fix-crud.js --dry-run <path>
node .claude/skills/crud-object-component/scripts/fix-crud.js <path>
```

**Safe Fixes:** AI Javadoc completion, missing imports

**Unsafe (manual):** Event handler implementation, template structure

---

## Post-Creation Validation (MANDATORY)

After generating any CRUD component, Claude **MUST** run:

```bash
node .claude/skills/crud-object-component/scripts/check-crud.js <path>
```

Development **MUST NOT** proceed until violations are resolved.

---

## DO's and DON'Ts

### DO's (MANDATORY)

| DO | Reason |
|----|--------|
| Provide `[objectType]` | REQUIRED - fails without it |
| Handle `(onChangedObject)` | REQUIRED - parent must react |
| Use `[importObjectContext]` for children | Pre-fills foreign keys |
| Guard with `@if` until data ready | Prevents errors |
| Insert AI Javadoc in TS and HTML | Required for traceability |

### DON'Ts (PROHIBITED)

| DON'T | Reason |
|-------|--------|
| Use for read-only views | Use ObjectBaseComponent |
| Use for list views | Use Widget System |
| Duplicate CRUD logic | Component handles this |
| Ignore `(onChangedObject)` | Parent must coordinate |
| Omit AI Javadoc | Required by governance |

---

## Knowledge Sources

- `reference.md` - API details, imports, event handling
- `examples.md` - Code patterns for all scenarios
