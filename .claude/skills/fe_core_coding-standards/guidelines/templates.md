# Templates Guidelines

Rules governing component creation using official templates from `projects/shell-alpha/src/app/templates/`.

---

## Template Reference Location

All official templates are located at:

```
projects/shell-alpha/src/app/templates/
├── example-component/                    # Simple standalone component
├── example-object-component/             # Component extending ObjectBaseComponent
├── example-new-object-component/         # New object component with view variants
│   └── view/
│       ├── example.component-base.ts
│       ├── example-component-full/
│       └── example-component-side/
├── example-object-page/                  # Page extending ObjectPageComponent
├── example-dashboard-page/               # Dashboard page extending MvsDashboardPage
├── example-overview-page/                # Overview page extending PageComponent
├── example-overview-config-page/         # Overview config page
└── example-cross-component/              # Cross-module component with tests
    ├── model/
    └── test/
```

---

## TMPL-001: Use Official Templates

**Level:** MANUAL-ONLY

Always use the official templates as the starting point for new components. Do NOT create components from scratch.

### DO

```bash
# Copy the appropriate template directory
cp -r projects/shell-alpha/src/app/templates/example-component features/feature-crm/cr/component/my-component
```

### DO NOT

```typescript
// DO NOT create components from scratch without using templates
@Component({...})
export class MyComponent {
    // Missing standard structure
}
```

---

## TMPL-002: Simple Component Structure

**Level:** AUTO-CHECKABLE

Simple components must follow the `example-component` template pattern.

### Template Location

`projects/shell-alpha/src/app/templates/example-component/`

### Required Structure

```typescript
import {Component, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';

@Component({
    selector: 'xx-component-name',
    templateUrl: './component-name.component.html',
    standalone: false
})
export class ComponentNameComponent implements OnInit, OnChanges, OnDestroy {

    busy: boolean;        // Indicator whether the component is busy
    initialized: boolean; // Indicator whether the component was initialized

    constructor() {
    }

    ngOnInit(): void {
        this.initComponent();
    }

    /**
     * Initialize Component.
     */
    initComponent() {
        this.refreshComponent();
    }

    /**
     * Refresh Component.
     */
    refreshComponent() {
        this.initialized = true;
    }

    /**
     * Process changes within Binding.
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (!this.initialized) {
            return;
        }

        if (changes["id"]) {
            this.refreshComponent();
        }
    }

    /**
     * Destroy component.
     */
    ngOnDestroy(): void {

    }
}
```

### DO

- Implement `OnInit`, `OnChanges`, `OnDestroy` interfaces
- Include `busy` and `initialized` flags
- Call `initComponent()` in `ngOnInit()`
- Check `initialized` flag in `ngOnChanges()`
- Include JSDoc comments for lifecycle methods

### DO NOT

```typescript
// Missing required interfaces and structure
@Component({...})
export class MyComponent {
    ngOnInit() {
        // Direct logic without initComponent pattern
    }
}
```

---

## TMPL-003: Object Base Component Structure

**Level:** AUTO-CHECKABLE

Components that display/manage objects must extend `ObjectBaseComponent` and follow the `example-object-component` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-object-component/`

### Required Structure

```typescript
import {Component, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ObjectBaseComponent} from 'features/core/shared/object/mvs-object-base/object-base.component';

@Component({
    selector: 'xx-object-name',
    templateUrl: './object-name.component.html',
    standalone: false
})
export class ObjectNameComponent extends ObjectBaseComponent implements OnInit, OnChanges, OnDestroy {

    /**
     * On Object Change.
     */
    onObjectChanged() {
        // Handle object changes
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.initialized) {
            return;
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
```

### DO

- Extend `ObjectBaseComponent`
- Implement `onObjectChanged()` method
- Call `super.ngOnDestroy()` in `ngOnDestroy()`
- Check `initialized` flag in `ngOnChanges()`

### DO NOT

```typescript
// DO NOT use simple component pattern for object-based components
@Component({...})
export class CustomerDetailComponent implements OnInit {
    @Input() customerId: number;

    ngOnInit() {
        this.loadCustomer();  // Should extend ObjectBaseComponent
    }
}
```

---

## TMPL-004: Object Page Structure

**Level:** AUTO-CHECKABLE

Pages that display a single object must extend `ObjectPageComponent` and follow the `example-object-page` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-object-page/`

### Required Structure

```typescript
import {Component, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ObjectPageComponent} from 'features/core/shared/object/mvs-object-page-component/object-page.component';

@Component({
    selector: 'xx-entity-page',
    templateUrl: './entity-name.page.html',
    standalone: false
})
export class EntityNamePage
    extends ObjectPageComponent
    implements OnInit, OnDestroy, OnChanges {

    defaultLabel: string = "Entity Name";

    protected getObjectType(): string {
        return "xx.EntityName";
    }
}
```

### DO

- Extend `ObjectPageComponent`
- Implement `getObjectType()` returning the object type string
- Define `defaultLabel` property
- Use `.page.ts` and `.page.html` file extensions

### DO NOT

```typescript
// DO NOT implement object page without extending ObjectPageComponent
@Component({...})
export class CustomerPage implements OnInit {
    // Missing ObjectPageComponent extension
}
```

---

## TMPL-005: Dashboard Page Structure

**Level:** AUTO-CHECKABLE

Dashboard pages must extend `MvsDashboardPage` and follow the `example-dashboard-page` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-dashboard-page/`

### Required Structure

```typescript
import {Component, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {MvsDashboardPage} from 'features/core/shared/dashboard/page/dashboard-page/mvs-dashboard.page';

@Component({
    selector: 'xx-dashboard-page',
    templateUrl: './dashboard-name.page.html',
    standalone: false
})
export class DashboardNamePage extends MvsDashboardPage implements OnInit, OnChanges, OnDestroy {

    defaultLabel: string = "Dashboard Name";

    ngOnInit(): void {
        super.ngOnInit();
        this.initComponent();
    }

    /**
     * Initialize Component.
     */
    initComponent() {
        this.refreshComponent();
    }

    /**
     * Refresh Component.
     */
    refreshComponent() {
        this.initialized = true;
    }

    /**
     * Process changes within Binding.
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (!this.initialized) {
            return;
        }

        if (changes["id"]) {
            this.refreshComponent();
        }
    }

    /**
     * Destroy component.
     */
    ngOnDestroy(): void {

    }
}
```

### DO

- Extend `MvsDashboardPage`
- Call `super.ngOnInit()` before `initComponent()`
- Define `defaultLabel` property
- Use `.page.ts` and `.page.html` file extensions

### DO NOT

```typescript
// DO NOT create dashboard without extending MvsDashboardPage
@Component({...})
export class SalesDashboard implements OnInit {
    // Missing MvsDashboardPage extension
}
```

---

## TMPL-006: Overview Page Structure

**Level:** AUTO-CHECKABLE

Overview/listing pages must extend `PageComponent` and follow the `example-overview-page` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-overview-page/`

### Required Structure

```typescript
import {Component, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {PageComponent} from 'features/core/shared/mvs-page/page.component';

@Component({
    selector: 'xx-overview',
    templateUrl: './overview-name.component.html',
    standalone: false
})
export class OverviewNameComponent extends PageComponent implements OnInit, OnChanges, OnDestroy {

    defaultLabel: string = "Overview Name";

    ngOnInit(): void {
        super.ngOnInit();
        this.initComponent();
    }

    /**
     * Initialize Component.
     */
    initComponent() {
        this.refreshComponent();
    }

    /**
     * Refresh Component.
     */
    refreshComponent() {
        this.initialized = true;
    }

    /**
     * Process changes within Binding.
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (!this.initialized) {
            return;
        }

        if (changes["id"]) {
            this.refreshComponent();
        }
    }

    /**
     * Destroy component.
     */
    ngOnDestroy(): void {

    }
}
```

### DO

- Extend `PageComponent`
- Call `super.ngOnInit()` before `initComponent()`
- Define `defaultLabel` property

### DO NOT

```typescript
// DO NOT create overview page without extending PageComponent
@Component({...})
export class CustomersOverview implements OnInit {
    // Missing PageComponent extension
}
```

---

## TMPL-007: New Object Component with Views

**Level:** AUTO-CHECKABLE

Components with multiple view modes (full/side) must follow the `example-new-object-component` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-new-object-component/`

### Required Structure

```
component-name/
├── component-name.component.ts       # Main component (extends ObjectBaseComponent)
├── component-name.component.html     # Main template
└── view/
    ├── component-name.component-base.ts    # Base view component
    ├── component-name-full/
    │   └── component-name.component-full.ts
    └── component-name-side/
        └── component-name.component-side.ts
```

### DO

- Create separate view components for full and side modes
- Use a base view component for shared logic
- Main component extends `ObjectBaseComponent`

### DO NOT

```typescript
// DO NOT handle multiple views with conditionals in single component
@Component({...})
export class CustomerComponent extends ObjectBaseComponent {
    @Input() mode: 'full' | 'side';

    // DO NOT use conditionals for view modes
    get template() {
        return this.mode === 'full' ? this.fullTemplate : this.sideTemplate;
    }
}
```

---

## TMPL-008: Cross-Module Component Structure

**Level:** AUTO-CHECKABLE

Components that span modules must follow the `example-cross-component` template.

### Template Location

`projects/shell-alpha/src/app/templates/example-cross-component/`

### Required Structure

```
component-name/
├── component-name.component.ts
├── component-name.component.html
├── model/
│   └── component-name-model.interface.ts
└── test/
    ├── component/
    │   └── component-name-test.component.ts
    └── unit-test/
        └── component-name.spec.ts
```

### DO

- Include model interfaces in `model/` directory
- Include test components in `test/component/`
- Include unit tests in `test/unit-test/`

### DO NOT

```typescript
// DO NOT create cross-module component without proper structure
component-name/
├── component-name.component.ts
└── component-name.spec.ts  // Tests should be in test/ subdirectory
```

---

## TMPL-009: Selector Naming Convention

**Level:** AUTO-CHECKABLE

Component selectors must follow the module prefix pattern.

### DO

```typescript
// CRM module components
@Component({ selector: 'cr-customer-list' })

// Billing module components
@Component({ selector: 'bm-invoice-detail' })

// Core/shared components
@Component({ selector: 'mvs-data-table' })
```

### DO NOT

```typescript
// Missing module prefix
@Component({ selector: 'customer-list' })

// Wrong prefix format
@Component({ selector: 'app-customer-list' })

// camelCase selector
@Component({ selector: 'crCustomerList' })
```

---

## TMPL-010: Standalone Flag

**Level:** AUTO-CHECKABLE

All components must explicitly set `standalone: false` until migration to standalone is complete.

### DO

```typescript
@Component({
    selector: 'cr-customer',
    templateUrl: './customer.component.html',
    standalone: false  // Explicitly set
})
```

### DO NOT

```typescript
@Component({
    selector: 'cr-customer',
    templateUrl: './customer.component.html'
    // Missing standalone flag
})
```

---

## TMPL-011: Required Lifecycle Methods

**Level:** AUTO-CHECKABLE

Components must implement appropriate lifecycle interfaces and methods.

### Simple Component

```typescript
implements OnInit, OnChanges, OnDestroy
```

### ObjectBaseComponent Extension

```typescript
extends ObjectBaseComponent implements OnInit, OnChanges, OnDestroy {
    onObjectChanged() {}
    ngOnChanges(changes: SimpleChanges) {}
    ngOnDestroy() { super.ngOnDestroy(); }
}
```

### Page Extension

```typescript
extends PageComponent implements OnInit, OnChanges, OnDestroy {
    ngOnInit() { super.ngOnInit(); this.initComponent(); }
}
```

### DO

- Always implement `OnInit`, `OnChanges`, `OnDestroy`
- Call `super.ngOnInit()` when extending base classes
- Call `super.ngOnDestroy()` when extending `ObjectBaseComponent`

### DO NOT

```typescript
// Missing lifecycle interfaces
export class CustomerComponent {
    ngOnInit() {}  // Interface not declared
}
```

---

## TMPL-012: Initialization Pattern

**Level:** AUTO-CHECKABLE

Components must follow the standard initialization pattern.

### DO

```typescript
ngOnInit(): void {
    this.initComponent();
}

initComponent() {
    this.refreshComponent();
}

refreshComponent() {
    this.initialized = true;
    // Load data, setup subscriptions, etc.
}

ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
        return;  // Guard against changes before init
    }

    if (changes["id"]) {
        this.refreshComponent();
    }
}
```

### DO NOT

```typescript
ngOnInit(): void {
    // DO NOT put all logic directly in ngOnInit
    this.loadData();
    this.setupSubscriptions();
    this.initialized = true;
}

ngOnChanges(changes: SimpleChanges): void {
    // DO NOT process changes before initialization
    if (changes["id"]) {
        this.loadData();  // May run before init
    }
}
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| TMPL-001 | Use Official Templates | MANUAL-ONLY |
| TMPL-002 | Simple Component Structure | AUTO-CHECKABLE |
| TMPL-003 | Object Base Component Structure | AUTO-CHECKABLE |
| TMPL-004 | Object Page Structure | AUTO-CHECKABLE |
| TMPL-005 | Dashboard Page Structure | AUTO-CHECKABLE |
| TMPL-006 | Overview Page Structure | AUTO-CHECKABLE |
| TMPL-007 | New Object Component with Views | AUTO-CHECKABLE |
| TMPL-008 | Cross-Module Component Structure | AUTO-CHECKABLE |
| TMPL-009 | Selector Naming Convention | AUTO-CHECKABLE |
| TMPL-010 | Standalone Flag | AUTO-CHECKABLE |
| TMPL-011 | Required Lifecycle Methods | AUTO-CHECKABLE |
| TMPL-012 | Initialization Pattern | AUTO-CHECKABLE |

---

## Quick Reference: Which Template to Use

| Scenario | Template | Base Class |
|----------|----------|------------|
| Simple UI component | `example-component` | None |
| Display/edit single object | `example-object-component` | `ObjectBaseComponent` |
| Object detail page (route) | `example-object-page` | `ObjectPageComponent` |
| Dashboard with widgets | `example-dashboard-page` | `MvsDashboardPage` |
| List/overview page | `example-overview-page` | `PageComponent` |
| Component with full/side views | `example-new-object-component` | `ObjectBaseComponent` |
| Cross-module reusable component | `example-cross-component` | None |
