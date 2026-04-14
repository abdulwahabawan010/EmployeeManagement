# Frontend Enum Rules - Examples

This document provides comprehensive examples of VALID and INVALID enum definitions.

## Valid Examples

### Example 1: Basic uppercase enum

```ts
export enum UserStatusEnum {
  ACTIVE,
  INACTIVE,
  PENDING,
  SUSPENDED,
}
```

### Example 2: Basic lowercase enum

```ts
export enum userStatusEnum {
  active,
  inactive,
  pending,
  suspended,
}
```

### Example 3: Enum corresponding to backend

Backend (Java):
```java
public enum OrderStatus {
    CREATED("CREATED"),
    PROCESSING("PROCESSING"),
    SHIPPED("SHIPPED"),
    DELIVERED("DELIVERED"),
    CANCELLED("CANCELLED");

    private final String value;

    OrderStatus(String value) {
        this.value = value;
    }
}
```

Frontend (TypeScript) - CORRECT:
```ts
// Semantic match only - NO syntax copying
export enum OrderStatusEnum {
  CREATED,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED,
}
```

### Example 4: Feature flag enum

```ts
export enum FeatureFlagEnum {
  DARK_MODE,
  BETA_FEATURES,
  EXPERIMENTAL_UI,
  LEGACY_SUPPORT,
}
```

### Example 5: Permission enum

```ts
export enum PermissionEnum {
  READ,
  WRITE,
  DELETE,
  ADMIN,
}
```

---

## Invalid Examples

### Violation 1: Explicit string values (uppercase)

```ts
// VIOLATION: Explicit string assignments
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}
```

**Why this is wrong:** Explicit string assignments are FORBIDDEN regardless of casing.

**Correction:**
```ts
export enum UserStatusEnum {
  ACTIVE,
  INACTIVE,
  PENDING,
  SUSPENDED,
}
```

### Violation 2: Explicit string values (lowercase)

```ts
// VIOLATION: Explicit lowercase string assignments
export enum userStatusEnum {
  active = 'active',
  inactive = 'inactive',
  pending = 'pending',
  suspended = 'suspended',
}
```

**Why this is wrong:** The assignment style is explicit, which is FORBIDDEN.

**Correction:**
```ts
export enum userStatusEnum {
  active,
  inactive,
  pending,
  suspended,
}
```

### Violation 3: Numeric assignments

```ts
// VIOLATION: Explicit numeric values
export enum PriorityEnum {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}
```

**Why this is wrong:** Explicit numeric assignments are FORBIDDEN.

**Correction:**
```ts
export enum PriorityEnum {
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL,
}
```

### Violation 4: Copying Java enum syntax

Backend (Java):
```java
public enum PaymentMethod {
    CREDIT_CARD("CREDIT_CARD"),
    DEBIT_CARD("DEBIT_CARD"),
    BANK_TRANSFER("BANK_TRANSFER"),
    CRYPTO("CRYPTO");
}
```

Frontend (TypeScript) - WRONG:
```ts
// VIOLATION: Copying Java serialization syntax
export enum PaymentMethodEnum {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
}
```

**Why this is wrong:** Backend syntax MUST NOT be copied. Only semantic matching is allowed.

**Correction:**
```ts
export enum PaymentMethodEnum {
  CREDIT_CARD,
  DEBIT_CARD,
  BANK_TRANSFER,
  CRYPTO,
}
```

### Violation 5: Mixed assignment styles

```ts
// VIOLATION: Mixing implicit and explicit
export enum MixedEnum {
  FIRST,
  SECOND = 'SECOND',
  THIRD,
  FOURTH = 4,
}
```

**Why this is wrong:** Assignment styles MUST be consistent and MUST be implicit.

**Correction:**
```ts
export enum MixedEnum {
  FIRST,
  SECOND,
  THIRD,
  FOURTH,
}
```

### Violation 6: Computed values

```ts
// VIOLATION: Computed/dynamic values
const PREFIX = 'STATUS_';

export enum ComputedEnum {
  ACTIVE = `${PREFIX}ACTIVE`,
  INACTIVE = `${PREFIX}INACTIVE`,
}
```

**Why this is wrong:** Computed or dynamic values are FORBIDDEN.

**Correction:**
```ts
export enum ComputedEnum {
  ACTIVE,
  INACTIVE,
}
```

### Violation 7: String values with different casing

```ts
// VIOLATION: Member name differs from string value
export enum CasingEnum {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}
```

**Why this is wrong:** Explicit string assignments are FORBIDDEN regardless of casing differences.

**Correction:**
```ts
export enum CasingEnum {
  ACTIVE,
  INACTIVE,
}
```

---

## Edge Cases

### Acceptable: Const enums with implicit values

```ts
// ALLOWED: const enum with implicit values
export const enum InlineEnum {
  OPTION_A,
  OPTION_B,
  OPTION_C,
}
```

### Acceptable: Enum used in type unions

```ts
// ALLOWED: Implicit enum with type usage
export enum DirectionEnum {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

type Movement = DirectionEnum.UP | DirectionEnum.DOWN;
```

---

## Common Mistakes to Avoid

1. **Thinking string enums are "safer"** - They are not safer, they are FORBIDDEN.

2. **Copying backend patterns** - NEVER copy assignment syntax from backend code.

3. **Adding explicit values "for clarity"** - Implicit values ARE clear. Explicit values are violations.

4. **Using numeric values for ordering** - Implicit enums maintain order. Explicit numbers are FORBIDDEN.

5. **Assuming TypeScript conventions apply** - This codebase has STRICTER rules than general TypeScript.
