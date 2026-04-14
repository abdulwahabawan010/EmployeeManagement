---
name: widget-examples
description: Code examples for widget creation patterns
---

# Widget Code Examples

For governance rules, see `SKILL.md`. For technical reference, see `reference.md`.

---

## 1. Basic Table Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Customer table widget for displaying customer list
 */
this.customerWidget = WidgetFactory.createWidgetTableEntityQl(
  'cr.customer.list.table',
  'Customers',
  'cr.Customer',
  'No customers found',
  [],
  [],
  false
);
```

---

## 2. Table Widget with Filters and Sorting

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Active customers table with date sorting
 */
this.activeCustomersWidget = WidgetFactory.createWidgetTableEntityQl(
  'cr.customer.active.table',
  'Active Customers',
  'cr.Customer',
  'No active customers',
  [FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE')],
  [new Sorting('e.createdDate', false)],
  true  // resolve FK texts
);
```

---

## 3. Data Widget (Single Record)

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Customer detail widget for displaying single customer data
 */
this.customerDetailWidget = WidgetFactory.createWidgetEntityData(
  'cr.customer.detail.data',
  'Customer Details',
  'cr.Customer',
  this.customerId
);
```

---

## 4. Form Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Customer edit form for updating customer data
 */
this.customerFormWidget = WidgetFactory.createWidgetForm(
  'cr.customer.edit.form',
  'Edit Customer',
  'cr.Customer',
  this.customerId
);
```

---

## 5. Object Widget (Full CRUD)

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Customer management widget with full CRUD operations
 */
this.customerObjectWidget = WidgetFactory.createWidgetObject(
  'cr.customer.manage.object',
  'Customer Management',
  'cr.Customer',
  this.customerId
);
```

---

## 6. Transient Data Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Dashboard summary widget with in-memory data
 */
this.summaryWidget = WidgetFactory.createWidgetTransient(
  'dashboard.summary.transient',
  'Summary',
  'list',
  'transient',
  'transient',
  'summary.data',
  [
    { id: 1, metric: 'Total Revenue', value: 125000 },
    { id: 2, metric: 'Total Costs', value: 85000 }
  ]
);
```

**Reference:** See `mvs-history.component.ts` for real-world usage.

---

## 7. Master-Detail Pattern

```typescript
export class MasterDetailComponent implements OnInit {
  /**
   * AI:
   * Status: "in progress"
   * Type: Widget
   * SubType: Runtime
   * Reason: Customer master table for selection
   */
  masterWidget: WidgetData;

  /**
   * AI:
   * Status: "in progress"
   * Type: Widget
   * SubType: Runtime
   * Reason: Order detail table filtered by selected customer
   */
  detailWidget: WidgetData | null = null;

  selectedId: number | null = null;

  ngOnInit(): void {
    /**
     * AI:
     * Status: "in progress"
     * Type: Widget
     * SubType: Runtime
     * Reason: Customer master table for selection
     */
    this.masterWidget = WidgetFactory.createWidgetTableEntityQl(
      'cr.customer.master.table',
      'Customers',
      'cr.Customer',
      'No customers',
      [],
      [],
      false
    );
  }

  handleMasterSelect(event: ObjectIdentifierData): void {
    this.selectedId = event.objectId;

    // ALWAYS clear first
    this.detailWidget = null;

    // Then create new detail widget
    this.createDetailWidget();
  }

  createDetailWidget(): void {
    const filters = [
      FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, this.selectedId)
    ];

    /**
     * AI:
     * Status: "in progress"
     * Type: Widget
     * SubType: Runtime
     * Reason: Order detail table filtered by selected customer
     */
    this.detailWidget = WidgetFactory.createWidgetTableEntityQl(
      'cr.order.by-customer.table',
      'Orders',
      'cr.Order',
      'No orders',
      filters,
      [],
      false
    );

    // Pre-fill foreign key on create
    const prefillFields: WidgetToolbarCreateInterface[] = [
      { fieldName: 'customerId', fieldValue: this.selectedId }
    ];
    this.detailWidget.functionCallbacks =
      WidgetFunctionCallBackCreate.widgetToolbarCreate(prefillFields);
  }
}
```

---

## 8. Event Handling

```typescript
// Component
handleObjectSelect(event: ObjectIdentifierData): void {
  const objectId = event.objectId;
  const objectType = event.objectType;
  const rowData = event.data;

  this.router.navigate(['/customer', objectId]);
}

// Template
<mvs-widget
  [widgetData]="customerWidget"
  (onObjectSelect)="handleObjectSelect($event)"
  (onObjectCreate)="handleCreate($event)">
</mvs-widget>
```

---

## 9. AI Javadoc Format (Required)

```typescript
/**
 * AI:
 * Status: "in progress" | "confirmed"
 * Type: Widget
 * SubType: Runtime | Config | Factory | Service | Model
 * Reason: <Clear, entity-specific and use-case-specific explanation>
 */
```

**Rules:**
- EVERY widget creation MUST have its own AI Javadoc
- Position MUST be directly above the widget creation
- Reason MUST be descriptive (not "created widget" or "updated")

---

## 10. Multiple Widgets Example

```typescript
export class CustomerDashboardComponent implements OnInit {

  /**
   * AI:
   * Status: "in progress"
   * Type: Widget
   * SubType: Runtime
   * Reason: Customer table widget for displaying customer list
   */
  customerWidget: WidgetData;

  /**
   * AI:
   * Status: "in progress"
   * Type: Widget
   * SubType: Runtime
   * Reason: Invoice table widget for displaying invoices
   */
  invoiceWidget: WidgetData;

  /**
   * AI:
   * Status: "in progress"
   * Type: Widget
   * SubType: Runtime
   * Reason: Order history widget for customer orders
   */
  orderWidget: WidgetData;

  ngOnInit(): void {
    /**
     * AI:
     * Status: "in progress"
     * Type: Widget
     * SubType: Runtime
     * Reason: Customer table widget for displaying customer list
     */
    this.customerWidget = WidgetFactory.createWidgetTableEntityQl(
      'cr.customer.list.table',
      'Customers',
      'cr.Customer',
      'No customers found',
      [],
      [],
      false
    );

    /**
     * AI:
     * Status: "in progress"
     * Type: Widget
     * SubType: Runtime
     * Reason: Invoice table widget for displaying invoices
     */
    this.invoiceWidget = WidgetFactory.createWidgetTableEntityQl(
      'bm.invoice.list.table',
      'Invoices',
      'bm.Invoice',
      'No invoices found',
      [],
      [],
      false
    );
  }
}
```

---

## 11. Runtime Component Example

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Custom customer table widget extending base table
 */

import { Component } from '@angular/core';
import { MvsWidgetTableComponent } from '../mvs-widget-table/mvs-widget-table.component';

@Component({
  selector: 'mvs-widget-customer-table',
  templateUrl: './mvs-widget-customer-table.component.html'
})
export class MvsWidgetCustomerTableComponent extends MvsWidgetTableComponent {

  compPostInit(): void {
    super.compPostInit();
    // Custom initialization
  }

  compOnDataLoaded(): void {
    super.compOnDataLoaded();
    // Custom data handling
  }
}
```

---

## 12. Config Component Example

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Config
 * Reason: Configuration component for customer table parameters
 */

import { Component } from '@angular/core';
import { WidgetConfigBaseComponent } from '../widget-config-base.component';

@Component({
  selector: 'mvs-widget-config-customer-table',
  templateUrl: './mvs-widget-config-customer-table.component.html'
})
export class MvsWidgetConfigCustomerTableComponent extends WidgetConfigBaseComponent {

  initComponent(): void {
    // Initialize configuration UI
  }

  refreshInternal(): void {
    // React to parameter changes
  }
}
```

---

## 13. Fixed Parameters Example

```typescript
// Standard parameter (user can override in config)
widget.setParamValue('paging', 25);

// Fixed parameter (user cannot override)
widget.setParam(WidgetDataParam.createFixed('selectionMode', 'single'));
```

---

## Anti-Patterns (NEVER DO)

```typescript
// BAD - Direct instantiation
const widget = new WidgetData();
widget.dataSource = 'entity';

// BAD - Generic alias
'widget1', 'myWidget', 'customerWidget', 'test'

// BAD - Over-configuration
widget.setParamValue('paging', 25);
widget.setParamValue('filter', true);
widget.setParamValue('sorting', true);
// These have defaults - don't set unless needed

// BAD - Missing AI Javadoc
this.widget = WidgetFactory.createWidgetTableEntityQl(...);
// MUST have Javadoc above

// BAD - Single Javadoc for multiple widgets
// Each widget MUST have its own Javadoc
```
