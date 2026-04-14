---
name: fe_core_primeng
description: "Frontend: Expert guidance on PrimeNG v20 UI component library including component usage, theming, and Forms integration. Use when working with PrimeNG components, styling UI, or integrating with the Forms system. Covers p-tabs, p-select, p-datePicker, p-drawer, p-popover, p-toggleSwitch, and other v20 components."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# PrimeNG

## Overview

PrimeNG is the **standard UI component library** for this application. It provides consistent, accessible, and themeable UI building blocks.

**PrimeNG is not used freely — it is used under strict architectural rules.**

---

## PrimeNG Version Enforcement (MANDATORY)

This project uses **PrimeNG v20 only**.

Only components, modules, APIs, and syntax that exist in PrimeNG v20 are allowed.

Any legacy or deprecated PrimeNG syntax must never be used.

---

## When to Use This Skill

Use this skill when:
- Working with PrimeNG v20 components
- Styling and theming UI components
- Integrating PrimeNG with the Forms system
- Configuring PrimeNG globally
- Implementing UI patterns with PrimeNG

---

## Critical Rules (Apply IMMEDIATELY)

### 1. Version Rules (PrimeNG v20)

**This application uses PrimeNG v20 syntax.**

### Core Component Reference

**Date Selection:**
- Component: `p-datePicker`
- Module: `DatePickerModule`

**Tabs:**
- Component: `p-tabs`
- Module: `TabsModule`

**Select Dropdown:**
- Component: `p-select`
- Module: `SelectModule`

**Popover:**
- Component: `p-popover`
- Module: `PopoverModule`

**Drawer (Side Panel):**
- Component: `p-drawer`
- Module: `DrawerModule`

**Toggle Switch:**
- Component: `p-toggleSwitch`
- Module: `ToggleSwitchModule`

**Checkbox (including three-state):**
- Component: `p-checkbox` (use `indeterminate` property for three-state)
- Module: `CheckboxModule`

**Stepper (Step Wizard):**
- Component: `p-stepper`
- Module: `StepperModule`

**Accordion Panel:**
- Component: `p-accordion-panel`
- Module: `AccordionModule`

**Menu Components:**
- Basic menu: `p-menu`
- Complex menus: Use `p-menu` with nested items or grid layout
- Menu bar: Use `p-toolbar` with `p-menu`
- Slide menu: Use `p-drawer` with `p-menu`

---

## p-tabs Structure
```html
<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Tab 1</p-tab>
    <p-tab value="1">Tab 2</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0">Content 1</p-tabpanel>
    <p-tabpanel value="1">Content 2</p-tabpanel>
  </p-tabpanels>
</p-tabs>
```

---

## Global Configuration Rules

### Required Global Setup

PrimeNG must be configured **once globally** via `providePrimeNG`:

```ts
providePrimeNG({
  theme: {
    preset: KlausPreset, // Mandatory theme preset
    options: {
      darkModeSelector: '.app-dark'
    }
  },
  ripple: true,
  locale: deLocale // German localization
});
```

**All colors, surfaces, and typography MUST come from the theme preset.**

---

## Module Import Rules

### Shared Module Pattern

- All commonly used PrimeNG modules are imported in **SharedModule**
- Feature modules import **SharedModule**
- Feature modules may import additional PrimeNG modules only if required

**Best Practices:**
- Import specific modules: `import { TableModule } from 'primeng/table';`
- Centralize common imports in SharedModule
- Import feature-specific modules only where needed

---

## Styling & Theming Rules

### Priority Order

Use styling in this order:

1. **PrimeNG component APIs** (e.g., `severity`, `variant`)
2. **PrimeFlex utility classes** (e.g., `p-3`, `flex`, `gap-2`)
3. **Theme CSS variables** (e.g., `var(--primary-color)`)
4. **Component-scoped SCSS** (last resort)

**Best Practices:**
- Use theme CSS variables for colors
- Use PrimeFlex utility classes for layout and spacing
- Keep styles consistent with the Klaus Preset theme

---

## Width & Sizing Units (MANDATORY)

### Rule: Use PrimeFlex Width Utilities Instead of Inline Styles

**NEVER use `px` in inline styles for widths.** Instead, use PrimeFlex utility classes with `rem` units.

**Why PrimeFlex utilities are the right approach:**

1. **Accessibility**: `rem` scales with user's browser font-size settings
2. **Consistency**: All sizing follows the same relative scale
3. **Maintainability**: No inline styles scattered across templates
4. **Theme Integration**: Works seamlessly with the Klaus Preset

### PrimeFlex Width Utilities

| Class | Size | Approx. px (at 16px base) |
|-------|------|---------------------------|
| `w-1rem` | 1rem | 16px |
| `w-2rem` | 2rem | 32px |
| `w-3rem` | 3rem | 48px |
| `w-4rem` | 4rem | 64px |
| `w-5rem` | 5rem | 80px |
| `w-6rem` | 6rem | 96px |
| `w-7rem` | 7rem | 112px |
| `w-8rem` | 8rem | 128px |
| `w-9rem` | 9rem | 144px |
| `w-10rem` | 10rem | 160px |

### Examples

```html
<!-- ❌ FORBIDDEN: px in inline styles -->
<th style="width: 100px">Column</th>
<div style="width: 200px">Content</div>

<!-- ❌ AVOID: rem in inline styles (acceptable but not preferred) -->
<th style="width: 6rem">Column</th>

<!-- ✅ CORRECT: PrimeFlex utility classes -->
<th class="w-6rem">Column</th>
<div class="w-12rem">Content</div>

<!-- ✅ CORRECT: Combining with other utilities -->
<th class="w-8rem text-right">Amount</th>
```

### Table Column Width Pattern

```html
<ng-template pTemplate="header">
    <tr>
        <th class="w-6rem">Date</th>
        <th class="w-5rem">Type</th>
        <th>Description</th>  <!-- Auto-width for flexible columns -->
        <th class="w-8rem text-right">Amount</th>
        <th class="w-4rem"></th>  <!-- Action column -->
    </tr>
</ng-template>
```

---

## Forms Integration (CRITICAL)

PrimeNG form components integration:
- Use **inside the Forms system**
- Wrap with `MvsFormField` components
- Integrate with the application's form architecture

**Correct Usage:**

```html
<mvs-form-field>
  <p-select [options]="items" />
</mvs-form-field>
```

**Best Practices:**
- Integrate PrimeNG inputs with the Forms system
- Use MvsFormField wrappers for form controls
- Follow the application's form validation patterns

---

## Common Component Examples

### Select

```html
<p-select
  [options]="items"
  [(ngModel)]="selectedItem"
  placeholder="Select an option">
</p-select>
```

### DatePicker

```html
<p-datePicker
  [(ngModel)]="date"
  dateFormat="dd.mm.yy">
</p-datePicker>
```

### Drawer

```html
<p-drawer
  [(visible)]="visible"
  position="right">
  <ng-template #header>Title</ng-template>
  Content here
</p-drawer>
```

### Popover

```html
<p-popover #popover>
  <div>Popover content</div>
</p-popover>
<button (click)="popover.toggle($event)">Toggle</button>
```

### ToggleSwitch

```html
<p-toggleSwitch
  [(ngModel)]="checked">
</p-toggleSwitch>
```

---

## Best Practices

**Module Imports:**
- Import specific modules from PrimeNG packages
- Centralize common imports in SharedModule
- Import feature-specific modules only where needed

**Styling:**
- Use theme CSS variables for colors
- Use PrimeFlex utility classes for layout
- Keep styles consistent with Klaus Preset

**Forms Integration:**
- Integrate PrimeNG inputs with the Forms system
- Use MvsFormField wrappers for form controls
- Use MvsMessageService wrapper for notifications

**Component Usage:**
- Keep business logic separate from UI components
- Use component APIs for configuration
- Follow application architecture patterns

---

## STOP-AND-ASK Rule

If you are unsure:
- Which PrimeNG component to use
- How to style a component
- Whether a component belongs in a Page, Form, or Widget
- How to integrate with the Forms system

**STOP.**
1. Review [primeng-reference.md](primeng-reference.md)
2. Check the Core Component Reference above
3. Ask before implementing

---

## Validation Script

**Location:** `.claude/skills/primeng/scripts/check-guidelines.js`

**IMPORTANT:** Only run on Claude-generated files.

**What it validates:**
- Proper PrimeNG module imports (specific imports, not wildcard)
- v20 component usage
- Forms integration (PrimeNG inputs wrapped by MvsFormField)
- Proper form element usage
- Theme-based styling (no hardcoded colors)
- MessageService wrapper usage (MvsMessageService)
- Separation of business logic from templates

**Usage:**
```bash
cd .claude/skills/primeng/scripts && node check-guidelines.js
```

**Auto-correction workflow:**
1. Claude generates code using PrimeNG
2. Run validation script
3. If errors found → Claude fixes violations
4. Re-run validation
5. Repeat until all checks pass

---

## Additional Resources

- **Detailed documentation:** [primeng-reference.md](primeng-reference.md) - Complete PrimeNG usage guide
- **Validation script:** `.claude/skills/primeng/scripts/check-guidelines.js`

---

## Summary

PrimeNG provides consistent, accessible, themeable UI building blocks.

When used correctly:
- ✅ Consistent UI and UX across the application
- ✅ Centralized theming via Klaus Preset
- ✅ Upgrade-safe PrimeNG v20 usage
- ✅ Predictable behavior integrated with Forms system
- ✅ Accessibility and localization built-in

**Following this skill guarantees:**
- Consistent UI and UX
- Centralized theming
- Upgrade-safe PrimeNG usage
- Predictable behavior across the system
