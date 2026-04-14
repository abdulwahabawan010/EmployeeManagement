---
name: fe_core_form
description: "Frontend: Expert guidance on enterprise forms system including MvsCrudObjectGenericComponent, metadata-driven form creation, Smart Guide integration, and validation. Use when creating or editing business objects, implementing form functionality, or working with form validation. NEVER create manual Angular forms - always use MvsCrudObjectGenericComponent."
---

# Forms

## Overview

In this application, **Forms are not Angular Forms**.

A Form is a **domain-driven, metadata-controlled, enterprise-grade UI system** used to create, edit, validate, confirm, and audit business objects.

Angular Reactive Forms are only the **lowest technical layer**, never the form system itself.

---

## When to Use This Skill

Use Forms when:
- Creating or editing business objects
- Validation, confirmation, or audit is required
- Smart Guide integration is needed
- Forms must scale across many entities

**Do NOT use Forms when:**
- UI is static
- No business object exists
- Simple display-only UI is sufficient

---

## The Golden Rule (CRITICAL)

❌ **NEVER create a form manually**
✅ **ALWAYS use `MvsCrudObjectGenericComponent`**

```html
<!-- ✅ CORRECT -->
<mvs-crud-object-generic
  [objectType]="'ad.Address'"
  [objectId]="addressId">
</mvs-crud-object-generic>

<!-- ❌ WRONG - NEVER DO THIS -->
<form [formGroup]="myForm">
  ...
</form>
```

**Everything else is automatic.**

---

## Core Rules

1. Always use `MvsCrudObjectGenericComponent`
2. Never create Angular forms manually
3. Never manipulate `FormGroup` directly
4. All behavior is metadata-driven

---

## What Forms Represent

Forms represent:
- A business object (DTO)
- Its lifecycle (create, update, delete)
- Validation and confirmation logic
- Layout and structure
- Business intelligence (Smart Guide)
- Audit, history, undo, autosave

**Forms are infrastructure, not UI components.**

---

## Core Problem Solved

Classic Angular forms do not scale for enterprise systems because they:
- Couple UI tightly to DTOs
- Require manual templates per entity
- Cannot evolve dynamically
- Cannot inject Smart Guide, audit, or confirmation logic

**The Forms system solves this by treating the form as data, rendered generically at runtime.**

---

## High-Level Architecture

```
CRUD Object
→ Form Definition (MvsFormDto)
→ Runtime Form (MvsFormGroup)
→ Areas (Header / Body / Footer)
→ Field Groups
→ Fields
→ Input Controls
```

**Each layer has exactly one responsibility.**

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

**Pages never control this lifecycle.**

---

## mvs-form (Renderer)

**Responsibilities:**
- Render Header / Body / Footer
- Handle Smart Guide focus
- Handle confirmation refresh
- Render nested subforms

**Must NOT:**
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

**Custom groups must extend:** `MvsFormFieldGroupComponent`

---

## Fields

Fields are metadata (`MvsFormFieldDto`).

**Each field knows:**
- Its input control
- Validation rules
- Smart Guide metadata
- Confirmation state

**Fields must NOT know:**
- CRUD logic
- Layout context

---

## Input Controls

Input controls are resolved dynamically:

```ts
this.formFieldService.getInputField(uiControl)
```

**This allows:**
- UI switching without code
- Reuse across entities
- Consistent behavior

---

## Smart Guide Integration

Forms support Smart Guide natively.

**Modes:**
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

**Features:**
- Field-level undo
- Global dirty state
- Optional autosave
- Safe local storage

---

## Anti-Patterns (FORBIDDEN)

❌ Creating `<form [formGroup]>` manually
❌ Bypassing `MvsCrudObjectGenericComponent`
❌ Manipulating `FormGroup` directly
❌ Embedding business logic in forms
❌ Implementing validation in UI

---

## STOP-AND-ASK Rule

If you consider writing:
```html
<form [formGroup]="...">
```

**STOP.**
1. Review [form-reference.md](form-reference.md)
2. Ask before implementing

---

## Validation Script

**Location:** `.claude/skills/form/scripts/check-guidelines.js`

**IMPORTANT:** Only run on Claude-generated files (NOT legacy code).

**What it validates:**
- No Manual Forms: Detects `<form>` tags without `mvs-crud-object-generic`
- No Direct FormGroup Usage: Detects `new FormGroup` and `[formGroup]` bindings
- CRUD Generic Enforcement: Ensures forms use `MvsCrudObjectGenericComponent`

**Usage:**
```bash
cd .claude/skills/form/scripts && node check-guidelines.js
```

**Auto-correction workflow:**
1. Claude generates form component
2. Run validation script
3. If errors found → Claude fixes violations
4. Re-run validation
5. Repeat until ✅ all checks pass

**Claude should NEVER leave a file with validation errors.**

---

## Additional Resources

- **Detailed documentation:** [form-reference.md](form-reference.md) - Complete forms system reference
- **Validation script:** `.claude/skills/form/scripts/check-guidelines.js`

---

## Summary

Forms are a **central system**, not an implementation detail.

When used correctly:
- ✅ All entities behave consistently
- ✅ Smart Guide works everywhere
- ✅ Audit, undo, and confirmation are automatic
- ✅ Forms scale without chaos

**Following this skill guarantees:**
- Enterprise scalability
- Consistent UX
- Smart Guide functionality
- Full audit & undo support
