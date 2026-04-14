# CRUD Object Component Usage Patterns

This document contains detailed code patterns for common CRUD Object Component use cases.

## Pattern 1: Create New Object (Simple)

Use this pattern when creating a standalone create page for an entity.

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: CreatePage
 * Reason: Created Customer creation page using CRUD Object Component for new customer registration
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: 'customer-create-page',
  templateUrl: './customer-create-page.component.html',
  styleUrls: ['./customer-create-page.component.scss'],
  standalone: false
})
export class CustomerCreatePageComponent {

  constructor(private router: Router) {}

  handleCustomerCreated(event: ObjectChangeInformation): void {
    if (event.action === ObjectChangeInformationActionEnum.created) {
      this.router.navigate(['/customer', event.after.id]);
    }
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: CreatePage
  Reason: Customer creation page using CRUD Object Component for new customer registration
-->

<div class="page-container">
  <h2>Create Customer</h2>

  <!-- AI: CRUD Object Component for Customer creation -->
  <mvs-crud-object
    [objectType]="'cr.Customer'"
    (onChangedObject)="handleCustomerCreated($event)">
  </mvs-crud-object>
</div>
```

---

## Pattern 2: Edit Existing Object

Use this pattern when creating an edit page that receives an ID from the route.

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: EditPage
 * Reason: Created Customer edit page using CRUD Object Component with navigation guard for unsaved changes
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: 'customer-edit-page',
  templateUrl: './customer-edit-page.component.html',
  styleUrls: ['./customer-edit-page.component.scss'],
  standalone: false
})
export class CustomerEditPageComponent implements OnInit {

  customerId: number;
  formDirty: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.customerId = +this.route.snapshot.params['id'];
  }

  handleCustomerUpdated(event: ObjectChangeInformation): void {
    switch (event.action) {
      case ObjectChangeInformationActionEnum.updated:
        console.log('Customer updated');
        this.formDirty = false;
        break;

      case ObjectChangeInformationActionEnum.deleted:
        console.log('Customer deleted');
        this.router.navigate(['/customers']);
        break;
    }
  }

  canDeactivate(): boolean {
    if (this.formDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: EditPage
  Reason: Customer edit page using CRUD Object Component with navigation guard for unsaved changes
-->

<div class="page-container">
  <h2>Edit Customer</h2>

  @if (customerId) {
    <!-- AI: CRUD Object Component for Customer editing -->
    <mvs-crud-object
      [objectType]="'cr.Customer'"
      [objectId]="customerId"
      (onChangedObject)="handleCustomerUpdated($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  }
</div>
```

---

## Pattern 3: Create Child Object with Parent Context

Use this pattern when creating a child entity that needs its parent foreign key pre-filled.

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Component
 * SubType: CrudIntegration
 * Reason: Created Invoice creation component with Customer context for automatic foreign key pre-fill
 */

import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';
import { DtoImportObjectContext } from 'features/core/shared/dto/dto.import.object.context';
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';

@Component({
  selector: 'customer-invoice-create',
  templateUrl: './customer-invoice-create.component.html',
  styleUrls: ['./customer-invoice-create.component.scss'],
  standalone: false
})
export class CustomerInvoiceCreateComponent implements OnInit {

  @Input() customerId: number;

  customerContext: DtoImportObjectContext;
  showCreateInvoice: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (this.customerId) {
      const customerIdentifier = new ObjectIdentifier('cr.Customer', this.customerId);
      this.customerContext = DtoImportObjectContext.createFromObjectIdentifier(customerIdentifier);
    }
  }

  openCreateInvoice(): void {
    this.showCreateInvoice = true;
  }

  handleInvoiceCreated(event: ObjectChangeInformation): void {
    if (event.action === ObjectChangeInformationActionEnum.created) {
      console.log('Invoice created for Customer:', this.customerId);
      this.showCreateInvoice = false;
      // Optionally refresh parent data or widget
    }
  }

  cancelCreate(): void {
    this.showCreateInvoice = false;
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Component
  SubType: CrudIntegration
  Reason: Invoice creation component with Customer context for automatic foreign key pre-fill
-->

<div class="invoice-create-container">
  <button pButton
    label="Create Invoice"
    icon="pi pi-plus"
    (click)="openCreateInvoice()">
  </button>

  @if (showCreateInvoice && customerContext) {
    <div class="create-form-container">
      <!-- AI: CRUD Object Component for Invoice creation with Customer context (customerId pre-filled) -->
      <mvs-crud-object
        [objectType]="'bm.Invoice'"
        [importObjectContext]="customerContext"
        (onChangedObject)="handleInvoiceCreated($event)">
      </mvs-crud-object>

      <button pButton
        label="Cancel"
        class="p-button-secondary"
        (click)="cancelCreate()">
      </button>
    </div>
  }
</div>
```

---

## Pattern 4: Combined Create/Edit Page

Use this pattern when a single page handles both creation (no ID) and editing (with ID).

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: CreateEditPage
 * Reason: Created Contract create/edit page using CRUD Object Component with automatic mode detection
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: 'contract-page',
  templateUrl: './contract-page.component.html',
  styleUrls: ['./contract-page.component.scss'],
  standalone: false
})
export class ContractPageComponent implements OnInit {

  contractId: number | null = null;
  formDirty: boolean = false;
  isCreateMode: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.contractId = +idParam;
      this.isCreateMode = false;
    }
  }

  get pageTitle(): string {
    return this.isCreateMode ? 'Create Contract' : 'Edit Contract';
  }

  handleContractChanged(event: ObjectChangeInformation): void {
    switch (event.action) {
      case ObjectChangeInformationActionEnum.created:
        console.log('Contract created with ID:', event.after.id);
        // Navigate to edit mode with new ID
        this.router.navigate(['/contract', event.after.id]);
        break;

      case ObjectChangeInformationActionEnum.updated:
        console.log('Contract updated');
        this.formDirty = false;
        break;

      case ObjectChangeInformationActionEnum.deleted:
        console.log('Contract deleted');
        this.router.navigate(['/contracts']);
        break;
    }
  }

  canDeactivate(): boolean {
    if (this.formDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: CreateEditPage
  Reason: Contract combined create/edit page using CRUD Object Component with automatic mode detection
-->

<div class="page-container">
  <h2>{{ pageTitle }}</h2>

  @if (isCreateMode) {
    <!-- AI: CRUD Object Component for Contract creation (create mode) -->
    <mvs-crud-object
      [objectType]="'cm.Contract'"
      (onChangedObject)="handleContractChanged($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  } @else if (contractId) {
    <!-- AI: CRUD Object Component for Contract editing (edit mode) -->
    <mvs-crud-object
      [objectType]="'cm.Contract'"
      [objectId]="contractId"
      (onChangedObject)="handleContractChanged($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  }
</div>
```

---

## Pattern 5: Create with Default Values

Use this pattern when creating an entity with pre-populated default values.

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: CreatePage
 * Reason: Created Invoice creation page with pre-filled default values for date and status
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';
import { DtoDetail } from 'features/core/shared/dto/dto.detail';

@Component({
  selector: 'invoice-create-page',
  templateUrl: './invoice-create-page.component.html',
  styleUrls: ['./invoice-create-page.component.scss'],
  standalone: false
})
export class InvoiceCreatePageComponent implements OnInit {

  defaultInvoice: DtoDetail;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.defaultInvoice = new DtoDetail();
    this.defaultInvoice.invoiceDate = new Date();
    this.defaultInvoice.dueDate = this.calculateDueDate();
    this.defaultInvoice.status = 'draft';
  }

  calculateDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  handleInvoiceCreated(event: ObjectChangeInformation): void {
    if (event.action === ObjectChangeInformationActionEnum.created) {
      this.router.navigate(['/invoice', event.after.id]);
    }
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: CreatePage
  Reason: Invoice creation page with pre-filled default values for date and status
-->

<div class="page-container">
  <h2>Create Invoice</h2>

  @if (defaultInvoice) {
    <!-- AI: CRUD Object Component for Invoice creation with default values -->
    <mvs-crud-object
      [objectType]="'bm.Invoice'"
      [defaultCreateDto]="defaultInvoice"
      (onChangedObject)="handleInvoiceCreated($event)">
    </mvs-crud-object>
  }
</div>
```

---

## Pattern 6: CRUD in ObjectBaseComponent Page

Use this pattern when a page extends ObjectBaseComponent but also needs CRUD editing capability.

### TypeScript

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: EditPage
 * Reason: Customer detail page combining ObjectBaseComponent lifecycle with CRUD Object Component for editing
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';
import { ObjectBaseComponent } from 'features/core/shared/components/object-base.component';

@Component({
  selector: 'customer-detail-page',
  templateUrl: './customer-detail-page.component.html',
  styleUrls: ['./customer-detail-page.component.scss'],
  standalone: false
})
export class CustomerDetailPageComponent extends ObjectBaseComponent implements OnInit {

  selectedTab: number = 0;

  constructor(private router: Router) {
    super();
  }

  onObjectChanged(): void {
    // ObjectBaseComponent hook - customer loaded
    this.setPageTitle(`${this.dto.name} - Customer`);
  }

  handleCustomerChanged(event: ObjectChangeInformation): void {
    // CRUD Object Component event - customer edited/deleted
    switch (event.action) {
      case ObjectChangeInformationActionEnum.updated:
        this.dto = event.after;
        break;

      case ObjectChangeInformationActionEnum.deleted:
        this.router.navigate(['/customers']);
        break;
    }
  }
}
```

### HTML Template

```html
<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: EditPage
  Reason: Customer detail page combining ObjectBaseComponent lifecycle with CRUD Object Component for editing
-->

@if (initialized && dto) {
  <div class="customer-detail">
    <h2>{{ dto.name }}</h2>

    <p-tabs [(value)]="selectedTab">
      <p-tablist>
        <p-tab [value]="0">Details</p-tab>
        <p-tab [value]="1">Invoices</p-tab>
      </p-tablist>
      <p-tabpanels>
        <p-tabpanel [value]="0">
          <!-- AI: CRUD Object Component for Customer editing in detail view -->
          <mvs-crud-object
            [objectType]="'cr.Customer'"
            [objectId]="dto.id"
            (onChangedObject)="handleCustomerChanged($event)">
          </mvs-crud-object>
        </p-tabpanel>

        <p-tabpanel [value]="1">
          <!-- Related data using widgets -->
          <mvs-widget [widgetData]="invoicesWidget"></mvs-widget>
        </p-tabpanel>
      </p-tabpanels>
    </p-tabs>
  </div>
}
```
