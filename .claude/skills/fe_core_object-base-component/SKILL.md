---
name: fe_core_object-base-component
description: "Frontend: Governs ObjectBaseComponent creation and modification in Angular. Triggers when creating entity detail components, extending OBC, implementing composition/extension patterns, or modifying files that extend ObjectBaseComponent or ObjectBaseModeComponent."
---

# ObjectBaseComponent Governance

## Scope

This skill applies when:
- Creating new entity detail components
- Modifying files containing `extends ObjectBaseComponent`
- Modifying files containing `extends ObjectBaseModeComponent`
- Implementing `getObjectComponent()` in entity services
- Creating OBC templates with `@if (initialized && dto)` guards

## Non-Scope

This skill does NOT apply to:
- Widget components (use `widget` skill)
- Page components (use `page` skill)
- CRUD object components (use `crud-object-component` skill)
- Form components (use `form` skill)
- Generic Angular components not extending OBC/OBMC

---

## Scripts (PRIMARY Enforcement)

Scripts are the PRIMARY enforcement mechanism. Claude MUST run scripts, NOT manually validate.

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `check-obc.js` | Validate OBC | REQUIRED after creation/modification |
| `fix-obc.js` | Auto-fix safe issues | When check-obc.js reports fixable violations |
| `validate-all-obcs.js` | Batch validation | When validating directory |
| `create-obc.js` | Generate OBC scaffold | When creating new OBC |

### Execution

```bash
node .claude/skills/object-base-component/scripts/check-obc.js <path>
node .claude/skills/object-base-component/scripts/fix-obc.js <path>
node .claude/skills/object-base-component/scripts/validate-all-obcs.js <directory>
node .claude/skills/object-base-component/scripts/create-obc.js --entity <Name> --module <mod>
```

---

## Rules

### G1: Inheritance (MANDATORY)

- G1.1: Entity detail components MUST extend `ObjectBaseComponent` or `ObjectBaseModeComponent`
- G1.2: Components MUST implement `OnInit` interface
- G1.3: Constructor MUST call `super()` with required dependencies

### G2: Lifecycle (MANDATORY)

- G2.1: `ngOnInit()` override MUST call `super.ngOnInit()`
- G2.2: `ngOnDestroy()` override MUST call `super.ngOnDestroy()`
- G2.3: `ngOnChanges()` override MUST call `super.ngOnChanges(changes)`
- G2.4: `onObjectChanged()` MUST be implemented in OBC subclasses
- G2.5: `refreshObject()` MUST NOT be called inside `onObjectChanged()` (causes infinite loop)
- G2.6: `refreshObject()` MUST NOT be called inside `ngOnInit()`

### G3: Template (MANDATORY)

- G3.1: Templates MUST guard dto access with `@if (initialized && dto)`
- G3.2: Templates MUST use Angular 17+ control flow (`@if`, `@for`, `@switch`)
- G3.3: Templates MUST NOT use `*ngIf`, `*ngFor` (deprecated)
- G3.4: Templates MUST be in separate `.html` files (no inline templates)

### G4: Service Registration (MANDATORY)

- G4.1: Entity services MUST implement `getObjectComponent(mode?, viewType?): Type<any>`
- G4.2: Service MUST return OBC class for non-create modes
- G4.3: Service MAY return `null` for create mode (uses default form)

### G5: Dirty State (MANDATORY)

- G5.1: `markAsDirty()` MUST be called when modifying `dto` properties
- G5.2: `isDirty` MUST be checked before save operations

### G6: Navigation (CONDITIONAL - when navigation used)

- G6.1: `navigationItems: NavigationItem[]` MUST be declared
- G6.2: `onNavigationItems.emit()` MUST be called after setting navigation items
- G6.3: NavigationItem MUST use `action` property (NOT `route`)
- G6.4: Import path MUST be `'features/core/shared/dto/navigation/navigation-item'`

### G7: UI Mode (CONDITIONAL - when multi-mode)

- G7.1: OBC MUST check `uiMode` to render appropriate view component
- G7.2: `'full'` mode: full-page layout with all features
- G7.3: `'side'` / `'mini-side'` mode: compact layout with essential features
- G7.4: Each mode MAY have different navigation items

### G8: File Location (RECOMMENDED)

- G8.1: OBC files SHOULD be in `<module>/component/object-components/<entity>-object-component/`
- G8.2: Legacy OBCs in `protected-components/` are ACCEPTABLE (no migration required)

---

## Rule Priority

When rules conflict, apply in this order:

1. G2.5 (no infinite loop) - highest priority
2. G1 (inheritance)
3. G2 (lifecycle)
4. G3 (template guards)
5. G4 (service registration)
6. G5 (dirty state)
7. G6 (navigation)
8. G7 (UI mode)
9. G8 (file location) - lowest priority

---

## Legacy Code

| Rule | New Code | Existing Code |
|------|----------|---------------|
| G1-G5 | REQUIRED | REQUIRED |
| G6-G7 | REQUIRED if feature used | No migration required |
| G8 | REQUIRED | No migration required |
| `*ngIf` → `@if` | REQUIRED | RECOMMENDED (no migration required) |

---

## Token Optimization

Claude MUST:
- Rely on script JSON output for validation results
- Summarize script results in 3 sentences maximum
- NOT reprint full script output
- NOT restate documentation rules
- NOT include full code blocks when summarizing

---

## Stop Conditions

Claude MUST STOP and ask when:
- Entity type is ambiguous
- Pattern (Composition vs Extension) is unclear
- Navigation structure is unspecified
- Foreign key relationship is unclear
- Service registration target is unknown

Claude MUST NOT ask when:
- UI mode unspecified → default to `'full'`
- Styles unspecified → create minimal `.scss`

---

## Documentation Gaps

If documentation is incomplete or ambiguous:
1. Claude MUST STOP execution
2. Claude MUST NOT invent rules
3. Claude MUST ask user for clarification
4. Claude MUST record gap if pattern repeats

---

## Validation Rule IDs

| ID | Rule | Severity |
|----|------|----------|
| G1.1 | Extends OBC/OBMC | error |
| G1.2 | Implements OnInit | warning |
| G2.1 | super.ngOnInit() | error |
| G2.2 | super.ngOnDestroy() | error |
| G2.3 | super.ngOnChanges() | warning |
| G2.4 | onObjectChanged() | error |
| G2.5 | No refreshObject in onObjectChanged | error |
| G3.1 | Template guards | warning |
| G3.2 | Angular 17+ control flow | info |
| G4.1 | getObjectComponent() | error |
| G5.1 | markAsDirty() | warning |
| G6.1-G6.4 | Navigation rules | warning/error |

---

## Quick Reference

| Resource | Content |
|----------|---------|
| `reference.md` | Lifecycle, integration points, API |
| `examples.md` | Code examples, templates, patterns |
| `scripts/` | Validation and generation scripts |

---

## Forbidden Actions

Claude MUST NOT:
- Create OBC without running `check-obc.js`
- Manually validate when script can validate
- Invent rules not in this document
- Assume legacy code is invalid
- Skip `super` calls in lifecycle methods
- Use `route` instead of `action` in NavigationItem
- Call `refreshObject()` in `onObjectChanged()`
