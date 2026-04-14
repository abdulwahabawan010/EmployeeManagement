# Selection Input Fields

> **Dropdown, Multi-select, Radio, Checkbox, and Switch components**

---

## Dropdown/Select

### Component
`<mvs-form-field-select>`

### Configuration
```typescript
// Create value list
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Option A' },
  { key: 2, label: 'Option B' },
  { key: 3, label: 'Option C' }
];

const selectField = new MvsFormFieldDto();
selectField.id = 'status';
selectField.uiInputControl = 'select';
selectField.uiLabel = 'Status';
selectField.valueList = valueList;
```

### Usage
```html
<mvs-form-field-select
  [formGroup]="formGroup"
  [formField]="selectField">
</mvs-form-field-select>
```

### With Icons and Colors
```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  {
    key: 1,
    label: 'High',
    image: 'fa fa-arrow-up',
    color: 'red-800',
    backgroundColor: 'red-200'
  },
  {
    key: 2,
    label: 'Medium',
    image: 'fa fa-minus',
    color: 'yellow-800',
    backgroundColor: 'yellow-200'
  },
  {
    key: 3,
    label: 'Low',
    image: 'fa fa-arrow-down',
    color: 'green-800',
    backgroundColor: 'green-200'
  }
];
```

---

## Multi-Select

### Component
`<mvs-form-field-multi-select>`

### Use For
Multiple selection dropdown

### Configuration
```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Tag 1' },
  { key: 2, label: 'Tag 2' },
  { key: 3, label: 'Tag 3' }
];

const tagsField = new MvsFormFieldDto();
tagsField.id = 'tags';
tagsField.uiInputControl = 'multi-select';
tagsField.uiLabel = 'Tags';
tagsField.valueList = valueList;
```

### Usage
```html
<mvs-form-field-multi-select
  [formGroup]="formGroup"
  [formField]="tagsField">
</mvs-form-field-multi-select>
```

---

## Radio Buttons

### Component
`<mvs-form-field-select-radio>`

### Configuration
```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Option 1' },
  { key: 2, label: 'Option 2' },
  { key: 3, label: 'Option 3' }
];

const radioField = new MvsFormFieldDto();
radioField.id = 'choice';
radioField.uiInputControl = 'select-radio';
radioField.uiLabel = 'Choose One';
radioField.valueList = valueList;
```

### Usage
```html
<mvs-form-field-select-radio
  [formGroup]="formGroup"
  [formField]="radioField">
</mvs-form-field-select-radio>
```

---

## Checkbox

### Component
`<mvs-form-field-checkbox>`

### Configuration
```typescript
const checkboxField = new MvsFormFieldDto();
checkboxField.id = 'active';
checkboxField.dataType = 'java.lang.Boolean';
checkboxField.uiInputControl = 'checkbox';
checkboxField.uiLabel = 'Is Active';
```

### Usage
```html
<mvs-form-field-checkbox
  [formGroup]="formGroup"
  [formField]="checkboxField">
</mvs-form-field-checkbox>
```

---

## Input Switch

### Component
`<mvs-form-field-input-switch>`

### Configuration
```typescript
const switchField = new MvsFormFieldDto();
switchField.id = 'enabled';
switchField.dataType = 'java.lang.Boolean';
switchField.uiInputControl = 'switch';
switchField.uiLabel = 'Enabled';
```

### Usage
```html
<mvs-form-field-input-switch
  [formGroup]="formGroup"
  [formField]="switchField">
</mvs-form-field-input-switch>
```

---

## Select Button

### Component
`<mvs-form-field-select-button>`

### Use For
Button-based selection (like tabs)

### Configuration
```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Day', image: 'fa fa-sun' },
  { key: 2, label: 'Week', image: 'fa fa-calendar-week' },
  { key: 3, label: 'Month', image: 'fa fa-calendar' }
];

const viewField = new MvsFormFieldDto();
viewField.id = 'viewMode';
viewField.uiInputControl = 'select-button';
viewField.uiLabel = 'View';
viewField.valueList = valueList;
```

---

## Chip

### Component
`<mvs-form-field-select-chip>`

### Use For
Chip-based selection

### Configuration
```typescript
const valueList = new MvsFormValueListDto();
valueList.entries = [
  { key: 1, label: 'Small' },
  { key: 2, label: 'Medium' },
  { key: 3, label: 'Large' }
];

const sizeField = new MvsFormFieldDto();
sizeField.id = 'size';
sizeField.uiInputControl = 'select-chip';
sizeField.uiLabel = 'Size';
sizeField.valueList = valueList;
```

---

## Rating

### Component
`<mvs-form-field-rating>`

### Configuration
```typescript
const ratingField = new MvsFormFieldDto();
ratingField.id = 'rating';
ratingField.dataType = 'java.lang.Integer';
ratingField.uiInputControl = 'rating';
ratingField.uiLabel = 'Rating';
```

### Usage
```html
<mvs-form-field-rating
  [formGroup]="formGroup"
  [formField]="ratingField">
</mvs-form-field-rating>
```

---

## Complete Example

```typescript
formGroup: FormGroup;
statusField: MvsFormFieldDto;
tagsField: MvsFormFieldDto;
activeField: MvsFormFieldDto;
enabledField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    status: new FormControl(1),
    tags: new FormControl([]),
    active: new FormControl(false),
    enabled: new FormControl(true)
  });

  // Status dropdown
  const statusValueList = new MvsFormValueListDto();
  statusValueList.entries = [
    { key: 1, label: 'Active', color: 'green-800' },
    { key: 2, label: 'Inactive', color: 'red-800' }
  ];

  this.statusField = new MvsFormFieldDto();
  this.statusField.id = 'status';
  this.statusField.uiInputControl = 'select';
  this.statusField.uiLabel = 'Status';
  this.statusField.valueList = statusValueList;

  // Tags multi-select
  const tagsValueList = new MvsFormValueListDto();
  tagsValueList.entries = [
    { key: 1, label: 'Important' },
    { key: 2, label: 'Urgent' },
    { key: 3, label: 'Review' }
  ];

  this.tagsField = new MvsFormFieldDto();
  this.tagsField.id = 'tags';
  this.tagsField.uiInputControl = 'multi-select';
  this.tagsField.uiLabel = 'Tags';
  this.tagsField.valueList = tagsValueList;

  // Active checkbox
  this.activeField = MvsFormFieldDto.createBasic('active', 'checkbox', 'Is Active');

  // Enabled switch
  this.enabledField = MvsFormFieldDto.createBasic('enabled', 'switch', 'Enabled');
}
```

```html
<div class="grid">
  <div class="col-12 md:col-6">
    <mvs-form-field-select
      [formGroup]="formGroup"
      [formField]="statusField">
    </mvs-form-field-select>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-multi-select
      [formGroup]="formGroup"
      [formField]="tagsField">
    </mvs-form-field-multi-select>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-checkbox
      [formGroup]="formGroup"
      [formField]="activeField">
    </mvs-form-field-checkbox>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-input-switch
      [formGroup]="formGroup"
      [formField]="enabledField">
    </mvs-form-field-input-switch>
  </div>
</div>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
