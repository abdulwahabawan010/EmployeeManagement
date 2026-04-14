---
name: ux-guidelines
description: Enforces mandatory UI/UX development standards for ALPHA SYSTEM including PrimeNG component usage, PrimeFlex layouts, color tokens, typography, spacing, icons, and data states. Use when implementing UI components, styling elements, handling loading/empty/error states, or validating frontend code against design standards.
---

# UX Guidelines

## Overview

This skill defines mandatory UI and frontend development standards for ALPHA SYSTEM. These are **rules, not suggestions**.

---

## When to Use This Skill

Use this skill when:
- Creating or modifying UI components
- Implementing layouts and styling
- Handling data states (loading, empty, error, busy)
- Working with forms, buttons, dialogs, or tables
- Validating frontend code against design standards
- Implementing icons, colors, or typography
- Building responsive layouts

---

## Platform Context

### Application Type

ALPHA SYSTEM is an enterprise ERP-style web application built on Angular 20 and PrimeNg 20.

**Screen Size Priorities:**
- **Minimum desktop**: 1065 x 768 px (must fully work)
- **Standard desktop**: 1280 x 800 px
- **Large desktop**: 1440 px+
- **Tablet (secondary)**: 768-1024 px

**This is NOT a mobile-first system.**

---

## Critical Rules (Apply IMMEDIATELY)

### 1. Component Rules (Hard top)

**All UI components MUST come from PrimeNG.**

| Forbidden | Required |
|-----------|----------|
| `<button>` | `p-button` |
| `<select>` | `p-select` |
| `<input type="text">` | `p-inputText` |
| Custom modal | `p-dialog` |
| Custom table | `p-table` |
| `<table>` | `p-table` |

---

### 2. Layout Rules (PrimeFlex Only)

**All layout MUST use PrimeFlex utility classes.**

```html
<div class="flex flex-column p-3 gap-2 h-full border-1 border-300"></div>
```

**Forbidden:**
- Custom CSS for `display`, `flex-direction`, `gap`, `padding`, `margin`
- Inline styles
- Tailwind / Bootstrap

---

### 3. Color Rules

**Always use PrimeFlex color tokens. Never use HEX, RGB, or custom values.**

| Purpose | Class |
|---------|-------|
| Primary text | `text-primary` / `text-blue-800` |
| Secondary text | `text-gray-600` |
| Success | `text-green-600`, `bg-green-50` |
| Warning | `text-yellow-600`, `bg-yellow-50` |
| Error | `text-red-600`, `bg-red-50` |
| Info | `text-blue-600`, `bg-blue-50` |

---

### 4. Typography Rules

- **Font family**: Roboto
- **Page title**: `text-2xl font-bold`
- **Section title**: `text-xl font-semibold`
- **Sub-section**: `text-lg font-semibold`/`font-medium`
- **Labels**: `text-base` / `text-lg font-medium`
- **Helper text**: `text-sm` / `text-base`

---

### 5. Button Rules

**Primary action button:**
```html
<p-button label="Save" severity="primary" icon="fa-solid fa-save"></p-button>
```

**Rules:**
- Only ONE `severity="primary"` per action group
- Primary action must be LAST in button group
- Icon-only utility buttons go on LEFT side
- Main action buttons go on RIGHT side

---

### 6. Mandatory Data States

Every data-driven component MUST handle:

| State | UI |
|-------|-----|
| Loading | Skeletons (NOT spinners) |
| Ready | Normal UI |
| Empty | Empty state message |
| Error | Error message |
| Busy | Loading indicator |

**Skipping any state is NOT allowed.**

---

### 7. Date Format (Mandatory)

```
DD.MM.YYYY
```

Example: `26.07.2024`

With time: `26.07.2024 14:35` (24-hour format)

**No alternative date formats are allowed.**

---

### 8. Icon Rules (Font Awesome)

- Default: `fa-regular`
- `fa-solid` only for: state, importance, visibility, active state

**Required Icons:**
- Home: `fa-regular fa-house`
- User: `fa-regular fa-user`
- Add/Plus: `fa-solid fa-plus`
- Chevrons: `fa-solid fa-chevron-up/down`
- Attachments: `fa-regular fa-paperclip-vertical`
- Comments: `fa-regular fa-comments`

---

### 9. Spacing Rules

| Scenario | Class |
|----------|-------|
| Major sections | `mb-4` / `mb-5` |
| Between cards | `mb-3` |
| Inside cards | `p-3` |
| Dense areas | `p-2` |

---

### 10. Shadows & Border Radius

**Shadows:**
- `shadow-none` (preferred)
- `shadow-1` (rare)
- `shadow-2+` NOT allowed

**Border Radius:**
- `border-round-md`
- `border-round-lg` (preferred)

---

## Empty State Guidelines

**Must contain:**
- Clear message (what's missing)
- Reason or context (why it's empty)
- Next step guidance (what to do)

**Examples:**
- "No tickets found for the selected filter."
- "Create your first configuration to get started."

**Empty state = guidance, not failure.**

---

## Error Handling

| Type | Component |
|------|-----------|
| Major/blocking | `p-dialog` |
| Feedback | Toast (`MessageService`) |
| Guidance | `p-message` |

---

## AI Output Validation Checklist

Before generating UI code, verify:

- [ ] No raw `<button>`, `<input>`, `<select>`
- [ ] All components are PrimeNG
- [ ] All spacing via PrimeFlex
- [ ] No HEX / RGB colors
- [ ] Only Font Awesome icons
- [ ] Only one primary action
- [ ] Correct date format (DD.MM.YYYY)
- [ ] Skeletons for loading
- [ ] Empty states implemented

**If any item fails, output is invalid.**

---

## Golden Rules

1. **PrimeNG only** - no custom components
2. **PrimeFlex first** - no custom CSS for layout
3. **No HEX / RGB** - use color tokens
3. **Font Awesome icons only**
4. **Desktop-first** - not mobile-first
5. **Reusable components**
6. **Predictable UX over creativity**
7. **One date format** - DD.MM.YYYY
8. **Empty state = guidance, not failure**

---

## STOP-AND-ASK Rule

If unsure about:
- Which PrimeNG component to use
- How to style a component
- How to handle a data state
- Whether layout is PrimeFlex compliant

**STOP. Review this skill. Ask before implementing.**

---

## Violation Handling

If a requirement conflicts with these rules:

1. Clearly state the conflict
2. Reference the violated rule
3. Propose a compliant alternative

**Never silently break rules to "make it work".**
