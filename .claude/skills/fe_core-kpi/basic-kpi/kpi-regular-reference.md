# KPI Regular Reference

## Purpose
Used to display a neutral numeric business value.

## When to Use
- Standard metrics
- No urgency or special attention needed
- Informational KPIs

## Examples
- Balance
- Total Contracts
- Active Policies

## Visual Characteristics
- Neutral background (default `surface-0`)
- No border emphasis
- Value is primary focus
- Optional icon (top-right)

## Required Elements

### KPI Figure
| Element | Required | Description |
|---------|----------|-------------|
| Label | Yes | Short, noun-based label (e.g., "Net Balance") |
| Value | Yes | Formatted numeric value with explicit unit/currency |
| Icon | No | Optional contextual icon (top-right position) |

### KPI Information
| Element | Required | Description |
|---------|----------|-------------|
| Helper Text | No | Optional comparison or context text |
| Badge | No | Not used in Regular variant |

## Rules
- Must not use strong colors
- Must not indicate urgency
- Must not visually dominate other KPIs
- Labels must be short and noun-based (e.g., "Net Balance" not "Your net balance")
- Values must always be formatted with explicit unit/currency

## AI Identification Rule
If a KPI has:
- No background color
- No level/status highlight

Then it is **KPI Regular**.

## Default Behavior
**If unsure about which KPI variant to use, default to KPI Regular.**
