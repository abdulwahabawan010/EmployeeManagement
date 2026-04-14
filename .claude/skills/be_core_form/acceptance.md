# Acceptance Checklist: Form Implementation

Use this checklist to verify compliance with form implementation standards.

## Class Structure

- [ ] FormObject class extends `FormObjectAbstract<EntityType>`
- [ ] Class is annotated with `@Component`
- [ ] Class is located in `{module}/access/form/` package

## Lifecycle Methods

- [ ] `preLoad()` is implemented when pre-load customization is needed
- [ ] `postLoad()` is implemented when post-load customization is needed
- [ ] `preSave()` is implemented when pre-save validation/transformation is needed
- [ ] `postSave()` is implemented when post-save actions are needed

## FormHelper Usage

- [ ] Field visibility changes use `FormHelper.setFieldVisible()`
- [ ] Field value changes use appropriate FormHelper methods
- [ ] Field configuration uses FormHelper utilities

## Best Practices

- [ ] Form customization logic is in FormObject class, not in controllers
- [ ] FormHelper is used for all field manipulation
- [ ] Entity reference is obtained from lifecycle method parameters
