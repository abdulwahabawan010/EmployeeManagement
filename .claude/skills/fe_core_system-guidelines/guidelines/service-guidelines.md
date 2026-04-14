# Service Guidelines

## Overview

Services in Angular are injectable classes that provide specific functionality, typically for data access, business logic, or cross-cutting concerns. This document defines strict rules for creating and organizing services in the Alpha Frontend application.

## File Naming Convention

### Rule
```
<name>.service.ts
```

### Requirements
- **Lowercase only**: Use lowercase letters
- **Hyphen separator**: Use hyphens (-) to separate words
- **`.service.ts` extension**: Always use this specific extension
- **Descriptive names**: Should clearly indicate the service's purpose
- **Important Note**:Frontend API services must use the exact backend controller api route path when creating new service.

### Examples

✅ **CORRECT**
```
customer.service.ts
invoice.service.ts
payment-processing.service.ts
ticket-notification.service.ts
user-authentication.service.ts
```

❌ **WRONG**
```
CustomerService.ts          // ❌ PascalCase not allowed
customer_service.ts         // ❌ Underscore not allowed
customerService.ts          // ❌ camelCase not allowed
customer.ts                 // ❌ Missing .service extension
CustomerSvc.ts              // ❌ Wrong naming and extension
```

## Folder Structure

### Location Rules

Services must be placed in one of two categories based on their purpose:

```
<module-alias>/service/
├── api/                    # CRUD and API services
└── domain/                 # Business logic and UI services
```

### API Services

**Location**: `service/api/`
**Purpose**: CRUD operations and backend API communication
**Base Class**: `MvsCrudService` or `MvsHttpGeneric`
**Naming**: Entity name + `.service.ts`

```
features/feature-bm/bm/service/api/
  ├── invoice/
  │   └── invoice.service.ts
  ├── payment/
  │   └── payment.service.ts
  └── customer/
      └── customer.service.ts
```

### Domain/UI Services

**Location**: `service/domain/` (or `service/ui/`)
**Purpose**: Business logic, UI state management, utility functions
**Base Class**: Optional (plain service or extends specific base)
**Naming**: Descriptive name + `.service.ts`

```
features/feature-bm/bm/service/domain/
  ├── invoice-calculation/
  │   └── invoice-calculation.service.ts
  ├── payment-processing/
  │   └── payment-processing.service.ts
  └── notification/
      └── notification.service.ts
```

### Dedicated Folder Requirement

**CRITICAL**: Each service MUST be in its own dedicated folder.

✅ **CORRECT**
```
service/api/
  ├── customer/
  │   └── customer.service.ts
  ├── invoice/
  │   └── invoice.service.ts
  └── payment/
      └── payment.service.ts
```

❌ **WRONG**
```
service/api/
  ├── customer.service.ts     // ❌ No dedicated folder
  ├── invoice.service.ts      // ❌ No dedicated folder
  └── payment.service.ts      // ❌ No dedicated folder
```

## Service Class Structure

### Injectable Decorator

**CRITICAL**: All services MUST use `@Injectable({ providedIn: 'root' })`

```typescript
@Injectable({
    providedIn: 'root'
})
export class CustomerService extends MvsCrudService {
    // Service implementation
}
```

### Class Naming Rules

- **PascalCase**: Use PascalCase for class names
- **Service suffix**: Always end with `Service`
- **Descriptive**: Name should clearly indicate functionality

✅ **CORRECT**
```typescript
export class CustomerService extends MvsCrudService { }
export class InvoiceCalculationService { }
export class PaymentProcessingService { }
```

❌ **WRONG**
```typescript
export class customer extends MvsCrudService { }      // ❌ lowercase
export class Customer extends MvsCrudService { }      // ❌ Missing Service suffix
export class CustomerSvc extends MvsCrudService { }   // ❌ Abbreviated suffix
export class CustomerAPI extends MvsCrudService { }   // ❌ Wrong suffix
```

## CRUD Service Pattern

### Basic CRUD Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MvsCrudService } from '@features/core/shared/service/crud/mvs-crud.service';
import { Type } from '@angular/core';
import { CustomerDto } from '../../model/dto/entity/customer/customer.dto';
import { CustomerObjectComponent } from '../../component/object-components/customer-object-component/customer-object.component';
import { MvsCrudModeEnum } from '@features/core/shared/service/crud/mvs-crud-mode.enum';

/**
 * CRUD service for Customer entity operations.
 * Provides standard CRUD methods and custom business operations.
 */
@Injectable({
    providedIn: 'root'
})
export class CustomerService extends MvsCrudService {

    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/bm/customers');
    }

    /**
     * Returns the component to display for this entity
     * @param mode - CRUD mode (create/update/view)
     */
    getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
        if (mode !== MvsCrudModeEnum.create) {
            return CustomerObjectComponent;
        }
        return null;
    }
}
```

### Key Components

1. **Injectable Decorator**
```typescript
@Injectable({
    providedIn: 'root'  // Service is singleton
})
```

2. **Base Class Extension**
```typescript
export class CustomerService extends MvsCrudService {
    // Inherits all CRUD methods
}
```

3. **Constructor**
```typescript
constructor(protected http: HttpClient) {
    super(http, MvsCrudService.baseUrl + '/bm/customers');
    //                                    ^^^^^^^^^^^^
    //                                    API endpoint path
}
```

4. **getObjectComponent Method**
```typescript
getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
    if (mode !== MvsCrudModeEnum.create) {
        return CustomerObjectComponent;  // Component to display entity
    }
    return null;  // No component for create mode (use form instead)
}
```

### Inherited CRUD Methods

When extending `MvsCrudService`, you automatically get:

```typescript
// Fetch single entity
get(id: number): Observable<CustomerDto>

// Fetch single entity (light - without resolved entities)
getLight(id: number): Observable<CustomerDto>

// List entities with filtering/sorting/paging
list(request: ObjectRequestList): Observable<CustomerDto[]>

// List by specific attribute
listByAttribute(attribute: string, value: any, sorting?: Sorting[]): Observable<CustomerDto[]>

// Get single entity by attribute
getByAttribute(attribute: string, value: any): Observable<CustomerDto>

// Search by name pattern
search(value: string): Observable<CustomerDto[]>

// Create new entity
create(dto: CustomerDto): Observable<CustomerDto>

// Update existing entity
update(dto: CustomerDto): Observable<CustomerDto>

// Delete entity
delete(id: number): Observable<void>

// Get entity history
history(request: ObjectRequestList): Observable<any[]>
```

### Custom Methods

Add custom business methods after inherited methods:

```typescript
@Injectable({
    providedIn: 'root'
})
export class InvoiceService extends MvsCrudService {

    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/bm/invoices');
    }

    getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
        if (mode !== MvsCrudModeEnum.create) {
            return InvoiceObjectComponent;
        }
        return null;
    }

    /**
     * Mark invoice as paid
     * @param invoiceId - Invoice ID
     * @param paymentDate - Payment date
     */
    markAsPaid(invoiceId: number, paymentDate: Date): Observable<InvoiceDto> {
        return this.http.post<InvoiceDto>(
            `${this.baseUrl}/${invoiceId}/mark-paid`,
            { paymentDate }
        );
    }

    /**
     * Generate PDF for invoice
     * @param invoiceId - Invoice ID
     */
    generatePdf(invoiceId: number): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/${invoiceId}/pdf`,
            { responseType: 'blob' }
        );
    }

    /**
     * Send invoice via email
     * @param invoiceId - Invoice ID
     * @param email - Recipient email
     */
    sendByEmail(invoiceId: number, email: string): Observable<void> {
        return this.http.post<void>(
            `${this.baseUrl}/${invoiceId}/send-email`,
            { email }
        );
    }
}
```

## Domain/UI Service Pattern

### Business Logic Service

```typescript
import { Injectable } from '@angular/core';

/**
 * Service for invoice calculation logic.
 * Handles tax calculations, discounts, and totals.
 */
@Injectable({
    providedIn: 'root'
})
export class InvoiceCalculationService {

    /**
     * Calculate total amount including tax
     * @param subtotal - Subtotal before tax
     * @param taxRate - Tax rate as decimal (e.g., 0.19 for 19%)
     */
    calculateTotal(subtotal: number, taxRate: number): number {
        const taxAmount = subtotal * taxRate;
        return subtotal + taxAmount;
    }

    /**
     * Calculate tax amount
     * @param subtotal - Subtotal before tax
     * @param taxRate - Tax rate as decimal
     */
    calculateTax(subtotal: number, taxRate: number): number {
        return subtotal * taxRate;
    }

    /**
     * Apply discount to amount
     * @param amount - Original amount
     * @param discountPercent - Discount percentage (e.g., 10 for 10%)
     */
    applyDiscount(amount: number, discountPercent: number): number {
        const discountAmount = amount * (discountPercent / 100);
        return amount - discountAmount;
    }

    /**
     * Calculate due date based on payment terms
     * @param issueDate - Invoice issue date
     * @param paymentTermDays - Payment terms in days
     */
    calculateDueDate(issueDate: Date, paymentTermDays: number): Date {
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + paymentTermDays);
        return dueDate;
    }
}
```

### UI State Management Service

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service for managing invoice filter state across components.
 */
@Injectable({
    providedIn: 'root'
})
export class InvoiceFilterService {

    private _filters = new BehaviorSubject<InvoiceFilters>({
        status: null,
        dateFrom: null,
        dateTo: null,
        customerId: null
    });

    /**
     * Observable stream of current filters
     */
    filters$: Observable<InvoiceFilters> = this._filters.asObservable();

    /**
     * Get current filter values
     */
    getFilters(): InvoiceFilters {
        return this._filters.getValue();
    }

    /**
     * Update filter values
     * @param filters - New filter values
     */
    setFilters(filters: InvoiceFilters): void {
        this._filters.next(filters);
    }

    /**
     * Reset filters to default values
     */
    resetFilters(): void {
        this._filters.next({
            status: null,
            dateFrom: null,
            dateTo: null,
            customerId: null
        });
    }

    /**
     * Update specific filter property
     * @param key - Filter property key
     * @param value - New value
     */
    updateFilter(key: keyof InvoiceFilters, value: any): void {
        const currentFilters = this.getFilters();
        this._filters.next({
            ...currentFilters,
            [key]: value
        });
    }
}

interface InvoiceFilters {
    status: string | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    customerId: number | null;
}
```

## Entity Provider Registration

**CRITICAL**: All CRUD services MUST be registered in the module's entity provider.

**File**: `<module-alias>.entity-provider.ts`

```typescript
import { ENTITY_SERVICE_REGISTRY } from '@features/core/shared/dto/dto-service/entity-service-registry';
import { CustomerService } from './service/api/customer/customer.service';
import { InvoiceService } from './service/api/invoice/invoice.service';
import { PaymentService } from './service/api/payment/payment.service';

export const BM_ENTITY_PROVIDER = [
    {
        provide: ENTITY_SERVICE_REGISTRY,
        useValue: [
            ['bm.Customer', { route: 'about:blank', service: CustomerService }],
            ['bm.Invoice', { route: 'about:blank', service: InvoiceService }],
            ['bm.Payment', { route: 'about:blank', service: PaymentService }],
        ],
        multi: true
    }
];
```

**Key Points**:
- Entity type format: `<module>.<EntityName>` (e.g., `bm.Customer`)
- Route can be actual route or `'about:blank'` for dynamic loading
- Service must be the class reference (not string)
- Register in module's `providers` array

## Documentation Requirements

### Service-Level Documentation

```typescript
/**
 * CRUD service for Invoice entity operations.
 *
 * Provides standard CRUD methods for invoice management plus:
 * - PDF generation
 * - Email delivery
 * - Payment marking
 * - Status tracking
 *
 * @see InvoiceDto
 * @see InvoiceObjectComponent
 */
@Injectable({
    providedIn: 'root'
})
export class InvoiceService extends MvsCrudService {
    // Implementation
}
```

### Method-Level Documentation

```typescript
/**
 * Generate PDF document for the specified invoice.
 *
 * @param invoiceId - ID of the invoice to generate PDF for
 * @returns Observable<Blob> - PDF document as binary blob
 * @throws HttpErrorResponse if invoice not found or generation fails
 *
 * @example
 * ```typescript
 * this.invoiceService.generatePdf(123).subscribe(
 *     blob => {
 *         const url = window.URL.createObjectURL(blob);
 *         window.open(url);
 *     },
 *     error => console.error('PDF generation failed', error)
 * );
 * ```
 */
generatePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(
        `${this.baseUrl}/${invoiceId}/pdf`,
        { responseType: 'blob' }
    );
}
```

## Validation Checklist

When creating a service, verify:

- [ ] File name is lowercase with hyphens: `<name>.service.ts`
- [ ] Service is in dedicated folder: `<name>/<name>.service.ts`
- [ ] Located in correct category: `api/` or `domain/`
- [ ] Class name is PascalCase with `Service` suffix
- [ ] Uses `@Injectable({ providedIn: 'root' })`
- [ ] CRUD services extend `MvsCrudService`
- [ ] Constructor properly initializes base class with API endpoint
- [ ] `getObjectComponent()` method implemented for CRUD services
- [ ] JSDoc comments added for class and methods
- [ ] Export keyword is present
- [ ] Registered in entity provider (for CRUD services)
- [ ] No other code in the file (service class only)

## Import Patterns

### Importing Services

```typescript
// In component
import { CustomerService } from '@features/feature-bm/bm/service/api/customer/customer.service';

@Component({
    selector: 'mvs-customer-list',
    templateUrl: './customer-list.component.html'
})
export class CustomerListComponent implements OnInit {

    constructor(
        private customerService: CustomerService
    ) { }

    ngOnInit(): void {
        this.customerService.list(request).subscribe(customers => {
            // Handle customers
        });
    }
}
```

### Service Dependencies

```typescript
@Injectable({
    providedIn: 'root'
})
export class InvoiceProcessingService {

    constructor(
        private invoiceService: InvoiceService,
        private paymentService: PaymentService,
        private notificationService: NotificationService,
        private calculationService: InvoiceCalculationService
    ) { }

    // Service methods using injected dependencies
}
```

## Anti-Patterns to Avoid

### ❌ Missing Injectable Decorator

```typescript
// ❌ WRONG
export class CustomerService extends MvsCrudService { }
```

✅ **CORRECT**
```typescript
@Injectable({
    providedIn: 'root'
})
export class CustomerService extends MvsCrudService { }
```

### ❌ Wrong providedIn Value

```typescript
// ❌ WRONG
@Injectable({
    providedIn: 'any'  // or null, or module reference
})
```

✅ **CORRECT**
```typescript
@Injectable({
    providedIn: 'root'  // Always use 'root' for services
})
```

### ❌ Multiple Services in One File

```typescript
// ❌ WRONG
export class CustomerService extends MvsCrudService { }
export class InvoiceService extends MvsCrudService { }
```

✅ **CORRECT**: Separate files for each service

### ❌ Incorrect Base URL Construction

```typescript
// ❌ WRONG
constructor(protected http: HttpClient) {
    super(http, '/api/bm/customers');  // Missing baseUrl prefix
}
```

✅ **CORRECT**
```typescript
constructor(protected http: HttpClient) {
    super(http, MvsCrudService.baseUrl + '/bm/customers');
}
```

### ❌ Missing Entity Provider Registration

```typescript
// ❌ WRONG - Service created but not registered
// Results in runtime errors when trying to load entity
```

✅ **CORRECT**: Always register in entity provider

## Common Service Patterns

### 1. Simple CRUD Service

```typescript
@Injectable({ providedIn: 'root' })
export class TagService extends MvsCrudService {
    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/core/tags');
    }

    getObjectComponent(mode: MvsCrudModeEnum): Type<any> {
        return mode !== MvsCrudModeEnum.create ? TagObjectComponent : null;
    }
}
```

### 2. CRUD Service with Custom Methods

```typescript
@Injectable({ providedIn: 'root' })
export class TicketService extends MvsCrudService {
    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/tm/tickets');
    }

    getObjectComponent(mode: MvsCrudModeEnum): Type<any> {
        return mode !== MvsCrudModeEnum.create ? TicketObjectComponent : null;
    }

    assign(ticketId: number, userId: number): Observable<TicketDto> {
        return this.http.post<TicketDto>(
            `${this.baseUrl}/${ticketId}/assign`,
            { userId }
        );
    }

    close(ticketId: number, resolution: string): Observable<TicketDto> {
        return this.http.post<TicketDto>(
            `${this.baseUrl}/${ticketId}/close`,
            { resolution }
        );
    }
}
```

### 3. Utility/Helper Service

```typescript
@Injectable({ providedIn: 'root' })
export class DateUtilityService {

    formatDate(date: Date, format: string): string {
        // Implementation
    }

    parseDate(dateString: string): Date {
        // Implementation
    }

    addDays(date: Date, days: number): Date {
        // Implementation
    }
}
```

### 4. State Management Service

```typescript
@Injectable({ providedIn: 'root' })
export class AppStateService {
    private _currentUser = new BehaviorSubject<UserDto | null>(null);
    currentUser$ = this._currentUser.asObservable();

    setCurrentUser(user: UserDto): void {
        this._currentUser.next(user);
    }

    getCurrentUser(): UserDto | null {
        return this._currentUser.getValue();
    }
}
```

## Summary

**Key Takeaways**:
1. Lowercase file names with hyphens: `<name>.service.ts`
2. Dedicated folder per service
3. Two main categories: `api/` and `domain/`
4. PascalCase class names with `Service` suffix
5. Always use `@Injectable({ providedIn: 'root' })`
6. CRUD services extend `MvsCrudService`
7. Implement `getObjectComponent()` for CRUD services
8. Register CRUD services in entity provider
9. Comprehensive JSDoc documentation
10. One service per file

Following these guidelines ensures maintainable, type-safe, and consistent service implementation across the entire application.
