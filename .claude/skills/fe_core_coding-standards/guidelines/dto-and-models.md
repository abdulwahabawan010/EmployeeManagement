# DTO and Models Guidelines

Rules governing data transfer object placement, enum location, and model organization.

---

## DTO-001: DTO Files in dto Directory

**Level:** AUTO-CHECKABLE

All DTO classes must be located in `model/dto/` directory.

### DO

```
model/
└── dto/
    ├── customer-dto.ts
    ├── order-dto.ts
    └── invoice-dto.ts
```

```typescript
// model/dto/customer-dto.ts
export class CustomerDto {
    id: number;
    name: string;
    email: string;
}
```

### DO NOT

```
model/
├── customer-dto.ts        // Should be in dto/
└── dto/
    └── order-dto.ts
```

```
service/
└── customer-dto.ts        // DTOs must not be in service/
```

---

## DTO-002: Enums in enum Directory

**Level:** AUTO-CHECKABLE

All enum types must be located in `model/enum/` directory.

### DO

```
model/
└── enum/
    ├── customer-status.enum.ts
    ├── order-type.enum.ts
    └── payment-method.enum.ts
```

### DO NOT

```
model/
├── customer-status.enum.ts    // Should be in enum/
└── dto/
    └── customer-status.enum.ts  // Enums must not be in dto/
```

```
component/
└── customer-list-component/
    └── customer-status.enum.ts  // Enums must not be in component/
```

---

## DTO-003: DTO Class Structure

**Level:** AUTO-CHECKABLE

DTO classes must only contain data properties. No methods except serialization helpers.

### DO

```typescript
export class CustomerDto {
    id: number;
    name: string;
    email: string;
    status: CustomerStatusEnum;
    createdAt: Date;
}
```

### DO NOT

```typescript
export class CustomerDto {
    id: number;
    name: string;

    // DO NOT add business logic to DTOs
    getFullName(): string {
        return this.firstName + ' ' + this.lastName;
    }

    // DO NOT add validation to DTOs
    validate(): boolean {
        return this.email.includes('@');
    }
}
```

---

## DTO-004: DTO Naming Convention

**Level:** AUTO-CHECKABLE

DTO file names must end with `-dto.ts` and class names with `Dto`.

### DO

```
customer-dto.ts          → CustomerDto
order-request-dto.ts     → OrderRequestDto
invoice-response-dto.ts  → InvoiceResponseDto
```

### DO NOT

```
customer.ts              → CustomerDto       // File name missing -dto
customerDTO.ts           → CustomerDTO       // Class uses DTO not Dto
customer-data.ts         → CustomerDto       // File name not matching
```

---

## DTO-005: Enum Naming Convention

**Level:** AUTO-CHECKABLE

Enum file names must end with `.enum.ts` and enum names with `Enum`.

### DO

```
customer-status.enum.ts  → CustomerStatusEnum
order-type.enum.ts       → OrderTypeEnum
payment-method.enum.ts   → PaymentMethodEnum
```

### DO NOT

```
customer-status.ts       → CustomerStatusEnum   // Missing .enum
status-enum.ts           → CustomerStatus       // Class missing Enum suffix
customer-statuses.ts     → CustomerStatuses     // Not proper naming
```

---

## DTO-006: Enum Value Conventions

**Level:** AUTO-CHECKABLE

Enum values must be PascalCase with string values in lowercase or PascalCase.

### DO

```typescript
export enum CustomerStatusEnum {
    Active = 'active',
    Inactive = 'inactive',
    Pending = 'pending'
}

export enum OrderTypeEnum {
    Standard = 'Standard',
    Express = 'Express',
    SameDay = 'SameDay'
}
```

### DO NOT

```typescript
export enum CustomerStatusEnum {
    ACTIVE = 'ACTIVE',           // SCREAMING_CASE keys
    inactive = 'inactive',       // lowercase key
    pending_approval = 'pending' // snake_case key
}
```

---

## DTO-007: Interface vs DTO Usage

**Level:** MANUAL-ONLY

Use interfaces for internal type definitions. Use DTOs for API contracts.

### DO

```typescript
// Internal type - use interface
// model/interface/customer-filter.interface.ts
export interface CustomerFilter {
    status?: CustomerStatusEnum;
    searchTerm?: string;
}

// API contract - use DTO class
// model/dto/customer-dto.ts
export class CustomerDto {
    id: number;
    name: string;
}
```

### DO NOT

```typescript
// DO NOT use DTO for internal-only types
export class CustomerFilterDto {  // This is not an API contract
    status?: CustomerStatusEnum;
}

// DO NOT use interface for API contracts
export interface CustomerDto {  // Should be class for serialization
    id: number;
    name: string;
}
```

---

## DTO-008: Request/Response DTO Separation

**Level:** AUTO-CHECKABLE

Separate request and response DTOs when they differ.

### DO

```
model/dto/
├── customer-dto.ts              // Base DTO
├── create-customer-request-dto.ts
├── update-customer-request-dto.ts
└── customer-response-dto.ts
```

```typescript
// create-customer-request-dto.ts
export class CreateCustomerRequestDto {
    name: string;
    email: string;
}

// customer-response-dto.ts
export class CustomerResponseDto {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
}
```

### DO NOT

```typescript
// DO NOT use single DTO for both request and response
// when they have different fields
export class CustomerDto {
    id?: number;        // Optional because not in create
    name: string;
    email: string;
    createdAt?: Date;   // Optional because not in create
}
```

---

## DTO-009: No Circular DTO Dependencies

**Level:** AUTO-CHECKABLE

DTOs must not have circular dependencies.

### DO

```typescript
// customer-dto.ts
import { AddressDto } from './address-dto';

export class CustomerDto {
    id: number;
    address: AddressDto;  // One-way dependency
}

// address-dto.ts
export class AddressDto {
    street: string;
    city: string;
    // No reference back to CustomerDto
}
```

### DO NOT

```typescript
// customer-dto.ts
import { OrderDto } from './order-dto';

export class CustomerDto {
    orders: OrderDto[];
}

// order-dto.ts
import { CustomerDto } from './customer-dto';

export class OrderDto {
    customer: CustomerDto;  // Circular dependency!
}
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| DTO-001 | DTO Files in dto Directory | AUTO-CHECKABLE |
| DTO-002 | Enums in enum Directory | AUTO-CHECKABLE |
| DTO-003 | DTO Class Structure | AUTO-CHECKABLE |
| DTO-004 | DTO Naming Convention | AUTO-CHECKABLE |
| DTO-005 | Enum Naming Convention | AUTO-CHECKABLE |
| DTO-006 | Enum Value Conventions | AUTO-CHECKABLE |
| DTO-007 | Interface vs DTO Usage | MANUAL-ONLY |
| DTO-008 | Request/Response DTO Separation | AUTO-CHECKABLE |
| DTO-009 | No Circular DTO Dependencies | AUTO-CHECKABLE |
