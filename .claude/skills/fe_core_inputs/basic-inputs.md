# Basic Input Fields

> **Text, Email, and Number input field components with examples**

---

## Overview

Basic input fields are the most commonly used form controls for simple text and numeric data entry.

---

## Text Field

### Component

`<mvs-form-field-text-field>`

### Use For

Single-line text input (names, titles, short descriptions)

### Configuration

```typescript
const nameField = new MvsFormFieldDto();
nameField.id = 'name';
nameField.data

Type = 'java.lang.String';
nameField.uiInputControl = 'text';
nameField.uiLabel = 'Name';
nameField.uiMandatory = true;
nameField.uiStringMaxLength = 100;
```

### Usage

```html
<mvs-form-field-text-field
  [formGroup]="formGroup"
  [formField]="nameField">
</mvs-form-field-text-field>
```

### Complete Example

```typescript
// Component
formGroup: FormGroup;
nameField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)])
  });

  this.nameField = new MvsFormFieldDto();
  this.nameField.id = 'name';
  this.nameField.uiInputControl = 'text';
  this.nameField.uiLabel = 'Full Name';
  this.nameField.uiMandatory = true;
  this.nameField.uiPlaceholder = 'Enter your name';
  this.nameField.uiStringMaxLength = 100;
}
```

---

## Email Field

### Component

`<mvs-form-field-email>`

### Use For

Email address input with validation

### Configuration

```typescript
const emailField = new MvsFormFieldDto();
emailField.id = 'email';
emailField.dataType = 'java.lang.String';
emailField.uiInputControl = 'email';
emailField.uiLabel = 'Email';
emailField.uiMandatory = true;
emailField.uiPlaceholder = 'name@example.com';
```

### Usage

```html
<mvs-form-field-email
  [formGroup]="formGroup"
  [formField]="emailField">
</mvs-form-field-email>
```

### Complete Example

```typescript
formGroup: FormGroup;
emailField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  this.emailField = new MvsFormFieldDto();
  this.emailField.id = 'email';
  this.emailField.uiInputControl = 'email';
  this.emailField.uiLabel = 'Email Address';
  this.emailField.uiMandatory = true;
  this.emailField.uiPlaceholder = 'your.email@company.com';
}
```

---

## Integer Number Field

### Component

`<mvs-form-field-int-number>`

### Use For

Whole numbers (age, quantity, count)

### Configuration

```typescript
const ageField = new MvsFormFieldDto();
ageField.id = 'age';
ageField.dataType = 'java.lang.Integer';
ageField.uiInputControl = 'int-number';
ageField.uiLabel = 'Age';
ageField.uiNumberMinValue = 0;
ageField.uiNumberMaxValue = 120;
```

### Usage

```html
<mvs-form-field-int-number
  [formGroup]="formGroup"
  [formField]="ageField">
</mvs-form-field-int-number>
```

### Complete Example

```typescript
formGroup: FormGroup;
ageField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    age: new FormControl(null, [Validators.min(0), Validators.max(120)])
  });

  this.ageField = new MvsFormFieldDto();
  this.ageField.id = 'age';
  this.ageField.dataType = 'java.lang.Integer';
  this.ageField.uiInputControl = 'int-number';
  this.ageField.uiLabel = 'Age';
  this.ageField.uiNumberMinValue = 0;
  this.ageField.uiNumberMaxValue = 120;
  this.ageField.uiPlaceholder = 'Enter age';
}
```

---

## Float Number Field

### Component

`<mvs-form-field-float-number>`

### Use For

Decimal numbers (price, weight, percentage)

### Configuration

```typescript
const priceField = new MvsFormFieldDto();
priceField.id = 'price';
priceField.dataType = 'java.lang.Double';
priceField.uiInputControl = 'float-number';
priceField.uiLabel = 'Price';
priceField.uiDoubleMinValue = 0.0;
priceField.uiDoubleMaxValue = 99999.99;
```

### Usage

```html
<mvs-form-field-float-number
  [formGroup]="formGroup"
  [formField]="priceField">
</mvs-form-field-float-number>
```

### Complete Example

```typescript
formGroup: FormGroup;
priceField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    price: new FormControl(null, [Validators.min(0), Validators.max(99999.99)])
  });

  this.priceField = new MvsFormFieldDto();
  this.priceField.id = 'price';
  this.priceField.dataType = 'java.lang.Double';
  this.priceField.uiInputControl = 'float-number';
  this.priceField.uiLabel = 'Price';
  this.priceField.uiDoubleMinValue = 0.0;
  this.priceField.uiDoubleMaxValue = 99999.99;
  this.priceField.uiPlaceholder = '0.00';
}
```

---

## Text Area Field

### Component

`<mvs-form-field-text-area-field>`

### Use For

Multi-line text input (descriptions, notes, comments)

### Configuration

```typescript
const notesField = new MvsFormFieldDto();
notesField.id = 'notes';
notesField.dataType = 'java.lang.String';
notesField.uiInputControl = 'textarea';
notesField.uiLabel = 'Notes';
notesField.uiStringMaxLength = 500;
```

### Usage

```html
<mvs-form-field-text-area-field
  [formGroup]="formGroup"
  [formField]="notesField">
</mvs-form-field-text-area-field>
```

### Complete Example

```typescript
formGroup: FormGroup;
notesField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    notes: new FormControl('', [Validators.maxLength(500)])
  });

  this.notesField = new MvsFormFieldDto();
  this.notesField.id = 'notes';
  this.notesField.uiInputControl = 'textarea';
  this.notesField.uiLabel = 'Notes';
  this.notesField.uiPlaceholder = 'Enter your notes here...';
  this.notesField.uiStringMaxLength = 500;
}
```

---

## Complete Form Example

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MvsFormFieldDto } from '../dto/mvs-form-field.dto';

@Component({
  selector: 'app-basic-form',
  templateUrl: './basic-form.component.html'
})
export class BasicFormComponent implements OnInit {
  formGroup: FormGroup;

  nameField: MvsFormFieldDto;
  emailField: MvsFormFieldDto;
  ageField: MvsFormFieldDto;
  priceField: MvsFormFieldDto;
  notesField: MvsFormFieldDto;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Create FormGroup
    this.formGroup = this.fb.group({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      age: new FormControl(null, [Validators.min(0), Validators.max(120)]),
      price: new FormControl(null, [Validators.min(0)]),
      notes: new FormControl('', [Validators.maxLength(500)])
    });

    // Create Fields
    this.nameField = MvsFormFieldDto.createBasic('name', 'text', 'Full Name');
    this.nameField.uiMandatory = true;
    this.nameField.uiStringMaxLength = 100;

    this.emailField = MvsFormFieldDto.createBasic('email', 'email', 'Email');
    this.emailField.uiMandatory = true;
    this.emailField.uiPlaceholder = 'name@example.com';

    this.ageField = MvsFormFieldDto.createBasic('age', 'int-number', 'Age');
    this.ageField.uiNumberMinValue = 0;
    this.ageField.uiNumberMaxLength = 120;

    this.priceField = MvsFormFieldDto.createBasic('price', 'float-number', 'Price');
    this.priceField.uiDoubleMinValue = 0.0;

    this.notesField = MvsFormFieldDto.createBasic('notes', 'textarea', 'Notes');
    this.notesField.uiStringMaxLength = 500;
  }

  onSubmit() {
    if (this.formGroup.valid) {
      console.log('Form values:', this.formGroup.value);
    }
  }
}
```

```html
<!-- basic-form.component.html -->
<form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
  <div class="grid">
    <div class="col-12">
      <mvs-form-field-text-field
        [formGroup]="formGroup"
        [formField]="nameField">
      </mvs-form-field-text-field>
    </div>

    <div class="col-12">
      <mvs-form-field-email
        [formGroup]="formGroup"
        [formField]="emailField">
      </mvs-form-field-email>
    </div>

    <div class="col-12 md:col-6">
      <mvs-form-field-int-number
        [formGroup]="formGroup"
        [formField]="ageField">
      </mvs-form-field-int-number>
    </div>

    <div class="col-12 md:col-6">
      <mvs-form-field-float-number
        [formGroup]="formGroup"
        [formField]="priceField">
      </mvs-form-field-float-number>
    </div>

    <div class="col-12">
      <mvs-form-field-text-area-field
        [formGroup]="formGroup"
        [formField]="notesField">
      </mvs-form-field-text-area-field>
    </div>

    <div class="col-12">
      <button type="submit" pButton label="Submit" [disabled]="!formGroup.valid"></button>
    </div>
  </div>
</form>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
