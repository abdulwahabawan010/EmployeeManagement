# MvsFormFieldOutputBaseComponent - Base Class Reference

> **Complete API documentation for MvsFormFieldOutputBaseComponent - The foundation for all output field components**

---

## Overview

**Location:** `features/core/shared/form/output/base/mvs-form-field-output-base.component.ts`

**Purpose:** Base class that all output field components extend to provide consistent functionality and lifecycle behavior.

---

## Class Properties

### `value: any`

The data value to display.

**Type:** `any`

**Usage:** Automatically bound via `@Input()`

```typescript
[value]="customer.birthDate"
[value]="42"
[value]="true"
```

### `formField: MvsFormFieldDto`

Optional metadata configuration.

**Type:** `MvsFormFieldDto`

**Usage:** For value lists, icons, configuration

```typescript
[formField]="{valueList: statusValueList}"
[formField]="{iconSize: 'text-xl'}"
```

### `dto: DtoDetail`

Optional full object containing the field.

**Type:** `DtoDetail`

**Usage:** For context and navigation

```typescript
[dto]="customer"
```

### `initialized: boolean`

Whether component has completed initialization.

**Type:** `boolean`

**Default:** `false`

---

## Input Properties

### `@Input() value: any`

Required. The data value to display.

### `@Input() formField: MvsFormFieldDto`

Optional. Metadata configuration.

### `@Input() dto: DtoDetail`

Optional. Full object for context.

### `@Input() form: MvsFormDto`

Optional. Form definition.

---

## Output Properties

### `@Output() onFieldValueSelected: EventEmitter<any>`

Emitted when user interacts with the output (clicks, selects).

```typescript
(onFieldValueSelected)="handleClick($event)"
```

---

## Lifecycle Methods

### `ngOnInit(): void`

```typescript
override ngOnInit() {
  super.ngOnInit();  // Always call super first
  this.refreshComponent();
  this.initialized = true;
}
```

### `ngOnChanges(changes: SimpleChanges): void`

```typescript
ngOnChanges(changes: SimpleChanges) {
  if (!this.initialized) return;
  this.refreshComponent();
}
```

### `ngOnDestroy(): void`

```typescript
override ngOnDestroy() {
  super.ngOnDestroy();  // Always call super last
}
```

---

## Core Methods

### `refreshComponent(): void`

Refresh component display based on value changes.

```typescript
override refreshComponent() {
  if (!this.value) {
    this.formattedValue = '';
    return;
  }
  this.formattedValue = this.formatValue(this.value);
  this.initialized = true;
}
```

---

## Creating Custom Output Components

### Step 1: Create Component Class

```typescript
import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MvsFormFieldOutputBaseComponent } from '../base/mvs-form-field-output-base.component';

@Component({
  selector: 'mvs-form-control-output-custom',
  template: `<span>{{ formattedValue }}</span>`,
  standalone: false
})
export class MvsFormFieldOutputCustomComponent
  extends MvsFormFieldOutputBaseComponent
  implements OnInit, OnChanges {

  formattedValue: string;

  override ngOnInit() {
    super.ngOnInit();
    this.refreshComponent();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.initialized) return;
    this.refreshComponent();
  }

  override refreshComponent() {
    if (!this.value) {
      this.formattedValue = '';
      return;
    }
    this.formattedValue = this.formatValue(this.value);
  }

  private formatValue(value: any): string {
    // Custom formatting logic
    return value.toString();
  }
}
```

### Step 2: Register in Module

```typescript
@NgModule({
  declarations: [MvsFormFieldOutputCustomComponent],
  exports: [MvsFormFieldOutputCustomComponent]
})
export class CoreSharedModule { }
```

---

## Best Practices

### 1. Always Call super() Methods

```typescript
// ✅ GOOD
override ngOnInit() {
  super.ngOnInit();
  this.refreshComponent();
  this.initialized = true;
}

// ❌ BAD
override ngOnInit() {
  this.refreshComponent();  // Missing super call
}
```

### 2. Set initialized Flag

```typescript
// ✅ GOOD
override ngOnInit() {
  super.ngOnInit();
  this.refreshComponent();
  this.initialized = true;  // Mark as initialized
}
```

### 3. Handle Null Values

```typescript
// ✅ GOOD
override refreshComponent() {
  if (!this.value || this.value === '-') {
    this.formattedValue = this.value || '';
    return;
  }
  this.formattedValue = this.formatValue(this.value);
}
```

### 4. Refresh on Value Changes

```typescript
// ✅ GOOD
ngOnChanges(changes: SimpleChanges) {
  if (!this.initialized) return;
  if (changes['value']) {
    this.refreshComponent();
  }
}
```

---

## Related Documentation

- [skill.md](./skill.md) - Complete output fields guide
- [all-outputs-reference.md](all-outputs-reference.md) - All output components reference

---

**Last Updated:** 2026-01-07
**Version:** 1.0
