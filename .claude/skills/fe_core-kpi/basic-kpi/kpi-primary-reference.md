# KPI Primary (Prime) Reference

## Purpose
Used for the **most important KPI** on the screen.
**There can be only ONE KPI Primary per view.**

## When to Use
- Key financial metric
- Primary decision-driving value
- Screen-defining metric

## Examples
- Net Balance
- Outstanding Amount
- Revenue

## Visual Characteristics
- Full background color
- Strong contrast
- Larger size than other KPIs
- Clear visual dominance

## Required Elements

### KPI Figure
| Element | Required | Description |
|---------|----------|-------------|
| Label | Yes | Short, noun-based label |
| Value | Yes | Main formatted value |
| Currency/Unit | Yes | Explicit currency or unit display |
| Icon | No | Optional contextual icon |

### KPI Information
| Element | Required | Description |
|---------|----------|-------------|
| Secondary Info | No | Optional (e.g., date, period) |

## Rules
- **Only ONE per screen** - This is strictly enforced
- Must appear in top hierarchy
- Must not include warning or alert semantics
- Must remain readable in all states
- Must have clear visual dominance over other KPIs

## AI Identification Rule
If a KPI has:
- Full background color
- Strong visual emphasis

Then it is **KPI Primary**.

## Critical Constraint
Never place more than one KPI Primary on a single screen or view. If multiple important metrics exist, choose the most critical one for Primary and use Regular for others.
