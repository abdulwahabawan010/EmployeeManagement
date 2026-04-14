# MvsObjectNavigationService

> Central navigation service for object-centric navigation across the Alpha application.

---

## Overview

`MvsObjectNavigationService` manages **object-based navigation** where every target is an object with type and identifier (e.g., `cr.Customer:12345`). Unlike traditional URL routing, this service orchestrates navigation across **5 UI locations** simultaneously with full URL synchronization.

**Key Capabilities:**
- Navigate objects to main area, sidebars (left/right/bottom), dialog, or overlay stack
- Bidirectional URL synchronization for bookmarkable states
- Reactive state via RxJS BehaviorSubjects
- Dirty state tracking to prevent data loss
- Context/breadcrumb tracking

---

## Quick Reference

### Navigation Locations

| Location | Code | URL Param | Mode | Use Case |
|----------|------|-----------|------|----------|
| Main | `'main'` | `tid` | `'full'` | Primary content |
| Right Sidebar | `'right'` | `tid-sbr` | `'side'` | Detail view (default) |
| Left Sidebar | `'left'` | `tid-sbl` | `'side'` | Secondary nav |
| Bottom | `'bottom'` | `tid-sbb` | `'side'` | Additional content |
| Dialog | `'dialog'` | `tid-dlg` | `'full'` | Modal dialog |
| Overlay | `addOverlay()` | `overlay` | `'full'` | Stacked modals |

### Navigation Actions

| Action | Enum Value | Use Case |
|--------|------------|----------|
| `any` | 0 | Default, context-dependent |
| `create` | 1 | Creating new object |
| `edit` | 2 | Editing existing object |
| `display` | 3 | View only (read-only) |
| `run` | 4 | Execute action/report |

### UI Modes

| Mode | Description |
|------|-------------|
| `'full'` | Full-page view |
| `'side'` | Standard sidebar |
| `'mini-side'` | Compact sidebar |
| `'inline'` | Embedded inline |
| `'consultant'` | Consultant layout |

### Common Operations

| Task | Code |
|------|------|
| Navigate to sidebar | `navigationService.navigateTo(entry, 'right')` |
| Close sidebar | `navigationService.navigateTo(null, 'right')` |
| Handle object click | `navigationService.handleObjectNavigation(objectId, event)` |
| Open in new tab | `navigationService.handleObjectNavigation(objectId, null, { openNewTab: true })` |
| Add overlay | `navigationService.addOverlay(entry)` |
| Remove overlay | `navigationService.removeLastOverlay()` |
| Set dirty | `navigationService.setDirty('right', true)` |
| Check dirty | `navigationService.getDirtyState('right')` |

---

## Core Concepts

### Object-Centric Navigation

Navigation targets are identified by:

| Property | Description | Example |
|----------|-------------|---------|
| `objectType` | Module prefix + entity name | `cr.Customer`, `tm.Ticket` |
| `objectId` | Unique identifier | `12345` |
| `navigationType` | Display type | `'Form'`, `'List'`, `'object'`, `'create'` |

### MvsObjectNavigationEntry Structure

```typescript
{
  objectIdentifier: {
    objectType: string;      // e.g., 'cr.Customer'
    objectId: number;        // Unique ID
    navigationType: string;  // 'Form', 'List', 'object', 'create'
  };
  name: string;              // Display name
  action: MvsObjectNavigationActionEnum;
  mode: UiMode;              // 'full', 'side', etc.
  viewType: string;          // Custom view identifier
  params: ParamRequest;      // Custom parameters
  context?: ObjectIdentifier[]; // Breadcrumb context
}
```

### URL Parameter Structure

```
Main:    tid=objectType:objectId[:navigationType]&tid-action=X&tid-mode=Y
Right:   tid-sbr=objectType:objectId&tid-sbr-action=X&tid-sbr-mode=Y
Left:    tid-sbl=objectType:objectId&tid-sbl-action=X
Bottom:  tid-sbb=objectType:objectId
Dialog:  tid-dlg=objectType:objectId
Overlay: overlay=cr.Customer:123,tm.Ticket:789
Context: tid-ctx=cm.Contract:999,cr.Customer:123
```

### Navigation Providers

| Provider | Use Case |
|----------|----------|
| `MvsObjectNavigationProviderGeneric` | Simple/config pages, flat navigation |
| `MvsObjectNavigationProviderOb` | CRUD pages, hierarchical object structures |

---

## Implementation Guide

### 1. Service Injection

```typescript
import { MvsObjectNavigationService } from "features/core/shared/navigation/mvs-object-navigation.service";

export class MyComponent implements OnInit {
    constructor(
        protected navigationService: MvsObjectNavigationService,
    ) {}
}
```

### 2. Initialize Provider

```typescript
import { MvsObjectNavigationProviderGeneric } from "features/core/shared/navigation/impl/mvs-object-navigation-provider-generic";

ngOnInit(): void {
    this.navigationService.setNavigationProvider(new MvsObjectNavigationProviderGeneric());
}
```

### 3. Create Navigation Entry

```typescript
import { MvsObjectNavigationEntry } from "features/core/shared/navigation/mvs-object-navigation-entry";
import { MvsObjectNavigationActionEnum } from "features/core/shared/navigation/mvs-object-navigation-action-enum";

const entry = MvsObjectNavigationEntry.createNavigationEntry(
    'cr.Customer',                      // objectType
    12345,                              // objectId
    null,                               // navigationType
    'Customer Details',                 // name
    null,                               // image
    null,                               // description
    MvsObjectNavigationActionEnum.any   // action
);

entry.mode = 'side';  // Set UI mode
```

### 4. Navigate to Location

```typescript
// Open in right sidebar (most common)
this.navigationService.navigateTo(entry, 'right');

// Open in other locations
this.navigationService.navigateTo(entry, 'left');
this.navigationService.navigateTo(entry, 'main');
this.navigationService.navigateTo(entry, 'dialog');

// Close sidebar
this.navigationService.navigateTo(null, 'right');
```

### 5. Handle Object Click (with Ctrl+Click detection)

```typescript
import { ObjectIdentifier } from "features/core/shared/basic/object-identifier";

onCustomerClick(event: MouseEvent, customer: CustomerDto) {
    const objectId = new ObjectIdentifier('cr.Customer', customer.id);

    // Automatically detects Ctrl+Click to open in new tab
    this.navigationService.handleObjectNavigation(objectId, event);
}

// Force new tab
this.navigationService.handleObjectNavigation(objectId, null, {
    openNewTab: true,
    openNewTabFocus: true
});
```

### 6. Subscribe to Navigation Changes

```typescript
ngOnInit(): void {
    this.navigationService.getNavigationBehaviourSubject('right').subscribe(
        (navObject: MvsObjectNavigationEntry) => {
            if (navObject) {
                this.handleNavigation(navObject);
            }
        }
    );
}
```

### 7. Overlay Stack Management

```typescript
// Push to overlay stack
this.navigationService.addOverlay(entry);

// Pop from stack
this.navigationService.removeLastOverlay();

// Clear all overlays
this.navigationService.clearOverlay();

// Check if object exists in overlay
const exists = this.navigationService.checkNavigationExistence(objectId);
```

### 8. Dirty State Management

```typescript
// Mark as dirty when form changes
this.navigationService.setDirty('right', true);

// Clear after save
this.navigationService.setDirty('right', false);

// Check and show confirmation
if (this.navigationService.getDirtyState('right')) {
    this.navigationService.showConfirmationMessage(() => {
        this.navigationService.navigateTo(null, 'right');
    });
}
```

### 9. Navigation with Context (Breadcrumbs)

```typescript
const entry = MvsObjectNavigationEntry.createNavigationEntry(
    'tm.Ticket', 789, null, 'Ticket', null, null,
    MvsObjectNavigationActionEnum.any
);

// Track parent objects
entry.context = [
    { objectType: 'cr.Customer', objectId: 12345 },
    { objectType: 'cm.Contract', objectId: 456 }
];

this.navigationService.navigateTo(entry, 'right');
```

### 10. Navigation with Custom Parameters

```typescript
const entry = MvsObjectNavigationEntry.createNavigationEntry(
    'rp.Report', null, 'List', 'Sales Report', null, null,
    MvsObjectNavigationActionEnum.run
);

entry.params = {
    filters: [
        { field: 'status', operator: 'eq', value: 'active' }
    ]
};
```

---

## Complete Examples

### List Component with Navigation

```typescript
@Component({
    selector: 'app-customer-list',
    template: `
        <div *ngFor="let customer of customers">
            <span (click)="onCustomerClick($event, customer)">{{ customer.name }}</span>
            <button (click)="openInOverlay(customer)">Modal</button>
        </div>
    `
})
export class CustomerListComponent implements OnInit {

    constructor(protected navigationService: MvsObjectNavigationService) {}

    ngOnInit(): void {
        this.navigationService.setNavigationProvider(new MvsObjectNavigationProviderGeneric());
    }

    onCustomerClick(event: MouseEvent, customer: CustomerDto) {
        const objectId = new ObjectIdentifier('cr.Customer', customer.id);
        this.navigationService.handleObjectNavigation(objectId, event);
    }

    openInOverlay(customer: CustomerDto) {
        const entry = MvsObjectNavigationEntry.createNavigationEntry(
            'cr.Customer', customer.id, null, customer.name, null, null,
            MvsObjectNavigationActionEnum.any
        );
        this.navigationService.addOverlay(entry);
    }
}
```

### Sidebar Component with Subscription

```typescript
@Component({
    selector: 'app-sidebar',
    template: `
        <div *ngIf="showSidebar">
            <mvs-crud-object [objectType]="currentObject.objectType"
                             [objectId]="currentObject.objectId">
            </mvs-crud-object>
        </div>
    `
})
export class SidebarComponent implements OnInit, OnDestroy {

    showSidebar = false;
    currentObject: ObjectIdentifier;
    private subscription: Subscription;

    constructor(protected navigationService: MvsObjectNavigationService) {}

    ngOnInit(): void {
        this.subscription = this.navigationService
            .getNavigationBehaviourSubject('right')
            .subscribe(navObject => {
                this.showSidebar = !!navObject;
                this.currentObject = navObject?.objectIdentifier;
            });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
```

### Action Menu Component

```typescript
@Component({
    selector: 'app-object-actions',
    template: `<p-menu [model]="menuItems"></p-menu>`
})
export class ObjectActionsComponent {

    @Input() objectType: string;
    @Input() objectId: number;
    @Input() objectName: string;

    menuItems: MenuItem[];

    constructor(protected navigationService: MvsObjectNavigationService) {}

    ngOnInit(): void {
        this.menuItems = [
            { label: 'Open in Sidebar', command: () => this.openInSidebar() },
            { label: 'Open as Modal', command: () => this.openAsModal() },
            { label: 'Open in New Tab', command: () => this.openInNewTab() },
            { label: 'Edit', command: () => this.openForEdit() }
        ];
    }

    private createEntry(action: MvsObjectNavigationActionEnum): MvsObjectNavigationEntry {
        return MvsObjectNavigationEntry.createNavigationEntry(
            this.objectType, this.objectId, null, this.objectName, null, null, action
        );
    }

    openInSidebar() {
        const entry = this.createEntry(MvsObjectNavigationActionEnum.display);
        entry.mode = 'side';
        this.navigationService.navigateTo(entry, 'right');
    }

    openAsModal() {
        const entry = this.createEntry(MvsObjectNavigationActionEnum.display);
        this.navigationService.addOverlay(entry);
    }

    openInNewTab() {
        const objectId = new ObjectIdentifier(this.objectType, this.objectId);
        this.navigationService.handleObjectNavigation(objectId, null, { openNewTab: true });
    }

    openForEdit() {
        const entry = this.createEntry(MvsObjectNavigationActionEnum.edit);
        entry.mode = 'side';
        this.navigationService.navigateTo(entry, 'right');
    }
}
```

---

## File Locations

| File | Purpose |
|------|---------|
| `features/core/shared/navigation/mvs-object-navigation.service.ts` | Main service |
| `features/core/shared/navigation/alpha-object-navigation.service.ts` | App extension |
| `features/core/shared/navigation/mvs-object-navigation-entry.ts` | Entry structure |
| `features/core/shared/navigation/mvs-object-navigation-action-enum.ts` | Action enum |
| `features/core/shared/navigation/impl/mvs-object-navigation-provider-generic.ts` | Generic provider |
| `features/core/shared/navigation/impl/mvs-object-navigation-provider-ob.ts` | ObjectBrowser provider |
| `features/core/shared/basic/object-identifier.ts` | Object reference |

---

## Design Principles

1. **Reactive Architecture** - State changes propagate via RxJS observables
2. **URL-First Design** - Navigation state always synchronized to URL
3. **Location Agnostic** - Same entry can render in any location
4. **Provider Pattern** - Flexible navigation structure sources
5. **Context Awareness** - Breadcrumb context tracks navigation history
6. **Dirty State Protection** - Prevents accidental data loss