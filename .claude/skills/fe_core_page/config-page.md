# Configuration Page (ConfigPageComponent)

This document is the **single, canonical source of truth** for implementing a **Configuration Page** in Angular.
It is explicitly written to generate a **correct, domain-compliant, and scalable**
Configuration Page **without ambiguity or missing rules**.

---

## CRITICAL: Entity Module Ownership Check (MANDATORY FIRST STEP)

**Before implementing ANY configuration page, you MUST verify entity module ownership.**

### Rule: Entities MUST Belong to the Module

A configuration page for module `xx` can ONLY contain entities that:
1. **Belong to the same module** (entity prefix matches module code, e.g., `bm.BillingRunType` in `bm` config page)
2. **OR have a direct relationship** with the module's core entities (verified in entity-registry.md)

### Entity Module Ownership Validation Flow

```
1. Identify config page module (e.g., bm = Billing Management)
           ↓
2. For EACH entity in the config page:
   a. Check entity prefix matches module (e.g., bm.*)
   b. If different module → Check entity-registry.md for relationship
           ↓
3. Relationship Check:
   grep "<EntityName>" entity-registry.md
   - Look for ManyToOne/OneToOne relationships TO module entities
           ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Entity belongs to module OR has relationship → VALID   │
   │ Entity from different module, no relationship → REMOVE │
   └─────────────────────────────────────────────────────────┘
```

### Common Violations to Check

| Config Page | Entity | Issue |
|-------------|--------|-------|
| bm config | `bm.DunningLevel`, `bm.DunningStatusType` | Dunning moved to `bd` module - primary relationships are with `bd.*` entities - REMOVE |

### How to Detect Broken Relationships

1. **Check entity-registry.md** for the entity's relationships
2. **Look at reverse relationships** - which entities USE this entity?
3. **If primary usage is by another module** → entity should be in that module's config

**Example: bm.DunningLevel**
```
From entity-registry.md:
bm.DunningLevel is used by:
- bd.Dunning#activeLevel           ← bd module (primary)
- bd.DunningLevelAction#dunningLevel  ← bd module (primary)
- bm.ContractDunningLevel#dunningLevel  ← bm module (secondary)

Result: Primary relationships are with bd module → REMOVE from bm config
```

### Example: bm Module

**WRONG** - Including dunning in bm config (dunning functionality moved to bd module):
```ts
// ❌ WRONG - bm.DunningLevel primary relationships are with bd module
widgets: {
    widgetDunningLevel: {
        entity: "bm.DunningLevel",  // Primary usage is bd.Dunning, bd.DunningLevelAction
        ...
    }
}
navigationItems: [
    { label: 'dunning', action: 'dunning', ... }  // REMOVE - dunning config is in bd module
]
```

**CORRECT** - Entities with valid relationships to bm module:
```ts
// ✅ CORRECT - Entities that have relationships within bm module
widgets: {
    billingRunTypeWidget: { entity: "bm.BillingRunType", ... },
    billingAreaWidget: { entity: "bm.BillingArea", ... },
    billingRunWidget: { entity: "bm.BillingRun", ... },
    creditorWidget: { entity: "bm.Creditor", ... },
    paymentCollectionViaWidget: { entity: "bm.PaymentCollectionVia", ... }
}
```

---

## CRITICAL: Hierarchical Entity Check (SECOND STEP)

**After validating module ownership, check the entity registry for hierarchical relationships.**

### Decision Flow

```
1. Identify root configuration entity (e.g., DunningType)
           ↓
2. Query entity registry for 1:n relationships
   grep "<EntityName>#" entity-registry.md
           ↓
3. Count child entity types
           ↓
   ┌───────────────────────────────────────┐
   │ 0-1 children → Simple ConfigPage      │
   │ 2+ children  → Hierarchical Pattern   │
   └───────────────────────────────────────┘
```

### If Hierarchical Pattern Required

**STOP.** Do NOT use flat tabs. Instead:

1. Read: `hierarchical-config-pattern.md`
2. Create: ObjectComponent for root entity
3. Use: Master-detail layout
4. Filter: All child widgets by parent FK

**See:** [Hierarchical Configuration Pattern](hierarchical-config-pattern.md)

---

## 1. What a Configuration Page Is (Purpose & Why)

A **Configuration Page** is a specialized page type designed to manage **system-level or module-level configuration data**
in a structured, scalable, and consistent way.

Unlike standard pages that focus on displaying or editing a single entity, a Configuration Page:

- Coordinates **multiple configuration entities**
- Provides **clear navigation** across configuration domains
- Supports **complex relationships** (e.g. master–detail)
- Enforces **consistent UX patterns** for admin and system settings

Typical use cases:
- Admin panels
- System settings
- Module configuration
- Technical configuration modules

A Configuration Page exists to **orchestrate configuration**, not to implement business logic.

---

## 2. Conceptual Positioning

A Configuration Page sits between generic pages and object-specific pages:

| Page Type | Responsibility |
|---------|----------------|
| PageComponent | Generic layouts and custom views |
| ObjectPageComponent | Single business object |
| ConfigPageComponent | Multiple configuration entities, navigation-driven |

**Key distinction:**  
A Configuration Page manages **configuration domains**, not individual business objects.

---

## 3. Core Design Principles (Non-Negotiable)

### 3.1 Declarative Configuration

All configuration widgets **must be defined upfront** in a registry.

- Widgets are NOT created imperatively
- Widgets are NOT created in templates
- Initialization is predictable
- Lifecycle complexity is reduced
- Configuration is centralized

---

### 3.2 Navigation-Driven Structure

Configuration Pages are organized around **navigation sections**, not routes.

- Each navigation item represents a configuration domain
- Switching domains does NOT change the route
- Routing remains static and simple

---

### 3.3 Optional Tab-Based Sub-Grouping

Tabs may optionally be used **within a navigation section**.

- Tabs improve usability
- Tabs do NOT introduce routing
- Tabs do NOT introduce complex state

---

### 3.4 Widget-Centric Architecture

Each configuration entity is represented by a **widget** that encapsulates:
- Data loading
- CRUD behavior
- UI behavior
- Interaction events

The Configuration Page:
- Orchestrates widgets
- Does NOT own business logic

---

## 4. Role of ConfigPageComponent

`ConfigPageComponent` is an abstract base class that provides:

- Automatic widget initialization
- Navigation lifecycle handling
- Standardized configuration-page behavior
- Integration with the global layout system

Concrete configuration pages define **structure only**, never mechanics.

---

## 5. Mandatory Implementation Contract (Hard Rules)

### 5.1 Class & Inheritance
- MUST extend `ConfigPageComponent`
- MUST NOT extend `PageComponent` directly
- MUST NOT bypass base lifecycle

```ts
export class YourConfigPage extends ConfigPageComponent {}
```

---

### 5.2 Lifecycle Rules
- MUST call `super.ngOnInit()`
- MUST NOT initialize widgets before base lifecycle
- MUST set `initialized = true` after initialization

```ts
ngOnInit(): void {
  super.ngOnInit();
  this.initialized = true;
}
```

---

### 5.3 Navigation Rules
- MUST define `navigationItems`
- MUST have exactly ONE item with `default: true`
- MUST use `action` as discriminator
- MUST NOT use routing for switching
- **MUST include `icon` for each navigation item (MANDATORY)**

**NavigationItem Structure (All Properties Required):**
```ts
navigationItems: NavigationItem[] = [
  {
    label: 'Dunning Types',           // Display label
    action: 'dunning-types',          // Action identifier (used in template)
    tooltip: 'Dunning Types',         // Tooltip text
    icon: 'fa fa-gavel',              // FontAwesome icon (MANDATORY!)
    toggleable: false,                // Whether toggleable
    default: true                     // Exactly ONE must be true
  },
  {
    label: 'AI Agents',
    action: 'artificial-agents',
    tooltip: 'AI Agents',
    icon: 'fa fa-robot',
    toggleable: false,
    default: false
  }
];
```

**Template Pattern - Use `activeNavigationItem` from base class:**
```html
<!-- Section 1 -->
<ng-container *ngIf="activeNavigationItem?.action == 'dunning-types'">
    <mvs-widget [widgetData]="widgets['dunningTypeWidget'].widgetData"></mvs-widget>
</ng-container>

<!-- Section 2 -->
<ng-container *ngIf="activeNavigationItem?.action == 'artificial-agents'">
    <mvs-widget [widgetData]="widgets['aiAgentWidget'].widgetData"></mvs-widget>
</ng-container>
```

---

### 5.4 Tab Rules (CRITICAL - When to Use Tabs)

**Tabs are ONLY for sub-grouping MULTIPLE widgets within a navigation section.**

**Decision Matrix:**

| Widgets per Navigation Section | Use Tabs? |
|-------------------------------|-----------|
| 1 widget | **NO** - render widget directly with `ng-container` |
| 2+ widgets | **YES** - use `p-tabs` to organize sub-sections |

**WRONG - Using tabs when only ONE widget per section:**
```html
<!-- DON'T DO THIS - Unnecessary tabs -->
<p-tabs [(value)]="activeSection">
    <p-tablist>
        <p-tab value="dunning-types">Dunning Types</p-tab>
        <p-tab value="ai-agents">AI Agents</p-tab>
    </p-tablist>
    <p-tabpanels>
        <p-tabpanel value="dunning-types">
            <mvs-widget [widgetData]="dunningTypeWidget"></mvs-widget>  <!-- ONE widget -->
        </p-tabpanel>
        <p-tabpanel value="ai-agents">
            <mvs-widget [widgetData]="aiAgentWidget"></mvs-widget>  <!-- ONE widget -->
        </p-tabpanel>
    </p-tabpanels>
</p-tabs>
```

**CORRECT - No tabs when one widget per section:**
```html
<!-- Navigation handles section switching, NOT tabs -->
<ng-container *ngIf="activeNavigationItem?.action == 'dunning-types'">
    <mvs-widget [widgetData]="widgets['dunningTypeWidget'].widgetData"></mvs-widget>
</ng-container>

<ng-container *ngIf="activeNavigationItem?.action == 'ai-agents'">
    <mvs-widget [widgetData]="widgets['aiAgentWidget'].widgetData"></mvs-widget>
</ng-container>
```

**CORRECT - Use tabs when MULTIPLE widgets in a section:**
```html
<ng-container *ngIf="activeNavigationItem?.action == 'cp.ProvisionAgent'">
    <!-- Multiple widgets → tabs make sense -->
    <p-tabs [value]="0">
        <p-tablist>
            <p-tab [value]="0">Agent</p-tab>
            <p-tab [value]="1">Agent Pool</p-tab>
            <p-tab [value]="2">Agent Pool Agent</p-tab>
        </p-tablist>
        <p-tabpanels>
            <p-tabpanel [value]="0">
                <mvs-widget [widgetData]="widgets.provisionAgentWidget.widgetData"></mvs-widget>
            </p-tabpanel>
            <p-tabpanel [value]="1">
                <mvs-widget [widgetData]="widgets.provisionAgentPoolWidget.widgetData"></mvs-widget>
            </p-tabpanel>
            <p-tabpanel [value]="2">
                <mvs-widget [widgetData]="widgets.provisionAgentPoolAgentWidget.widgetData"></mvs-widget>
            </p-tabpanel>
        </p-tabpanels>
    </p-tabs>
</ng-container>
```

**Key Point:** Navigation items (with icons) handle top-level section switching. Tabs are ONLY for sub-grouping within a single navigation section.

---

### 5.5 Widget Registry Rules
- MUST define a `widgets` registry
- MUST use declarative widget definitions
- MUST NOT create widgets in templates

---

### 5.6 Navigation Selection Handling
- MUST implement `postNavigationSelection()`
- MUST update `uiWidgetEntries`
- MUST auto-select first tab when tabs exist

---

## 6. Template Rules (Angular)

- MUST render widgets explicitly
- MUST guard initialization
- MUST use `<mvs-config-header>` with valid `categoryTypeMode`

---

## 7. categoryTypeMode

Only allowed values:
```ts
'cross' | 'technical' | 'system' | 'ticket' | 'call' | 'channel' |
'notification' | 'document' | 'contract' | 'workflow' |
'contractInsurance' | 'person' | 'household'
```

Do NOT invent custom values.

---

## 8. Required Overrides

```ts
isConfigurationPage(): boolean {
  return true;
}

isNavComponent(): NavigationItem[] {
  return this.navigationItems;
}
```

---

## 9. Routing Rules
- MUST use static routes
- MUST NOT use `:id` parameters

---

## 10. Anti-Patterns (Forbidden)

### Entity Relationship Violations
- **Including entities whose primary relationships are with another module** (e.g., `bm.DunningLevel` in bm config when its primary usage is by `bd.*` entities)
- **Including entities without checking entity-registry.md for relationships**

### How to Validate Entity Belongs in Config Page

```
1. Check entity-registry.md for the entity
2. Look at reverse relationships (which entities USE this entity)
3. If primary relationships are with SAME module → KEEP
4. If primary relationships are with DIFFERENT module → REMOVE
```

### Structural Violations
- Creating widgets in templates
- Switching configuration via route params
- Initializing widgets before base lifecycle
- Mixing Object Page logic into Configuration Pages
- **Using flat tabs for hierarchical entities** (see hierarchical-config-pattern.md)
- **Showing child entities without parent context**
- **Not filtering child widgets by parent FK**

---

## 11. Final Guarantee

If all rules in this document are followed, the Configuration Page will be correct,
scalable, maintainable, and safe for Claude AI–generated implementations.
