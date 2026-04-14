# Naming Guidelines

Rules governing file, class, variable, and method naming conventions.

---

## NAME-001: File Naming Convention

**Level:** AUTO-CHECKABLE

Files must use kebab-case with appropriate suffix.

### DO

```
customer-list.component.ts
customer.service.ts
customer-status.enum.ts
customer.interface.ts
customer-dto.ts
customer.pipe.ts
customer.directive.ts
customer.guard.ts
customer.resolver.ts
```

### DO NOT

```
CustomerList.component.ts      // PascalCase file name
customerList.component.ts      // camelCase file name
customer_list.component.ts     // snake_case file name
customerlistcomponent.ts       // No separators
```

---

## NAME-002: Component Class Naming

**Level:** AUTO-CHECKABLE

Component classes must use PascalCase and end with `Component`.

### DO

```typescript
export class CustomerListComponent {}
export class OrderDetailComponent {}
export class DashboardOverviewComponent {}
```

### DO NOT

```typescript
export class CustomerList {}           // Missing Component suffix
export class customerListComponent {}  // camelCase
export class Customer_List_Component {} // snake_case
```

---

## NAME-003: Service Class Naming

**Level:** AUTO-CHECKABLE

Service classes must use PascalCase and end with `Service`.

### DO

```typescript
export class CustomerService {}
export class OrderApiService {}
export class AuthenticationService {}
```

### DO NOT

```typescript
export class Customer {}           // Missing Service suffix
export class CustomerSvc {}        // Abbreviated suffix
export class customerService {}    // camelCase
```

---

## NAME-004: Enum Naming

**Level:** AUTO-CHECKABLE

Enums must use PascalCase and end with `Enum`.

### DO

```typescript
export enum CustomerStatusEnum {
    Active = 'active',
    Inactive = 'inactive'
}

export enum OrderTypeEnum {
    Standard = 'standard',
    Express = 'express'
}
```

### DO NOT

```typescript
export enum CustomerStatus {}      // Missing Enum suffix
export enum customerStatusEnum {}  // camelCase
export enum CUSTOMER_STATUS {}     // SCREAMING_CASE
```

---

## NAME-005: Interface Naming

**Level:** AUTO-CHECKABLE

Interfaces must use PascalCase. Do NOT prefix with `I`.

### DO

```typescript
export interface Customer {
    id: number;
    name: string;
}

export interface OrderRequest {
    items: OrderItem[];
}
```

### DO NOT

```typescript
export interface ICustomer {}      // I prefix not allowed
export interface customerData {}   // camelCase
export interface CUSTOMER {}       // SCREAMING_CASE
```

---

## NAME-006: DTO Class Naming

**Level:** AUTO-CHECKABLE

DTO classes must use PascalCase and end with `Dto`.

### DO

```typescript
export class CustomerDto {
    id: number;
    name: string;
}

export class OrderRequestDto {
    items: OrderItemDto[];
}
```

### DO NOT

```typescript
export class CustomerDTO {}        // All caps DTO
export class Customer {}           // Missing Dto suffix
export class customerDto {}        // camelCase
```

---

## NAME-007: Variable Naming

**Level:** AUTO-CHECKABLE

Variables must use camelCase. Constants may use SCREAMING_SNAKE_CASE.

### DO

```typescript
// Variables
const customerName = 'John';
let orderCount = 0;
const isActive = true;

// Constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';
const DEFAULT_PAGE_SIZE = 20;
```

### DO NOT

```typescript
const CustomerName = 'John';       // PascalCase variable
const customer_name = 'John';      // snake_case variable
let ORDERCOUNT = 0;                // SCREAMING_CASE for non-constant
```

---

## NAME-008: Method Naming

**Level:** AUTO-CHECKABLE

Methods must use camelCase and start with a verb.

### DO

```typescript
getCustomer(id: number) {}
updateOrder(order: Order) {}
deleteItem(itemId: number) {}
isValid(): boolean {}
hasPermission(role: string): boolean {}
canActivate(): boolean {}
```

### DO NOT

```typescript
Customer(id: number) {}            // Missing verb, PascalCase
customer_data() {}                 // snake_case
GetCustomer() {}                   // PascalCase
```

---

## NAME-009: Private Member Naming

**Level:** AUTO-CHECKABLE

Private class members must use camelCase. Do NOT use underscore prefix.

### DO

```typescript
export class CustomerService {
    private customerCache: Map<number, Customer>;
    private isLoading: boolean;

    private loadCustomer(id: number) {}
}
```

### DO NOT

```typescript
export class CustomerService {
    private _customerCache: Map<number, Customer>;  // Underscore prefix
    private _isLoading: boolean;
}
```

---

## NAME-010: Boolean Naming

**Level:** AUTO-CHECKABLE

Boolean variables and properties must use is/has/can/should prefix.

### DO

```typescript
isActive: boolean;
hasPermission: boolean;
canEdit: boolean;
shouldRefresh: boolean;
isLoading: boolean;
```

### DO NOT

```typescript
active: boolean;       // Missing prefix
permission: boolean;   // Missing prefix
edit: boolean;         // Missing prefix
loading: boolean;      // Missing prefix
```

---

## NAME-011: Observable Naming

**Level:** AUTO-CHECKABLE

Observable variables must end with `$` suffix.

### DO

```typescript
customers$: Observable<Customer[]>;
isLoading$: BehaviorSubject<boolean>;
currentUser$: Observable<User>;
```

### DO NOT

```typescript
customers: Observable<Customer[]>;    // Missing $ suffix
customersObservable: Observable<>;    // Verbose, no $ suffix
```

---

## NAME-012: Component Selector Naming

**Level:** AUTO-CHECKABLE

Component selectors must use kebab-case with module prefix.

### DO

```typescript
@Component({
    selector: 'cr-customer-list',    // cr = CRM module prefix
    ...
})
export class CustomerListComponent {}

@Component({
    selector: 'bm-invoice-detail',   // bm = Billing module prefix
    ...
})
export class InvoiceDetailComponent {}
```

### DO NOT

```typescript
@Component({
    selector: 'customerList',        // camelCase
    ...
})

@Component({
    selector: 'customer-list',       // Missing module prefix
    ...
})
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| NAME-001 | File Naming Convention | AUTO-CHECKABLE |
| NAME-002 | Component Class Naming | AUTO-CHECKABLE |
| NAME-003 | Service Class Naming | AUTO-CHECKABLE |
| NAME-004 | Enum Naming | AUTO-CHECKABLE |
| NAME-005 | Interface Naming | AUTO-CHECKABLE |
| NAME-006 | DTO Class Naming | AUTO-CHECKABLE |
| NAME-007 | Variable Naming | AUTO-CHECKABLE |
| NAME-008 | Method Naming | AUTO-CHECKABLE |
| NAME-009 | Private Member Naming | AUTO-CHECKABLE |
| NAME-010 | Boolean Naming | AUTO-CHECKABLE |
| NAME-011 | Observable Naming | AUTO-CHECKABLE |
| NAME-012 | Component Selector Naming | AUTO-CHECKABLE |
