---
name: fe_core_outputs
description: "Frontend: Implement read-only output field components for data display. Use when creating display components, MvsFormFieldOutputBaseComponent extensions, widget columns, or working with uiOutputControl configuration."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Output Fields - Implementation Guide

Comprehensive guide for implementing read-only display components in Alpha Frontend.

## 🚨 SCRIPT-FIRST ARCHITECTURE

### PRIMARY SOURCE OF TRUTH

**Scripts are authoritative. Claude MUST NOT duplicate their work.**

1. **Validation Script** (`scripts/check-guidelines.js`)
   - Validates ALL requirements from this documentation
   - Returns structured results (pass/fail/warnings)
   - **Claude**: Run script → Read output → Summarize in ≤ 3 sentences

2. **Auto-Fix Script** (`scripts/fix-output-component-rules.js`)
   - Fixes ALL deterministic violations automatically
   - Returns JSON: `{ fixedFiles[], skippedFiles[], errors[] }`
   - **Claude**: Run script → Report results → NEVER manually replicate fixes

### CLAUDE INTERACTION RULES

**MUST NOT:**
- ❌ Reprint full output component files
- ❌ Reprint full script output (summarize only)
- ❌ Explain rules already documented in this file
- ❌ Manually apply fixes that scripts can handle
- ❌ Describe violations in detail (scripts already do this)

**MUST:**
- ✅ Rely on script JSON output
- ✅ Summarize results in ≤ 3 sentences
- ✅ Direct users to scripts for validation/fixes
- ✅ Focus on orchestration, not reimplementation

### VALIDATION VS. FIXING

**Validation** (`check-guidelines.js`):
- Purpose: Verify compliance, report violations
- When: After generating code, before committing
- Output: Colorized console report with pass/fail/warnings

**Fixing** (`fix-output-component-rules.js`):
- Purpose: Automatically correct deterministic violations
- When: Only after user explicitly requests fixes
- Output: JSON with fixedFiles[], skippedFiles[], errors[]
- **REQUIRES USER APPROVAL** before running (except --dry-run)

### MODULE SCOPING

Both scripts support component-scoped processing:

**Single File Mode:**
```bash
node scripts/check-guidelines.js ./my-output.component.ts
node scripts/fix-output-component-rules.js ./my-output.component.ts --dry-run
```

**Directory Mode (Component-Filtered):**
```bash
# Only processes files matching: mvs-form-control-output-*.component.ts, *-output-*.component.ts
node scripts/check-guidelines.js ./src/app/shared/form/output
node scripts/fix-output-component-rules.js ./src/app/shared/form/output --dry-run
```

**Supported Component Patterns:**
- `mvs-form-control-output-*.component.ts`
- `mvs-form-control-*.component.ts`
- `*-output-*.component.ts`

### AUTO-FIX CAPABILITIES

The auto-fix script handles these deterministic violations:

**Component Structure:**
- Missing `@Component()` decorator
- Missing `extends MvsFormFieldOutputBaseComponent`
- Incorrect selector pattern

**Lifecycle Methods:**
- Missing `super.ngOnInit()` calls
- Missing `super.ngOnDestroy()` calls
- Missing `ngOnChanges()` implementation
- Missing `refreshComponent()` call in `ngOnInit()`

**Required Methods:**
- Missing `refreshComponent()` method
- Missing value change handling in `ngOnChanges()`

**Required Patterns:**
- Missing `this.initialized = true`
- Missing null/undefined value handling

**Limitations:**
- Cannot infer custom formatting logic
- Cannot determine optimal display format
- Cannot add component imports
- Cannot generate templates (only basic structure)

### SCRIPT INVOCATION WORKFLOW

1. **After Claude generates code:**
   ```bash
   node scripts/check-guidelines.js ./mvs-form-control-output-custom.component.ts
   ```

2. **If violations found:**
   ```bash
   # Preview fixes
   node scripts/fix-output-component-rules.js ./mvs-form-control-output-custom.component.ts --dry-run

   # Apply fixes (requires user approval)
   node scripts/fix-output-component-rules.js ./mvs-form-control-output-custom.component.ts
   ```

3. **Re-validate:**
   ```bash
   node scripts/check-guidelines.js ./mvs-form-control-output-custom.component.ts
   ```

4. **Claude reports results** (≤ 3 sentences):
   - "Validation passed with 18/18 checks."
   - "Auto-fix applied 4 corrections: added refreshComponent(), added super.ngOnInit(), added null handling, added initialized flag."
   - "Manual step: Add custom formatting logic in refreshComponent()."

## Quick Start

### What Are Output Fields?

Output fields are **specialized, reusable, display-only components** that:
- Receive a value via `@Input() value`
- Receive optional metadata via `@Input() formField`
- Extend `MvsFormFieldOutputBaseComponent`
- Handle formatting, styling, and interactions

### Core Components

| Component | Purpose |
|-----------|---------|
| `MvsFormFieldOutputBaseComponent` | Base class for all output components |
| `MvsFormFieldDto` | Field metadata (optional) |
| `MvsFormValueListDto` | Value list for label lookups |

## Architecture

```
Widget/Table/Form
  -> Column Definitions (MvsFormFieldDto)
    -> Data Rows (DTOs)
      -> Output Components (mvs-form-control-output-*)
        -> Formatted Display
```

## Component Pattern

Every output field component must:

```typescript
@Component({
  selector: 'mvs-form-control-output-[type]',
  template: '<span>{{formattedValue}}</span>'
})
export class MvsFormFieldOutputDateComponent
    extends MvsFormFieldOutputBaseComponent
    implements OnInit, OnDestroy, OnChanges {

  formattedValue: string;

  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
  }

  override ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.refreshComponent();
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  override refreshComponent() {
    if (!this.value || this.value === '-') {
      this.formattedValue = this.value;
      return;
    }
    this.formattedValue = this.formatValue(this.value);
    this.initialized = true;
  }

  formatValue(input: any): string {
    // Format logic here
    return formatted;
  }
}
```

## Required Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | any | Yes | The data to display |
| `formField` | MvsFormFieldDto | No | Metadata for configuration |
| `dto` | any | No | Full object for context/navigation |
| `form` | any | No | Form definition |

## Output Field Categories

### Text Display
- `mvs-form-control-output-text` - Plain text
- `mvs-form-control-output-text-upper-case` - Uppercase text
- `mvs-form-control-output-text-lower-case` - Lowercase text

### Date/Time Display
- `mvs-form-control-output-date` - Formatted date (DD.MM.YYYY)
- `mvs-form-control-output-date-time` - Date and time
- `mvs-form-control-output-date-ago` - Relative time ("2 days ago")
- `mvs-form-control-output-due-date` - Due date with color coding
- `mvs-form-control-output-years-ago` - Years since date

### Number/Amount Display
- `mvs-form-control-output-amount` - Formatted number
- `mvs-form-control-output-amount-color` - Color-coded (red negative)
- `mvs-form-control-output-currency-euro` - Euro currency

### Boolean Display
- `mvs-form-control-output-bool` - True/False text
- `mvs-form-control-output-icon-yes` - Checkmark for true
- `mvs-form-control-output-icon-no` - X icon for false

### Badge/Tag Display
- `mvs-form-control-output-badge` - Status badge with color
- `mvs-form-control-output-tag` - Tag display
- `mvs-form-control-output-chip` - Chip display

### Navigation Display
- `mvs-form-control-output-navigate-to-object-main` - Click to navigate main
- `mvs-form-control-output-navigate-to-object-right` - Navigate right sidebar
- `mvs-form-control-output-navigate-to-new-window` - Open new window

### Privacy Display
- `mvs-form-control-anonymize-email` - Masked email
- `mvs-form-control-anonymize-phone-number` - Masked phone

See [all-outputs-reference.md](all-outputs-reference.md) for complete list.

## Usage Examples

### Widget Column Configuration

```typescript
const columns: MvsFormFieldDto[] = [
  {
    id: 'name',
    uiLabel: 'Name',
    uiOutputControl: 'text'
  },
  {
    id: 'birthDate',
    dataType: 'java.time.LocalDate',
    uiLabel: 'Birth Date',
    uiOutputControl: 'date'
  },
  {
    id: 'status',
    uiLabel: 'Status',
    uiOutputControl: 'badge',
    valueList: statusValueList
  },
  {
    id: 'active',
    uiLabel: 'Active',
    uiOutputControl: 'bool-icon-yes'
  }
];
```

### Direct Usage

```html
<mvs-form-control-output-date
  [value]="customer.birthDate">
</mvs-form-control-output-date>
```

### With Value List

```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Active', image: 'fa fa-check', color: 'green-800' },
  { key: 2, label: 'Inactive', image: 'fa fa-times', color: 'red-800' }
];
```

```html
<mvs-form-control-output-badge
  [value]="customer.status"
  [formField]="{valueList: valueList}">
</mvs-form-control-output-badge>
```

### Navigation Output

```html
<mvs-form-control-output-navigate-to-object-main
  [value]="customer.name"
  [dto]="customer">  <!-- dto required for navigation -->
</mvs-form-control-output-navigate-to-object-main>
```

## Best Practices

### DO: Use Output Components

```html
<mvs-form-control-output-date
  [value]="customer.birthDate">
</mvs-form-control-output-date>
```

### DON'T: Use Plain Interpolation

```html
<!-- WRONG -->
<span>{{ customer.birthDate | date:'dd.MM.yyyy' }}</span>
```

### DO: Use Value Lists for Enums

```html
<mvs-form-control-output-badge
  [value]="customer.status"
  [formField]="{valueList: statusValueList}">
</mvs-form-control-output-badge>
```

### DON'T: Manual Mapping

```typescript
// WRONG
getStatusLabel(statusId: number): string {
  return this.statusList.find(s => s.id === statusId)?.label;
}
```

## Output vs Input Fields

| Aspect | Input Fields | Output Fields |
|--------|-------------|---------------|
| Purpose | Data entry | Data display |
| Interaction | Editable | Read-only |
| FormGroup | Required | Not used |
| Base Class | MvsFormFieldBaseComponent | MvsFormFieldOutputBaseComponent |
| Selector | `mvs-form-field-*` | `mvs-form-control-output-*` |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Output not displaying | value is null/undefined | Check value exists |
| Navigation not working | dto not passed | Add `[dto]="object"` |
| Shows ID instead of label | valueList missing | Set formField.valueList |
| Wrong format | Wrong component type | Use correct uiOutputControl |

## API Reference

For detailed API documentation:

- [MvsFormFieldOutputBaseComponent](MvsFormFieldOutputBaseComponent.md) - Base class API
- [all-outputs-reference](all-outputs-reference.md) - Complete output list

## Validation & Auto-Fix

### Validation

**Purpose:** Verify compliance with all Output Component guidelines.

```bash
# Validate single file
node scripts/check-guidelines.js ./mvs-form-control-output-custom.component.ts

# Validate entire output directory (component-filtered)
node scripts/check-guidelines.js ./src/app/shared/form/output
```

**Output:** Colorized console report with:
- ✓ Passed checks
- ✗ Failed checks (with hints)
- ⚠ Warnings
- ○ Skipped checks

**Claude Response Pattern:**
- Read script output
- Summarize in ≤ 3 sentences
- Do NOT reprint full output

### Auto-Fix

**Purpose:** Automatically correct deterministic violations.

**⚠️ REQUIRES USER APPROVAL** before running (except `--dry-run`).

```bash
# Preview fixes without writing
node scripts/fix-output-component-rules.js ./mvs-form-control-output-custom.component.ts --dry-run

# Apply fixes (user must approve)
node scripts/fix-output-component-rules.js ./mvs-form-control-output-custom.component.ts

# Fix entire output directory
node scripts/fix-output-component-rules.js ./src/app/shared/form/output --dry-run
```

**Output:** JSON with:
```json
{
  "fixedFiles": [
    {
      "path": "path/to/component.ts",
      "fixes": ["Added refreshComponent() method", "..."]
    }
  ],
  "skippedFiles": [...],
  "errors": [...]
}
```

**What Gets Fixed:**
- Component structure: Missing `@Component()`, `extends MvsFormFieldOutputBaseComponent`
- Lifecycle methods: Missing `super` calls, `ngOnChanges()` implementation
- Required methods: Missing `refreshComponent()`
- Required patterns: Missing `this.initialized = true`, null handling

**What Requires Manual Intervention:**
- Custom formatting logic in `refreshComponent()`
- Optimal display format selection
- Component imports
- Template implementation (beyond basic structure)

**Claude Response Pattern:**
- Parse JSON output
- Report: "Fixed N files with M corrections"
- List files affected (not all fixes)
- Specify manual steps remaining
- Total response: ≤ 3 sentences
