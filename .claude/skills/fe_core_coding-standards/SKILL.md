---
name: fe_core_coding-standards
description: "Frontend: Enforces architectural, structural, and formatting rules for the Alpha frontend codebase. Provides deterministic validation and auto-fixing of coding standards violations including module boundaries, naming conventions, one-enum-per-file rules, import restrictions, and code style. Use when validating code against architectural standards, checking import boundaries, enforcing naming conventions, or applying auto-fixes to coding violations."
---

# Coding Standards

Architectural, structural, and formatting rule enforcement for the Alpha frontend codebase.

## Validation Philosophy

1. **Rules are enforced, not suggested** - Every rule produces a pass/fail result
2. **Programmatic validation required** - If a rule cannot be validated programmatically, it is marked as MANUAL
3. **No architectural assumptions** - Only documented guidelines are enforced
4. **Deterministic execution** - Same input always produces same output
5. **Safe by default** - Check never mutates; fix only changes what check reports

## Execution Model

### When to Run check-guidelines.js

- After generating new files
- Before committing changes
- During code review validation
- When validating existing codebase sections

### When to Run fix-guidelines.js

- After check-guidelines.js reports fixable violations
- When auto-fixing formatting issues
- When normalizing import order
- When applying deterministic fixes only

### Safety Constraints

- `check-guidelines.js` NEVER modifies files
- `fix-guidelines.js` ONLY fixes violations reported by check
- Uncertain cases are reported, not guessed
- Public APIs are never changed by fix scripts
- Fix scripts are idempotent (safe to run multiple times)

## Quick Usage

```bash
# Validate files against all coding standards
node .claude/skills/coding-standards/scripts/check-guidelines.js <file-or-directory>

# Auto-fix violations
node .claude/skills/coding-standards/scripts/check-guidelines.js --auto-fix <file-or-directory>

# Output as JSON for programmatic use
node .claude/skills/coding-standards/scripts/check-guidelines.js --json <file-or-directory>

# List all validation rules
node .claude/skills/coding-standards/scripts/check-guidelines.js --list-rules
```

## Rule Categories

| Category | Guideline File | Description |
|----------|----------------|-------------|
| Architecture | [architecture.md](guidelines/architecture.md) | Module boundaries, layering, dependency direction |
| Structure | [structure.md](guidelines/structure.md) | File organization, one-per-file rules |
| Naming | [naming.md](guidelines/naming.md) | File, class, variable naming conventions |
| DTO & Models | [dto-and-models.md](guidelines/dto-and-models.md) | Data transfer object and model placement |
| Code Style | [code-style-and-formatting.md](guidelines/code-style-and-formatting.md) | Formatting, indentation, quotes |
| Testing | [testing.md](guidelines/testing.md) | Test file location, naming patterns |
| Boundaries | [boundaries.md](guidelines/boundaries.md) | Import restrictions, public API enforcement |
| Templates | [templates.md](guidelines/templates.md) | Component templates, lifecycle patterns, base class usage |

## Rule Enforcement Levels

| Level | Meaning |
|-------|---------|
| AUTO-CHECKABLE | Script can detect violations |
| AUTO-FIXABLE | Script can automatically fix violations |
| MANUAL-ONLY | Requires human review |

## Scripts

### check-guidelines.js

Validates files against all coding standards rules.

```bash
node .claude/skills/coding-standards/scripts/check-guidelines.js <file-or-directory>
```

**Output includes:**
- Rule ID
- File path
- Line and column number
- Violation description
- Whether violation is fixable

**Exit codes:**
- `0` - No violations
- `1` - Violations found

### fix-guidelines.js

Auto-fixes violations reported by check-guidelines.js.

```bash
# Via auto-fix flag
node .claude/skills/coding-standards/scripts/check-guidelines.js --auto-fix <path>

# Via piped JSON
node .claude/skills/coding-standards/scripts/check-guidelines.js --json <path> | node .claude/skills/coding-standards/scripts/fix-guidelines.js
```

**Behavior:**
- Fixes ONLY violations reported by check
- Idempotent (safe to run multiple times)
- Never guesses intent
- Never changes public APIs
- Reports summary of applied fixes

## Guidelines Reference

### Architecture Rules
- [architecture.md](guidelines/architecture.md) - Module layering, dependency direction, feature isolation

### Structure Rules
- [structure.md](guidelines/structure.md) - One enum per file, one interface per file, directory organization

### Naming Rules
- [naming.md](guidelines/naming.md) - File naming, class naming, variable naming conventions

### DTO & Model Rules
- [dto-and-models.md](guidelines/dto-and-models.md) - DTO placement, enum location, model organization

### Code Style Rules
- [code-style-and-formatting.md](guidelines/code-style-and-formatting.md) - Indentation, quotes, line length, import order

### Testing Rules
- [testing.md](guidelines/testing.md) - Test file location, naming patterns, test structure

### Boundary Rules
- [boundaries.md](guidelines/boundaries.md) - Import restrictions, private component isolation, circular dependency prevention

### Template Rules
- [templates.md](guidelines/templates.md) - Component templates, lifecycle patterns, base class usage, selector conventions
