# Enum Guidelines

## Overview

This document defines strict rules for creating and organizing enums in the Alpha Frontend Angular application. Enums provide type-safe constants and must follow consistent patterns across the entire codebase.

## File Naming Convention

### Rule
```
<name>.enum.ts
```

### Requirements
- **Lowercase only**: Use lowercase letters
- **Hyphen separator**: Use hyphens (-) to separate words
- **`.enum.ts` extension**: Always use this specific extension
- **Descriptive names**: Name should clearly indicate the enum's purpose

### Examples

✅ **CORRECT**
```
customer-status.enum.ts
ticket-priority.enum.ts
payment-method.enum.ts
invoice-type.enum.ts
user-role.enum.ts
```

❌ **WRONG**
```
CustomerStatus.enum.ts          // ❌ PascalCase not allowed
customerstatus.enum.ts          // ❌ Missing hyphens for readability
customer_status.enum.ts         // ❌ Underscore not allowed
customerStatus.enum.ts          // ❌ camelCase not allowed
customer-status.ts              // ❌ Missing .enum extension
```

## Folder Structure

### Location Rules

Enums must be placed in one of FOUR locations based on their purpose and usage scope:

```
<module-alias>/model/
├── dto/
│   └── enum/                    # DTO-related enums
├── private-domain/enum/         # Module-only domain enums
├── protected-domain/enum/       # Feature-shared domain enums
└── public-domain/enum/          # Cross-feature domain enums
```

### Enum Location Types

#### 1. DTO-Related Enums
**Location**: `model/dto/enum/`
**Usage**: Enums tightly coupled with DTOs, entity-specific enums used exclusively within DTO definitions
**Example**:
```
features/feature-bm/bm/model/dto/enum/
  └── invoice-status.enum.ts
```

#### 2. Private Domain Enums
**Location**: `model/private-domain/enum/`
**Usage**: Business logic enums used only within the same module
**Example**:
```
features/feature-bm/bm/model/private-domain/enum/
  └── invoice-calculation-mode.enum.ts
```

#### 3. Protected Domain Enums
**Location**: `model/protected-domain/enum/`
**Usage**: Business logic enums shared within the same feature (multiple modules)
**Example**:
```
features/feature-bm/bm/model/protected-domain/enum/
  └── payment-status.enum.ts
```

#### 4. Public Domain Enums
**Location**: `model/public-domain/enum/`
**Usage**: Business logic enums used across different features
**Example**:
```
features/feature-core/core/model/public-domain/enum/
  └── entity-status.enum.ts
```

### File Organization

All enum files are placed **directly** in their respective `enum/` directory:

✅ **CORRECT**
```
model/
├── dto/enum/
│   └── invoice-status.enum.ts
└── private-domain/enum/
    ├── customer-status.enum.ts
    ├── invoice-type.enum.ts
    └── payment-method.enum.ts
```

❌ **WRONG**
```
model/private-domain/enum/
  ├── customer-status/              // ❌ No subdirectories
  │   └── customer-status.enum.ts
  └── invoice-type/                 // ❌ No subdirectories
      └── invoice-type.enum.ts
```

### Choosing the Correct Location

Use this decision tree to determine where to place an enum:

**Decision Process:**

1. **Is the enum used exclusively within DTO definitions?**
   - **YES** → Place in `model/dto/enum/`
   - **NO** → Continue to step 2

2. **Is the enum used across multiple features?**
   - **YES** → Place in `model/public-domain/enum/`
   - **NO** → Continue to step 3

3. **Is the enum used within multiple modules in the same feature?**
   - **YES** → Place in `model/protected-domain/enum/`
   - **NO** → Place in `model/private-domain/enum/`

**Examples:**

| Enum Type | Correct Location | Reason |
|-----------|------------------|--------|
| `InvoiceStatus` (used in `InvoiceDto`) | `model/dto/enum/` | Tightly coupled with DTO definition |
| `InvoiceCalculationMode` (internal to BM module) | `model/private-domain/enum/` | Only used within BM module business logic |
| `PaymentStatus` (shared across BM modules) | `model/protected-domain/enum/` | Shared within feature-bm modules |
| `EntityStatus` (used across all features) | `model/public-domain/enum/` | Cross-feature enum |

## Enum Declaration Format

### Basic Structure

```typescript
/**
 * Status values for customer entities.
 * Defines the lifecycle states a customer can be in.
 */
export enum CustomerStatus {
    /**
     * Customer is active and can perform transactions
     */
    ACTIVE,

    /**
     * Customer account is temporarily suspended
     */
    SUSPENDED,

    /**
     * Customer account is permanently closed
     */
    CLOSED
}
```

### Naming Rules

#### Enum Name
- **PascalCase**: Use PascalCase for enum names
- **Descriptive**: Name should clearly indicate what it represents
- **Singular**: Use singular form (Status, not Statuses)

✅ **CORRECT**
```typescript
export enum CustomerStatus { }
export enum TicketPriority { }
export enum InvoiceType { }
```

❌ **WRONG**
```typescript
export enum customerStatus { }     // ❌ camelCase not allowed
export enum CUSTOMER_STATUS { }    // ❌ SCREAMING_SNAKE_CASE not allowed
export enum Customer_Status { }    // ❌ Mixed case not allowed
export enum CustomerStatuses { }   // ❌ Plural form not preferred
```

#### Enum Values
- **SCREAMING_SNAKE_CASE**: Use uppercase with underscores
- **Numeric values**: DO NOT assign explicit values (use auto-incrementing numeric enums)
- **No string assignments**: String value assignments are NOT allowed

✅ **CORRECT**
```typescript
export enum Priority {
    HIGH,       // 0
    MEDIUM,     // 1
    LOW,        // 2
    CRITICAL    // 3
}
```

❌ **WRONG**
```typescript
export enum Priority {
    High,                       // ❌ PascalCase not allowed
    medium,                     // ❌ lowercase not allowed
    HIGH = 'HIGH',              // ❌ String assignments not allowed
    CRITICAL = 1                // ❌ Explicit numeric assignments not allowed
}
```

## Documentation Requirements

### JSDoc Comments

Every enum and its values should have clear documentation:

```typescript
/**
 * Invoice type classification.
 * Determines the nature and processing rules for invoices.
 */
export enum InvoiceType {
    /**
     * Standard invoice for regular transactions
     */
    STANDARD,

    /**
     * Credit note to reverse or adjust previous invoices
     */
    CREDIT_NOTE,

    /**
     * Pro forma invoice used for quotations
     */
    PRO_FORMA,

    /**
     * Recurring invoice for subscription-based services
     */
    RECURRING
}
```

### Documentation Guidelines

1. **Enum-level comment**: Describe the purpose and usage
2. **Value-level comments**: Explain each enum value
3. **Clear language**: Use simple, understandable descriptions
4. **Business context**: Include business rules if relevant

## Common Patterns

### Status Enums

```typescript
/**
 * Entity status in the system lifecycle
 */
export enum EntityStatus {
    DRAFT,
    ACTIVE,
    INACTIVE,
    ARCHIVED,
    DELETED
}
```

### Priority Enums

```typescript
/**
 * Priority level for task or ticket processing
 */
export enum Priority {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW
}
```

### Type Classification Enums

```typescript
/**
 * Document type classification
 */
export enum DocumentType {
    CONTRACT,
    INVOICE,
    RECEIPT,
    REPORT,
    ATTACHMENT
}
```

## Import and Export

### Exporting Enums

Always use `export` keyword:

```typescript
export enum CustomerStatus {
    ACTIVE,
    INACTIVE
}
```

### Importing Enums

```typescript
// Named import (preferred)

// From DTO enums
import { InvoiceStatus } from '@features/feature-bm/bm/model/dto/enum/invoice-status/invoice-status.enum';

// From private domain enums
import { CustomerStatus } from '@features/feature-bm/bm/model/private-domain/enum/customer-status/customer-status.enum';

// Using in code
const status: CustomerStatus = CustomerStatus.ACTIVE;
const invoiceStatus: InvoiceStatus = InvoiceStatus.PENDING;
```

## Validation Checklist

When creating an enum, verify:

- [ ] File name is lowercase with hyphens: `<name>.enum.ts`
- [ ] Enum file is placed directly in the enum directory (NOT in a subdirectory)
- [ ] Located in correct location based on decision tree: dto/private-domain/protected-domain/public-domain
- [ ] Enum name is PascalCase
- [ ] Enum values are SCREAMING_SNAKE_CASE
- [ ] NO explicit value assignments (numeric auto-increment only)
- [ ] NO string assignments
- [ ] JSDoc comments added for enum and all values
- [ ] Export keyword is present
- [ ] No other code in the file (enum only)

## Anti-Patterns to Avoid

### ❌ Multiple Enums in One File

```typescript
// ❌ WRONG - Multiple enums in one file
export enum CustomerStatus { }
export enum CustomerType { }
export enum CustomerCategory { }
```

✅ **CORRECT**: Create separate files for each enum

### ❌ String Enums

```typescript
// ❌ WRONG - String value assignments
export enum Priority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}
```

✅ **CORRECT**: Use numeric enums without explicit values

```typescript
export enum Priority {
    HIGH,      // 0
    MEDIUM,    // 1
    LOW        // 2
}
```

### ❌ Explicit Numeric Values

```typescript
// ❌ WRONG - Explicit numeric assignments
export enum Status {
    ACTIVE = 1,
    INACTIVE = 2
}
```

✅ **CORRECT**: Use auto-incrementing numeric values

```typescript
export enum Status {
    ACTIVE,    // 0
    INACTIVE   // 1
}
```

### ❌ Non-Constant Values

```typescript
// ❌ WRONG - Computed values
export enum Priority {
    HIGH = getPriorityValue(),
    MEDIUM = computeMediumPriority()
}
```

✅ **CORRECT**: Use auto-incrementing numeric enums

```typescript
export enum Priority {
    HIGH,
    MEDIUM
}
```

## Examples from Codebase

### Example 1: Ticket Priority

**File**: `features/feature-core/tm/model/private-domain/enum/ticket-priority/ticket-priority.enum.ts`

```typescript
/**
 * Priority levels for ticket processing and SLA calculation
 */
export enum TicketPriority {
    /**
     * Immediate attention required - response within 1 hour
     */
    CRITICAL,

    /**
     * High importance - response within 4 hours
     */
    HIGH,

    /**
     * Normal priority - response within 24 hours
     */
    MEDIUM,

    /**
     * Low importance - response within 72 hours
     */
    LOW
}
```

### Example 2: Payment Method

**File**: `features/feature-bm/bm/model/private-domain/enum/payment-method/payment-method.enum.ts`

```typescript
/**
 * Available payment methods for invoice settlement
 */
export enum PaymentMethod {
    /**
     * Bank transfer / wire transfer
     */
    BANK_TRANSFER,

    /**
     * Credit card payment
     */
    CREDIT_CARD,

    /**
     * Direct debit / SEPA
     */
    DIRECT_DEBIT,

    /**
     * Cash payment
     */
    CASH,

    /**
     * Payment via PayPal
     */
    PAYPAL
}
```

## Integration with DTOs

Enums are typically used as field types in DTOs:

```typescript
// Import from dto/enum for DTO-related enums
import { InvoiceStatus } from '../enum/invoice-status/invoice-status.enum';

// Import from domain enums for business logic enums
import { PaymentMethod } from '../../private-domain/enum/payment-method/payment-method.enum';

export class InvoiceDto extends DtoDetail {
    invoiceNumber: string;
    status: InvoiceStatus;          // DTO-related enum
    paymentMethod: PaymentMethod;   // Domain enum

    // Type-safe usage
    isPending(): boolean {
        return this.status === InvoiceStatus.PENDING;
    }
}
```

## Summary

**Key Takeaways**:
1. Lowercase file names with hyphens: `<name>.enum.ts`
2. Place enums directly in the `enum/` directory (NOT in subdirectories)
3. Four enum locations: dto, private-domain, protected-domain, public-domain
4. Use decision tree to choose correct location based on usage scope
5. PascalCase enum names
6. SCREAMING_SNAKE_CASE values WITHOUT explicit assignments (numeric auto-increment)
7. NO string value assignments allowed
8. NO explicit numeric assignments allowed
9. Comprehensive JSDoc documentation
10. Export all enums
11. One enum per file

Following these guidelines ensures type-safe, maintainable, and consistent enum usage across the entire application.
