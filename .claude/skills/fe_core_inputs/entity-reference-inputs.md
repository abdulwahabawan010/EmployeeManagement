# Entity Reference Input Fields

> **Components for selecting and searching related entities**

---

## General Index Search

### Component
`<mvs-form-field-general-index-search>`

### Use For
Search and select any entity type

### Configuration
```typescript
const customerField = new MvsFormFieldDto();
customerField.id = 'customerDtoId';
customerField.dataType = 'cr.Customer';
customerField.uiInputControl = 'general-index-search';
customerField.uiLabel = 'Customer';
customerField.uiReferenceDataObjectType = 'cr.Customer';
customerField.relationship = 'ManyToOne';
```

### Usage
```html
<mvs-form-field-general-index-search
  [formGroup]="formGroup"
  [formField]="customerField">
</mvs-form-field-general-index-search>
```

---

## Flexible Search

### Component
`<mvs-form-field-flexible-search>`

### Use For
Advanced entity search with filters

### Configuration
```typescript
const projectField = new MvsFormFieldDto();
projectField.id = 'projectDtoId';
projectField.dataType = 'sp.Project';
projectField.uiInputControl = 'flexible-search';
projectField.uiLabel = 'Project';
projectField.uiReferenceDataObjectType = 'sp.Project';
```

---

## Ticket Type Selector

### Component
`<mvs-form-field-ticket-type-selector>`

### Use For
Selecting ticket types

### Configuration
```typescript
const ticketTypeField = new MvsFormFieldDto();
ticketTypeField.id = 'ticketTypeDtoId';
ticketTypeField.dataType = 'tm.TicketType';
ticketTypeField.uiInputControl = 'ticket-type-selector';
ticketTypeField.uiLabel = 'Ticket Type';
ticketTypeField.relationship = 'ManyToOne';
```

### Usage
```html
<mvs-form-field-ticket-type-selector
  [formGroup]="formGroup"
  [formField]="ticketTypeField">
</mvs-form-field-ticket-type-selector>
```

---

## Entity Context Attribute

### Component
`<mvs-form-field-entity-context-attribute>`

### Use For
Context-aware attribute selection

### Configuration
```typescript
const attributeField = new MvsFormFieldDto();
attributeField.id = 'attributeId';
attributeField.uiInputControl = 'entity-context-attribute';
attributeField.uiLabel = 'Attribute';
```

---

## Complete Example

```typescript
formGroup: FormGroup;
customerField: MvsFormFieldDto;
projectField: MvsFormFieldDto;
ticketTypeField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    customerDtoId: new FormControl(null, [Validators.required]),
    projectDtoId: new FormControl(null),
    ticketTypeDtoId: new FormControl(null, [Validators.required])
  });

  // Customer search
  this.customerField = new MvsFormFieldDto();
  this.customerField.id = 'customerDtoId';
  this.customerField.dataType = 'cr.Customer';
  this.customerField.uiInputControl = 'general-index-search';
  this.customerField.uiLabel = 'Customer';
  this.customerField.uiReferenceDataObjectType = 'cr.Customer';
  this.customerField.relationship = 'ManyToOne';
  this.customerField.uiMandatory = true;

  // Project search
  this.projectField = new MvsFormFieldDto();
  this.projectField.id = 'projectDtoId';
  this.projectField.dataType = 'sp.Project';
  this.projectField.uiInputControl = 'flexible-search';
  this.projectField.uiLabel = 'Project';
  this.projectField.uiReferenceDataObjectType = 'sp.Project';

  // Ticket type selector
  this.ticketTypeField = new MvsFormFieldDto();
  this.ticketTypeField.id = 'ticketTypeDtoId';
  this.ticketTypeField.dataType = 'tm.TicketType';
  this.ticketTypeField.uiInputControl = 'ticket-type-selector';
  this.ticketTypeField.uiLabel = 'Ticket Type';
  this.ticketTypeField.uiMandatory = true;
}
```

```html
<div class="grid">
  <div class="col-12">
    <mvs-form-field-general-index-search
      [formGroup]="formGroup"
      [formField]="customerField">
    </mvs-form-field-general-index-search>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-flexible-search
      [formGroup]="formGroup"
      [formField]="projectField">
    </mvs-form-field-flexible-search>
  </div>

  <div class="col-12 md:col-6">
    <mvs-form-field-ticket-type-selector
      [formGroup]="formGroup"
      [formField]="ticketTypeField">
    </mvs-form-field-ticket-type-selector>
  </div>
</div>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
