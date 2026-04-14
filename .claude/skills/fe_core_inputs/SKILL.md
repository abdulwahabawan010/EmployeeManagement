---
name: fe_core_inputs
description: "Frontend: Implement metadata-driven input field components for Angular forms. Use when creating form inputs, MvsFormFieldBaseComponent extensions, custom form fields, or working with MvsFormFieldDto configuration."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Input Fields - Implementation Guide

Comprehensive guide for implementing metadata-driven input field components in Alpha Frontend.

## 🚨 SCRIPT-FIRST ARCHITECTURE

### PRIMARY SOURCE OF TRUTH

**Scripts are authoritative. Claude MUST NOT duplicate their work.**

1. **Validation Script** (`scripts/check-guidelines.js`)
   - Validates ALL requirements from this documentation
   - Returns structured results (pass/fail/warnings)
   - **Claude**: Run script → Read output → Summarize in ≤ 3 sentences

2. **Auto-Fix Script** (`scripts/fix-input-component-rules.js`)
   - Fixes ALL deterministic violations automatically
   - Returns JSON: `{ fixedFiles[], skippedFiles[], errors[] }`
   - **Claude**: Run script → Report results → NEVER manually replicate fixes

### CLAUDE INTERACTION RULES

**MUST NOT:**
- ❌ Reprint full input component files
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

**Fixing** (`fix-input-component-rules.js`):
- Purpose: Automatically correct deterministic violations
- When: Only after user explicitly requests fixes
- Output: JSON with fixedFiles[], skippedFiles[], errors[]
- **REQUIRES USER APPROVAL** before running (except --dry-run)

### MODULE SCOPING

Both scripts support component-scoped processing:

**Single File Mode:**
```bash
node scripts/check-guidelines.js ./mvs-form-field-custom.component.ts
node scripts/fix-input-component-rules.js ./mvs-form-field-custom.component.ts --dry-run
```

**Directory Mode (Component-Filtered):**
```bash
# Only processes files matching: mvs-form-field-*.component.ts
node scripts/check-guidelines.js ./src/app/shared/form/fields
node scripts/fix-input-component-rules.js ./src/app/shared/form/fields --dry-run
```

**Supported Component Patterns:**
- `mvs-form-field-*.component.ts`

### AUTO-FIX CAPABILITIES

The auto-fix script handles these deterministic violations:

**Component Structure:**
- Missing `@Component()` decorator
- Missing `extends MvsFormFieldBaseComponent`
- Incorrect selector pattern

**Lifecycle Methods:**
- Missing `super.ngOnInit()` calls
- Missing `super.ngOnChanges()` calls
- Missing `super.ngOnDestroy()` calls
- Missing `refreshComponent()` call in `ngOnInit()`

**Required Methods:**
- Missing `refreshComponent()` method
- Missing `handleFieldChange()` method
- Missing `onChange.emit()` in `handleFieldChange()`

**Required Patterns:**
- Missing `this.initialized = true`

**Limitations:**
- Cannot infer custom field logic
- Cannot determine optimal PrimeNG component
- Cannot add component imports
- Cannot generate templates (only basic structure)
- Cannot add FormControl validators

### SCRIPT INVOCATION WORKFLOW

1. **After Claude generates code:**
   ```bash
   node scripts/check-guidelines.js ./mvs-form-field-custom.component.ts
   ```

2. **If violations found:**
   ```bash
   # Preview fixes
   node scripts/fix-input-component-rules.js ./mvs-form-field-custom.component.ts --dry-run

   # Apply fixes (requires user approval)
   node scripts/fix-input-component-rules.js ./mvs-form-field-custom.component.ts
   ```

3. **Re-validate:**
   ```bash
   node scripts/check-guidelines.js ./mvs-form-field-custom.component.ts
   ```

4. **Claude reports results** (≤ 3 sentences):
   - "Validation passed with 20/20 checks."
   - "Auto-fix applied 5 corrections: added super.ngOnInit(), added handleFieldChange(), added onChange.emit(), added refreshComponent(), added initialized flag."
   - "Manual steps: Implement custom field logic in handleFieldChange() and add validators."

## Quick Start

### What Are Input Fields?

Input fields are **metadata-driven, reusable form control components** that:
- Receive configuration via `MvsFormFieldDto`
- Extend `MvsFormFieldBaseComponent`
- Integrate with Angular Reactive Forms
- Support readonly, disabled, and change tracking states

### Core Components

| Component | Purpose |
|-----------|---------|
| `MvsFormFieldBaseComponent` | Base class for all input components |
| `MvsFormFieldDto` | Field metadata configuration |
| `MvsFormValueListDto` | Dropdown/select options |

## Architecture

```
Form (MvsFormDto)
  -> Field Groups
    -> Fields (MvsFormFieldDto)
      -> Input Components (mvs-form-field-*)
        -> PrimeNG/HTML Controls (wrapped)
```

## Component Pattern

Every input field component must:

```typescript
@Component({
  selector: 'mvs-form-field-[type]',
  template: `
    <div [formGroup]="formGroup">
      <input
        [id]="formField.id"
        [readOnly]="readOnly || disabled"
        [formControlName]="formField.id"
        (change)="handleFieldChange($event)"
        type="text"
        pInputText/>
    </div>
  `
})
export class MvsFormFieldTextFieldComponent
    extends MvsFormFieldBaseComponent
    implements OnInit, OnDestroy, OnChanges {

  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
    this.initialized = true;
  }

  override ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  override handleFieldChange(event: any) {
    const trimmedValue = event.target.value.trim();
    this.formGroup.controls[this.formField.id].setValue(trimmedValue);
    this.onChange.emit(event);
  }
}
```

## Required Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `formGroup` | FormGroup | Yes | Angular FormGroup containing this field |
| `formField` | MvsFormFieldDto | Yes | Field metadata |
| `readOnly` | boolean | No | Display-only mode |
| `disabled` | boolean | No | Grayed out, no interaction |

## Creating MvsFormFieldDto

### Minimal

```typescript
const field = new MvsFormFieldDto();
field.id = 'name';  // Must match FormControl name
```

### Using Static Helper

```typescript
const field = MvsFormFieldDto.createBasic(
  'name',           // id
  'text',           // uiInputControl
  'Customer Name',  // uiLabel
  'update'          // access
);
```

### Full Configuration

```typescript
const field = new MvsFormFieldDto();
field.id = 'email';
field.dataType = 'java.lang.String';
field.uiLabel = 'Email Address';
field.uiInputControl = 'email';
field.uiMandatory = true;
field.access = 'update';
```

## Input Field Categories

### Basic Inputs
- `mvs-form-field-text-field` - Single-line text
- `mvs-form-field-email` - Email with validation
- `mvs-form-field-int-number` - Integer input
- `mvs-form-field-float-number` - Decimal input

See [basic-inputs.md](basic-inputs.md)

### Date/Time Inputs
- `mvs-form-field-date-picker` - Date selection
- `mvs-form-field-date-time` - Date and time
- `mvs-form-field-time` - Time only
- `mvs-form-field-duration-field` - Duration (ISO 8601)

See [date-time-inputs.md](date-time-inputs.md)

### Selection Inputs
- `mvs-form-field-select` - Dropdown
- `mvs-form-field-multi-select` - Multiple selection
- `mvs-form-field-checkbox` - Single checkbox
- `mvs-form-field-input-switch` - Toggle switch
- `mvs-form-field-select-radio` - Radio buttons

See [selection-inputs.md](selection-inputs.md)

### Entity Reference Inputs
- `mvs-form-field-general-index-search` - Entity search
- `mvs-form-field-flexible-search` - Flexible search

See [entity-reference-inputs.md](entity-reference-inputs.md)

### Code Editors
- `mvs-form-field-code-mirror-sql` - SQL editor
- `mvs-form-field-code-mirror-json` - JSON editor

See [code-editor-inputs.md](code-editor-inputs.md)

### Custom Inputs
- `mvs-form-field-iban-field` - IBAN validation
- `mvs-form-field-phone-number` - Phone input
- `mvs-form-field-icon` - Icon picker

See [custom-inputs.md](custom-inputs.md)

## Usage Examples

### Dropdown with Value List

```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Option A' },
  { key: 2, label: 'Option B' }
];

const field = new MvsFormFieldDto();
field.id = 'status';
field.uiInputControl = 'select';
field.valueList = valueList;
```

```html
<mvs-form-field-select
  [formGroup]="formGroup"
  [formField]="field">
</mvs-form-field-select>
```

### Readonly Mode

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField"
  [readOnly]="true">
</mvs-form-field-text-field>
```

### Listening to Changes

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField"
  (onChange)="onFieldChange($event)">
</mvs-form-field-text-field>
```

## Best Practices

### DO: Use Input Components

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField">
</mvs-form-field-text-field>
```

### DON'T: Use HTML Inputs Directly

```html
<!-- WRONG -->
<input type="text" formControlName="name">
```

### DO: Match FormControl Name and field.id

```typescript
formGroup = this.fb.group({
  name: new FormControl('')
});
nameField = { id: 'name' };  // Must match
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Field not displaying | FormControl missing | Add matching FormControl to FormGroup |
| Changes not detected | Missing formGroup binding | Ensure `[formGroup]="formGroup"` is set |
| Dropdown empty | valueList not set | Assign valueList to formField |
| Validation not working | Validators not added | Add validators to FormControl |

## API Reference

For detailed API documentation:

- [MvsFormFieldBaseComponent](MvsFormFieldBaseComponent.md) - Base class API
- [MvsFormFieldDto](MvsFormFieldDto.md) - Field configuration reference

## Validation & Auto-Fix

### Validation

**Purpose:** Verify compliance with all Input Component guidelines.

```bash
# Validate single file
node scripts/check-guidelines.js ./mvs-form-field-custom.component.ts

# Validate entire input directory (component-filtered)
node scripts/check-guidelines.js ./src/app/shared/form/fields
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
node scripts/fix-input-component-rules.js ./mvs-form-field-custom.component.ts --dry-run

# Apply fixes (user must approve)
node scripts/fix-input-component-rules.js ./mvs-form-field-custom.component.ts

# Fix entire input directory
node scripts/fix-input-component-rules.js ./src/app/shared/form/fields --dry-run
```

**Output:** JSON with:
```json
{
  "fixedFiles": [
    {
      "path": "path/to/component.ts",
      "fixes": ["Added handleFieldChange() method", "..."]
    }
  ],
  "skippedFiles": [...],
  "errors": [...]
}
```

**What Gets Fixed:**
- Component structure: Missing `@Component()`, `extends MvsFormFieldBaseComponent`
- Lifecycle methods: Missing `super` calls, `refreshComponent()` call in `ngOnInit()`
- Required methods: Missing `refreshComponent()`, `handleFieldChange()`, `onChange.emit()`
- Required patterns: Missing `this.initialized = true`

**What Requires Manual Intervention:**
- Custom field logic in `handleFieldChange()`
- PrimeNG component selection and configuration
- Component imports
- Template implementation (beyond basic structure)
- FormControl validators

**Claude Response Pattern:**
- Parse JSON output
- Report: "Fixed N files with M corrections"
- List files affected (not all fixes)
- Specify manual steps remaining
- Total response: ≤ 3 sentences
