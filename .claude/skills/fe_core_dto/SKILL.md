---
name: fe_core_dto
description: "Frontend: Enforces strict DTO patterns for TypeScript classes and interfaces. Applies when creating/modifying Entity DTOs (extends DtoDetail), API DTOs (interfaces), or Enums in model/dto/ directories."
---

# DTO Skill

## Scope

This skill applies when:
- Creating or modifying Entity DTOs (TypeScript classes extending `DtoDetail`)
- Creating or modifying API DTOs (TypeScript interfaces)
- Creating or modifying Enums in `model/dto/enum/`
- Any `.ts` file in `model/dto/` directories

## Non-Scope

This skill does NOT apply to:
- Business logic implementation
- Validation implementation
- Service layer code
- Third-party or external code
- Code outside `model/dto/` directories

---

## Rules

### Entity DTO Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| E1 | Entity DTOs MUST extend `DtoDetail` | Script |
| E2 | Entity DTOs MUST be TypeScript `class` (not `interface`) | Script |
| E3 | Entity DTOs MUST have `id: number` property | Script |
| E4 | Entity DTOs MUST have `name: string` property | Script |
| E5 | Entity DTOs MUST be in `model/dto/entity/` | Script |
| E6 | Files MUST be named `<entity-name>.dto.ts` | Script |
| E7 | Classes MUST be named `<EntityName>Dto` | Script |
| E8 | MUST import `DtoDetail` from `features/core/shared/dto/dto.detail` | Script |

### API DTO Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| A1 | API DTOs MUST be TypeScript `interface` (not `class`) | Script |
| A2 | API DTOs MUST NOT extend `DtoDetail` | Script |
| A3 | API DTOs MUST be in `model/dto/api/` | Script |
| A4 | Files MUST be named `<descriptive-name>.dto.ts` | Script |
| A5 | Interfaces MUST be named `<DescriptiveName>Dto` | Script |

### Relationship Rules (Three-Field Pattern)

| ID | Rule | Enforcement |
|----|------|-------------|
| R1 | ManyToOne MUST use three fields: `<entity>DtoId`, `<entity>DtoName`, `<entity>Dto` | Script |
| R2 | Field names MUST use camelCase | Script |
| R3 | `<entity>DtoId` MUST be `number` (optional) | Script |
| R4 | `<entity>DtoName` MUST be `string` (optional) | Script |
| R5 | `<entity>Dto` MUST be `<Entity>Dto` (optional) | Script |
| R6 | OneToMany MUST use arrays: `<entity>s?: <Entity>Dto[]` | Script |

### Property Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| P1 | Nullable fields MUST use `?` modifier | Script |
| P2 | Required fields MUST NOT use `?` modifier | Script |
| P3 | Backend `@Column(nullable = false)` MUST map to required field | Manual |

### Type Mapping Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| T1 | Backend `Long`/`Integer` MUST map to `number` | Manual |
| T2 | Backend `String` MUST map to `string` | Manual |
| T3 | Backend `Boolean` MUST map to `boolean` | Manual |
| T4 | Backend `LocalDate`/`LocalDateTime` MUST map to `string` or `Date` | Manual |
| T5 | Backend `BigDecimal` MUST map to `number` | Manual |
| T6 | Backend `List<T>`/`Set<T>` MUST map to `T[]` | Manual |
| T7 | Backend `Enum` maps to `string` or TypeScript enum (NON-MANDATORY) | Manual |

### Enum Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| EN1 | Enum files MUST be in `model/dto/enum/` | Script |
| EN2 | Files MUST be named `<enum-name>.enum.ts` | Script |
| EN3 | Enums MUST be named `<EnumName>Enum` | Script |
| EN4 | Enum values MUST NOT use explicit assignments (`VALUE = 'VALUE'`) | Script |
| EN5 | Values MUST use `ALL_CAPS` or `all_lowercase` | Script |
| EN6 | Values MUST NOT use PascalCase or camelCase | Script |

### Best Practice Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| B1 | JSDoc comments for properties (NON-MANDATORY) | Manual |
| B2 | Group properties logically (NON-MANDATORY) | Manual |
| B3 | DTOs MUST NOT contain business logic | Script |
| B4 | Entity and API DTOs MUST NOT be in same file | Script |
| B5 | `any` type MUST NOT be used | Script |
| B6 | Check backend model before creation (NON-MANDATORY) | Manual |

---

## Script Enforcement

**Scripts are the PRIMARY enforcement mechanism.**

### Validation Command

```bash
node .claude/skills/dto/scripts/check-guidelines.js [path]
```

### Script Output

The script outputs JSON only:

```json
{
  "skill": "dto",
  "status": "pass" | "fail",
  "violations": [
    {
      "file": "path/to/file.ts",
      "rule": "E1",
      "message": "Entity DTO must extend DtoDetail"
    }
  ],
  "summary": {
    "filesChecked": 10,
    "dtoFiles": 5,
    "enumFiles": 2,
    "violationCount": 1
  }
}
```

### Claude Behavior

1. Claude MUST run the script after generating/modifying DTO code
2. Claude MUST NOT consider work complete until script reports `"status": "pass"`
3. Claude MUST rely on script output for validation
4. Claude MUST NOT restate documentation or script output
5. Claude MUST summarize results in 3 sentences or fewer

---

## Rule Priority

1. These rules OVERRIDE inferred patterns from backend code
2. These rules OVERRIDE general TypeScript conventions
3. These rules OVERRIDE AI inference from external sources

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

## Additional Resources

- `reference.md` - Detailed explanations and API reference
- `examples.md` - Code examples for all patterns
