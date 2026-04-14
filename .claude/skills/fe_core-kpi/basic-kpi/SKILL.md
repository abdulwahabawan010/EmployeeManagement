---
name: fe_core_kpi
description: "Frontend: Expert guidance on KPI (Key Performance Indicator) components including Regular, Highlight, and Primary variants. Use when creating or modifying KPI components, displaying business metrics, or implementing dashboard indicators. Enforces strict variant rules, visual hierarchy, and the one-Primary-per-screen constraint."
---

# Basic KPI Components

## Overview

KPI (Key Performance Indicator) components are compact UI elements used to display critical business values or states. They are presentation components, not analytics or charts.

**KPIs must be:**
- Immediately readable
- Visually consistent
- Non-interactive (by default)
- Semantically meaningful

---

## CRITICAL: Reusable Component Rule

**BasicKpiCardComponent is a REUSABLE component. Create it ONCE, use it EVERYWHERE.**

### Before Creating Any KPI:
1. **SEARCH** the project for existing `BasicKpiCardComponent`
2. **IF EXISTS** → Use the existing component, DO NOT recreate
3. **IF NOT EXISTS** → Create it using [kpi-example-reference.md](kpi-example-reference.md)

### Rules:
- **ONE component handles ALL variants** (Regular, Highlight, Primary)
- **NEVER duplicate** - the same component serves all KPI needs
- **Change variant via `variant` property** - not by creating new components
- **Once created, it remains reusable** across the entire application

### Usage Pattern:
```html
<!-- Same component, different variants -->
<app-basic-kpi-card [kpi]="{ variant: 'regular', ... }"></app-basic-kpi-card>
<app-basic-kpi-card [kpi]="{ variant: 'highlight', ... }"></app-basic-kpi-card>
<app-basic-kpi-card [kpi]="{ variant: 'primary', ... }"></app-basic-kpi-card>
```

**DO NOT create separate components for each variant. One component handles all.**

---

## When to Use This Skill

Use this skill when:
- Creating KPI components for dashboards
- Displaying business metrics or values
- Implementing status indicators
- Working with financial summaries
- Deciding which KPI variant to use

---

## Reference Files

| File | Description |
|------|-------------|
| **[kpi-example-reference.md](kpi-example-reference.md)** | Complete implementation with model, component, template, and usage examples |
| **[kpi-regular-reference.md](kpi-regular-reference.md)** | Regular variant specification and rules |
| **[kpi-highlight-reference.md](kpi-highlight-reference.md)** | Highlight variant specification and rules |
| **[kpi-primary-reference.md](kpi-primary-reference.md)** | Primary variant specification and rules |

**For complete code implementation, refer to [kpi-example-reference.md](kpi-example-reference.md)**

---

## KPI Variants (ONLY THREE)

There are exactly **three KPI variants** in the system. No additional variants are allowed.

| Variant | Purpose | Visual Emphasis |
|---------|---------|-----------------|
| **Regular** | Neutral numeric values | Minimal - no colors/borders |
| **Highlight** | Status, alerts, warnings | Subtle border/accent |
| **Primary** | Most important metric | Full background color |

---

## Variant Selection Rules

### Use KPI Regular when:
- Displaying standard metrics
- No urgency or attention needed
- Informational values only

### Use KPI Highlight when:
- Showing status or level
- Warning or alert states
- Action-required situations

### Use KPI Primary when:
- Displaying THE key metric
- Screen-defining value
- Primary decision-driving data

**Default Rule:** If unsure which variant to use, default to **KPI Regular**.

---

## Critical Constraints

### One Primary Per Screen
**Only ONE KPI Primary is allowed per screen or view.** This is strictly enforced.

### Visual Hierarchy
- Primary > Highlight > Regular
- Highlight must not overpower Primary
- Regular must not use strong colors

### AI Identification Rules

| If KPI has... | Then it is... |
|---------------|---------------|
| Full background color | **KPI Primary** |
| Level/status highlight (border/accent) | **KPI Highlight** |
| Neither | **KPI Regular** |

---

## Highlight Severity Options

| Severity | Border Color | Use Case |
|----------|--------------|----------|
| `info` | Blue | General status, informational |
| `warning` | Yellow | Attention needed, caution |
| `critical` | Red | Urgent, immediate action required |

---

## Common KPI Structure

Every KPI follows the same structural logic:

### KPI Figure
- **Label** (required): Short, noun-based (e.g., "Net Balance")
- **Value** (required): Formatted with explicit unit/currency
- **Icon** (optional): Contextual icon, top-right position

### KPI Information
- **Helper Text** (optional): Status or comparison text
- **Badge/Indicator** (optional): Level indicator for Highlight variant

---

## Text Rules (Strict)

**Labels:**
- Short, noun-based
- OK: "Net Balance"
- NOT OK: "Your net balance"

**Values:**
- Always formatted
- Always include explicit unit/currency

**Status Text:**
- Max 1 sentence
- Action-oriented when applicable

---

## Icon Rules

- Icons are optional
- Icons must support meaning (info, warning, context)
- Icons must not replace labels
- Use Font Awesome icons only

---

## Component Registry

All KPI-related components are registered here.

| Component | Purpose | Reference |
|-----------|---------|-----------|
| BasicKpiCardComponent | Generic KPI card (Regular/Highlight/Primary) | [kpi-example-reference.md](kpi-example-reference.md) |

**When adding new KPI components:**
1. Add component reference to this table
2. Create detailed reference documentation
3. Follow existing patterns and conventions

---

## STOP-AND-ASK Rule

If you are unsure:
- Which KPI variant to use
- How to structure the KPI
- Whether to use Primary or Highlight

**STOP.**
1. Review the reference files listed above
2. Apply the AI Identification Rules
3. Ask before implementing if still uncertain

---

## Summary

KPI components provide compact, readable business value displays.

**Key Points:**
- **REUSABLE**: Create BasicKpiCardComponent once, use everywhere
- **THREE VARIANTS ONLY**: Regular, Highlight, Primary (via `variant` property)
- **ONE PRIMARY PER SCREEN**: Strictly enforced
- **NEVER DUPLICATE**: Do not create new components for existing variants
- Refer to [kpi-example-reference.md](kpi-example-reference.md) for implementation

**This document is authoritative. Claude must follow it strictly when generating KPI components.**
