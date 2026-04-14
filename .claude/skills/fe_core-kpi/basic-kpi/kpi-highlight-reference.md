# KPI Highlight Reference

## Purpose
Used to highlight a status, level, or required attention.
This KPI communicates **state**, not just value.

## When to Use
- Dunning status
- Risk levels
- Warnings
- Action-required states

## Examples
- "In Dunning - Level 1"
- "Payment Overdue"
- "Contract Expiring"

## Visual Characteristics
- Subtle highlighted border or accent
- Status badge optional (e.g., LEVEL 1)
- Optional warning icon
- Stronger emphasis than Regular KPI

## Required Elements

### KPI Figure
| Element | Required | Description |
|---------|----------|-------------|
| Label | Yes | Status context label |
| Status Text | Yes | Main status text |
| Icon | No | Optional warning/info icon |

### KPI Information
| Element | Required | Description |
|---------|----------|-------------|
| Level Indicator | No | Optional badge (e.g., "LEVEL 1") |
| Action Hint | No | Short action hint (1 line max) |

## Rules
- Highlighting must be semantic (warning, info, critical)
- Must never use full background fill
- Must not overpower KPI Primary
- Must clearly indicate why it is highlighted
- Status text: max 1 sentence, action-oriented when applicable

## AI Identification Rule
If a KPI has:
- Level/status highlight
- Subtle border or accent (not full background)

Then it is **KPI Highlight**.

## Icon Guidelines for Highlight
- Icons should support meaning (warning, info, context)
- Icons must not replace labels
- Common icons: warning triangle, info circle, alert icons
