# Test Harness

> Production-grade component testing framework for isolated Angular component testing with mock data and services.

---

## Overview

The Test Harness (`features/core/shared/test`) enables **isolated component testing** where developers, QA, designers, and business stakeholders can preview Angular components without the full application context.

**Key Capabilities:**
- Test UI components independently with mock data
- Replace backend services with mock implementations
- Preview components at different responsive widths
- Share specific test states via deep-linked URLs
- Provide documentation with code snippets and Figma links

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| Test definition file | `features/feature-*/[module]/test/[module]-test-definition.ts` |
| Mock data files | `features/feature-*/[module]/component/[component]/test/data/mock-*.json` |
| Core types | `features/core/shared/test/data/test-harness.types.ts` |
| Test module registration | `projects/shell-alpha/src/app/test/test.module.ts` |
| Main harness component | `features/core/shared/test/component/test-harness.component.ts` |
| Mock services | `features/core/shared/test/mock/` |

### Display Modes (Responsive Testing)

| Mode | Width | Breakpoint |
|------|-------|------------|
| `xs` | 320px | Mobile small |
| `s` | 480px | Mobile |
| `m` | 768px | Tablet |
| `l` | 992px | Desktop |
| `xl` | 1200px | Desktop large |
| `full` | 100% | Full width |

### Component Types

| Type | Description |
|------|-------------|
| `'Component'` | Standard UI component |
| `'ObjectBaseComponent'` | Entity/object display component |
| `'FormComponent'` | Form-based component |
| `'DialogComponent'` | Dialog/modal component |

### Test Data Types

| Type | Value | Use Case |
|------|-------|----------|
| `local` | 0 | Mock data in JSON files (recommended) |
| `server` | 1 | Data fetched from backend API |

### Special Input Keys (Auto-Converted)

| Key | Conversion |
|-----|------------|
| `objectIdentifier` | `ObjectIdentifier` instance |
| `formGroup` | `MvsFormGroup` with controls |
| `params` | Route parameters |
| `queryParams` | Query parameters |
| `appendTo` | DOM element reference |
| ISO date strings | JavaScript `Date` objects |
| `_mockAgentActiveObjectService` | Mock agent service data |
| `_mockWizardDataStore` | Mock wizard state data |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Module key | Lowercase, 2-3 chars | `'bm'`, `'cr'`, `'cm'` |
| Module label | Full name + key | `'Billing (bm)'` |
| Component key | PascalCase class name | `'BmCustomerComponent'` |
| Test case key | Kebab-case descriptor | `'default'`, `'with-data'` |
| Test data name | Human readable | `'Basic'`, `'With Many Items'` |
| Mock file | `mock-*.json` | `mock-testA.json` |
| Provider export | `MODULE_TEST_PROVIDERS` | `BM_TEST_PROVIDERS` |

---

## Core Concepts

### Selection Hierarchy

```
Module (bm, cr, dm, etc.)
  └── Component (registered in module)
      └── Test Case (defines scenario)
          └── Test Case Data (specific variant)
```

### Registry Pattern

Test modules are registered via Angular's dependency injection using `multi: true`:

```typescript
const TEST_MODULE_REGISTRY = new InjectionToken<TestModuleDefinition[]>('...');

// In module providers
{ provide: TEST_MODULE_REGISTRY, useValue: myModuleEntry, multi: true }
```

### Type Definitions

```typescript
// Test module grouping
interface TestModuleDefinition {
  key: string;                    // Module identifier (bm, cr, dm)
  label: string;                  // Human-readable label
  components: TestComponentDefinition[];
}

// Component for testing
interface TestComponentDefinition {
  key: string;                    // Unique identifier
  type: string;                   // Category for grouping
  label: string;                  // Display name
  component: Type<any>;           // Angular component class
  testCases: TestCase[];          // Test scenarios
  selector: string;               // Component selector
}

// Single test scenario
interface TestCase {
  key: string;                    // Unique identifier
  label: string;                  // Human-readable name
  description?: string;           // Scenario description
  testCaseData: TestCaseData[];   // Data snapshots
  dataProvider?: Type<TestCaseDataProvider>;
}

// Test data variant
interface TestCaseData {
  id: number;
  name: string;
  json: string;                   // Stringified JSON data
  dataType: number;               // 0 = local, 1 = server
  type: TestCaseDataType;
}
```

### Rendering Flow

1. User selects module → component → test case → test data
2. Harness destroys previous component instance
3. Creates `MockActivatedRoute` and `MockRouter`
4. Creates custom injector with mock services
5. Dynamically creates component with injector
6. Parses test case JSON
7. Applies inputs via Angular's `setInput()` API
8. Initializes mock services from special keys
9. Attaches navigation sidebars

---

## Implementation Guide

### Step 1: Create Mock Data File

Create JSON file for component test data:

**File:** `features/feature-[name]/[module]/component/[component]/test/data/mock-testA.json`

```json
{
    "title": "Test Title",
    "items": [
        { "id": 1, "name": "Item 1" },
        { "id": 2, "name": "Item 2" }
    ],
    "params": { "id": "123" },
    "queryParams": { "tab": "details" }
}
```

### Step 2: Create Test Definition File

**File:** `features/feature-[name]/[module]/test/[module]-test-definition.ts`

```typescript
import { Provider } from '@angular/core';
import { TEST_MODULE_REGISTRY, TestCaseDataType, TestModuleDefinition } from '@core/shared/test/data/test-harness.types';
import { MyComponent } from '../component/my-component/my-component.component';
import MockDataA from '../component/my-component/test/data/mock-testA.json';

const myModuleEntry: TestModuleDefinition = {
    key: 'my',
    label: 'My Module (my)',
    components: [
        {
            key: 'MyComponent',
            component: MyComponent,
            selector: 'app-my-component',
            type: 'Component',
            label: 'My Component',
            testCases: [
                {
                    key: 'default',
                    label: 'Default State',
                    description: 'Shows the component in default state',
                    testCaseData: [
                        {
                            id: 1,
                            name: 'Basic',
                            json: JSON.stringify(MockDataA),
                            dataType: 0,
                            type: TestCaseDataType.local
                        }
                    ]
                }
            ]
        }
    ]
};

export const MY_TEST_PROVIDERS: Provider[] = [
    { provide: TEST_MODULE_REGISTRY, useValue: myModuleEntry, multi: true }
];
```

### Step 3: Register in Test Module

**File:** `projects/shell-alpha/src/app/test/test.module.ts`

```typescript
import { MY_TEST_PROVIDERS } from '../../../../../features/feature-[name]/[module]/test/[module]-test-definition';

@NgModule({
    imports: [...],
    providers: [
        ...MY_TEST_PROVIDERS
    ]
})
export class TestModule {}
```

---

## Complete Examples

### Example 1: Basic Component Test

**Mock Data:** `features/feature-crm/cr/component/cr-ticket-list/test/data/mock-tickets.json`

```json
{
    "tickets": [
        {
            "id": 1,
            "title": "Login Issue",
            "status": "open",
            "priority": "high",
            "createdAt": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "title": "Payment Failed",
            "status": "in_progress",
            "priority": "medium",
            "createdAt": "2024-01-14T08:00:00Z"
        }
    ],
    "totalCount": 2,
    "params": { "customerId": "456" },
    "queryParams": { "status": "open" }
}
```

**Test Definition:** `features/feature-crm/cr/test/cr-test-definition.ts`

```typescript
import { Provider } from '@angular/core';
import { TEST_MODULE_REGISTRY, TestCaseDataType, TestModuleDefinition } from '@core/shared/test/data/test-harness.types';
import { CrTicketListComponent } from '../component/cr-ticket-list/cr-ticket-list.component';
import MockTickets from '../component/cr-ticket-list/test/data/mock-tickets.json';

const crModuleEntry: TestModuleDefinition = {
    key: 'cr',
    label: 'CRM (cr)',
    components: [
        {
            key: 'CrTicketListComponent',
            component: CrTicketListComponent,
            selector: 'cr-ticket-list',
            type: 'Component',
            label: 'Ticket List',
            testCases: [
                {
                    key: 'with-tickets',
                    label: 'With Tickets',
                    description: 'Shows a list of tickets',
                    testCaseData: [
                        {
                            id: 1,
                            name: 'Multiple Tickets',
                            json: JSON.stringify(MockTickets),
                            dataType: 0,
                            type: TestCaseDataType.local
                        }
                    ]
                },
                {
                    key: 'empty-state',
                    label: 'Empty State',
                    description: 'Shows empty state when no tickets',
                    testCaseData: [
                        {
                            id: 2,
                            name: 'No Tickets',
                            json: JSON.stringify({ tickets: [], totalCount: 0 }),
                            dataType: 0,
                            type: TestCaseDataType.local
                        }
                    ]
                }
            ]
        }
    ]
};

export const CR_TEST_PROVIDERS: Provider[] = [
    { provide: TEST_MODULE_REGISTRY, useValue: crModuleEntry, multi: true }
];
```

### Example 2: ObjectBaseComponent with Entity Data

```typescript
{
    key: 'BmCustomerObjectComponent',
    component: BmCustomerObjectComponent,
    selector: 'bm-customer-object',
    type: 'ObjectBaseComponent',
    label: 'Customer Object',
    testCases: [
        {
            key: 'view-mode',
            label: 'View Mode',
            testCaseData: [
                {
                    id: 1,
                    name: 'Active Customer',
                    json: JSON.stringify({
                        objectIdentifier: {
                            objectType: 'bm.Customer',
                            objectId: 123
                        },
                        dto: {
                            id: 123,
                            name: 'John Doe',
                            email: 'john@example.com',
                            status: 'ACTIVE'
                        },
                        uiMode: 'side'
                    }),
                    dataType: 0,
                    type: TestCaseDataType.local
                }
            ]
        }
    ]
}
```

### Example 3: Form Component with FormGroup

```typescript
{
    key: 'CustomerFormComponent',
    component: CustomerFormComponent,
    selector: 'app-customer-form',
    type: 'FormComponent',
    label: 'Customer Form',
    testCases: [
        {
            key: 'create-mode',
            label: 'Create Mode',
            testCaseData: [
                {
                    id: 1,
                    name: 'Empty Form',
                    json: JSON.stringify({
                        formGroup: {
                            name: '',
                            email: '',
                            phone: ''
                        },
                        mode: 'create'
                    }),
                    dataType: 0,
                    type: TestCaseDataType.local
                }
            ]
        },
        {
            key: 'edit-mode',
            label: 'Edit Mode',
            testCaseData: [
                {
                    id: 2,
                    name: 'Populated Form',
                    json: JSON.stringify({
                        formGroup: {
                            name: 'Jane Smith',
                            email: 'jane@example.com',
                            phone: '+1234567890'
                        },
                        mode: 'edit'
                    }),
                    dataType: 0,
                    type: TestCaseDataType.local
                }
            ]
        }
    ]
}
```

### Example 4: Component with Mock Services

```typescript
{
    key: 'AgentDashboardComponent',
    component: AgentDashboardComponent,
    selector: 'app-agent-dashboard',
    type: 'Component',
    label: 'Agent Dashboard',
    testCases: [
        {
            key: 'with-active-objects',
            label: 'With Active Objects',
            testCaseData: [
                {
                    id: 1,
                    name: 'Multiple Active',
                    json: JSON.stringify({
                        _mockAgentActiveObjectService: [
                            { id: 1, objectType: 'cr.Ticket', objectId: 100, status: 'active' },
                            { id: 2, objectType: 'cr.Customer', objectId: 200, status: 'pending' }
                        ],
                        _mockWizardDataStore: {
                            address: { street: 'Main St', city: 'Berlin' },
                            selectedContracts: []
                        }
                    }),
                    dataType: 0,
                    type: TestCaseDataType.local
                }
            ]
        }
    ]
}
```

### Example 5: Lazy Loading with Data Provider

```typescript
import { Injectable } from '@angular/core';
import { TestCaseDataProvider } from '@core/shared/test/data/test-harness.types';
import { Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';

@Injectable({ providedIn: 'root' })
export class CustomerTestDataProvider implements TestCaseDataProvider {
    constructor(private customerService: CustomerService) {}

    load(
        args: Record<string, unknown>,
        ctx: { moduleKey: string; componentKey: string; caseKey: string }
    ): Observable<Record<string, unknown>> {
        return this.customerService.getById(args['id'] as number);
    }
}

// In test definition:
{
    key: 'dynamic-customer',
    label: 'Dynamic Customer Data',
    dataProvider: CustomerTestDataProvider,
    dataProviderArgs: { id: 123 },
    preferProvider: true,
    testCaseData: []
}
```

---

## Mock Services

### MockActivatedRoute

Simulates Angular's `ActivatedRoute`:

```typescript
// Set via JSON keys
{ "params": { "id": "123" }, "queryParams": { "tab": "details" } }

// Runtime updates available
mockRoute.setParams({ id: '456' });
mockRoute.setQueryParams({ tab: 'overview' });
```

### MockRouter

Simulates Angular Router without URL changes:

- `navigate()` updates MockActivatedRoute queryParams
- Emits `NavigationEnd` events
- Supports query param merge strategies

### MockAgentActiveObjectService

Initialize via `_mockAgentActiveObjectService` key:

```json
{
    "_mockAgentActiveObjectService": [
        { "id": 1, "objectType": "cr.Ticket", "objectId": 100, "status": "active" }
    ]
}
```

### MockWizardDataStoreService

Initialize via `_mockWizardDataStore` key:

```json
{
    "_mockWizardDataStore": {
        "address": { "street": "Main St", "city": "Berlin" },
        "contracts": [],
        "notifications": []
    }
}
```

---

## Checklist for Adding Component

1. Create mock data JSON file(s) in `component/[name]/test/data/`
2. Import component in test definition file
3. Import mock data JSON file(s)
4. Add component to `components` array with:
   - `key` - unique identifier (PascalCase class name)
   - `component` - class reference
   - `selector` - component selector
   - `type` - component category
   - `label` - display name
   - `testCases` - array of test scenarios
5. Each test case has:
   - `key` - unique identifier (kebab-case)
   - `label` - display name
   - `testCaseData` - array of data variants
6. Each test case data has:
   - `id` - unique number
   - `name` - variant name
   - `json` - stringified JSON data
   - `dataType` - 0 for local
   - `type` - TestCaseDataType.local
7. Export providers array as `MODULE_TEST_PROVIDERS`
8. Register providers in `test.module.ts`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Component not appearing | Check if providers are registered in `test.module.ts` |
| Data not loading | Verify JSON is valid and properly stringified |
| Inputs not applied | Check input property names match JSON keys |
| Mock route not working | Use `params` and `queryParams` keys in JSON |
| Dates showing as strings | Harness auto-converts ISO date strings to Date objects |
| Mock service not initialized | Use `_mockAgentActiveObjectService` or `_mockWizardDataStore` keys |

---

## File Structure

```
features/feature-[name]/[module]/
├── test/
│   └── [module]-test-definition.ts
├── component/
│   └── [component-name]/
│       ├── [component-name].component.ts
│       └── test/
│           └── data/
│               ├── mock-testA.json
│               └── mock-testB.json

features/core/shared/test/
├── component/
│   └── test-harness.component.ts
├── page/
│   └── test-harness.page.ts
├── data/
│   └── test-harness.types.ts
├── mock/
│   ├── mock-activated-route.ts
│   ├── mock-router.ts
│   ├── mock-agent-active-object.service.ts
│   └── mock-wizard-data-store.service.ts
└── services/
    ├── harness-navigation.service.ts
    └── harness-ijector.service.ts
```