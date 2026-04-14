# Forms

## Purpose

In this application, **Forms are not Angular Forms**.

A Form is a **domain-driven, metadata-controlled, enterprise-grade UI system** used to create, edit, validate, confirm, and audit business objects.
Angular Reactive Forms are only the **lowest technical layer**, never the form system itself.

Forms represent:
- A business object (DTO)
- Its lifecycle (create, update, delete)
- Validation and confirmation logic
- Layout and structure
- Business intelligence (Smart Guide)
- Audit, history, undo, autosave

Forms are **infrastructure**, not UI components.

---

## Core Problem Solved

Classic Angular forms do not scale for enterprise systems because they:
- Couple UI tightly to DTOs
- Require manual templates per entity
- Cannot evolve dynamically
- Cannot inject Smart Guide, audit, or confirmation logic

The Forms system solves this by treating the form as **data**, rendered generically at runtime.

---

## High-Level Architecture

CRUD Object  
→ Form Definition (`MvsFormDto`)  
→ Runtime Form (`MvsFormGroup`)  
→ Areas (Header / Body / Footer)  
→ Field Groups  
→ Fields  
→ Input Controls  

Each layer has **exactly one responsibility**.

---

## The Only Valid Entry Point (Golden Rule)

❌ Never create a form manually  
✅ Always use `MvsCrudObjectGenericComponent`

```html
<mvs-crud-object-generic
  [objectType]="'ad.Address'"
  [objectId]="addressId">
</mvs-crud-object-generic>
```

Everything else is automatic.

---

## Form Lifecycle (Internal)

1. Page embeds `MvsCrudObjectGenericComponent`
2. CRUD service is resolved
3. DTO + `MvsFormDto` are loaded
4. `MvsFormDto` → `MvsFormGroup`
5. `mvs-form` renders layout
6. Field groups rendered
7. Fields rendered
8. Input controls injected dynamically

Pages never control this lifecycle.

---

## mvs-form (Renderer)

Responsibilities:
- Render Header / Body / Footer
- Handle Smart Guide focus
- Handle confirmation refresh
- Render nested subforms

It must not:
- Talk to backend
- Contain business logic
- Decide CRUD actions

---

## Field Groups

Each field group:
- Controls layout
- Filters visible fields
- Applies widget configuration
- Handles group-level Smart Guide
- Handles group-level confirmation

Custom groups must extend:
`MvsFormFieldGroupComponent`

---

## Fields

Fields are metadata (`MvsFormFieldDto`).

Each field knows:
- Its input control
- Validation rules
- Smart Guide metadata
- Confirmation state

Fields must not know:
- CRUD logic
- Layout context

---

## Input Controls

Input controls are resolved dynamically:

```ts
this.formFieldService.getInputField(uiControl)
```

This allows:
- UI switching without code
- Reuse across entities
- Consistent behavior

---

## Smart Guide Integration

Forms support Smart Guide natively.

Modes:
- `SMART_CONFIG` – configure guides
- `SMART` – runtime AI assistance
- `NORMAL` – disabled

Fields and groups may emit focus events and fetch AI advice automatically.

---

## Confirmation & Validation

Forms support **business confirmation**, not just validation:
- Field-level confirmation
- Group-level confirmation
- Validity dates
- Backend-driven updates

---

## Undo, Dirty State, Autosave

Provided automatically via:
- `FormStateService`
- `FieldStorageService`

Features:
- Field-level undo
- Global dirty state
- Optional autosave
- Safe local storage

---

## Anti-Patterns (Forbidden)

- Creating `<form [formGroup]>` manually
- Bypassing `MvsCrudObjectGenericComponent`
- Manipulating `FormGroup` directly
- Embedding business logic in forms
- Implementing validation in UI

---

## Summary

Forms are a **central system**, not an implementation detail.

When used correctly:
- All entities behave consistently
- Smart Guide works everywhere
- Audit, undo, and confirmation are automatic
- Forms scale without chaos
