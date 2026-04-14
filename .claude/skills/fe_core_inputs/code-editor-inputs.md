# Code Editor Input Fields

> **SQL, JSON, Groovy, and SPEL code editor components**

---

## SQL Editor

### Component
`<mvs-form-field-code-mirror-sql>`

### Use For
SQL query editing with syntax highlighting

### Configuration
```typescript
const sqlField = new MvsFormFieldDto();
sqlField.id = 'query';
sqlField.dataType = 'java.lang.String';
sqlField.uiInputControl = 'code-mirror-sql';
sqlField.uiLabel = 'SQL Query';
```

### Usage
```html
<mvs-form-field-code-mirror-sql
  [formGroup]="formGroup"
  [formField]="sqlField">
</mvs-form-field-code-mirror-sql>
```

---

## JSON Editor

### Component
`<mvs-form-field-code-mirror-json>`

### Use For
JSON editing with validation and formatting

### Configuration
```typescript
const jsonField = new MvsFormFieldDto();
jsonField.id = 'config';
jsonField.dataType = 'java.lang.String';
jsonField.uiInputControl = 'code-mirror-json';
jsonField.uiLabel = 'Configuration (JSON)';
```

### Usage
```html
<mvs-form-field-code-mirror-json
  [formGroup]="formGroup"
  [formField]="jsonField">
</mvs-form-field-code-mirror-json>
```

---

## Groovy Editor

### Component
`<mvs-form-field-code-mirror-groovy>`

### Use For
Groovy script editing

### Configuration
```typescript
const groovyField = new MvsFormFieldDto();
groovyField.id = 'script';
groovyField.dataType = 'java.lang.String';
groovyField.uiInputControl = 'code-mirror-groovy';
groovyField.uiLabel = 'Groovy Script';
```

---

## SPEL Editor

### Component
`<mvs-form-field-code-mirror-spel>`

### Use For
Spring Expression Language editing

### Configuration
```typescript
const spelField = new MvsFormFieldDto();
spelField.id = 'expression';
spelField.dataType = 'java.lang.String';
spelField.uiInputControl = 'code-mirror-spel';
spelField.uiLabel = 'Expression (SPEL)';
```

---

## Complete Example

```typescript
formGroup: FormGroup;
sqlField: MvsFormFieldDto;
jsonField: MvsFormFieldDto;
groovyField: MvsFormFieldDto;

ngOnInit() {
  this.formGroup = this.fb.group({
    query: new FormControl('SELECT * FROM table'),
    config: new FormControl('{}'),
    script: new FormControl('')
  });

  this.sqlField = new MvsFormFieldDto();
  this.sqlField.id = 'query';
  this.sqlField.uiInputControl = 'code-mirror-sql';
  this.sqlField.uiLabel = 'SQL Query';

  this.jsonField = new MvsFormFieldDto();
  this.jsonField.id = 'config';
  this.jsonField.uiInputControl = 'code-mirror-json';
  this.jsonField.uiLabel = 'Configuration';

  this.groovyField = new MvsFormFieldDto();
  this.groovyField.id = 'script';
  this.groovyField.uiInputControl = 'code-mirror-groovy';
  this.groovyField.uiLabel = 'Script';
}
```

```html
<div class="grid">
  <div class="col-12">
    <mvs-form-field-code-mirror-sql
      [formGroup]="formGroup"
      [formField]="sqlField">
    </mvs-form-field-code-mirror-sql>
  </div>

  <div class="col-12">
    <mvs-form-field-code-mirror-json
      [formGroup]="formGroup"
      [formField]="jsonField">
    </mvs-form-field-code-mirror-json>
  </div>

  <div class="col-12">
    <mvs-form-field-code-mirror-groovy
      [formGroup]="formGroup"
      [formField]="groovyField">
    </mvs-form-field-code-mirror-groovy>
  </div>
</div>
```

---

**Last Updated:** 2026-01-07
**Version:** 1.0
