# DTO (Data Transfer Object) Guidelines

## Overview

DTOs are TypeScript classes that represent data structures transferred between the frontend and backend. This document defines strict rules for creating and organizing DTOs in the Alpha Frontend Angular application.

## File Naming Convention

### Rule
```
<name>.dto.ts
```

### Requirements
- **Lowercase only**: Use lowercase letters
- **Hyphen separator**: Use hyphens (-) to separate words
- **`.dto.ts` extension**: Always use this specific extension
- **Descriptive names**: Should match the entity or API structure name

### Examples

✅ **CORRECT**
```
customer.dto.ts
invoice-line-item.dto.ts
payment-plan.dto.ts
ticket-action.dto.ts
user-profile.dto.ts
```

❌ **WRONG**
```
Customer.dto.ts            // ❌ PascalCase not allowed
customer_dto.ts            // ❌ Underscore not allowed
customerDto.ts             // ❌ camelCase not allowed
customer.ts                // ❌ Missing .dto extension
CustomerDTO.ts             // ❌ Wrong case and extension
```

## Folder Structure

### Location Rules

DTOs must be placed in one of two main categories:

```
<module-alias>/model/dto/
├── entity/                 # Entity DTOs (database entities)
└── api/                    # API DTOs (request/response objects)
```

### Entity DTOs

**Location**: `model/dto/entity/`
**Purpose**: Represent database entities
**Base Classes**: `DtoDetail` or `DtoDetailConfigurable`

```
features/feature-bm/bm/model/dto/entity/
  ├── invoice/
  │   └── invoice.dto.ts
  ├── payment/
  │   └── payment.dto.ts
  └── customer/
      └── customer.dto.ts
```

### API DTOs

**Location**: `model/dto/api/`
**Purpose**: Request/Response objects for API calls
**Base Classes**: Optional (can be plain classes or interfaces)

```
features/feature-bm/bm/model/dto/api/
  ├── invoice-create-request/
  │   └── invoice-create-request.dto.ts
  ├── payment-process-response/
  │   └── payment-process-response.dto.ts
  └── invoice-summary/
      └── invoice-summary.dto.ts
```

### Dedicated Folder Requirement

**CRITICAL**: Each DTO MUST be in its own dedicated folder.

✅ **CORRECT**
```
model/dto/entity/
  ├── customer/
  │   └── customer.dto.ts
  ├── invoice/
  │   └── invoice.dto.ts
  └── payment/
      └── payment.dto.ts
```

❌ **WRONG**
```
model/dto/entity/
  ├── customer.dto.ts        // ❌ No dedicated folder
  ├── invoice.dto.ts         // ❌ No dedicated folder
  └── payment.dto.ts         // ❌ No dedicated folder
```

## DTO Class Structure

### Base Classes

#### DtoDetail

Used for standard entity DTOs:

```typescript
import { DtoDetail } from '@features/core/shared/dto/model/dto-detail';

/**
 * Customer entity DTO
 */
export class CustomerDto extends DtoDetail {
    // Fields here
}
```

#### DtoDetailConfigurable

Used for configurable entities (master data):

```typescript
import { DtoDetailConfigurable } from '@features/core/shared/dto/model/dto-detail-configurable';

/**
 * Ticket Type configuration entity
 */
export class TicketTypeDto extends DtoDetailConfigurable {
    // Fields here
}
```

### Class Naming Rules

- **PascalCase**: Use PascalCase for class names
- **Dto suffix**: Always end with `Dto`
- **Descriptive**: Name should match the entity/structure

✅ **CORRECT**
```typescript
export class CustomerDto extends DtoDetail { }
export class InvoiceLineItemDto extends DtoDetail { }
export class PaymentProcessRequestDto { }
```

❌ **WRONG**
```typescript
export class customer extends DtoDetail { }           // ❌ lowercase
export class Customer extends DtoDetail { }           // ❌ Missing Dto suffix
export class CustomerDTO extends DtoDetail { }        // ❌ Wrong suffix (DTO vs Dto)
export class CustomerDataTransferObject { }           // ❌ Verbose, use Dto
```

## Field Definitions

### Field Types

```typescript
export class InvoiceDto extends DtoDetail {
    // Primitive types
    invoiceNumber: string;
    amount: number;
    issueDate: Date;
    isPaid: boolean;

    // Entity references (foreign keys)
    customerId: number;
    customer?: CustomerDto;  // Optional: populated object

    // Arrays
    lineItems: InvoiceLineItemDto[];
    tags: string[];

    // Enums
    status: InvoiceStatus;
    type: InvoiceType;

    // Optional fields
    notes?: string;
    dueDate?: Date;
}
```

### Field Naming Conventions

- **camelCase**: Use camelCase for field names
- **Foreign Keys**: Use pattern `<entityName>Id` for IDs
- **Optional fields**: Use `?` for nullable/optional fields
- **Arrays**: Use plural names for collections

✅ **CORRECT**
```typescript
customerId: number;          // Foreign key
customer?: CustomerDto;      // Optional populated object
lineItems: LineItemDto[];    // Array (plural)
notes?: string;              // Optional field
```

❌ **WRONG**
```typescript
CustomerID: number;          // ❌ PascalCase
customer_id: number;         // ❌ snake_case
customersId: number;         // ❌ Plural for singular reference
lineItem: LineItemDto[];     // ❌ Singular for array
notes: string | null;        // ❌ Use optional (?) instead of null union
```

## Documentation Requirements

### Class-Level Documentation

```typescript
/**
 * Customer entity representing business clients.
 * Contains customer contact information, status, and related data.
 *
 * @extends DtoDetail
 * @module feature-bm
 */
export class CustomerDto extends DtoDetail {
    // Fields
}
```

### Field-Level Documentation

```typescript
export class InvoiceDto extends DtoDetail {
    /**
     * Unique invoice number in format: INV-YYYY-NNNN
     */
    invoiceNumber: string;

    /**
     * Total invoice amount including tax
     */
    totalAmount: number;

    /**
     * Invoice issue date (when invoice was created)
     */
    issueDate: Date;

    /**
     * Payment due date (optional, based on payment terms)
     */
    dueDate?: Date;

    /**
     * Current invoice status
     * @see InvoiceStatus
     */
    status: InvoiceStatus;
}
```

## Entity DTO Pattern

### Complete Example

```typescript
import { DtoDetail } from '@features/core/shared/dto/model/dto-detail';
import { InvoiceStatus } from '../../private-domain/enum/invoice-status/invoice-status.enum';
import { InvoiceType } from '../../private-domain/enum/invoice-type/invoice-type.enum';
import { CustomerDto } from '../customer/customer.dto';
import { InvoiceLineItemDto } from '../invoice-line-item/invoice-line-item.dto';

/**
 * Invoice entity representing customer billing documents.
 * Manages invoice lifecycle from creation to payment.
 */
export class InvoiceDto extends DtoDetail {
    /**
     * Unique invoice number (e.g., INV-2025-0001)
     */
    invoiceNumber: string;

    /**
     * Invoice issue date
     */
    issueDate: Date;

    /**
     * Payment due date
     */
    dueDate: Date;

    /**
     * Total amount before tax
     */
    subtotal: number;

    /**
     * Tax amount
     */
    taxAmount: number;

    /**
     * Total amount including tax
     */
    totalAmount: number;

    /**
     * Current invoice status
     */
    status: InvoiceStatus;

    /**
     * Invoice type classification
     */
    type: InvoiceType;

    /**
     * Foreign key to customer
     */
    customerId: number;

    /**
     * Customer entity (populated when needed)
     */
    customer?: CustomerDto;

    /**
     * Invoice line items
     */
    lineItems: InvoiceLineItemDto[];

    /**
     * Additional notes or comments
     */
    notes?: string;

    /**
     * Whether invoice has been paid
     */
    isPaid: boolean;

    /**
     * Payment date (if paid)
     */
    paidDate?: Date;
}
```

## API DTO Pattern

### Request DTO

```typescript
/**
 * Request DTO for creating a new invoice
 */
export class InvoiceCreateRequestDto {
    /**
     * Customer ID for the invoice
     */
    customerId: number;

    /**
     * Issue date (defaults to current date if not provided)
     */
    issueDate?: Date;

    /**
     * Line items to include in invoice
     */
    lineItems: InvoiceLineItemCreateDto[];

    /**
     * Optional notes
     */
    notes?: string;
}
```

### Response DTO

```typescript
/**
 * Response DTO for invoice creation
 */
export class InvoiceCreateResponseDto {
    /**
     * Whether the operation was successful
     */
    success: boolean;

    /**
     * Created invoice entity
     */
    invoice?: InvoiceDto;

    /**
     * Error message if operation failed
     */
    errorMessage?: string;

    /**
     * Validation errors if any
     */
    validationErrors?: string[];
}
```

## Configurable Entity Pattern

### Configuration DTO

```typescript
import { DtoDetailConfigurable } from '@features/core/shared/dto/model/dto-detail-configurable';

/**
 * Ticket Type configuration entity.
 * Defines available ticket types in the system.
 */
export class TicketTypeDto extends DtoDetailConfigurable {
    /**
     * Display name of the ticket type
     */
    name: string;

    /**
     * Unique code identifier
     */
    code: string;

    /**
     * Description of the ticket type
     */
    description: string;

    /**
     * Default priority level for this type
     */
    defaultPriority: TicketPriority;

    /**
     * Default SLA in hours
     */
    defaultSlaHours: number;

    /**
     * Icon class for UI display
     */
    iconClass: string;

    /**
     * Color for UI theming
     */
    color: string;

    /**
     * Whether this type is active
     */
    isActive: boolean;

    /**
     * Display order in lists
     */
    sortOrder: number;
}
```

## Validation Checklist

When creating a DTO, verify:

- [ ] File name is lowercase with hyphens: `<name>.dto.ts`
- [ ] DTO is in dedicated folder: `<name>/<name>.dto.ts`
- [ ] Located in correct category: `entity/` or `api/`
- [ ] Class name is PascalCase with `Dto` suffix
- [ ] Extends appropriate base class (`DtoDetail` or `DtoDetailConfigurable`) for entities
- [ ] All fields use camelCase naming
- [ ] Foreign keys follow `<entityName>Id` pattern
- [ ] Optional fields use `?` operator
- [ ] Arrays use plural names
- [ ] Enums imported and typed correctly
- [ ] JSDoc comments added for class and fields
- [ ] Export keyword is present
- [ ] No other code in the file (DTO class only)

## Import Patterns

### Importing Related DTOs

```typescript
// Import base classes
import { DtoDetail } from '@features/core/shared/dto/model/dto-detail';

// Import enums
import { InvoiceStatus } from '../../private-domain/enum/invoice-status/invoice-status.enum';

// Import related DTOs (relative paths within same module)
import { CustomerDto } from '../customer/customer.dto';
import { LineItemDto } from '../line-item/line-item.dto';

// Import DTOs from other modules (absolute paths)
import { UserDto } from '@features/feature-core/um/model/dto/entity/user/user.dto';
```

## Anti-Patterns to Avoid

### ❌ Multiple DTOs in One File

```typescript
// ❌ WRONG
export class CustomerDto extends DtoDetail { }
export class InvoiceDto extends DtoDetail { }
```

✅ **CORRECT**: Separate files for each DTO

### ❌ No Base Class for Entity DTOs

```typescript
// ❌ WRONG - Entity DTO without base class
export class CustomerDto {
    id: number;
    name: string;
}
```

✅ **CORRECT**: Extend DtoDetail or DtoDetailConfigurable

### ❌ Inconsistent Field Naming

```typescript
// ❌ WRONG
export class InvoiceDto extends DtoDetail {
    InvoiceNumber: string;    // PascalCase
    customer_id: number;      // snake_case
    LineItems: LineItemDto[]; // PascalCase
}
```

✅ **CORRECT**: Use camelCase consistently

### ❌ Improper Optional Field Handling

```typescript
// ❌ WRONG
notes: string | null;
dueDate: Date | undefined;
```

✅ **CORRECT**: Use optional operator
```typescript
notes?: string;
dueDate?: Date;
```

### ❌ Missing Type Information

```typescript
// ❌ WRONG
lineItems: any[];
status: string;
```

✅ **CORRECT**: Use proper types
```typescript
lineItems: InvoiceLineItemDto[];
status: InvoiceStatus;
```

## Common DTO Patterns

### 1. Simple Entity DTO

```typescript
export class TagDto extends DtoDetail {
    name: string;
    color: string;
    description?: string;
}
```

### 2. Entity with References

```typescript
export class OrderDto extends DtoDetail {
    orderNumber: string;
    orderDate: Date;
    customerId: number;
    customer?: CustomerDto;
    lineItems: OrderLineItemDto[];
}
```

### 3. Hierarchical Entity

```typescript
export class OrganizationalUnitDto extends DtoDetail {
    name: string;
    code: string;
    parentId?: number;
    parent?: OrganizationalUnitDto;
    children: OrganizationalUnitDto[];
}
```

### 4. API Request/Response

```typescript
export class SearchRequestDto {
    query: string;
    filters: FilterCriteria[];
    paging: PagingDto;
    sorting: Sorting[];
}

export class SearchResponseDto {
    results: any[];
    totalCount: number;
    page: number;
    pageSize: number;
}
```

## Integration with Services

DTOs are typically used in service methods:

```typescript
@Injectable({
    providedIn: 'root'
})
export class InvoiceService extends MvsCrudService {
    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/bm/invoices');
    }

    // Returns Observable<InvoiceDto>
    get(id: number): Observable<InvoiceDto> {
        return super.get(id);
    }

    // Returns Observable<InvoiceDto[]>
    list(request: ObjectRequestList): Observable<InvoiceDto[]> {
        return super.list(request);
    }

    // Accepts and returns InvoiceDto
    create(invoice: InvoiceDto): Observable<InvoiceDto> {
        return super.create(invoice);
    }
}
```

## Summary

**Key Takeaways**:
1. Lowercase file names with hyphens: `<name>.dto.ts`
2. Dedicated folder per DTO
3. Two main categories: `entity/` and `api/`
4. PascalCase class names with `Dto` suffix
5. Entity DTOs extend `DtoDetail` or `DtoDetailConfigurable`
6. camelCase field names
7. Foreign keys follow `<entityName>Id` pattern
8. Optional fields use `?` operator
9. Comprehensive JSDoc documentation
10. One DTO per file

Following these guidelines ensures type-safe, maintainable, and consistent DTO usage across the entire application.