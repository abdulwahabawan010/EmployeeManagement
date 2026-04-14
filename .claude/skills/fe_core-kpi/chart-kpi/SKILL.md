---
name: fe_core_chart_kpi
description: "Frontend: Expert guidance on Chart KPI components displaying metrics with embedded mini charts. Supports Bar, Line, and Pie/Doughnut variants. Use when creating KPI cards with trend visualization, dashboard charts, or compact analytics displays. Enforces reusable component pattern and PrimeNG chart integration."
---

# Chart KPI Components

## Overview

Chart KPI components display business metrics with embedded mini charts for trend visualization. They combine a headline KPI value with a compact visual chart to provide quick insight without detailed analytics.

**Chart KPIs must be:**
- Immediately readable (KPI value takes priority)
- Compact (KPI-scale, not analytics-scale)
- Non-interactive (hover only, no click navigation)
- Visually consistent with the KPI system

---

## CRITICAL: Reusable Component Rule

**ChartKpiCardComponent is a REUSABLE component. Create it ONCE, use it EVERYWHERE.**

### Before Creating Any Chart KPI:
1. **SEARCH** the project for existing `ChartKpiCardComponent`
2. **IF EXISTS** → Use the existing component, DO NOT recreate
3. **IF NOT EXISTS** → Create it using [chart-kpi-example.md](chart-kpi-example.md)

### Rules:
- **ONE component handles ALL chart types** (Bar, Line, Pie)
- **NEVER duplicate** - the same component serves all chart KPI needs
- **Change chart type via `chartType` property** - not by creating new components
- **Once created, it remains reusable** across the entire application

### Usage Pattern:
```html
<!-- Same component, different chart types -->
<app-chart-kpi-card [kpi]="{ chartType: 'bar', ... }"></app-chart-kpi-card>
<app-chart-kpi-card [kpi]="{ chartType: 'line', ... }"></app-chart-kpi-card>
<app-chart-kpi-card [kpi]="{ chartType: 'pie', ... }"></app-chart-kpi-card>
```

**DO NOT create separate components for each chart type. One component handles all.**

---

## When to Use This Skill

Use this skill when:
- Creating KPI cards with embedded charts
- Displaying metrics with trend visualization
- Implementing dashboard overview cards
- Working with period-based comparisons
- Showing distribution or composition data

---

## Reference Files

| File | Description |
|------|-------------|
| **[chart-kpi-example.md](chart-kpi-example.md)** | Complete implementation with model, component, template, and usage examples |
| **[chart-reference.md](chart-reference.md)** | All chart variant specifications, behaviors, and rules |

**For complete code implementation, refer to [chart-kpi-example.md](chart-kpi-example.md)**

---

## Chart Types (ONLY THREE)

There are exactly **three chart types** supported. No additional types are allowed.

| Chart Type | Purpose | Best For |
|------------|---------|----------|
| **Bar** | Period-based comparison | Revenue, volume, counts |
| **Line** | Continuous trend over time | Performance, usage trends |
| **Pie** | Distribution or composition | Category-based KPIs |

---

## Chart Type Selection Rules

### Use Bar Chart when:
- Comparing discrete periods (months, quarters)
- Highlighting current period performance
- Showing volume or count comparisons

### Use Line Chart when:
- Showing continuous trends
- Emphasizing growth/decline patterns
- Tracking performance over time

### Use Pie Chart when:
- Showing distribution or composition
- Displaying category breakdowns
- Representing parts of a whole

**Default Rule:** If unsure which chart type to use, default to **Bar Chart**.

---

## Visual Hierarchy (MANDATORY)

```
┌─────────────────────────────────────┐
│  Icon (left)     Change % (right)   │  ← Top Row
│                  ↑ +12.5%           │
├─────────────────────────────────────┤
│  MONTHLY REVENUE                    │  ← Label (small, muted)
│  $48,290                            │  ← Value (large, bold, PRIMARY)
├─────────────────────────────────────┤
│  ┌─┐ ┌─┐ ┌─┐ ███ ┌─┐ ┌─┐           │  ← Mini Chart (compact)
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘           │
│  Jan Feb Mar Apr May Jun            │
└─────────────────────────────────────┘
```

**Critical:** The chart must NEVER overpower the KPI value.

---

## Technical Constraints

- **PrimeNG v20 charts only** (`<p-chart>`)
- **PrimeFlex utilities only** for layout & typography
- **No custom CSS**
- **Font Awesome icons only**
- **Colors follow system tokens**
- **Chart legends: HIDDEN**
- **Chart grid: MINIMAL**
- **Tooltips: ENABLED**

---

## Behavior Requirements

### General
- KPI value is always readable without interacting
- Chart supports discovery, not decision-making
- No click navigation inside KPI card
- Hover only (no selection persistence)
- Predictable enterprise behavior

### Active State
- Current period visually emphasized (stronger color/opacity)
- Non-active items muted/reduced opacity

### Hover State
- Show tooltip with period name and formatted value
- Does NOT change KPI headline value

---

## Data Model Structure

Every Chart KPI requires:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | KPI label (e.g., "Monthly Revenue") |
| `value` | number | Yes | Primary KPI figure |
| `currency` | string | No | Currency code (e.g., "EUR") |
| `changePercent` | number | No | Change from previous period |
| `changeDirection` | enum | No | 'positive' \| 'negative' \| 'neutral' |
| `icon` | string | No | Font Awesome icon class |
| `chartType` | enum | Yes | 'bar' \| 'line' \| 'pie' |
| `chartData` | object | Yes | PrimeNG-compatible chart data |
| `activeIndex` | number | No | Current period index (bar/line) |

---

## Component Registry

All Chart KPI-related components are registered here.

| Component | Purpose | Reference |
|-----------|---------|-----------|
| ChartKpiCardComponent | Generic Chart KPI card (Bar/Line/Pie) | [chart-kpi-example.md](chart-kpi-example.md) |

**When adding new chart KPI components:**
1. Add component reference to this table
2. Create detailed reference documentation
3. Follow existing patterns and conventions

---

## STOP-AND-ASK Rule

If you are unsure:
- Which chart type to use
- How to structure the chart data
- Whether data fits bar vs line vs pie

**STOP.**
1. Review the reference files listed above
2. Apply the Chart Type Selection Rules
3. Ask before implementing if still uncertain

---

## Summary

Chart KPI components provide compact metric displays with embedded trend visualization.

**Key Points:**
- **REUSABLE**: Create ChartKpiCardComponent once, use everywhere
- **THREE CHART TYPES ONLY**: Bar, Line, Pie (via `chartType` property)
- **KPI VALUE DOMINATES**: Chart supports, never overpowers
- **NEVER DUPLICATE**: Do not create new components for existing chart types
- Refer to [chart-kpi-example.md](chart-kpi-example.md) for implementation

**This document is authoritative. Claude must follow it strictly when generating Chart KPI components.**
