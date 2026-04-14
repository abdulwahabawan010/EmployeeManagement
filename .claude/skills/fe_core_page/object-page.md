# Object Page

## Purpose

An **Object Page** is a specialized page type dedicated to displaying and managing **a single business object instance** (entity), uniquely identified by its **type** and **ID**.

Unlike Dashboard Pages (collection-oriented) or Configuration Pages (system-oriented), an Object Page is:
- **Object-centric**
- **Context-aware**
- **Driven by an Object Identifier**
- **Integrated with routing and global page context**

It is the canonical page type for **entity detail and edit views**.

---

## Conceptual Positioning

An Object Page occupies the most specific level in the page hierarchy:

| Page Type | Responsibility |
|---------|----------------|
| Dashboard Page | Browse collections of entities |
| Configuration Page | Manage system/module configuration |
| Object Page | View and manage one entity instance |

The defining characteristic is that **the page exists because of an object**.

---

## Core Design Principles

### Object-First Architecture

The lifecycle of an Object Page is driven entirely by an **Object Identifier**, consisting of:
- `objectType` (e.g. `tm.Ticket`, `cr.Customer`)
- `objectId` (unique identifier)

Without this identifier, the page has no meaning.

---

### Dynamic Component Resolution

An Object Page does **not** render entity UI directly.

Instead, it:
- Resolves the correct `ObjectBaseComponent` dynamically at runtime
- Instantiates the component programmatically
- Injects the resolved object context

This enables:
- Reuse of the same page infrastructure for multiple entity types
- Registry-based, extensible entity UI resolution

---

### Routed and Overlay Execution Modes

Object Pages support two equivalent execution modes:

- **Routed mode**: object loaded from route parameters (e.g. `/entity/:id`)
- **Overlay mode**: object injected via input (dialogs, side panels)

After object resolution, both modes behave identically.

---

### Page Context Awareness

An Object Page updates the global page context with the active object, enabling:
- Breadcrumb updates
- Object-aware widgets
- Cross-component coordination

---

## Role of ObjectPageComponent

`ObjectPageComponent` is an abstract base class that:
- Extends `PageComponent`
- Manages object lifecycle and routing
- Subscribes to route parameters
- Dynamically loads the correct object component
- Synchronizes object state with global page context

Concrete Object Pages define only:
- The object type
- Optional navigation behavior
- Optional lifecycle hooks

---

## Mandatory Implementation Contract

All rules below are enforceable.

---

### Class & Inheritance Rules

- MUST extend `ObjectPageComponent`
- MUST NOT extend `PageComponent` directly
- MUST NOT render entity-specific UI in the page

```ts
export class YourObjectPage extends ObjectPageComponent {}
```

---

### Lifecycle Rules

- MUST set `defaultLabel` before initialization
- MUST call `super.ngOnInit()`
- MUST NOT subscribe to route params manually
- MUST allow base class to control `initialized`

```ts
override ngOnInit(): void {
  this.defaultLabel = 'Entity';
  super.ngOnInit();
}
```

---

### Object Type Rules

- MUST implement `getObjectType()`
- MUST return a valid, registered entity type

```ts
protected override getObjectType(): string {
  return 'tm.Ticket';
}
```

---

### Routing Rules

- MUST use routes containing an object identifier
- MUST use `:id` parameter unless explicitly overridden

```ts
{ path: 'ticket/:id', component: TicketPageComponent }
```

---

### Overlay Mode Rules

When used outside routing:

- MUST set `[isOverlay]="true"`
- MUST provide `objectIdentifier` input
- MUST NOT rely on route params

```html
<ticket-page
  [isOverlay]="true"
  [objectIdentifier]="selectedTicket">
</ticket-page>
```

---

### Template Rules

- MUST contain `ObjectInplaceDirective`
- MUST NOT contain entity-specific UI

```html
<ng-template objectInplaceDirective></ng-template>
```

---

### Dynamic Component Rules

The page MUST allow `ObjectPageComponent` to:
- Resolve the correct object component via core registry
- Create the component dynamically
- Inject object identifier and context

Page implementations MUST NOT interfere with this process.

---

### Navigation Rules

- MAY define `navigationItems`
- If defined:
    - MUST have exactly one default item
    - MUST react via `postNavigationSelection()`
- Navigation is object-scoped, not page-scoped

---

### Page Context Rules

- MUST allow base class to update global object context
- MUST NOT manually manipulate page context

---

## Extension Hooks

The following hooks may be overridden safely:

```ts
protected onRouteChangeBefore(params: any) {}
protected onRouteChangeAfter(params: any) {}
protected postChangeObject() {}
protected onObjectChanged() {}
```

Use cases include:
- Validation
- UI adjustments
- Header or breadcrumb updates

---

## Anti-Patterns (Forbidden)

- Implementing CRUD logic in the Object Page
- Loading data manually in the page
- Rendering object UI directly
- Subscribing to route params redundantly
- Treating Object Pages as dashboards

---

## Correct Implementation Flow

1. Extend `ObjectPageComponent`
2. Set `defaultLabel`
3. Implement `getObjectType()`
4. Call `super.ngOnInit()`
5. Allow base class to resolve object and load component
6. React to lifecycle via hooks if needed

---

## Example Object Page (TypeScript)

```ts
@Component({
  selector: 'address-page',
  templateUrl: './address.page.html',
  standalone: true
})
export class AddressPage extends ObjectPageComponent {

  override defaultLabel = 'Address';

  protected override getObjectType(): string {
    return 'ad.Address';
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

}
```

---

## Example Object Page Template (HTML)

```html
<ng-container *ngIf="objectIdentifier && initialized">
  <div class="mb-3" *ngIf="objectIdentifier.objectId">
    <div class="flex align-items-center gap-2">
      <i class="fa fa-location-dot text-2xl text-primary"></i>
      <h3 class="m-0">{{ defaultLabel }}</h3>
    </div>
  </div>

  <!-- REQUIRED: ObjectInplaceDirective -->
  <ng-template objectInplaceDirective></ng-template>
</ng-container>

<ng-container *ngIf="!initialized">
  <div class="flex align-items-center justify-content-center p-5">
    <p-progressSpinner></p-progressSpinner>
  </div>
</ng-container>
```

---

## Summary

An Object Page is a **thin orchestration layer** for a single entity instance.

When implemented according to these rules:
- Object lifecycle handling remains consistent
- Routed and overlay modes behave identically
- Entity UI stays reusable and decoupled
- Page behavior remains predictable and extensible
