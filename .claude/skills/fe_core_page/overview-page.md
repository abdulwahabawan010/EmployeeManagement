# Overview Page

## Purpose

An **Overview Page** is a module-level landing page that provides a **high-level operational view** of a module through **KPIs and aggregated statistics**.

It is designed to answer:
- What is happening in this module right now?
- How is the module performing overall?

Unlike Dashboards or Object Pages, an Overview Page is:
- **Module-scoped**
- **Aggregate-focused**
- **Insight-driven rather than action-driven**

---

## Conceptual Positioning

Overview Pages sit at the top of the module navigation hierarchy:

| Page Type | Primary Responsibility |
|---------|------------------------|
| Overview Page | Module-wide KPIs and statistics |
| Dashboard Page | Browse entity collections |
| Object Page | View/manage a single entity |
| Config Page | Configure module/system behavior |

An Overview Page represents the **entry point** into a module.

---

## Core Design Principles

### Module-Centric Design

An Overview Page represents a **module**, not an entity.

All displayed data is:
- Aggregated across the module
- Detached from individual object lifecycles
- Intended for fast situational awareness

---

### Standardized KPI and Statistics Model

Overview Pages follow a **fixed structural contract**:
- **Overview tab** → KPIs (counts, totals, trends)
- **Statistics tab** → Charts, widgets, distributions

This enforces a consistent UX across all modules.

---

### Dynamic Module Resolution

Overview Pages do not reference KPI or Statistics implementations directly.

Instead:
- Modules register themselves dynamically
- The Overview Page resolves components via a module alias
- KPI and Statistics components are loaded at runtime

This enables framework-level consistency and module-level customization.

---

### Delegation-Based Architecture

The Overview Page:
- Contains **no business logic**
- Delegates KPI rendering to KPI components
- Delegates statistics rendering to Statistics components
- Delegates tab/navigation handling to a shared container

---

## Role of the Overview Page Wrapper

The Overview Page component:
- Extends `PageComponent`
- Acts as a **thin wrapper**
- Anchors routing and page identity
- Binds a module alias to the overview framework

It exists to provide structure, not behavior.

---

## Mandatory Implementation Contract

All rules below are enforceable.

---

### Page Wrapper Rules

- MUST extend `PageComponent`
- MUST NOT extend `ObjectPageComponent`
- MUST contain no business logic
- MUST delegate rendering

```ts
export class YourOverviewPage extends PageComponent {}
```

---

### Template Rules

- MUST render `<ui-object-navigation-main-page>`
- MUST pass a valid module alias
- MUST NOT render KPIs, widgets, or charts directly

```html
<ui-object-navigation-main-page alias="moduleAlias"></ui-object-navigation-main-page>
```

---

### Lifecycle Rules

- MUST set `defaultLabel`
- MUST call `super.ngOnInit()`
- MUST allow base lifecycle to set `initialized`

```ts
ngOnInit(): void {
  this.defaultLabel = 'Module Overview';
  super.ngOnInit();
}
```

---

## Module Contract (Required)

A module exposing an Overview Page MUST:

- Implement `DynamicModule`
- Register itself with `ModuleRegistryService`
- Provide KPI and Statistics components

```ts
export class MyModule implements DynamicModule {
  alias = 'my-module';

  constructor(registry: ModuleRegistryService) {
    registry.registerModule(this);
  }

  getKpiComponent() {
    return MyKpiComponent;
  }

  getStatisticsComponent() {
    return MyStatisticsComponent;
  }
}
```

---

## KPI Component Rules

KPI components MUST:

- Extend `OverviewKpiBaseComponent`
- Load aggregated data only
- Be resilient to partial failures
- Produce `KpiHeaderDto[]`

```ts
export class MyKpiComponent extends OverviewKpiBaseComponent {}
```

---

## Statistics Component Rules

Statistics components MUST:

- Extend `OverviewStatisticsBaseComponent`
- Create widgets via `WidgetFactory`
- Use `filterCriteria` and `filterCriteriaForQuery`
- Recreate widgets in `refreshComponent()`

```ts
export class MyStatisticsComponent extends OverviewStatisticsBaseComponent {}
```

---

## Routing Rules

- SHOULD be accessible via `/ui/nav/main/:alias`
- MAY define a module-specific route
- MUST NOT use `:id` parameters

```ts
{ path: 'overview', component: MyOverviewPage }
```

---

## Anti-Patterns (Forbidden)

- Rendering widgets directly in the overview page
- Loading entities directly in the page
- Bypassing module registry
- Implementing custom tab logic
- Mixing entity logic into overview pages

---

## Correct Implementation Flow

1. Module implements `DynamicModule`
2. Module registers itself with `ModuleRegistryService`
3. Overview Page extends `PageComponent`
4. Template delegates to navigation container
5. KPI and Statistics components load dynamically
6. Widgets render inside Statistics components

---

## Example Overview Page (TypeScript)

```ts
@Component({
  selector: 'address-overview-page',
  templateUrl: './address-overview.page.html',
  standalone: true
})
export class AddressOverviewPage extends PageComponent {

  override defaultLabel = 'Address Overview';

  override ngOnInit(): void {
    super.ngOnInit();
  }
}
```

---

## Example Overview Page Template (HTML)

```html
<ui-object-navigation-main-page alias="address"></ui-object-navigation-main-page>
```

---

## Summary

An Overview Page is a **module-level insight surface**.

When implemented according to these rules:
- All modules share a consistent overview experience
- KPI and statistics logic remains isolated
- The framework stays extensible and predictable
- The page remains lightweight and declarative
