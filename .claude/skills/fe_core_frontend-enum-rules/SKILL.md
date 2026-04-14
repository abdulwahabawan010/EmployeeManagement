---
name: fe_core_frontend-enum-rules
description: "Frontend: Enforces strict enum definition rules for frontend TypeScript code. Prevents explicit string/numeric assignments and backend-style enum copying."
---

# Frontend Enum Rules

This skill defines MANDATORY rules for TypeScript enum definitions in the frontend codebase. These rules are NON-NEGOTIABLE and OVERRIDE any inferred patterns from backend code or general TypeScript conventions.

---

## Claude Behavior Rules (CRITICAL)

### Scripts Are Primary Source of Truth

1. **Scripts do the work, Claude orchestrates**
   - Run validation/fix scripts FIRST
   - Trust script JSON output as authoritative
   - Do NOT re-analyze files that scripts already processed

2. **Token Optimization (MANDATORY)**
   - Claude MUST NOT reprint full enum files
   - Claude MUST NOT reprint full script output
   - Claude MUST NOT explain rules already documented here
   - Claude MUST summarize results in ≤ 3 sentences

3. **Output Rules**
   - Report: `X violations in Y files` (not full details)
   - If fixing: `Fixed X files, Y skipped`
   - Only show details if user explicitly requests

### Validation vs. Fixing

| Action | Script | Requires Approval |
|--------|--------|-------------------|
| Validate | `check-enum-rules.v2.js` | No |
| Fix | `fix-enum-rules.js` | **YES** |

**CRITICAL**: Never auto-fix without explicit user approval.

---

## Module Scoping (NON-NEGOTIABLE)

### What is a Module?

A module is a directory containing `<alias>.module.ts` (e.g., `sp.module.ts`).

### Enum Directory Scope

When validating or fixing, ONLY these directories within a module are scanned:

```
<module>/model/dto/enum/
<module>/model/private-domain/enum/
<module>/model/protected-domain/enum/
<module>/model/public-domain/enum/
```

**Anything outside these paths is IGNORED.**

### Cross-Module Rule

- ONLY scan enums within the CURRENT module
- Other modules MUST NOT be scanned or reported
- If path spans multiple modules, each module is scoped independently

---

## When This Skill Applies

This skill applies when:

- Creating new TypeScript enums in the frontend codebase
- Modifying existing TypeScript enums
- Reviewing or auditing enum definitions
- Generating enums that correspond to backend enums
- Any `.ts` file containing `enum` declarations within enum directories

---

## Allowed Enum Patterns

### Uppercase implicit members (ALLOWED)

```ts
export enum KanbanLaneTypeEnum {
  WORK,
  COMPLETED,
  BACKLOG,
}
```

### Lowercase implicit members (ALLOWED)

```ts
export enum KanbanLaneTypeEnum {
  work,
  completed,
  backlog,
}
```

---

## Forbidden Enum Patterns

### Explicit string assignments (FORBIDDEN)

```ts
// VIOLATION: explicit-string-assignment
export enum KanbanLaneTypeEnum {
  WORK = 'WORK',
  COMPLETED = 'COMPLETED',
}
```

### Explicit numeric assignments (FORBIDDEN)

```ts
// VIOLATION: explicit-numeric-assignment
export enum KanbanLaneTypeEnum {
  WORK = 1,
  COMPLETED = 2,
}
```

### Template literals (FORBIDDEN)

```ts
// VIOLATION: template-literal-assignment
export enum KanbanLaneTypeEnum {
  WORK = `WORK`,
}
```

### Variable references (FORBIDDEN)

```ts
// VIOLATION: variable-reference-assignment
export enum KanbanLaneTypeEnum {
  WORK = SOME_CONST,
}
```

### Mixed styles (FORBIDDEN)

```ts
// VIOLATION: Mixed implicit and explicit
export enum KanbanLaneTypeEnum {
  WORK,
  COMPLETED = 'COMPLETED',
}
```

---

## Scripts Reference

### Validation Script

**Path:** `.claude/skills/frontend-enum-rules/scripts/check-enum-rules.v2.js`

**Usage:**
```bash
node check-enum-rules.v2.js <path> [<path> ...]
```

**Input Path Types:**
- Single file: `path/to/my.enum.ts`
- Enum directory: `path/to/model/dto/enum`
- Module root: `path/to/sp` (auto-detects `sp.module.ts`)

**Output (JSON only):**
```json
{
  "status": "PASSED | FAILED",
  "checkedFiles": 5,
  "violations": [
    {
      "file": "relative/path.ts",
      "enum": "MyEnum",
      "line": 10,
      "rule": "explicit-string-assignment",
      "code": "MEMBER = 'MEMBER',"
    }
  ]
}
```

**Exit Codes:**
- `0` - No violations
- `1` - Violations found
- `2` - Script error

---

### Auto-Fix Script

**Path:** `.claude/skills/frontend-enum-rules/scripts/fix-enum-rules.js`

**Usage:**
```bash
node fix-enum-rules.js [--dry-run] <path> [<path> ...]
```

**Input Path Types:** Same as validation script

**Safe Fixes (auto-applied):**
- `explicit-string-assignment`: `MEMBER = 'VALUE'` → `MEMBER`
- `explicit-numeric-assignment`: `MEMBER = 1` → `MEMBER`

**Unsafe (skipped, requires manual review):**
- `template-literal-assignment`
- `variable-reference-assignment`

**Output (JSON only):**
```json
{
  "dryRun": false,
  "fixedFiles": ["path1.ts", "path2.ts"],
  "skippedFiles": [
    {"file": "path3.ts", "reason": "Contains unfixable violations"}
  ],
  "errors": []
}
```

**Flags:**
- `--dry-run`: Report what would be fixed without modifying files

---

## Explicit Rules Summary

Enums MUST NOT:

1. Use explicit string assignments (e.g., `WORK = 'WORK'`)
2. Use explicit numeric assignments (e.g., `WORK = 1`)
3. Attempt to mirror Java enum serialization syntax
4. Introduce computed or dynamic values
5. Mix implicit and explicit assignment styles

Enums MUST:

1. Use implicit member values only
2. Use consistent casing throughout (all UPPERCASE or all lowercase)
3. Follow the naming convention `*Enum` suffix for enum type names

---

## Backend Relationship Rule

### Backend enums are SEMANTIC references only

When creating frontend enums that correspond to backend enums:

- The enum NAME may match the backend
- The enum MEMBERS may match the backend
- The enum ASSIGNMENT STYLE MUST NOT match the backend

### Example

Backend Java enum:
```java
public enum KanbanLaneType {
    WORK("WORK"),
    COMPLETED("COMPLETED");
}
```

**Correct** frontend TypeScript enum:
```ts
export enum KanbanLaneTypeEnum {
  WORK,
  COMPLETED,
}
```

**Incorrect** (copying Java syntax):
```ts
export enum KanbanLaneTypeEnum {
  WORK = 'WORK',
  COMPLETED = 'COMPLETED',
}
```

---

## Rule Priority

1. **This skill's enum rules OVERRIDE any inferred backend patterns.**
2. **This skill OVERRIDES general TypeScript habits.**
3. **This skill OVERRIDES AI inference.**
4. **Conflict resolution:** If conflict exists, Claude MUST STOP and ASK.

---

## Actions Required

When Claude encounters an enum-related task:

1. **Before creating an enum:** Apply these rules
2. **After creating/modifying an enum:** Run validation script
3. **When violations found:** Ask user before fixing
4. **When asked to copy backend patterns:** Apply Backend Relationship Rule

---

## Violation Response

When validation detects violations:

1. Report summary: `Found X violations in Y files`
2. Ask: `Run auto-fix? (--dry-run first recommended)`
3. If approved, run fix script
4. Report result: `Fixed X files, Y skipped`

---

## Quick Reference

| Pattern | Status |
|---------|--------|
| `MEMBER` (implicit) | ALLOWED |
| `member` (implicit lowercase) | ALLOWED |
| `MEMBER = 'MEMBER'` | FORBIDDEN |
| `member = 'member'` | FORBIDDEN |
| `MEMBER = 1` | FORBIDDEN |
| Mixed styles | FORBIDDEN |
| Computed values | FORBIDDEN |
