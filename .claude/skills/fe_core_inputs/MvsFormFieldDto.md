# MvsFormFieldDto - Field Metadata Reference

> **Complete reference for MvsFormFieldDto - The configuration object for all input fields**

---

## Overview

**Purpose:** MvsFormFieldDto is the metadata configuration object that defines how an input field should behave, what it should display, and how it integrates with the form system.

**Location:** `features/core/shared/dto/mvs-form-field.dto.ts`

---

## Table of Contents

1. [Core Properties](#core-properties)
2. [UI Configuration](#ui-configuration)
3. [Validation Properties](#validation-properties)
4. [Entity Reference Properties](#entity-reference-properties)
5. [Helper Methods](#helper-methods)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)

---

## Core Properties

### `id: string`

**Required.** The unique identifier for this field, must match the FormControl name.

```typescript
field.id = 'customerName';  // Must match FormControl name
```

### `dataType: string`

The data type of the field value.

**Common Values:**
- `'java.lang.String'` - Text
- `'java.lang.Integer'` - Integer number
- `'java.lang.Double'` - Decimal number
- `'java.lang.Boolean'` - Boolean
- `'java.time.LocalDate'` - Date
- `'java.time.LocalDateTime'` - Date and time
- Entity types: `'cr.Customer'`, `'tm.Ticket'`, etc.

```typescript
field.dataType = 'java.lang.String';
```

### `uiInputControl: string`

The type of input control to render.

**Common Values:**
- `'text'` - Text field
- `'email'` - Email field
- `'int-number'` - Integer number
- `'float-number'` - Decimal number
- `'date-picker'` - Date picker
- `'select'` - Dropdown
- `'checkbox'` - Checkbox
- `'textarea'` - Text area
- Many more...

```typescript
field.uiInputControl = 'text';
```

### `uiLabel: string`

The display label for the field.

```typescript
field.uiLabel = 'Customer Name';
```

### `access: string`

Field access mode.

**Values:**
- `'read'` - Read-only
- `'update'` - Can be edited
- `'create'` - Only for creation

```typescript
field.access = 'update';
```

---

## UI Configuration

### `uiMandatory: boolean`

Whether the field is required.

```typescript
field.uiMandatory = true;  // Shows * indicator
```

### `uiDescription: string`

Help text/description for the field.

```typescript
field.uiDescription = 'Enter the customer full name';
```

### `uiPlaceholder: string`

Placeholder text for the input.

```typescript
field.uiPlaceholder = 'Enter name...';
```

### `uiOrder: number`

Display order in form (lower numbers first).

```typescript
field.uiOrder = 10;
```

### `uiGroupName: string`

Field group this field belongs to.

```typescript
field.uiGroupName = 'Personal Information';
```

### `valueList: MvsFormValueListDto`

Options for dropdown/select fields.

```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Active' },
  { key: 2, label: 'Inactive' }
];

field.valueList = valueList;
```

---

## Validation Properties

### String Validation

```typescript
field.uiStringMinLength = 3;
field.uiStringMaxLength = 100;
field.uiStringPattern = '^[a-zA-Z]+$';  // Regex pattern
```

### Number Validation

```typescript
// Integer
field.uiNumberMinValue = 0;
field.uiNumberMaxValue = 100;

// Float/Double
field.uiDoubleMinValue = 0.0;
field.uiDoubleMaxValue = 9999.99;
```

### Date Validation

```typescript
field.uiDateMinValue = '2020-01-01';
field.uiDateMaxValue = '2025-12-31';
```

---

## Entity Reference Properties

### `uiReferenceDataObjectType: string`

The entity type this field references.

```typescript
field.uiReferenceDataObjectType = 'cr.Customer';
```

### `relationship: string`

The type of relationship.

**Values:**
- `'ManyToOne'` - Many-to-one
- `'OneToMany'` - One-to-many
- `'ManyToMany'` - Many-to-many

```typescript
field.relationship = 'ManyToOne';
```

---

## Helper Methods

### `static createBasic(id, uiInputControl, uiLabel, access?): MvsFormFieldDto`

Create a basic field with minimal configuration.

```typescript
const field = MvsFormFieldDto.createBasic(
  'name',              // id
  'text',              // uiInputControl
  'Customer Name',     // uiLabel
  'update'             // access (optional)
);
```

---

## Complete Examples

### Example 1: Text Field

```typescript
const nameField = new MvsFormFieldDto();
nameField.id = 'name';
nameField.dataType = 'java.lang.String';
nameField.uiInputControl = 'text';
nameField.uiLabel = 'Name';
nameField.uiMandatory = true;
nameField.uiStringMaxLength = 100;
nameField.access = 'update';
```

### Example 2: Email Field

```typescript
const emailField = new MvsFormFieldDto();
emailField.id = 'email';
emailField.dataType = 'java.lang.String';
emailField.uiInputControl = 'email';
emailField.uiLabel = 'Email Address';
emailField.uiMandatory = true;
emailField.uiPlaceholder = 'name@example.com';
emailField.access = 'update';
```

### Example 3: Number Field

```typescript
const ageField = new MvsFormFieldDto();
ageField.id = 'age';
ageField.dataType = 'java.lang.Integer';
ageField.uiInputControl = 'int-number';
ageField.uiLabel = 'Age';
ageField.uiNumberMinValue = 0;
ageField.uiNumberMaxValue = 120;
ageField.access = 'update';
```

### Example 4: Date Field

```typescript
const birthDateField = new MvsFormFieldDto();
birthDateField.id = 'birthDate';
birthDateField.dataType = 'java.time.LocalDate';
birthDateField.uiInputControl = 'date-birth';
birthDateField.uiLabel = 'Birth Date';
birthDateField.uiMandatory = true;
birthDateField.access = 'update';
```

### Example 5: Dropdown Field

```typescript
// Create value list
const statusValueList = new MvsFormValueListDto();
statusValueList.entries = [
  { key: 1, label: 'Active', color: 'green-800' },
  { key: 2, label: 'Inactive', color: 'red-800' },
  { key: 3, label: 'Pending', color: 'yellow-800' }
];

// Create field
const statusField = new MvsFormFieldDto();
statusField.id = 'status';
statusField.dataType = 'java.lang.Integer';
statusField.uiInputControl = 'select';
statusField.uiLabel = 'Status';
statusField.uiMandatory = true;
statusField.valueList = statusValueList;
statusField.access = 'update';
```

### Example 6: Checkbox Field

```typescript
const activeField = new MvsFormFieldDto();
activeField.id = 'active';
activeField.dataType = 'java.lang.Boolean';
activeField.uiInputControl = 'checkbox';
activeField.uiLabel = 'Is Active';
activeField.access = 'update';
```

### Example 7: Entity Reference Field

```typescript
const customerField = new MvsFormFieldDto();
customerField.id = 'customerDtoId';
customerField.dataType = 'cr.Customer';
customerField.uiInputControl = 'general-index-search';
customerField.uiLabel = 'Customer';
customerField.uiReferenceDataObjectType = 'cr.Customer';
customerField.relationship = 'ManyToOne';
customerField.uiMandatory = true;
customerField.access = 'update';
```

---

## Best Practices

### 1. Always Set Required Properties

```typescript
// ✅ GOOD - All required properties set
const field = new MvsFormFieldDto();
field.id = 'name';              // ← Required
field.uiInputControl = 'text';  // ← Required
field.uiLabel = 'Name';         // ← Recommended

// ❌ BAD - Missing required properties
const field = new MvsFormFieldDto();
field.uiLabel = 'Name';  // Missing id and uiInputControl!
```

### 2. Match id to FormControl Name

```typescript
// ✅ GOOD - Names match
this.formGroup = this.fb.group({
  customerName: new FormControl('')
});

field.id = 'customerName';  // ← Matches FormControl

// ❌ BAD - Names don't match
this.formGroup = this.fb.group({
  customerName: new FormControl('')
});

field.id = 'name';  // ← Mismatch!
```

### 3. Use Appropriate uiInputControl

```typescript
// ✅ GOOD - Appropriate control for data type
field.dataType = 'java.lang.String';
field.uiInputControl = 'text';  // ← Matches data type

// ❌ BAD - Wrong control for data type
field.dataType = 'java.time.LocalDate';
field.uiInputControl = 'text';  // ← Should be date-picker!
```

### 4. Set Validation Properties

```typescript
// ✅ GOOD - Validation configured
field.uiMandatory = true;
field.uiStringMinLength = 3;
field.uiStringMaxLength = 50;

// ❌ BAD - No validation
field.uiMandatory = false;
// Missing min/max length
```

### 5. Use Helper Methods When Possible

```typescript
// ✅ GOOD - Using helper method
const field = MvsFormFieldDto.createBasic('name', 'text', 'Name', 'update');

// ❌ VERBOSE - Manual creation
const field = new MvsFormFieldDto();
field.id = 'name';
field.uiInputControl = 'text';
field.uiLabel = 'Name';
field.access = 'update';
```

---

## Related Documentation

- [MvsFormFieldBaseComponent.md](MvsFormFieldBaseComponent.md) - Base component reference
- [skill.md](./skill.md) - Complete input fields guide
- [basic-inputs.md](basic-inputs.md) - Basic input examples
- [selection-inputs.md](selection-inputs.md) - Selection input examples

---

**Last Updated:** 2026-01-07
**Version:** 1.0
