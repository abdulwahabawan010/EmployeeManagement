# Code Style and Formatting Guidelines

Rules governing indentation, quotes, line length, import ordering, and formatting.

---

## STYLE-001: Indentation

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Use 4 spaces for indentation. No tabs.

### DO

```typescript
export class CustomerService {
    private customers: Customer[];

    getCustomer(id: number): Customer {
        return this.customers.find(c => c.id === id);
    }
}
```

### DO NOT

```typescript
export class CustomerService {
  private customers: Customer[];  // 2 spaces

	getCustomer(id: number): Customer {  // Tab character
		return this.customers.find(c => c.id === id);
	}
}
```

---

## STYLE-002: Quote Style

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Use single quotes for strings. Use backticks only for template literals.

### DO

```typescript
const name = 'John';
const greeting = `Hello, ${name}!`;
const path = '/api/customers';
```

### DO NOT

```typescript
const name = "John";           // Double quotes
const greeting = "Hello";      // Double quotes when no interpolation
const path = `/api/customers`; // Backticks without interpolation
```

---

## STYLE-003: Trailing Commas

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Use trailing commas in multiline arrays, objects, and function parameters.

### DO

```typescript
const customer = {
    id: 1,
    name: 'John',
    email: 'john@example.com',
};

const items = [
    'apple',
    'banana',
    'cherry',
];

function createUser(
    name: string,
    email: string,
    age: number,
) {}
```

### DO NOT

```typescript
const customer = {
    id: 1,
    name: 'John',
    email: 'john@example.com'  // Missing trailing comma
};

const items = [
    'apple',
    'banana',
    'cherry'  // Missing trailing comma
];
```

---

## STYLE-004: Maximum Line Length

**Level:** AUTO-CHECKABLE

Maximum line length is 120 characters.

### DO

```typescript
// Line within 120 characters
const result = this.customerService.getCustomersByStatus(CustomerStatusEnum.Active);

// Break long lines
const filteredCustomers = this.customers
    .filter(c => c.status === CustomerStatusEnum.Active)
    .map(c => c.name);
```

### DO NOT

```typescript
// Line exceeding 120 characters
const result = this.customerService.getCustomersByStatusAndTypeAndRegionAndDateRange(CustomerStatusEnum.Active, CustomerTypeEnum.Premium, 'US', new Date(), new Date());
```

---

## STYLE-005: Brace Style

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Use K&R brace style. Opening brace on same line.

### DO

```typescript
if (condition) {
    doSomething();
} else {
    doSomethingElse();
}

function getName(): string {
    return this.name;
}

class Customer {
    constructor() {
        // ...
    }
}
```

### DO NOT

```typescript
if (condition)
{                              // Opening brace on new line
    doSomething();
}
else
{
    doSomethingElse();
}

function getName(): string
{
    return this.name;
}
```

---

## STYLE-006: Import Ordering

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Imports must be ordered in groups with blank lines between:
1. Angular core imports
2. Third-party library imports
3. Project imports (features/core)
4. Relative imports

### DO

```typescript
// 1. Angular imports
import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// 2. Third-party imports
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 3. Project imports
import { CustomerService } from 'features/feature-crm/cr/service/customer.service';
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';

// 4. Relative imports
import { CustomerDto } from '../model/dto/customer-dto';
import { CustomerStatusEnum } from '../model/enum/customer-status.enum';
```

### DO NOT

```typescript
// Mixed, unordered imports
import { CustomerDto } from '../model/dto/customer-dto';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerService } from 'features/feature-crm/cr/service/customer.service';
import { OnInit } from '@angular/core';
```

---

## STYLE-007: Semicolons

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Always use semicolons at end of statements.

### DO

```typescript
const name = 'John';
let count = 0;
count++;
return result;
```

### DO NOT

```typescript
const name = 'John'    // Missing semicolon
let count = 0
count++
return result
```

---

## STYLE-008: Space After Keywords

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Add space after keywords: if, else, for, while, switch, catch, return.

### DO

```typescript
if (condition) {
    return value;
}

for (const item of items) {
    process(item);
}

while (condition) {
    doWork();
}
```

### DO NOT

```typescript
if(condition) {        // Missing space after if
    return value;
}

for(const item of items) {  // Missing space after for
    process(item);
}
```

---

## STYLE-009: No Multiple Empty Lines

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Maximum one consecutive empty line.

### DO

```typescript
export class CustomerService {
    private cache: Map<number, Customer>;

    constructor() {
        this.cache = new Map();
    }

    getCustomer(id: number): Customer {
        return this.cache.get(id);
    }
}
```

### DO NOT

```typescript
export class CustomerService {
    private cache: Map<number, Customer>;


                                            // Multiple empty lines
    constructor() {
        this.cache = new Map();
    }



    getCustomer(id: number): Customer {     // Multiple empty lines
        return this.cache.get(id);
    }
}
```

---

## STYLE-010: No Trailing Whitespace

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

No trailing whitespace at end of lines.

### DO

```typescript
const name = 'John';
const age = 30;
```

### DO NOT

```typescript
const name = 'John';   ␣␣␣
const age = 30;␣
```

---

## STYLE-011: File Ends with Newline

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Files must end with a single newline character.

### DO

```typescript
export class Customer {
    id: number;
}
⏎
```

### DO NOT

```typescript
export class Customer {
    id: number;
}
// No newline at end of file
```

---

## STYLE-012: Object Property Spacing

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Consistent spacing in object literals.

### DO

```typescript
const customer = { id: 1, name: 'John' };

const config = {
    baseUrl: '/api',
    timeout: 5000,
};
```

### DO NOT

```typescript
const customer = {id:1,name:'John'};  // No spaces

const config = {
    baseUrl:'/api',    // Missing space after colon
    timeout : 5000,    // Space before colon
};
```

---

## STYLE-013: Arrow Function Style

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

Use concise arrow functions when possible.

### DO

```typescript
// Single expression - no braces
const double = (x: number) => x * 2;

// Single parameter - parentheses optional
const items = customers.map(c => c.name);

// Multiple statements - braces required
const process = (item: Item) => {
    validate(item);
    return transform(item);
};
```

### DO NOT

```typescript
// Unnecessary braces and return
const double = (x: number) => { return x * 2; };

// Unnecessary parentheses
const items = customers.map((c) => c.name);
```

---

## STYLE-014: Type Annotation Spacing

**Level:** AUTO-CHECKABLE, AUTO-FIXABLE

No space before colon, one space after colon in type annotations.

### DO

```typescript
const name: string = 'John';
function getName(): string {}
class Customer {
    id: number;
}
```

### DO NOT

```typescript
const name : string = 'John';    // Space before colon
const age:number = 30;           // No space after colon
function getName() : string {}   // Space before colon
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| STYLE-001 | Indentation | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-002 | Quote Style | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-003 | Trailing Commas | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-004 | Maximum Line Length | AUTO-CHECKABLE |
| STYLE-005 | Brace Style | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-006 | Import Ordering | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-007 | Semicolons | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-008 | Space After Keywords | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-009 | No Multiple Empty Lines | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-010 | No Trailing Whitespace | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-011 | File Ends with Newline | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-012 | Object Property Spacing | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-013 | Arrow Function Style | AUTO-CHECKABLE, AUTO-FIXABLE |
| STYLE-014 | Type Annotation Spacing | AUTO-CHECKABLE, AUTO-FIXABLE |
