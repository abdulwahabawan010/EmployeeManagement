# Component Guidelines

## Overview

Components are the building blocks of Angular applications. This document defines strict rules for creating and organizing components in the Alpha Frontend application following the modolithic architecture and NgModule pattern.

## File Naming Convention

### Rule
```
<name>.component.ts
<name>.component.html
<name>.component.scss
```

### Requirements
- **Lowercase only**: Use lowercase letters
- **Hyphen separator**: Use hyphens (-) to separate words
- **Three separate files**: TypeScript, HTML, and SCSS
- **`.component.*` extensions**: Always use these specific extensions

### Examples

✅ **CORRECT**
```
customer-list/
  ├── customer-list.component.ts
  ├── customer-list.component.html
  └── customer-list.component.scss

invoice-details/
  ├── invoice-details.component.ts
  ├── invoice-details.component.html
  └── invoice-details.component.scss
```

❌ **WRONG**
```
CustomerList.component.ts               // ❌ PascalCase not allowed
customer_list.component.ts              // ❌ Underscore not allowed
customerList.component.ts               // ❌ camelCase not allowed
customer-list.ts                        // ❌ Missing .component extension
customer-list.component.ts              // ❌ Missing .html and .scss files
```

## Folder Structure

### Location Rules

Components must be organized by type within the `component/` directory:

```
<module-alias>/component/
├── private-components/       # Module-only components
├── protected-components/     # Feature-shared components
├── public-components/        # Cross-feature components
└── object-components/        # Entity display components
```

### Visibility Levels

#### 1. Private Components
**Location**: `component/private-components/`
**Usage**: Only within the same module
**Export**: NEVER exported from module

```
features/feature-bm/bm/component/private-components/
  └── invoice-summary-card/
      ├── invoice-summary-card.component.ts
      ├── invoice-summary-card.component.html
      └── invoice-summary-card.component.scss
```

#### 2. Protected Components
**Location**: `component/protected-components/`
**Usage**: Within the same feature (multiple modules)
**Export**: Exported from module for feature-level sharing

```
features/feature-bm/bm/component/protected-components/
  └── payment-status-badge/
      ├── payment-status-badge.component.ts
      ├── payment-status-badge.component.html
      └── payment-status-badge.component.scss
```

#### 3. Public Components
**Location**: `component/public-components/`
**Usage**: Across different features
**Export**: Exported from module for application-wide sharing

```
features/feature-core/core/component/public-components/
  └── entity-status-indicator/
      ├── entity-status-indicator.component.ts
      ├── entity-status-indicator.component.html
      └── entity-status-indicator.component.scss
```

#### 4. Object Components
**Location**: `component/object-components/`
**Usage**: Display and edit specific entities
**Pattern**: Complex structure with view modes

```
features/feature-bm/bm/component/object-components/
  └── invoice-object-component/
      ├── invoice-object.component.ts          # Wrapper component
      ├── view/
      │   ├── invoice-base.component.ts        # Shared logic
      │   ├── invoice-full/                    # Full view mode
      │   │   ├── invoice-full.component.ts
      │   │   ├── invoice-full.component.html
      │   │   └── invoice-full.component.scss
      │   └── invoice-side/                    # Side panel mode
      │       ├── invoice-side.component.ts
      │       ├── invoice-side.component.html
      │       └── invoice-side.component.scss
      └── shared/                              # Shared sub-components
          ├── invoice-line-items/
          └── invoice-payments/
```

### Dedicated Folder Requirement

**CRITICAL**: Each component MUST be in its own dedicated folder with all three files.

✅ **CORRECT**
```
component/private-components/
  ├── invoice-summary/
  │   ├── invoice-summary.component.ts
  │   ├── invoice-summary.component.html
  │   └── invoice-summary.component.scss
  └── payment-form/
      ├── payment-form.component.ts
      ├── payment-form.component.html
      └── payment-form.component.scss
```

❌ **WRONG**
```
component/private-components/
  ├── invoice-summary.component.ts        // ❌ No dedicated folder
  ├── invoice-summary.component.html      // ❌ Not organized
  ├── invoice-summary.component.scss
  ├── payment-form.component.ts           // ❌ No dedicated folder
  ├── payment-form.component.html
  └── payment-form.component.scss
```

## Component Decorator Configuration

### Required Settings

**CRITICAL**: Components in this project use NgModule architecture, NOT standalone components.

```typescript
@Component({
    selector: 'mvs-invoice-list',
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.scss'],
    standalone: false                            // ✅ CRITICAL: Must be false
})
export class InvoiceListComponent implements OnInit {
    // Component implementation
}
```

### Decorator Properties

#### selector
- **Format**: `mvs-<module-code>-<name>` (kebab-case)
- **Prefix**: Always start with `mvs-`
- **Module code**: Include 2-letter module code
- **Descriptive**: Clear indication of component purpose

✅ **CORRECT**
```typescript
selector: 'mvs-bm-invoice-list'
selector: 'mvs-tm-ticket-details'
selector: 'mvs-cr-customer-card'
```

❌ **WRONG**
```typescript
selector: 'invoice-list'           // ❌ Missing mvs- prefix
selector: 'mvsInvoiceList'         // ❌ camelCase not allowed
selector: 'MVS-INVOICE-LIST'       // ❌ All caps not allowed
selector: 'invoice_list'           // ❌ Underscore not allowed
```

#### templateUrl
- **Relative path**: Use `./` for same directory
- **No inline templates**: Always use separate HTML file

✅ **CORRECT**
```typescript
templateUrl: './invoice-list.component.html'
```

❌ **WRONG**
```typescript
template: `<div>...</div>`         // ❌ Inline template not allowed
templateUrl: 'invoice-list.html'   // ❌ Missing ./ and .component
```

#### styleUrls
- **Array format**: Even for single file
- **Relative path**: Use `./` for same directory
- **No inline styles**: Always use separate SCSS file

✅ **CORRECT**
```typescript
styleUrls: ['./invoice-list.component.scss']
```

❌ **WRONG**
```typescript
styles: [`.list { }`]              // ❌ Inline styles not allowed
styleUrls: ['invoice-list.scss']   // ❌ Missing ./ and .component
styleUrl: './invoice-list.component.scss'  // ❌ Wrong property (styleUrl vs styleUrls)
```

#### standalone
- **Value**: MUST be `false`
- **Required**: This is CRITICAL for NgModule architecture

✅ **CORRECT**
```typescript
standalone: false
```

❌ **WRONG**
```typescript
standalone: true                   // ❌ Violates NgModule architecture
// Missing standalone property      // ❌ Must be explicitly set
```

## Component Class Structure

### Basic Component Pattern

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

/**
 * Displays a list of invoices with filtering and sorting.
 */
@Component({
    selector: 'mvs-bm-invoice-list',
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.scss'],
    standalone: false
})
export class InvoiceListComponent implements OnInit, OnDestroy {

    // State properties
    busy: boolean = false;
    initialized: boolean = false;

    // Data properties
    invoices: InvoiceDto[] = [];
    totalCount: number = 0;

    // Input/Output properties (if applicable)
    @Input() customerId?: number;
    @Output() invoiceSelected = new EventEmitter<InvoiceDto>();

    constructor(
        private invoiceService: InvoiceService
    ) { }

    ngOnInit(): void {
        this.initComponent();
    }

    ngOnDestroy(): void {
        // Cleanup subscriptions
    }

    /**
     * Initialize component and load data
     */
    private initComponent(): void {
        this.busy = true;

        this.invoiceService.list(this.buildRequest()).subscribe(
            invoices => {
                this.invoices = invoices;
                this.initialized = true;
                this.busy = false;
            },
            error => {
                console.error('Failed to load invoices', error);
                this.busy = false;
            }
        );
    }

    /**
     * Build request for invoice list
     */
    private buildRequest(): ObjectRequestList {
        const request = new ObjectRequestList();
        if (this.customerId) {
            request.filters = [
                FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, this.customerId)
            ];
        }
        return request;
    }

    /**
     * Handle invoice selection
     */
    onInvoiceClick(invoice: InvoiceDto): void {
        this.invoiceSelected.emit(invoice);
    }
}
```

### Class Naming Rules

- **PascalCase**: Use PascalCase for class names
- **Component suffix**: Always end with `Component`
- **Descriptive**: Name should match selector and purpose

✅ **CORRECT**
```typescript
export class InvoiceListComponent { }
export class PaymentFormComponent { }
export class CustomerDetailsComponent { }
```

❌ **WRONG**
```typescript
export class invoiceList { }              // ❌ lowercase
export class InvoiceList { }              // ❌ Missing Component suffix
export class InvoiceListComp { }          // ❌ Abbreviated suffix
export class InvoiceListCmp { }           // ❌ Abbreviated suffix
```

## Base Class Inheritance

Components should extend appropriate base classes when applicable:

### ObjectBaseComponent

For components that display entities:

```typescript
import { Component } from '@angular/core';
import { ObjectBaseComponent } from '@features/core/shared/object/mvs-object-base/object-base.component';

@Component({
    selector: 'mvs-bm-invoice-object',
    templateUrl: './invoice-object.component.html',
    styleUrls: ['./invoice-object.component.scss'],
    standalone: false
})
export class InvoiceObjectComponent extends ObjectBaseComponent {

    constructor() {
        super();
    }

    /**
     * Called when object data changes
     */
    protected override onObjectChanged(): void {
        // Handle object changes
    }
}
```

### ObjectBaseModeComponent

For components with multiple view modes:

```typescript
import { Component } from '@angular/core';
import { ObjectBaseModeComponent } from '@features/core/shared/object/mvs-object-base/object-base-mode.component';

@Component({
    selector: 'mvs-bm-invoice-full',
    templateUrl: './invoice-full.component.html',
    styleUrls: ['./invoice-full.component.scss'],
    standalone: false
})
export class InvoiceFullComponent extends ObjectBaseModeComponent {

    constructor() {
        super();
    }

    protected override onObjectChanged(): void {
        // Handle object changes specific to full view
    }
}
```

## Lifecycle Hooks

### Required Lifecycle Interfaces

Implement appropriate lifecycle interfaces:

```typescript
export class MyComponent implements OnInit, OnChanges, OnDestroy {

    ngOnInit(): void {
        // Component initialization
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.initialized) return;
        // Handle input changes
    }

    ngOnDestroy(): void {
        // Cleanup
    }
}
```

### Initialization Pattern

```typescript
export class MyComponent implements OnInit, OnChanges {

    busy: boolean = false;
    initialized: boolean = false;

    ngOnInit(): void {
        this.initComponent();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Guard against processing changes before initialization
        if (!this.initialized) return;

        // Safe to process changes
        this.refreshComponent();
    }

    private initComponent(): void {
        this.busy = true;

        // Initialization logic
        this.loadData();

        this.initialized = true;
        this.busy = false;
    }

    private refreshComponent(): void {
        // Refresh logic when inputs change
    }
}
```

## Module Registration

**CRITICAL**: Components MUST be declared in their module's `@NgModule` decorator.

```typescript
// bm.module.ts
@NgModule({
    declarations: [
        InvoiceListComponent,      // ✅ Declared
        InvoiceDetailsComponent,   // ✅ Declared
        PaymentFormComponent,      // ✅ Declared
        // ... all components
    ],
    exports: [
        // Only export protected and public components
        PaymentStatusBadgeComponent,  // Protected component
        EntityStatusIndicatorComponent // Public component
        // Do NOT export private components
    ],
    imports: [
        CommonModule,
        // ... other modules
    ]
})
export class BmModule { }
```

### Export Rules

| Component Type | Export in Module | Usage |
|---------------|------------------|-------|
| Private | ❌ NEVER | Same module only |
| Protected | ✅ YES | Same feature |
| Public | ✅ YES | All features |
| Object | ❌ Typically NO | Loaded dynamically |

## CSS Guidelines

### Custom CSS Rules

1. **Avoid Custom CSS**: Use PrimeNG components and PrimeFlex utilities
2. **Module-Prefixed Classes**: If custom CSS needed, prefix with module code
3. **BEM Naming**: Follow BEM (Block-Element-Modifier) convention

```scss
// ✅ CORRECT - Module-prefixed classes
.bm-invoice-card {
    // Block
}

.bm-invoice-card__header {
    // Element
}

.bm-invoice-card__header--highlight {
    // Modifier
}

// ❌ WRONG - Generic classes without prefix
.invoice-card {
    // Missing module prefix
}

.card {
    // Too generic, missing prefix
}
```

### PrimeFlex Usage (Preferred)

```html
<!-- ✅ CORRECT - Use PrimeFlex utilities -->
<div class="flex flex-column gap-2">
    <div class="p-3 border-round surface-card">
        Content
    </div>
</div>

<!-- ❌ WRONG - Custom CSS when PrimeFlex available -->
<div class="bm-custom-flex-column">
    <div class="bm-custom-card">
        Content
    </div>
</div>
```

## Validation Checklist

When creating a component, verify:

- [ ] Three separate files: `.ts`, `.html`, `.scss`
- [ ] Files are lowercase with hyphens
- [ ] Component in dedicated folder: `<name>/<name>.component.*`
- [ ] Located in correct visibility folder
- [ ] Selector uses `mvs-<module>-<name>` format
- [ ] `standalone: false` in decorator
- [ ] `templateUrl` points to separate HTML file
- [ ] `styleUrls` array points to separate SCSS file
- [ ] Class name is PascalCase with `Component` suffix
- [ ] Extends appropriate base class (if applicable)
- [ ] Implements lifecycle interfaces
- [ ] Declared in module's `declarations` array
- [ ] Exported if protected/public (not if private)
- [ ] JSDoc comments added
- [ ] No inline templates or styles

## Anti-Patterns to Avoid

### ❌ Inline Template

```typescript
// ❌ WRONG
@Component({
    selector: 'mvs-invoice-list',
    template: `
        <div>
            <h2>Invoices</h2>
            <!-- More HTML -->
        </div>
    `,
    standalone: false
})
```

✅ **CORRECT**: Use separate HTML file

### ❌ Inline Styles

```typescript
// ❌ WRONG
@Component({
    selector: 'mvs-invoice-list',
    templateUrl: './invoice-list.component.html',
    styles: [`
        .list { display: flex; }
        .item { padding: 10px; }
    `],
    standalone: false
})
```

✅ **CORRECT**: Use separate SCSS file

### ❌ Standalone Component

```typescript
// ❌ WRONG
@Component({
    selector: 'mvs-invoice-list',
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.scss'],
    standalone: true  // ❌ This project uses NgModules
})
```

✅ **CORRECT**: Use `standalone: false`

### ❌ No Dedicated Folder

```
component/
  ├── invoice-list.component.ts   // ❌ Not in folder
  ├── invoice-list.component.html
  └── invoice-list.component.scss
```

✅ **CORRECT**: Create dedicated folder

### ❌ Missing Module Declaration

```typescript
// ❌ WRONG - Component created but not declared in module
@NgModule({
    declarations: [
        // InvoiceListComponent missing!
    ]
})
```

✅ **CORRECT**: Declare all components

## Common Component Patterns

### 1. Simple Display Component

```typescript
@Component({
    selector: 'mvs-bm-invoice-summary',
    templateUrl: './invoice-summary.component.html',
    styleUrls: ['./invoice-summary.component.scss'],
    standalone: false
})
export class InvoiceSummaryComponent {
    @Input() invoice: InvoiceDto;

    get formattedAmount(): string {
        return this.invoice?.totalAmount?.toFixed(2) || '0.00';
    }
}
```

### 2. List Component with Service

```typescript
@Component({
    selector: 'mvs-bm-invoice-list',
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.scss'],
    standalone: false
})
export class InvoiceListComponent implements OnInit {
    invoices: InvoiceDto[] = [];
    busy: boolean = false;

    constructor(private invoiceService: InvoiceService) { }

    ngOnInit(): void {
        this.loadInvoices();
    }

    private loadInvoices(): void {
        this.busy = true;
        this.invoiceService.list(new ObjectRequestList()).subscribe(
            invoices => {
                this.invoices = invoices;
                this.busy = false;
            }
        );
    }
}
```

### 3. Form Component with Validation

```typescript
@Component({
    selector: 'mvs-bm-payment-form',
    templateUrl: './payment-form.component.html',
    styleUrls: ['./payment-form.component.scss'],
    standalone: false
})
export class PaymentFormComponent implements OnInit {
    @Input() invoiceId: number;
    @Output() paymentSubmitted = new EventEmitter<PaymentDto>();

    paymentForm: FormGroup;

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.paymentForm = this.fb.group({
            amount: ['', Validators.required],
            method: ['', Validators.required],
            date: [new Date(), Validators.required]
        });
    }

    onSubmit(): void {
        if (this.paymentForm.valid) {
            const payment = this.paymentForm.value;
            this.paymentSubmitted.emit(payment);
        }
    }
}
```

## Summary

**Key Takeaways**:
1. Three separate files: `.ts`, `.html`, `.scss`
2. Lowercase with hyphens: `<name>.component.*`
3. Dedicated folder per component
4. Visibility levels: private, protected, public, object
5. `standalone: false` (NgModule architecture)
6. Selector: `mvs-<module>-<name>` format
7. PascalCase class names with `Component` suffix
8. Declare in module's `declarations` array
9. Export only protected/public components
10. Comprehensive JSDoc documentation

Following these guidelines ensures maintainable, consistent, and architecturally compliant component development.
