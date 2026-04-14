# Dashboard Page

## Purpose

A **Dashboard Page** is a specialized page type used to present **collections of business entities** in a clear, interactive overview.  
It is optimized for **browsing, searching, and selecting entities**, and for navigating users from an overview into **entity detail (Object) pages**.

Unlike Configuration Pages or Object Pages, a Dashboard Page is **collection-first**:
- It focuses on listing entities, not configuring systems
- It does not edit entities directly
- It acts as an entry point into deeper object views

Typical use cases include dashboards for:
- Customers
- Addresses
- Contracts
- Documents
- Any entity where users need a fast overview and quick navigation

---

## Conceptual Positioning

A Dashboard Page sits between generic layouts and object detail pages:

| Page Type | Responsibility |
|---------|----------------|
| PageComponent | Generic layouts and custom views |
| Dashboard Page | Entity collection overview (browse + navigate) |
| Object Page | Single entity view/edit |
| Config Page | System/module configuration |

The defining characteristic is that **Dashboards operate on collections**, not individual objects.

---

## Core Design Principles

### Widget-Centric Overview

Dashboard Pages are built around one or more **widgets** that encapsulate:
- Table or grid rendering
- Filtering, sorting, and searching (via widget configuration)
- User interactions such as row or item selection

The page orchestrates widgets but never implements table or data logic itself.

---

### Navigation as a First-Class Concern

A standard dashboard workflow is:

1. User opens the dashboard route
2. Widget loads and displays an entity collection
3. User selects an entity
4. The page navigates to the corresponding Object Page

Dashboards are therefore **navigation-focused**, not editing-focused.

---

### Minimal Routing Complexity

Dashboard Pages:
- Use **static routes**
- Do **not** include object identifiers in the route
- Delegate object-specific routing to Object Pages

---

## Role of PageComponent

Dashboard Pages extend `PageComponent` and follow its lifecycle pattern to ensure consistent behavior:

- Base page initialization via `super.ngOnInit()`
- Widget creation after base lifecycle
- Explicit `initialized` state to control rendering

This prevents partial or inconsistent UI states.

---

## Mandatory Implementation Contract

All rules below are enforceable.

---

### Class & Inheritance

- MUST extend `PageComponent`
- MUST NOT extend `ConfigPageComponent`
- MUST NOT contain object-editing logic

```ts
export class YourDashboardPage extends PageComponent {}
```

---

### Lifecycle Rules

- MUST call `super.ngOnInit()`
- MUST create widgets after base lifecycle
- MUST set `initialized = true` after widgets are created

```ts
ngOnInit(): void {
  super.ngOnInit();
  this.initComponent();
}
```

---

### Widget Rules

- MUST create dashboard widgets using `WidgetFactory`
- MUST store widgets in `WidgetData` properties
- MUST NOT create widgets inside templates

```ts
addressDashboardWidgetData: WidgetData;
```

---

### Widget Creation Patterns

#### Simple Entity Overview

```ts
this.addressDashboardWidgetData =
  WidgetFactory.createWidgetTableEntityBasicQl(
    'ad.address.dashboard.widget',
    'Addresses',
    'ad.Address'
  );
```

#### Filtered or Advanced Overview

```ts
this.addressDashboardWidgetData =
  WidgetFactory.createWidgetTableEntityQl(
    'ad.address.dashboard.filtered',
    'Active Addresses',
    'ad.Address',
    'No addresses found',
    filters,
    [],
    true
  );
```

---

### Navigation Rules

- MUST handle widget `(onObjectSelect)` events
- MUST navigate to Object Pages
- SHOULD open Object Pages in a new tab for continuity

```ts
handleTemplateSelect(event: ObjectIdentifierData) {
  const entry = MvsObjectNavigationEntry.createNavigationEntry(
    event.objectType,
    event.objectId,
    'object',
    '',
    '',
    '',
    MvsObjectNavigationActionEnum.edit,
    'full'
  );

  this.navigationService.openObjectInNewTab(entry);
}
```

---

### Template Rules

- MUST render widgets explicitly
- MUST guard rendering with existence checks

```html
@if (addressDashboardWidgetData) {
  <mvs-widget
    [widgetData]="addressDashboardWidgetData"
    (onObjectSelect)="handleTemplateSelect($event)">
  </mvs-widget>
}
```

---

## Routing Rules

- MUST use static routes
- MUST NOT use `:id` parameters

```ts
{ path: 'address/dashboard', component: AddressDashboardPage }
```

---

## Correct Implementation Flow

1. Extend `PageComponent`
2. Call `super.ngOnInit()`
3. Create dashboard widgets via `WidgetFactory`
4. Set `initialized = true`
5. Render widgets explicitly
6. Handle selection and navigate to Object Pages

---

## Anti-Patterns (Forbidden)

- Loading entities via route parameters
- Editing entities directly on the dashboard
- Creating widgets in templates
- Skipping `super.ngOnInit()`
- Mixing configuration logic into dashboards

---

## Summary

A Dashboard Page provides a **fast, widget-driven overview** of entity collections and acts as a **navigation bridge** into Object Pages.

When implemented according to these rules, the Dashboard Page remains:
- Simple
- Predictable
- Scalable
- Consistent across the application
