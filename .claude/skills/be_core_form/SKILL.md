---
name: be_core_form
description: "Backend: Expert guidance on FormObject classes for customizing form generation, field manipulation, and form lifecycle methods. Use when creating FormObject classes, implementing form customization, manipulating form fields, or working with FormHelper utilities."
---

# Form Implementation Guide

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/core/form/usage-guideline.md`

## When to Use This Skill

Use when:
- Creating FormObject classes
- Customizing form generation
- Manipulating form fields
- Implementing form lifecycle methods

## Key Concepts

### FormObjectAbstract
Base class for form customizations:
```java
public class MyEntityForm extends FormObjectAbstract<MyEntity> {
    // Implement lifecycle methods
}
```

### Package Location
Store in `{module}/access/form/` package

### FormHelper
Utility class for field manipulation:
- Modify field visibility
- Set field values
- Configure field options
- Handle field dependencies

## Lifecycle Methods

### preLoad()
Called before entity data is loaded into form.

### postLoad()
Called after entity data is loaded into form.

### preSave()
Called before form data is saved to entity.

### postSave()
Called after form data is saved to entity.

## Implementation Pattern

```java
@Component
public class MyEntityForm extends FormObjectAbstract<MyEntity> {

    @Override
    public void postLoad(FormObject formObject, MyEntity entity) {
        // Customize form after loading
        FormHelper.setFieldVisible(formObject, "fieldName", false);
    }

    @Override
    public void preSave(FormObject formObject, MyEntity entity) {
        // Validate or transform before save
    }
}
```

## Automated Checks

The following checks are automated via `scripts/check-form.js`:

| Rule ID | Name | Description | Auto-fixable |
|---------|------|-------------|--------------|
| FORM-001 | Extends FormObjectAbstract | Class must extend FormObjectAbstract<EntityType> | No |
| FORM-002 | Has @Component Annotation | Class must have @Component annotation | Yes |
| FORM-003 | Correct Package Location | Must be in {module}/access/form/ package | No |
| FORM-004 | Lifecycle Method Signatures | Methods must have correct (FormObject, Entity) parameters | No |
| FORM-005 | Uses FormHelper | Use FormHelper methods instead of direct field access | No |
| FORM-006 | FormHelper Method Exists | Verify FormHelper method names are valid | No |
| FORM-007 | Override Annotation | Lifecycle methods should have @Override | Yes |

### Usage

```bash
# Check a directory
node scripts/check-form.js backend/src/main/java/

# Check specific category
node scripts/check-form.js --category lifecycle backend/src/

# Output as JSON
node scripts/check-form.js --json backend/ > report.json

# List all rules
node scripts/check-form.js --list-rules
```

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
