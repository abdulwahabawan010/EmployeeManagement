# Custom and Specialized Input Fields

> **IBAN, Phone, Color picker, Icon selector, and other specialized components**

---

## IBAN Field

### Component
`<mvs-form-field-iban-field>`

### Use For
IBAN (International Bank Account Number) with validation

### Configuration
```typescript
const ibanField = new MvsFormFieldDto();
ibanField.id = 'iban';
ibanField.dataType = 'java.lang.String';
ibanField.uiInputControl = 'iban-field';
ibanField.uiLabel = 'IBAN';
ibanField.uiMandatory = true;
```

### Usage
```html
<mvs-form-field-iban-field
  [formGroup]="formGroup"
  [formField]="ibanField">
</mvs-form-field-iban-field>
```

---

## Phone Number

### Component
`<mvs-form-field-phone-number>`

### Configuration
```typescript
const phoneField = new MvsFormFieldDto();
phoneField.id = 'phone';
phoneField.dataType = 'java.lang.String';
phoneField.uiInputControl = 'phone-number';
phoneField.uiLabel = 'Phone Number';
```

### Usage
```html
<mvs-form-field-phone-number
  [formGroup]="formGroup"
  [formField]="phoneField">
</mvs-form-field-phone-number>
```

---

## Mobile Number

### Component
`<mvs-form-field-mobile-number>`

### Configuration
```typescript
const mobileField = new MvsFormFieldDto();
mobileField.id = 'mobile';
mobileField.dataType = 'java.lang.String';
mobileField.uiInputControl = 'mobile-number';
mobileField.uiLabel = 'Mobile Number';
```

---

## Color Picker

### Component
`<mvs-form-field-colors>`

### Configuration
```typescript
const colorField = new MvsFormFieldDto();
colorField.id = 'color';
colorField.dataType = 'java.lang.String';
colorField.uiInputControl = 'colors';
colorField.uiLabel = 'Color';
```

### Usage
```html
<mvs-form-field-colors
  [formGroup]="formGroup"
  [formField]="colorField">
</mvs-form-field-colors>
```

---

## Icon Selector

### Component
`<mvs-form-field-icon>`

### Configuration
```typescript
const iconField = new MvsFormFieldDto();
iconField.id = 'icon';
iconField.dataType = 'java.lang.String';
iconField.uiInputControl = 'icon';
iconField.uiLabel = 'Icon';
```

### Usage
```html
<mvs-form-field-icon
  [formGroup]="formGroup"
  [formField]="iconField">
</mvs-form-field-icon>
```

---

## Slider

### Component
`<mvs-form-field-slider>`

### Configuration
```typescript
const sliderField = new MvsFormFieldDto();
sliderField.id = 'volume';
sliderField.dataType = 'java.lang.Integer';
sliderField.uiInputControl = 'slider';
sliderField.uiLabel = 'Volume';
sliderField.uiNumberMinValue = 0;
sliderField.uiNumberMaxValue = 100;
```

### Usage
```html
<mvs-form-field-slider
  [formGroup]="formGroup"
  [formField]="sliderField">
</mvs-form-field-slider>
```

---

## Height Input

### Component
`<mvs-form-field-height>`

### Configuration
```typescript
const heightField = new MvsFormFieldDto();
heightField.id = 'height';
heightField.dataType = 'java.lang.Integer';
heightField.uiInputControl = 'height';
heightField.uiLabel = 'Height (cm)';
```

---

## Badge

### Component
`<mvs-form-field-badge>`

### Configuration
```typescript
const badgeField = new MvsFormFieldDto();
badgeField.id = 'badge';
badgeField.dataType = 'java.lang.String';
badgeField.uiInputControl = 'badge';
badgeField.uiLabel = 'Badge';
```

---

## Document Upload

### Component
`<mvs-form-field-document-upload>`

### Use For
File upload functionality

### Configuration
```typescript
const uploadField = new MvsFormFieldDto();
uploadField.id = 'document';
uploadField.uiInputControl = 'document-upload';
uploadField.uiLabel = 'Upload Document';
```

---

## Complete Example

```typescript
formGroup: FormGroup;
ibanField: MvsFormFieldDto;
phoneField: MvsFormFieldDto;
colorField: MvsFormFieldDto;
iconField: MvsFormFieldDto;
sliderField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    iban: new FormControl(''),
    phone: new FormControl(''),
    color: new FormControl('#000000'),
    icon: new FormControl('fa fa-home'),
    volume: new FormControl(50)
  });

  // IBAN
  this.ibanField = new MvsFormFieldDto();
  this.ibanField.id = 'iban';
  this.ibanField.uiInputControl = 'iban-field';
  this.ibanField.uiLabel = 'IBAN';
  this.ibanField.uiMandatory = true;

  // Phone
  this.phoneField = new MvsFormFieldDto();
  this.phoneField.id = 'phone';
  this.phoneField.uiInputControl = 'phone-number';
  this.phoneField.uiLabel = 'Phone';

  // Color
  this.colorField = new MvsFormFieldDto();
  this.colorField.id = 'color';
  this.colorField.uiInputControl = 'colors';
  this.colorField.uiLabel = 'Theme Color';

  // Icon
  this.iconField = new MvsFormFieldDto();
  this.iconField.id = 'icon';
  this.iconField.uiInputControl = 'icon';
  this.iconField.uiLabel = 'Icon';

  // Slider
  this.sliderField = new MvsFormFieldDto();
  this.sliderField.id = 'volume';
  this.sliderField.uiInputControl = 'slider';
  this.sliderField.uiLabel = 'Volume';
  this.sliderField.uiNumberMinValue = 0;
  this.sliderField.uiNumberMaxValue = 100;
}
```

```html
<div class="grid">
  <div class="col-12">
    <mvs-form-field-iban-field
      [formGroup]="formGroup"
      [formField]="ibanField">
    </mvs-form-field-iban-field>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-phone-number
      [formGroup]="formGroup"
      [formField]="phoneField">
    </mvs-form-field-phone-number>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-colors
      [formGroup]="formGroup"
      [formField]="colorField">
    </mvs-form-field-colors>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-icon
      [formGroup]="formGroup"
      [formField]="iconField">
    </mvs-form-field-icon>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-slider
      [formGroup]="formGroup"
      [formField]="sliderField">
    </mvs-form-field-slider>
  </div>
</div>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
