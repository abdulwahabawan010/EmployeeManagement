---
name: fe_core_page
description: "Frontend: Expert guidance on page architecture including Overview Pages (module KPIs), Dashboard Pages (entity browsing), Object Pages (single entity view/edit), and Config Pages (system configuration). Use when creating new pages, determining page type, or implementing page-specific patterns. Covers page hierarchy, navigation rules, and lifecycle ownership."
---

# Page Architecture

## Overview

Pages define the **structural and behavioral foundation** of the application UI. Each page type has a **strict responsibility boundary** and must only be used for its intended purpose.

**There are four different page types**, each solving a different problem. Using the wrong page type is considered a design error.

---

## ⚠️ COMPLEX CONFIGURATION ENTITY RULE (NON-NEGOTIABLE)

> **This is the canonical definition.** Other documents reference this section.

**This rule is NOT optional. This rule is NOT a recommendation. Violations are ARCHITECTURAL ERRORS.**

### Definition

A **Complex Configuration Entity** is any configuration entity that has **2 or more one-to-many (1:n) child entities** in the entity registry.

**Examples of Complex Configuration Entities:**
- `tm.TicketType` (has TicketTypeField, TicketTypeAction, TicketTypeStatus, etc.)
- `bd.DunningType` (has DunningTypeLevel, DunningTypeCharge, DunningTypeAction, etc.)
- Most `*Type` entities in the system

### The Rule

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPLEX CONFIGURATION ENTITY RULE                                          │
│                                                                             │
│  If a configuration entity has 2 or more one-to-many child entities,       │
│  it MUST be implemented as an ObjectComponent and MUST open                 │
│  as a dedicated Object Page via navigation.                                 │
│                                                                             │
│  Inline rendering, flat tabs, or master-detail layouts                      │
│  are STRICTLY FORBIDDEN when an ObjectComponent is registered.              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Decision Matrix

```
START: Is this a configuration entity?
         │
         ▼
   ┌─────────────────────────────────────────────────┐
   │ Count 1:n child entities in entity registry    │
   │ grep "<EntityName>#" entity-registry.md        │
   └─────────────────────┬───────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
   ┌───────────┐                   ┌───────────┐
   │  0 or 1   │                   │   2 or    │
   │ children  │                   │   more    │
   └─────┬─────┘                   └─────┬─────┘
         │                               │
         ▼                               ▼
┌─────────────────────┐     ┌──────────────────────────────────────┐
│ Simple Config Page  │     │ COMPLEX CONFIGURATION ENTITY         │
│ • Flat tabs OK      │     │                                      │
│ • Inline OK         │     │ MANDATORY IMPLEMENTATION:            │
│                     │     │ 1. Config Page shows SIMPLE TABLE    │
│                     │     │ 2. Click row → Opens Object Page     │
│                     │     │ 3. Object Page uses ObjectComponent  │
│                     │     │ 4. ObjectComponent shows left nav    │
│                     │     │ 5. Child entities as nav sections    │
│                     │     │                                      │
│                     │     │ FORBIDDEN:                           │
│                     │     │ ✗ Flat tabs for children             │
│                     │     │ ✗ Inline master-detail               │
│                     │     │ ✗ Mixed patterns in Config Page      │
└─────────────────────┘     └──────────────────────────────────────┘
```

### Concrete Example: TicketType

```
WRONG (ARCHITECTURAL ERROR):
┌─────────────────────────────────────────────────────────────────┐
│ Config Page                                                     │
│ ┌─Tab1────────┬─Tab2────────┬─Tab3────────┬─Tab4──────────────┐│
│ │ TicketTypes │ TicketFields│ TicketStatus│ TicketActions     ││  ← FORBIDDEN!
│ └─────────────┴─────────────┴─────────────┴───────────────────┘│
└─────────────────────────────────────────────────────────────────┘

CORRECT (MANDATORY):
┌─────────────────────────────────────────────────────────────────┐
│ Config Page                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Simple Table: TicketTypes                                   │ │
│ │ ├─ Support Ticket    → [Click opens Object Page]           │ │
│ │ ├─ Bug Report        → [Click opens Object Page]           │ │
│ │ └─ Feature Request   → [Click opens Object Page]           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks row
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Object Page: Support Ticket (TicketTypeObjectComponent)         │
│ ┌───────────────┬─────────────────────────────────────────────┐ │
│ │ Left Nav      │ Content Area                                │ │
│ │ ┌───────────┐ │ Fields (filtered by this TicketType)        │ │
│ │ │ Overview  │ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Fields    │◄│ │ Summary Field | Text | Required        │ │ │
│ │ │ Statuses  │ │ │ Priority     | Enum | Required        │ │ │
│ │ │ Actions   │ │ └─────────────────────────────────────────┘ │ │
│ │ │ Workflows │ │                                             │ │
│ │ └───────────┘ │                                             │ │
│ └───────────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Enforcement

| Violation | Classification |
|-----------|----------------|
| Flat tabs for complex entity children | **ARCHITECTURAL ERROR** |
| Inline master-detail for complex entity | **ARCHITECTURAL ERROR** |
| Missing ObjectComponent for complex entity | **ARCHITECTURAL ERROR** |
| No left navigation in ObjectComponent | **ARCHITECTURAL ERROR** |

**All violations MUST be rejected in code review.**

**See:**
- [hierarchical-config-pattern.md](hierarchical-config-pattern.md) for implementation guide
- [acceptance.md](acceptance.md) for rule IDs and acceptance criteria

---

## When to Use This Skill

Use this skill when:
- Creating a new page component
- Determining which page type to use
- Implementing page-specific patterns
- Understanding page navigation flows
- Debugging page hierarchy issues

---

## Page Types

### Overview Page
**Module-wide KPIs and aggregated statistics.**
See [overview-page.md](overview-page.md) for detailed documentation.

### Dashboard Page
**Browse and select entity collections.**
See [dashboard-page.md](dashboard-page.md) for detailed documentation.

### Object Page
**View and manage a single entity.**
See [object-page.md](object-page.md) for detailed documentation.

### Config Page
**Configure module or system behavior.**
See [config-page.md](config-page.md) for detailed documentation.

---

## Page Hierarchy & Responsibility Model

| Level | Page Type | Responsibility |
|------|----------|----------------|
| Module | Overview Page | Module-wide KPIs and aggregated statistics |
| Collection | Dashboard Page | Browse and select entity collections |
| Instance | Object Page | View and manage a single entity |
| System | Config Page | Configure module or system behavior |

**This hierarchy is intentional and must not be violated.**

---

## Critical Rules: When to Use What

### Overview Page

✅ **Use when:**
- You need a **module entry point**
- You want to show **KPIs, metrics, or aggregated statistics**
- No single entity is the focus
- The user needs **situational awareness**, not actions

❌ **Do NOT use to:**
- List entities
- Edit entities
- Configure systems

---

### Dashboard Page

✅ **Use when:**
- You need to **browse a collection of entities**
- The primary interaction is **selecting an entity**
- Navigation to Object Pages is required
- Filtering, sorting, or searching is needed

❌ **Do NOT use to:**
- Edit entities directly
- Show module KPIs
- Configure systems

---

### Object Page

✅ **Use when:**
- You are working with **exactly one entity**
- The entity is identified by `objectType` and `objectId`
- The page exists *because the object exists*
- View, edit, or detailed inspection is required

❌ **Do NOT use to:**
- Display entity lists
- Show module-wide statistics
- Configure unrelated entities

---

### Config Page

✅ **Use when:**
- You are configuring **module-level or system-level behavior**
- Multiple configuration entities must be managed together

**⚠️ MANDATORY: Apply Complex Configuration Entity Rule (see above)**

Before creating a Config Page:
1. Query entity registry: `grep "<EntityName>#" entity-registry.md`
2. Count child entities
3. **2+ children** → Use simple table + Object Page navigation (see rule above)

**See:** [config-page.md](config-page.md) and [hierarchical-config-pattern.md](hierarchical-config-pattern.md)

❌ **FORBIDDEN:**
- Flat tabs for complex entities (2+ children) - **ARCHITECTURAL ERROR**
- Inline master-detail for complex entities - **ARCHITECTURAL ERROR**
- Browse operational data or edit business entities on Config Pages

---

## Navigation & User Flow Rules

**Typical user flows:**

- Overview Page → Dashboard Page → Object Page
- Dashboard Page → Object Page
- Object Page → related Object Page
- Config Page operates **parallel** to operational flows

**Config Pages must never replace operational pages.**

---

## Lifecycle Ownership Rules

- **Overview Pages** own **no data lifecycle**
- **Dashboard Pages** own **widget lifecycle only**
- **Object Pages** own **object lifecycle**
- **Config Pages** own **configuration orchestration lifecycle**

**Lifecycle responsibilities must not overlap.**

---

## Anti-Patterns (FORBIDDEN)

**General Page Anti-Patterns:**
❌ Using Dashboards as editors
❌ Using Object Pages as lists
❌ Using Config Pages for operational workflows
❌ Implementing business logic at page level
❌ Mixing responsibilities between page types

**Complex Configuration Entity Anti-Patterns (ARCHITECTURAL ERRORS):**
❌ Flat tabs for complex entities (2+ children)
❌ Inline master-detail for complex entities
❌ Missing ObjectComponent for complex entity
❌ ObjectComponent without left navigation

**See:** [acceptance.md](acceptance.md) for complete rule IDs (PAGE-002 through PAGE-007).

---

## STOP-AND-ASK Rule

If you are **not 100% sure** which page type to use:

1. **STOP**
2. Enter **plan mode**
3. Ask clarifying questions before implementation

**Creating the wrong page type is worse than delaying a decision.**

---

## Validation Script

**Location:** `.claude/skills/page/scripts/check-guidlines.js`

**IMPORTANT:** Only run on Claude-generated files (NOT legacy code).

**What it validates:**

**Base Rules (All Pages):**
- Must inherit from PageComponent, ConfigPageComponent, or ObjectPageComponent
- Must call super.ngOnInit()
- Page type must be clearly identifiable

**Overview Page Rules:**
- Must use `<ui-object-navigation-main-page>` for rendering
- Must NOT render widgets directly (`<mvs-widget>`)

**Dashboard Page Rules:**
- Must create widgets via WidgetFactory
- Must handle onObjectSelect and navigate to Object Page

**Object Page Rules:**
- Must extend ObjectPageComponent
- Must implement getObjectType()
- Must contain ObjectInplaceDirective

**Config Page Rules:**
- Must define navigationItems
- Tabs are allowed ONLY for simple configuration entities (0-1 child entities)
- Complex configuration entities (2+ children) MUST NOT use tabs, regardless of count
- Must NOT create widgets in template

**Usage:**
```bash
cd .claude/skills/page/scripts && node check-guidlines.js
```

**Auto-correction workflow:**
1. Claude generates page component
2. Run validation script
3. If errors found → Claude fixes violations
4. Re-run validation
5. Repeat until ✅ all checks pass

**Claude should NEVER leave a file with validation errors.**

---

## Additional Resources

- **Overview Page:** [overview-page.md](overview-page.md) - Module entry points and KPIs
- **Dashboard Page:** [dashboard-page.md](dashboard-page.md) - Entity collection browsing
- **Object Page:** [object-page.md](object-page.md) - Single entity management
- **Config Page:** [config-page.md](config-page.md) - System configuration
- **Hierarchical Config:** [hierarchical-config-pattern.md](hierarchical-config-pattern.md) - Master-detail pattern for hierarchical entities
- **Entity Registry:** `.claude/skills/fe_core_entity_registry/` - Check relationships before creating config pages
- **Validation script:** `.claude/skills/page/scripts/check-guidlines.js`

---

## Summary

When the rules in this skill are followed:
- ✅ Page usage remains consistent
- ✅ Navigation is predictable
- ✅ The system scales cleanly
- ✅ New modules follow the same mental model
- ✅ Architectural drift is prevented
