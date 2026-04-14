# MvsFormFieldBaseComponent - Base Class Reference

> **Complete API documentation for MvsFormFieldBaseComponent - The foundation for all input field components**

---

## Overview

**Location:** `features/core/shared/form/field/base/mvs-form-field-base.component.ts`

**Purpose:** Base class that all input field components extend to provide consistent functionality, state management, and lifecycle behavior.

**Key Responsibilities:**
- Managing FormGroup integration
- Handling readonly and disabled states
- Change tracking and field storage
- Smart Guide integration
- Standardized lifecycle hooks
- Common event emission

---

## Table of Contents

1. [Class Properties](#class-properties)
2. [Input Properties](#input-properties)
3. [Output Properties](#output-properties)
4. [Lifecycle Methods](#lifecycle-methods)
5. [Core Methods](#core-methods)
6. [Creating Custom Input Components](#creating-custom-input-components)
7. [Complete Examples](#complete-examples)
8. [Best Practices](#best-practices)

---

## Class Properties

### `formGroup: FormGroup`

The Angular Reactive FormGroup that contains this field's FormControl.

**Type:** `FormGroup`

**Usage:** Automatically bound via `@Input()`

**Example:**
```typescript
// In parent component
this.formGroup = this.fb.group({
  name: new FormControl('')
});
```

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField">
</mvs-form-field-text-field>
```

### `formField: MvsFormFieldDto`

The metadata object describing this field's configuration.

**Type:** `MvsFormFieldDto`

**Usage:** Automatically bound via `@Input()`

**Properties Used:**
- `id` - FormControl name (required)
- `uiLabel` - Display label
- `uiInputControl` - Input type
- `valueList` - Options for select/dropdown
- `uiMandatory` - Required indicator
- `dataType` - Data type
- Many more configuration properties

### `readOnly: boolean`

Whether the field is in read-only mode (displays value, cannot edit).

**Type:** `boolean`

**Default:** `false`

**Usage:**
```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField"
  [readOnly]="true">
</mvs-form-field-text-field>
```

### `disabled: boolean`

Whether the field is disabled (grayed out, cannot interact).

**Type:** `boolean`

**Default:** `false`

**Usage:**
```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField"
  [disabled]="true">
</mvs-form-field-text-field>
```

### `initialized: boolean`

Whether the component has completed initialization.

**Type:** `boolean`

**Default:** `false`

**Usage:** Set to `true` in `ngOnInit()` after setup completes

```typescript
override ngOnInit() {
  super.ngOnInit();
  this.refreshComponent();
  this.initialized = true;  // ← Set after initialization
}
```

### `hasChanged: boolean`

Whether the field value has changed from its original value.

**Type:** `boolean`

**Default:** `false`

**Usage:** Automatically managed by base component, used for visual change indicators

---

## Input Properties

### `@Input() formGroup: FormGroup`

Required. The FormGroup containing this field's FormControl.

### `@Input() formField: MvsFormFieldDto`

Required. The field metadata configuration.

### `@Input() readOnly: boolean`

Optional. Display-only mode.

### `@Input() disabled: boolean`

Optional. Disabled/grayed-out mode.

### `@Input() hideLabel: boolean`

Optional. Hide the field label (if wrapper used).

---

## Output Properties

### `@Output() onChange: EventEmitter<any>`

Emitted when the field value changes.

**Usage:**
```typescript
onFieldChange(event: any) {
  console.log('Field changed:', event);
}
```

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField"
  (onChange)="onFieldChange($event)">
</mvs-form-field-text-field>
```

---

## Lifecycle Methods

### `ngOnInit(): void`

Called when the component is initialized.

**Override Pattern:**
```typescript
override ngOnInit() {
  super.ngOnInit();  // ← Always call super first

  // Your initialization logic here
  this.refreshComponent();

  this.initialized = true;  // ← Mark as initialized
}
```

**What Base Does:**
- Initializes field storage
- Sets up Smart Guide integration
- Registers with form system
- Initializes change tracking

### `ngOnChanges(changes: SimpleChanges): void`

Called when input properties change.

**Override Pattern:**
```typescript
override ngOnChanges(changes: SimpleChanges) {
  super.ngOnChanges(changes);  // ← Always call super first

  // Handle specific property changes
  if (changes['formField']) {
    this.refreshComponent();
  }
}
```

### `ngOnDestroy(): void`

Called when the component is destroyed.

**Override Pattern:**
```typescript
override ngOnDestroy() {
  // Your cleanup logic here

  super.ngOnDestroy();  // ← Always call super last
}
```

**What Base Does:**
- Unregisters from field storage
- Cleans up Smart Guide subscriptions
- Removes event listeners

---

## Core Methods

### `refreshComponent(): void`

Refresh the component state and configuration.

**Override Pattern:**
```typescript
override refreshComponent() {
  // Custom refresh logic
  if (this.formField && this.formGroup) {
    // Load data, configure options, etc.
  }
}
```

**When Called:**
- During `ngOnInit()`
- When `formField` changes
- When manual refresh needed

### `handleFieldChange(event: any): void`

Handle field value change events.

**Override Pattern:**
```typescript
override handleFieldChange(event: any) {
  // Custom change handling
  const value = event.target.value;

  // Update FormControl if needed
  this.formGroup.controls[this.formField.id].setValue(value);

  // Emit change event
  this.onChange.emit(event);
}
```

**Example - Trim Whitespace:**
```typescript
override handleFieldChange(event: any) {
  const trimmedValue = event.target.value.trim();
  this.formGroup.controls[this.formField.id].setValue(trimmedValue);
  this.onChange.emit(event);
}
```

### `getFormControl(): FormControl`

Get the FormControl for this field.

**Returns:** `FormControl`

**Usage:**
```typescript
const control = this.getFormControl();
if (control.valid) {
  // Do something
}
```

---

## Creating Custom Input Components

### Step 1: Create Component Class

```typescript
import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MvsFormFieldBaseComponent } from '../base/mvs-form-field-base.component';

@Component({
  selector: 'mvs-form-field-custom-input',
  templateUrl: './mvs-form-field-custom-input.component.html',
  styleUrls: ['./mvs-form-field-custom-input.component.scss'],
  standalone: false
})
export class MvsFormFieldCustomInputComponent
  extends MvsFormFieldBaseComponent
  implements OnInit, OnChanges, OnDestroy {

  // Custom properties
  customOption: string = 'default';

  // Lifecycle hooks
  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
    this.initialized = true;
  }

  override ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);

    if (changes['formField']) {
      this.refreshComponent();
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  // Custom methods
  override refreshComponent() {
    if (this.formField && this.formGroup) {
      // Initialize custom options
      this.customOption = this.formField.customProperty || 'default';
    }
  }

  override handleFieldChange(event: any) {
    // Custom change handling
    const value = this.processValue(event.target.value);
    this.formGroup.controls[this.formField.id].setValue(value);
    this.onChange.emit(event);
  }

  processValue(value: any): any {
    // Custom value processing
    return value;
  }
}
```

### Step 2: Create Template

```html
<!-- mvs-form-field-custom-input.component.html -->
<div [formGroup]="formGroup" *ngIf="initialized">
  <!-- Label -->
  <label [for]="formField.id" *ngIf="!hideLabel && formField.uiLabel">
    {{ formField.uiLabel }}
    <span *ngIf="formField.uiMandatory" class="text-red-500">*</span>
  </label>

  <!-- Input -->
  <input
    [id]="formField.id"
    [formControlName]="formField.id"
    [readOnly]="readOnly || disabled"
    [disabled]="disabled"
    (change)="handleFieldChange($event)"
    type="text"
    pInputText
    class="w-full"
    [class.field-changed]="hasChanged"/>

  <!-- Validation Errors -->
  <small
    *ngIf="formGroup.get(formField.id)?.invalid && formGroup.get(formField.id)?.touched"
    class="p-error">
    {{ getErrorMessage() }}
  </small>
</div>
```

### Step 3: Register in Module

```typescript
import { NgModule } from '@angular/core';
import { MvsFormFieldCustomInputComponent } from './mvs-form-field-custom-input.component';

@NgModule({
  declarations: [
    MvsFormFieldCustomInputComponent
  ],
  exports: [
    MvsFormFieldCustomInputComponent
  ]
})
export class CoreSharedModule { }
```

### Step 4: Register with FormFieldService

Map the `uiInputControl` value to your component:

```typescript
// In FormFieldService or similar
const componentMap = {
  'text': MvsFormFieldTextFieldComponent,
  'email': MvsFormFieldEmailComponent,
  'custom-input': MvsFormFieldCustomInputComponent,  // ← Add your component
  // ... other mappings
};
```

---

## Complete Examples

### Example 1: Simple Text Input

```typescript
import { Component, OnInit } from '@angular/core';
import { MvsFormFieldBaseComponent } from '../base/mvs-form-field-base.component';

@Component({
  selector: 'mvs-form-field-simple-text',
  template: `
    <div [formGroup]="formGroup">
      <input
        [id]="formField.id"
        [formControlName]="formField.id"
        [readOnly]="readOnly || disabled"
        (change)="handleFieldChange($event)"
        type="text"
        pInputText/>
    </div>
  `
})
export class MvsFormFieldSimpleTextComponent
  extends MvsFormFieldBaseComponent
  implements OnInit {

  override ngOnInit() {
    super.ngOnInit();
    this.initialized = true;
  }

  override handleFieldChange(event: any) {
    this.onChange.emit(event);
  }
}
```

### Example 2: Number Input with Validation

```typescript
import { Component, OnInit } from '@angular/core';
import { MvsFormFieldBaseComponent } from '../base/mvs-form-field-base.component';

@Component({
  selector: 'mvs-form-field-custom-number',
  template: `
    <div [formGroup]="formGroup">
      <label [for]="formField.id">{{ formField.uiLabel }}</label>
      <input
        [id]="formField.id"
        [formControlName]="formField.id"
        [readOnly]="readOnly || disabled"
        [min]="minValue"
        [max]="maxValue"
        (change)="handleFieldChange($event)"
        type="number"
        pInputText/>
      <small *ngIf="showError()" class="p-error">
        Value must be between {{ minValue }} and {{ maxValue }}
      </small>
    </div>
  `
})
export class MvsFormFieldCustomNumberComponent
  extends MvsFormFieldBaseComponent
  implements OnInit {

  minValue = 0;
  maxValue = 100;

  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
    this.initialized = true;
  }

  override refreshComponent() {
    if (this.formField) {
      this.minValue = this.formField.uiNumberMinValue || 0;
      this.maxValue = this.formField.uiNumberMaxValue || 100;
    }
  }

  override handleFieldChange(event: any) {
    const value = parseFloat(event.target.value);

    // Validate range
    if (value < this.minValue || value > this.maxValue) {
      this.formGroup.get(this.formField.id).setErrors({ range: true });
    }

    this.onChange.emit(event);
  }

  showError(): boolean {
    const control = this.formGroup.get(this.formField.id);
    return control?.invalid && control?.touched;
  }
}
```

### Example 3: Dropdown with Dynamic Options

```typescript
import { Component, OnInit } from '@angular/core';
import { MvsFormFieldBaseComponent } from '../base/mvs-form-field-base.component';

@Component({
  selector: 'mvs-form-field-custom-dropdown',
  template: `
    <div [formGroup]="formGroup">
      <label [for]="formField.id">{{ formField.uiLabel }}</label>
      <p-select
        [id]="formField.id"
        [formControlName]="formField.id"
        [options]="options"
        [disabled]="readOnly || disabled"
        (onChange)="handleFieldChange($event)"
        optionLabel="label"
        optionValue="key"
        placeholder="Select an option">
      </p-select>
    </div>
  `
})
export class MvsFormFieldCustomDropdownComponent
  extends MvsFormFieldBaseComponent
  implements OnInit {

  options: any[] = [];

  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
    this.initialized = true;
  }

  override refreshComponent() {
    if (this.formField?.valueList?.entries) {
      this.options = this.formField.valueList.entries;
    }
  }

  override handleFieldChange(event: any) {
    this.onChange.emit(event);
  }
}
```

### Example 4: Input with External Data Loading

```typescript
import { Component, OnInit } from '@angular/core';
import { MvsFormFieldBaseComponent } from '../base/mvs-form-field-base.component';
import { DataService } from '../services/data.service';

@Component({
  selector: 'mvs-form-field-data-dropdown',
  template: `
    <div [formGroup]="formGroup">
      <label [for]="formField.id">{{ formField.uiLabel }}</label>
      <p-select
        [id]="formField.id"
        [formControlName]="formField.id"
        [options]="options"
        [loading]="loading"
        [disabled]="readOnly || disabled"
        (onChange)="handleFieldChange($event)"
        optionLabel="name"
        optionValue="id">
      </p-select>
    </div>
  `
})
export class MvsFormFieldDataDropdownComponent
  extends MvsFormFieldBaseComponent
  implements OnInit {

  options: any[] = [];
  loading = false;

  constructor(private dataService: DataService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.loadOptions();
    this.initialized = true;
  }

  async loadOptions() {
    this.loading = true;
    try {
      // Load options from service
      this.options = await this.dataService.getOptions(this.formField.id).toPromise();
    } catch (error) {
      console.error('Failed to load options:', error);
    } finally {
      this.loading = false;
    }
  }

  override handleFieldChange(event: any) {
    this.onChange.emit(event);
  }
}
```

---

## Best Practices

### 1. Always Call super() Methods

```typescript
// ✅ GOOD
override ngOnInit() {
  super.ngOnInit();  // ← Always call super first
  this.refreshComponent();
  this.initialized = true;
}

// ❌ BAD
override ngOnInit() {
  // Missing super.ngOnInit() - breaks base functionality
  this.refreshComponent();
  this.initialized = true;
}
```

### 2. Set initialized Flag

```typescript
// ✅ GOOD
override ngOnInit() {
  super.ngOnInit();
  this.refreshComponent();
  this.initialized = true;  // ← Mark as initialized
}

// ❌ BAD
override ngOnInit() {
  super.ngOnInit();
  this.refreshComponent();
  // Missing initialized = true - template won't render
}
```

### 3. Emit onChange Events

```typescript
// ✅ GOOD
override handleFieldChange(event: any) {
  // Process value
  const value = this.processValue(event.target.value);
  this.formGroup.controls[this.formField.id].setValue(value);

  // Always emit change event
  this.onChange.emit(event);  // ← Emit change
}

// ❌ BAD
override handleFieldChange(event: any) {
  const value = this.processValue(event.target.value);
  this.formGroup.controls[this.formField.id].setValue(value);
  // Missing onChange.emit() - parent won't know about changes
}
```

### 4. Handle Readonly and Disabled Properly

```html
<!-- ✅ GOOD -->
<input
  [readOnly]="readOnly || disabled"
  [disabled]="disabled"
  [formControlName]="formField.id"/>

<!-- ❌ BAD -->
<input
  [readOnly]="readOnly"
  [formControlName]="formField.id"/>
  <!-- Missing disabled handling -->
```

### 5. Use FormControl Name from formField.id

```html
<!-- ✅ GOOD -->
<input [formControlName]="formField.id"/>

<!-- ❌ BAD -->
<input formControlName="hardcodedName"/>
```

### 6. Refresh on formField Changes

```typescript
// ✅ GOOD
override ngOnChanges(changes: SimpleChanges) {
  super.ngOnChanges(changes);

  if (changes['formField']) {
    this.refreshComponent();  // ← Refresh when formField changes
  }
}

// ❌ BAD
override ngOnChanges(changes: SimpleChanges) {
  super.ngOnChanges(changes);
  // Missing refresh - component won't update
}
```

### 7. Check initialized Before Rendering

```html
<!-- ✅ GOOD -->
<div [formGroup]="formGroup" *ngIf="initialized">
  <!-- Content -->
</div>

<!-- ❌ BAD -->
<div [formGroup]="formGroup">
  <!-- Content renders before initialization complete -->
</div>
```

---

## Common Patterns

### Pattern 1: Value Transformation

```typescript
override handleFieldChange(event: any) {
  // Transform value before setting
  let value = event.target.value;

  // Example: Convert to uppercase
  value = value.toUpperCase();

  // Example: Remove special characters
  value = value.replace(/[^a-zA-Z0-9]/g, '');

  // Example: Limit length
  value = value.substring(0, 50);

  // Set transformed value
  this.formGroup.controls[this.formField.id].setValue(value);
  this.onChange.emit(event);
}
```

### Pattern 2: Conditional Validation

```typescript
override handleFieldChange(event: any) {
  const value = event.target.value;
  const control = this.formGroup.get(this.formField.id);

  // Custom validation based on field configuration
  if (this.formField.uiMandatory && !value) {
    control.setErrors({ required: true });
  } else if (value.length < this.formField.uiStringMinLength) {
    control.setErrors({ minLength: true });
  } else {
    control.setErrors(null);
  }

  this.onChange.emit(event);
}
```

### Pattern 3: Dependent Fields

```typescript
override handleFieldChange(event: any) {
  const value = event.target.value;

  // Update other fields based on this value
  if (value === 'special') {
    this.formGroup.get('otherField').setValue('auto-filled');
    this.formGroup.get('anotherField').disable();
  }

  this.onChange.emit(event);
}
```

---

## Related Documentation

- [MvsFormFieldDto.md](MvsFormFieldDto.md) - Field metadata configuration
- [skill.md](./skill.md) - Complete input fields guide
- [basic-inputs.md](basic-inputs.md) - Basic input examples
- [selection-inputs.md](selection-inputs.md) - Selection input examples

---

**Last Updated:** 2026-01-07
**Version:** 1.0
