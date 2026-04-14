# Structure Guidelines

Rules governing file organization, one-per-file rules, and directory structure.

---

## STRUCT-001: One Enum Per File

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Each enum must be in its own dedicated file.

### DO

```
model/enum/
├── customer-status.enum.ts    // Contains only CustomerStatusEnum
├── customer-type.enum.ts      // Contains only CustomerTypeEnum
└── payment-method.enum.ts     // Contains only PaymentMethodEnum
```

```typescript
// customer-status.enum.ts
export enum CustomerStatusEnum {
    Active = 'active',
    Inactive = 'inactive',
    Pending = 'pending'
}
```

### DO NOT

```typescript
// customer-enums.ts - DO NOT put multiple enums in one file
export enum CustomerStatusEnum {
    Active = 'active',
    Inactive = 'inactive'
}

export enum CustomerTypeEnum {
    Individual = 'individual',
    Business = 'business'
}
```

---

## STRUCT-002: One Interface Per File

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Each interface must be in its own dedicated file.

### DO

```
model/
├── customer.interface.ts      // Contains only Customer interface
├── address.interface.ts       // Contains only Address interface
└── contact.interface.ts       // Contains only Contact interface
```

```typescript
// customer.interface.ts
export interface Customer {
    id: number;
    name: string;
    email: string;
}
```

### DO NOT

```typescript
// models.ts - DO NOT put multiple interfaces in one file
export interface Customer {
    id: number;
    name: string;
}

export interface Address {
    street: string;
    city: string;
}
```

---

## STRUCT-003: Component File Structure

**Level:** AUTO-CHECKABLE

Each component must have its files in a dedicated directory.

### DO

```
component/
└── customer-list-component/
    ├── customer-list.component.ts
    ├── customer-list.component.html
    ├── customer-list.component.scss
    └── customer-list.component.spec.ts
```

### DO NOT

```
component/
├── customer-list.component.ts
├── customer-list.component.html
├── customer-detail.component.ts   // Multiple components at same level
├── customer-detail.component.html
```

---

## STRUCT-004: Service Directory Structure

**Level:** AUTO-CHECKABLE

Services must be organized in the service directory.

### DO

```
service/
├── customer.service.ts
├── order.service.ts
└── api/
    ├── customer-api.service.ts
    └── order-api.service.ts
```

### DO NOT

```
// DO NOT place services in component directories
component/
└── customer-list-component/
    ├── customer-list.component.ts
    └── customer.service.ts  // Service should be in service/
```

---

## STRUCT-005: Model Directory Structure

**Level:** AUTO-CHECKABLE

Models must follow the established directory hierarchy.

### DO

```
model/
├── dto/
│   ├── customer-dto.ts
│   └── order-dto.ts
├── enum/
│   ├── customer-status.enum.ts
│   └── order-type.enum.ts
└── interface/
    ├── customer.interface.ts
    └── order.interface.ts
```

### DO NOT

```
model/
├── customer-dto.ts           // Should be in dto/
├── customer-status.enum.ts   // Should be in enum/
└── customer.interface.ts     // Should be in interface/
```

---

## STRUCT-006: Protected Components Directory

**Level:** AUTO-CHECKABLE

Internal/private components must be in `protected-components/` directory.

### DO

```
component/
├── public-components/
│   └── customer-card-component/
│       └── customer-card.component.ts
└── protected-components/
    └── customer-internal-component/
        └── customer-internal.component.ts
```

### DO NOT

```
component/
├── customer-card-component/      // Public vs protected unclear
└── customer-internal-component/
```

---

## STRUCT-007: Index Barrel Files

**Level:** AUTO-CHECKABLE

Each module should have an index.ts barrel file for public exports.

### DO

```
cr/
├── index.ts                    // Exports public API
├── component/
├── service/
└── model/
```

```typescript
// index.ts
export * from './component/public-components/customer-card-component/customer-card.component';
export * from './service/customer.service';
export * from './model/dto/customer-dto';
```

### DO NOT

```
// No index.ts, forcing consumers to import from deep paths
import { CustomerCardComponent } from 'features/feature-crm/cr/component/public-components/customer-card-component/customer-card.component';
```

---

## STRUCT-008: File Naming Matches Content

**Level:** AUTO-CHECKABLE

File name must match the primary export name.

### DO

```typescript
// customer.service.ts
export class CustomerService {}

// customer-status.enum.ts
export enum CustomerStatusEnum {}

// customer.interface.ts
export interface Customer {}
```

### DO NOT

```typescript
// helpers.ts - File name does not match content
export class CustomerService {}

// types.ts - Generic name, multiple exports
export enum CustomerStatusEnum {}
export interface Customer {}
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| STRUCT-001 | One Enum Per File | AUTO-CHECKABLE, AUTO-FIXABLE |
| STRUCT-002 | One Interface Per File | AUTO-CHECKABLE, AUTO-FIXABLE |
| STRUCT-003 | Component File Structure | AUTO-CHECKABLE |
| STRUCT-004 | Service Directory Structure | AUTO-CHECKABLE |
| STRUCT-005 | Model Directory Structure | AUTO-CHECKABLE |
| STRUCT-006 | Protected Components Directory | AUTO-CHECKABLE |
| STRUCT-007 | Index Barrel Files | AUTO-CHECKABLE |
| STRUCT-008 | File Naming Matches Content | AUTO-CHECKABLE |
