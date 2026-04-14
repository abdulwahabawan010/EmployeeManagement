---
name: fe_core_mvs-core-service
description: "Frontend: Enforces patterns for dynamic entity service resolution via MvsCoreService. Applies when resolving CRUD services, components, or metadata by entity type alias at runtime."
---

# MvsCoreService Skill

## Scope

This skill applies when:
- Using `MvsCoreService` for dynamic entity service resolution
- Resolving CRUD services by entity type alias at runtime
- Retrieving object/page components for entities dynamically
- Accessing entity metadata (icons, labels, type IDs)
- Building generic components that work with multiple entity types
- Registering new entities in `dto.service.map.ts`

## Non-Scope

This skill does NOT apply to:
- Single known entity type operations (inject specific service directly)
- Static component implementations with fixed entity types
- Third-party or external service implementations
- Non-entity-related services

---

## Rules

### Injection Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| INJ1 | MvsCoreService MUST be injected via constructor | Script |
| INJ2 | MvsCoreService MUST be used only for dynamic resolution (runtime entity type) | Script |
| INJ3 | MvsCoreService MUST NOT be used for single known entity type | Script |

### Service Resolution Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| SR1 | `getCrudService()` return MUST be checked for null before use | Script |
| SR2 | Generic type `<T>` with `getCrudService<T>()` for type safety (NON-MANDATORY) | Manual |
| SR3 | Service returned is auto-initialized with ObjectService | Manual |
| SR4 | Service's `objectType` is auto-set by MvsCoreService | Manual |

### Component Resolution Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| CR1 | `getObjectComponent()` MUST receive `MvsCrudModeEnum` as mode | Script |
| CR2 | `getObjectComponent()` return MUST be checked for null before use | Script |
| CR3 | `MvsCrudModeEnum.create` MUST be used for create operations | Script |
| CR4 | `MvsCrudModeEnum.update` MUST be used for edit operations | Script |
| CR5 | `MvsCrudModeEnum.read` MUST be used for read-only displays | Script |
| CR6 | Entity services MUST implement `getObjectComponent(mode)` | Manual |

### Metadata Access Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| MA1 | `getObjectTypeId()` returns `Observable<number>` - MUST handle as async | Script |
| MA2 | `getObjectTypeId()` result is cached after first retrieval | Manual |
| MA3 | `getObjectIcon()` returns PrimeNG icon class string | Manual |
| MA4 | `getObjectLabels()` returns array of field names in priority order | Manual |
| MA5 | Cache metadata in `ngOnInit`, not in repeated calls (NON-MANDATORY) | Manual |

### Entity Type Alias Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| ETA1 | Alias MUST follow pattern: `{module}.{EntityName}` | Script |
| ETA2 | Alias MUST use registered aliases only | Script |
| ETA3 | Module prefix MUST match the entity's module | Script |

### Service Registration Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| REG1 | New entities MUST be registered in `dto.service.map.ts` | Script |
| REG2 | Registration MUST include `service` class and `entityName` | Script |
| REG3 | Service class MUST extend `MvsCrudService` | Script |

### Global Service Access Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| GS1 | `getObjectService()` returns singleton `MvsObjectService` | Manual |
| GS2 | `getPageService()` returns `PageService` instance | Manual |
| GS3 | `getPageContextService()` returns `PageContextService` instance | Manual |

---

## Script Enforcement

**Scripts are the PRIMARY enforcement mechanism.**

### Validation Command

```bash
node .claude/skills/mvs-core-service/scripts/check-guidelines.js [path]
```

### Script Output

The script outputs JSON only:

```json
{
  "skill": "mvs-core-service",
  "status": "pass" | "fail",
  "violations": [
    {
      "file": "path/to/file.ts",
      "rule": "SR1",
      "message": "getCrudService() return must be checked for null"
    }
  ],
  "summary": {
    "filesChecked": 10,
    "filesWithMvsCoreService": 3,
    "violationCount": 1
  }
}
```

### Claude Behavior

1. Claude MUST run the script after generating/modifying MvsCoreService code
2. Claude MUST NOT consider work complete until script reports `"status": "pass"`
3. Claude MUST rely on script output for validation
4. Claude MUST NOT restate documentation or script output
5. Claude MUST summarize results in 3 sentences or fewer

---

## Rule Priority

1. These rules OVERRIDE inferred patterns from external sources
2. These rules OVERRIDE general Angular conventions
3. These rules OVERRIDE AI inference

### Conflict Resolution

If conflict exists between these rules and any other source:
1. Claude MUST STOP
2. Claude MUST ASK for clarification
3. Claude MUST NOT guess or invent patterns

---

## Legacy Code Rules

### NEW Code (Claude-generated)

All rules in this skill MUST be enforced for new code.

### EXISTING Code (Pre-existing)

- Validation script runs ONLY on Claude-modified files
- Migration is NOT required for legacy code
- Legacy patterns are NOT invalid unless explicitly flagged

---

## Documentation Gaps

If this skill does not cover a scenario:

1. Claude MUST STOP
2. Claude MUST record the gap in `missing_items.md`
3. Claude MUST ASK for clarification
4. Claude MUST NOT invent rules

---

## Core Files

| File | Location |
|------|----------|
| MvsCoreService | `features/core/shared/service/mvs-core.service.ts` |
| Service Map | `features/core/shared/dto/dto.service.map.ts` |
| MvsCrudModeEnum | `features/core/shared/service/crud/mvs-crud-mode.enum.ts` |

---

## Additional Resources

- `reference.md` - Architecture details and API reference
- `examples.md` - Code examples for all patterns
