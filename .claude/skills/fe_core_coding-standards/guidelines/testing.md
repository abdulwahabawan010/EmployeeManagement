# Testing Guidelines

Rules governing test file location, naming patterns, and test structure.

---

## TEST-001: Test File Co-location

**Level:** AUTO-CHECKABLE

Test files must be co-located with the file they test, in the same directory.

### DO

```
component/
└── customer-list-component/
    ├── customer-list.component.ts
    ├── customer-list.component.html
    ├── customer-list.component.scss
    └── customer-list.component.spec.ts  // Co-located

service/
├── customer.service.ts
└── customer.service.spec.ts  // Co-located
```

### DO NOT

```
component/
└── customer-list-component/
    ├── customer-list.component.ts
    └── customer-list.component.html

tests/                                    // Separate test folder
└── customer-list.component.spec.ts       // Not co-located
```

---

## TEST-002: Test File Naming

**Level:** AUTO-CHECKABLE

Test files must use `.spec.ts` suffix matching the source file name.

### DO

```
customer.service.ts       → customer.service.spec.ts
customer-list.component.ts → customer-list.component.spec.ts
customer-status.enum.ts   → customer-status.enum.spec.ts
customer.pipe.ts          → customer.pipe.spec.ts
```

### DO NOT

```
customer.service.ts       → customer.test.ts      // Wrong suffix
customer.service.ts       → customerService.spec.ts  // Name mismatch
customer.service.ts       → customer-service-spec.ts // Wrong format
```

---

## TEST-003: Describe Block Naming

**Level:** AUTO-CHECKABLE

Root describe block must match the class/function being tested.

### DO

```typescript
// customer.service.spec.ts
describe('CustomerService', () => {
    // ...
});

// customer-list.component.spec.ts
describe('CustomerListComponent', () => {
    // ...
});
```

### DO NOT

```typescript
// customer.service.spec.ts
describe('Customer Service Tests', () => {  // Does not match class name
    // ...
});

describe('Tests', () => {  // Too generic
    // ...
});
```

---

## TEST-004: Nested Describe for Methods

**Level:** AUTO-CHECKABLE

Use nested describe blocks for testing methods.

### DO

```typescript
describe('CustomerService', () => {
    describe('getCustomer', () => {
        it('should return customer by id', () => {});
        it('should return null for unknown id', () => {});
    });

    describe('updateCustomer', () => {
        it('should update customer data', () => {});
        it('should throw error for invalid data', () => {});
    });
});
```

### DO NOT

```typescript
describe('CustomerService', () => {
    it('should return customer by id', () => {});
    it('should return null for unknown id', () => {});
    it('should update customer data', () => {});  // All tests flat
});
```

---

## TEST-005: Test Case Naming

**Level:** AUTO-CHECKABLE

Test case names must start with "should" and describe expected behavior.

### DO

```typescript
it('should return customer when id exists', () => {});
it('should throw error when id is null', () => {});
it('should emit event when customer is updated', () => {});
it('should display loading spinner while fetching', () => {});
```

### DO NOT

```typescript
it('returns customer', () => {});           // Missing "should"
it('getCustomer works', () => {});          // Vague
it('test customer retrieval', () => {});    // Starts with "test"
it('customer', () => {});                   // Not descriptive
```

---

## TEST-006: Arrange-Act-Assert Pattern

**Level:** MANUAL-ONLY

Tests must follow Arrange-Act-Assert (AAA) pattern with clear sections.

### DO

```typescript
it('should return customer when id exists', () => {
    // Arrange
    const customerId = 1;
    const expectedCustomer = { id: 1, name: 'John' };
    customerRepository.findById.mockReturnValue(expectedCustomer);

    // Act
    const result = service.getCustomer(customerId);

    // Assert
    expect(result).toEqual(expectedCustomer);
    expect(customerRepository.findById).toHaveBeenCalledWith(customerId);
});
```

### DO NOT

```typescript
it('should return customer when id exists', () => {
    expect(service.getCustomer(1)).toEqual({ id: 1, name: 'John' });
    // Everything mixed together, no clear structure
});
```

---

## TEST-007: One Assertion Concept Per Test

**Level:** MANUAL-ONLY

Each test should verify one logical concept. Multiple assertions are allowed if they verify the same concept.

### DO

```typescript
it('should create customer with generated id', () => {
    const result = service.createCustomer({ name: 'John' });

    // Multiple assertions for same concept (customer creation)
    expect(result.id).toBeDefined();
    expect(result.name).toBe('John');
    expect(result.createdAt).toBeDefined();
});
```

### DO NOT

```typescript
it('should create and update customer', () => {
    // Testing two different concepts in one test
    const created = service.createCustomer({ name: 'John' });
    expect(created.id).toBeDefined();

    const updated = service.updateCustomer(created.id, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
});
```

---

## TEST-008: Mock External Dependencies

**Level:** MANUAL-ONLY

External dependencies (HTTP, services) must be mocked in unit tests.

### DO

```typescript
describe('CustomerService', () => {
    let service: CustomerService;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;

    beforeEach(() => {
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        service = new CustomerService(httpClientSpy);
    });

    it('should fetch customer from API', () => {
        const expectedCustomer = { id: 1, name: 'John' };
        httpClientSpy.get.and.returnValue(of(expectedCustomer));

        service.getCustomer(1).subscribe(customer => {
            expect(customer).toEqual(expectedCustomer);
        });
    });
});
```

### DO NOT

```typescript
describe('CustomerService', () => {
    let service: CustomerService;

    beforeEach(() => {
        // DO NOT use real HttpClient in unit tests
        service = new CustomerService(new HttpClient(...));
    });
});
```

---

## TEST-009: Test Data Builders

**Level:** MANUAL-ONLY

Use test data builders or factories for complex test data.

### DO

```typescript
// test/builders/customer.builder.ts
export class CustomerBuilder {
    private customer: Partial<Customer> = {
        id: 1,
        name: 'Default Name',
        status: CustomerStatusEnum.Active,
    };

    withId(id: number): CustomerBuilder {
        this.customer.id = id;
        return this;
    }

    withName(name: string): CustomerBuilder {
        this.customer.name = name;
        return this;
    }

    build(): Customer {
        return this.customer as Customer;
    }
}

// Usage in test
const customer = new CustomerBuilder()
    .withId(1)
    .withName('John')
    .build();
```

### DO NOT

```typescript
it('should process customer', () => {
    // DO NOT create complex objects inline
    const customer = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        status: CustomerStatusEnum.Active,
        address: {
            street: '123 Main St',
            city: 'New York',
            // ... many more properties
        },
    };
});
```

---

## TEST-010: No Test Implementation Leakage

**Level:** AUTO-CHECKABLE

Production code must not contain test-only code or conditions.

### DO

```typescript
// customer.service.ts - Production code only
export class CustomerService {
    getCustomer(id: number): Customer {
        return this.http.get<Customer>(`/api/customers/${id}`);
    }
}
```

### DO NOT

```typescript
// customer.service.ts
export class CustomerService {
    getCustomer(id: number): Customer {
        // DO NOT add test conditions in production code
        if (environment.testing) {
            return MOCK_CUSTOMER;
        }
        return this.http.get<Customer>(`/api/customers/${id}`);
    }
}
```

---

## TEST-011: Test Harness Data Location

**Level:** AUTO-CHECKABLE

Test harness mock data must be in `test/data/` directory within component folder.

### DO

```
component/
└── customer-list-component/
    ├── customer-list.component.ts
    └── test/
        └── data/
            ├── mock-customers.json
            └── mock-empty-list.json
```

### DO NOT

```
component/
└── customer-list-component/
    ├── customer-list.component.ts
    ├── mock-customers.json           // Not in test/data/
    └── test-data.json                 // Wrong naming, wrong location
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| TEST-001 | Test File Co-location | AUTO-CHECKABLE |
| TEST-002 | Test File Naming | AUTO-CHECKABLE |
| TEST-003 | Describe Block Naming | AUTO-CHECKABLE |
| TEST-004 | Nested Describe for Methods | AUTO-CHECKABLE |
| TEST-005 | Test Case Naming | AUTO-CHECKABLE |
| TEST-006 | Arrange-Act-Assert Pattern | MANUAL-ONLY |
| TEST-007 | One Assertion Concept Per Test | MANUAL-ONLY |
| TEST-008 | Mock External Dependencies | MANUAL-ONLY |
| TEST-009 | Test Data Builders | MANUAL-ONLY |
| TEST-010 | No Test Implementation Leakage | AUTO-CHECKABLE |
| TEST-011 | Test Harness Data Location | AUTO-CHECKABLE |
