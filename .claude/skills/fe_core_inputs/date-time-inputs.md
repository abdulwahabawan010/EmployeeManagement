# Date and Time Input Fields

> **Date picker, DateTime, Duration, and Time input components**

---

## Date Picker

### Component
`<mvs-form-field-date-picker>`

### Configuration
```typescript
const dateField = new MvsFormFieldDto();
dateField.id = 'startDate';
dateField.dataType = 'java.time.LocalDate';
dateField.uiInputControl = 'date-picker';
dateField.uiLabel = 'Start Date';
dateField.uiMandatory = true;
```

### Usage
```html
<mvs-form-field-date-picker
  [formGroup]="formGroup"
  [formField]="dateField">
</mvs-form-field-date-picker>
```

---

## Date Birth

### Component
`<mvs-form-field-date-birth>`

### Use For
Birth dates (restricts to past dates)

### Configuration
```typescript
const birthDateField = new MvsFormFieldDto();
birthDateField.id = 'birthDate';
birthDateField.dataType = 'java.time.LocalDate';
birthDateField.uiInputControl = 'date-birth';
birthDateField.uiLabel = 'Birth Date';
```

### Usage
```html
<mvs-form-field-date-birth
  [formGroup]="formGroup"
  [formField]="birthDateField">
</mvs-form-field-date-birth>
```

---

## Date Today

### Component
`<mvs-form-field-date-today>`

### Use For
Dates that default to today

### Configuration
```typescript
const todayField = new MvsFormFieldDto();
todayField.id = 'createdDate';
todayField.dataType = 'java.time.LocalDate';
todayField.uiInputControl = 'date-today';
todayField.uiLabel = 'Created Date';
```

---

## Date Time

### Component
`<mvs-form-field-date-time>`

### Use For
Date and time selection

### Configuration
```typescript
const dateTimeField = new MvsFormFieldDto();
dateTimeField.id = 'appointmentDateTime';
dateTimeField.dataType = 'java.time.LocalDateTime';
dateTimeField.uiInputControl = 'date-time';
dateTimeField.uiLabel = 'Appointment';
```

### Usage
```html
<mvs-form-field-date-time
  [formGroup]="formGroup"
  [formField]="dateTimeField">
</mvs-form-field-date-time>
```

---

## Time

### Component
`<mvs-form-field-time>`

### Use For
Time-only input

### Configuration
```typescript
const timeField = new MvsFormFieldDto();
timeField.id = 'startTime';
timeField.dataType = 'java.time.LocalTime';
timeField.uiInputControl = 'time';
timeField.uiLabel = 'Start Time';
```

---

## Duration

### Component
`<mvs-form-field-duration-field>`

### Use For
Duration/time span (ISO 8601 format)

### Configuration
```typescript
const durationField = new MvsFormFieldDto();
durationField.id = 'duration';
durationField.dataType = 'java.time.Duration';
durationField.uiInputControl = 'duration';
durationField.uiLabel = 'Duration';
```

---

## Complete Example

```typescript
formGroup: FormGroup;
startDateField: MvsFormFieldDto;
birthDateField: MvsFormFieldDto;
appointmentField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    startDate: new FormControl(null, [Validators.required]),
    birthDate: new FormControl(null),
    appointmentDateTime: new FormControl(null)
  });

  this.startDateField = new MvsFormFieldDto();
  this.startDateField.id = 'startDate';
  this.startDateField.dataType = 'java.time.LocalDate';
  this.startDateField.uiInputControl = 'date-picker';
  this.startDateField.uiLabel = 'Start Date';
  this.startDateField.uiMandatory = true;

  this.birthDateField = new MvsFormFieldDto();
  this.birthDateField.id = 'birthDate';
  this.birthDateField.dataType = 'java.time.LocalDate';
  this.birthDateField.uiInputControl = 'date-birth';
  this.birthDateField.uiLabel = 'Birth Date';

  this.appointmentField = new MvsFormFieldDto();
  this.appointmentField.id = 'appointmentDateTime';
  this.appointmentField.dataType = 'java.time.LocalDateTime';
  this.appointmentField.uiInputControl = 'date-time';
  this.appointmentField.uiLabel = 'Appointment';
}
```

```html
<div class="grid">
  <div class="col-12 md:col-6">
    <mvs-form-field-date-picker
      [formGroup]="formGroup"
      [formField]="startDateField">
    </mvs-form-field-date-picker>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-date-birth
      [formGroup]="formGroup"
      [formField]="birthDateField">
    </mvs-form-field-date-birth>
  </div>

  <div class="col-12">
    <mvs-form-field-date-time
      [formGroup]="formGroup"
      [formField]="appointmentField">
    </mvs-form-field-date-time>
  </div>
</div>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
