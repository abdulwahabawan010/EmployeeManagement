---
name: fe_core_ql
description: "Frontend: Expert guidance on Query Language (QL) for data retrieval including entities, aliases, joins, filters, pipes, inter-query dependencies, FK field naming, and QlQueryBuilder. Use when writing QL queries, implementing QlService data fetching, inter-query dependencies, debugging QL issues, or optimizing query performance. Covers QlQueryDto, QlRequestDto, QlQueryBuilder, FilterCriteria, dependsOn, logics, and validation patterns."
---

# QL (Query Language)

## Overview

QL is the **default and preferred data access mechanism** for the application. It provides a declarative, performant, and type-safe way to fetch backend data through a single abstraction layer.

**Key Principle:** QL separates **WHAT data is requested** (queries) from **HOW data is returned** (pipes).

---

## When to Use This Skill

Use QL when:
- Fetching lists or single entities
- Fetching related data (joins)
- Loading dashboard data
- Powering widgets
- Fetching form metadata
- Performing batch data retrieval

**Do NOT use QL when:**
- Data is purely static
- Backend explicitly forbids QL usage
- A trivial in-memory dataset is sufficient

---

## Critical Rules (Apply IMMEDIATELY)

### 1. Priority Rules
- ✅ QL has higher priority than ObjectRequest
- ❌ NEVER combine multiple QL calls with forkJoin (use batching instead)
- ✅ Always batch related queries

### 2. Single-Assignment Rule (MANDATORY)

**QL queries MUST be created in a single assignment.** Do NOT split query construction into multiple intermediate variables.

```ts
// ❌ FORBIDDEN - Multiple intermediate variables
const personJoin: QlJoinDto = { type: 'entity', name: 'person', as: 'p', joinType: 'left' };
const customerJoin: QlJoinDto = { type: 'entity', name: 'customer', as: 'c', joinType: 'left', joins: [personJoin] };
const bankAccountJoin: QlJoinDto = { type: 'entity', name: 'bankAccount', as: 'ba', joinType: 'left' };

const qlQuery: QlQueryDto = {
  name: 'myQuery',
  type: 'view',
  start: {
    name: 'bm.CustomerBillingAccount',
    as: 'e',
    type: 'entity',
    joins: [customerJoin, bankAccountJoin]
  }
};

// ✅ CORRECT - Single assignment with inline definitions
const qlQuery: QlQueryDto = {
  name: 'myQuery',
  type: 'view',
  start: {
    name: 'bm.CustomerBillingAccount',
    as: 'e',
    type: 'entity',
    joins: [
      {
        type: 'entity',
        name: 'customer',
        as: 'c',
        joinType: 'left',
        joins: [
          { type: 'entity', name: 'person', as: 'p', joinType: 'left' }
        ]
      },
      { type: 'entity', name: 'bankAccount', as: 'ba', joinType: 'left' }
    ]
  }
};
```

**Why:** Single-assignment improves readability by keeping the entire query structure visible at once. Intermediate variables fragment the query logic and make it harder to understand the full query shape.

### 3. Alias Rules
- Every entity (root or joined) **MUST have an alias**
- Root entity: typically `e`
- Joined entities: custom aliases (`c`, `u`, `fvl`, etc.)
- All field references MUST use aliases: `e.fieldName`, `u.fieldName`

### 4. Foreign Key (FK) Field Naming Convention

**CRITICAL: Before referencing ANY field, determine if it's a Foreign Key.**

**Decision Process:**
1. Is the field a relationship to another entity (ManyToOne, OneToOne)?
2. **YES (FK)** → append `Id` suffix: `e.customerId`, `e.projectId`
3. **NO (regular field)** → use field name as-is: `e.name`, `e.status`

```ts
// ✅ CORRECT - FK fields with Id suffix
FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, customerId)
FilterCriteria.create('e.projectId', FilterCriteria.cOperatorEqual, projectId)

// ✅ CORRECT - Regular fields without Id suffix
FilterCriteria.create('e.name', FilterCriteria.cOperatorContainsPattern, searchTerm)
FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)

// ❌ WRONG - Missing Id suffix for FK
FilterCriteria.create('e.customer', ...)  // Should be 'e.customerId'

// ❌ WRONG - Adding Id to non-FK field
FilterCriteria.create('e.nameId', ...)    // Should be 'e.name'
```

> **Note:** This is DIFFERENT from ObjectRequestList, which uses relationship names without `Id` suffix. See ObjectRequestList documentation.

### 5. FK Traversal with Joins

**CRITICAL: You CANNOT traverse FK relationships using dot notation in filters.**

**When filtering by a related entity's attribute:**
1. Create a JOIN to the related entity with its own alias
2. Apply the filter using the JOINED entity's alias

```ts
// ❌ WRONG - Attempting dot notation through FK
FilterCriteria.create('cc.customer.name', FilterCriteria.cOperatorEqual, 'Max')

// ✅ CORRECT - Using JOIN with separate alias
const query: QlQueryDto = {
  name: 'contracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'cc'
  },
  joins: [
    {
      type: 'simpleAttribute',
      name: 'customer',  // FK attribute name (without Id suffix in join)
      as: 'c'            // Alias for joined entity
    }
  ],
  filters: [
    // Filter on JOINED entity using its alias
    FilterCriteria.create('c.name', FilterCriteria.cOperatorEqual, 'Max')
  ]
};
```

### 6. Filter and Sorting Rules
- ✅ ALWAYS use `FilterCriteria.create(...)`
- ❌ NEVER construct filter objects manually
- ✅ ALWAYS use `new Sorting(...)`
- ✅ Field paths MUST include alias prefix

### 7. Queries and Pipes
- Always define BOTH queries AND pipes
- Access results via `response.pipeData[pipeName]`
- Never access by query name

---

## Core Concepts

### Entities

Entities represent backend data models. Format: `[module].[EntityName]`

**Examples:**
- `cr.Customer` – Customer Relations module
- `tm.Ticket` – Ticket Management module
- `um.User` – User Management module
- `ci.InsurableObject` – Claims/Insurance module
- `cc.FieldValueListEntry` – Core Configuration module

Every query starts with a root entity:

```ts
start: {
  type: 'entity',
  name: 'cr.Customer',
  as: 'e'
}
```

### Aliases

**Purpose:**
- Reference fields in filters, sorting, field selection
- Avoid naming collisions
- Link filters and joins correctly

**Conventions:**
- Root entity: `e`
- Joined entities: `c`, `u`, `i`, `fvl`, `t`, etc.

**Usage:**
```ts
// Root entity field
FilterCriteria.create('e.id', FilterCriteria.cOperatorEqual, 28274)

// Joined entity field
FilterCriteria.create('fvl.id', FilterCriteria.cOperatorEqual, listId)

// Sorting
new Sorting('e.createdDate', false)
```

### Joins

Retrieve related entities in a single query.

**Join Types:**
- `left` – Left outer join
- `inner` – Inner join
- `right` – Right outer join (rarely used)

**Recursive Nesting:**
```
Root Entity
 └─ Join Level 1
     └─ Join Level 2
         └─ Join Level 3
```

**Example:**
```ts
joins: [
  {
    joinType: 'left',
    type: 'entity',
    name: 'customer',
    as: 'c',
    joins: [  // Nested join
      {
        joinType: 'left',
        type: 'entity',
        name: 'address',
        as: 'a'
      }
    ]
  }
]
```

---

## Architecture

- **Single backend endpoint:** `/core/ql/query`
- **Automatic batching:** Requests within ~50ms
- **Support for:** Filtering, sorting, pagination, joins
- **Technology:** TypeScript DTOs, RxJS

**Two-Layer Structure:**
1. **Queries** – Define WHAT data to fetch
2. **Pipes** – Define HOW data is returned

**Results are ALWAYS returned by pipe name, NEVER by query name.**

---

## Complete Example

```ts
const query: QlQueryDto = {
  name: 'customers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.Customer',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ],
  sortings: [
    new Sorting('e.createdDate', false)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'customers',
  type: 'simple',
  simpleQuery: 'customers',
  settings: {
    includeForm: true,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const customers = res.pipeData['customers']?.data ?? [];
});
```

---

## QlQueryBuilder (MANDATORY for Direct QL Usage)

**CRITICAL: When fetching data directly via QL in components or services, you MUST use the `QlQueryBuilder`.** The builder provides a fluent API that reduces boilerplate, auto-generates pipes, and handles error display automatically.

### Why Use QlQueryBuilder?

1. **Automatic pipe generation** - No need to manually create pipes; they are auto-generated from query names
2. **Built-in error handling** - Pipeline errors are automatically displayed to users via `MvsMessageService`
3. **Cleaner code** - Fluent API reduces verbose DTO construction
4. **Consistent result access** - `QlQueryResult` wrapper provides convenient methods like `get()`, `getCount()`, `getForm()`

### Basic Usage

```ts
// ✅ CORRECT - Using QlQueryBuilder
this.qlService.builder()
    .query({
        name: 'customers',
        type: 'view',
        start: {
            type: 'entity',
            name: 'cr.Customer',
            as: 'e'
        },
        filters: [
            FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
        ],
        sortings: [
            new Sorting('e.createdDate', false)
        ]
    })
    .execute()
    .subscribe(result => {
        const customers = result.get('customers');  // Returns data array
        const count = result.getCount('customers'); // Returns total count
        const form = result.getForm('customers');   // Returns form metadata
    });
```

### Builder Methods

| Method | Description |
|--------|-------------|
| `query(queryDto)` | Add a single query to the batch. Returns builder for chaining. |
| `queries(...queryDtos)` | Add multiple queries at once. Returns builder for chaining. |
| `pipe(pipeSettings)` | Define a custom pipe (only if non-default settings needed). |
| `showErrors(boolean)` | Enable/disable automatic error display. Default: `true`. |
| `execute()` | Execute queries and return `Observable<QlQueryResult>`. |
| `executeRaw()` | Execute queries and return raw `Observable<any>` response. |
| `reset()` | Reset builder for reuse (clears queries, pipes, resets showErrors to true). |

### QlQueryResult Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `get(name)` | `any[]` | Get data array for a pipe by name. Returns `[]` if not found. |
| `getCount(name)` | `number` | Get total count for a pipe. Returns `0` if not found. |
| `getForm(name)` | `any` | Get form metadata for a pipe. |
| `getPipeResult(name)` | `any` | Get full pipe result including data, form, info, messages. |
| `getRawResponse()` | `any` | Get the complete raw response object. |

### Batch Queries (Multiple Queries)

```ts
// Batch multiple queries in a single request
this.qlService.builder()
    .query({
        name: 'activeCustomers',
        type: 'view',
        start: { type: 'entity', name: 'cr.Customer', as: 'e' },
        filters: [FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)]
    })
    .query({
        name: 'recentOrders',
        type: 'view',
        start: { type: 'entity', name: 'om.Order', as: 'e' },
        filters: [FilterCriteria.create('e.createdDate', FilterCriteria.cOperatorGreaterEqual, lastWeek)]
    })
    .execute()
    .subscribe(result => {
        const customers = result.get('activeCustomers');
        const orders = result.get('recentOrders');
    });
```

### Custom Pipe Settings

By default, pipes are auto-generated with:
- `type: 'simple'`
- `settings: { includeCount: false, includeForm: false }`

To customize pipe settings:

```ts
this.qlService.builder()
    .query({
        name: 'customersWithForm',
        type: 'view',
        start: { type: 'entity', name: 'cr.Customer', as: 'e' }
    })
    .pipe({
        name: 'customersWithForm',
        simpleQuery: 'customersWithForm',
        settings: { includeCount: true, includeForm: true }
    })
    .execute()
    .subscribe(result => {
        const customers = result.get('customersWithForm');
        const count = result.getCount('customersWithForm');
        const form = result.getForm('customersWithForm');
    });
```

### Error Handling

Pipeline errors are automatically displayed by default. To disable:

```ts
this.qlService.builder()
    .query({ ... })
    .showErrors(false)  // Disable automatic error display
    .execute()
    .subscribe(result => { ... });
```

### GroupBy Example with Builder

```ts
this.qlService.builder()
    .query({
        name: 'callUsage',
        type: 'view',
        start: {
            type: 'groupBy',
            name: 'pc.Call',
            as: 'e',
            fields: [
                { name: 'callType' },  // NOTE: Use relationship name, NOT 'callTypeId'
                { name: '*', function: 'count', as: 'count' }
            ]
        },
        filters: [
            FilterCriteria.create('e.agentId', FilterCriteria.cOperatorEqual, agentId)
        ]
    })
    .execute()
    .subscribe(result => {
        const usageData = result.get('callUsage');
        // usageData: [{ 'e.callType': 1, 'e.count': 5 }, { 'e.callType': 2, 'e.count': 3 }]
    });
```

### Anti-Patterns

```ts
// ❌ WRONG - Manual request construction for direct QL usage
const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];
this.qlService.query(request).subscribe(...);

// ✅ CORRECT - Use builder
this.qlService.builder()
    .query(query)
    .execute()
    .subscribe(...);
```

---

## GroupBy Queries (Aggregations)

Use `type: 'groupBy'` for COUNT, SUM, AVG, MIN, MAX aggregations.

### Key Concepts

1. **Regular fields** in `fields[]` become GROUP BY columns
2. **Function fields** (with `function` property) become aggregation expressions
3. **`filters`** → WHERE clause (applied before GROUP BY)
4. **`functionFilters`** → HAVING clause (applied after GROUP BY)

### CRITICAL: GroupBy Field Naming vs Filter FK Naming

**The FK naming convention (`Id` suffix) applies ONLY to filters, NOT to groupBy fields.**

| Context | FK Field Reference | Example |
|---------|-------------------|---------|
| **Filters** | Use `Id` suffix | `FilterCriteria.create('e.callTypeId', ...)` |
| **GroupBy fields** | Use relationship name (NO `Id` suffix) | `{ name: 'callType' }` |

```ts
// ❌ WRONG - Using 'Id' suffix in groupBy fields
start: {
    type: 'groupBy',
    name: 'pc.Call',
    as: 'e',
    fields: [
        { name: 'callTypeId' },  // ❌ WRONG! Will cause "groupByMemberName is null" error
        { name: '*', function: 'count', as: 'count' }
    ]
},
filters: [
    FilterCriteria.create('e.agentId', FilterCriteria.cOperatorEqual, agentId)  // ✅ Correct in filter
]

// ✅ CORRECT - Using relationship name in groupBy fields
start: {
    type: 'groupBy',
    name: 'pc.Call',
    as: 'e',
    fields: [
        { name: 'callType' },  // ✅ CORRECT! Use relationship name
        { name: '*', function: 'count', as: 'count' }
    ]
},
filters: [
    FilterCriteria.create('e.agentId', FilterCriteria.cOperatorEqual, agentId)  // ✅ Correct in filter
]
```

**Result Access:** When accessing groupBy results, use the alias prefix:
```ts
const callTypeId = item['e.callType'];  // NOT 'e.callTypeId'
const count = item['e.count'];
```

### CRITICAL: GroupBy with Joins

**When performing `groupBy` over multiple joined entities, ALL join levels must use `type: 'groupBy'`, not `type: 'entity'`.**

| Scenario | Start Type | Join Type |
|----------|------------|-----------|
| Simple entity query | `'entity'` | `'entity'` |
| Simple groupBy (no joins) | `'groupBy'` | N/A |
| **GroupBy with joins** | `'groupBy'` | **`'groupBy'`** |

### Example: Simple GroupBy on Entity Field

Group CustomerContract by entityStatus with count (based on test17):

```ts
const query: QlQueryDto = {
  name: 'customerContractsByStatus',
  type: 'view',
  start: {
    type: 'groupBy',  // KEY: groupBy type
    name: 'cr.CustomerContract',
    as: 'e',
    fields: [
      { name: 'entityStatus' },  // GROUP BY column
      { name: '*', function: 'count', as: 'count' }  // COUNT(*)
    ]
  },
  filters: [
    FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, customerId)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'customerContractsByStatus',
  type: 'simple',
  simpleQuery: 'customerContractsByStatus',
  settings: { includeCount: true }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(response => {
  const results = response.pipeData['customerContractsByStatus']?.data ?? [];
  // results: [{ 'e.entityStatus': 0, 'e.count': 3 }, { 'e.entityStatus': 1, 'e.count': 2 }]
});
```

### Example: GroupBy with Nested Joins

Group CustomerContract by ContractType.name through nested joins (based on test18):

```ts
// ✅ CORRECT - All join levels use type: 'groupBy'
const query: QlQueryDto = {
  name: 'customerContractsByContractType',
  type: 'view',
  start: {
    type: 'groupBy',  // KEY: groupBy type
    name: 'cr.CustomerContract',
    as: 'e',
    fields: [
      { name: '*', function: 'count', as: 'count' }  // COUNT(*)
    ],
    joins: [
      {
        type: 'groupBy',  // CRITICAL: Must be 'groupBy', NOT 'entity'
        name: 'contract',
        as: 'c',
        joins: [
          {
            type: 'groupBy',  // CRITICAL: Must be 'groupBy', NOT 'entity'
            name: 'contractType',
            as: 'ct',
            fields: [
              { name: 'name' }  // GROUP BY column on nested join
            ]
          }
        ]
      }
    ]
  },
  filters: [
    FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, customerId)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'customerContractsByContractType',
  type: 'simple',
  simpleQuery: 'customerContractsByContractType'
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(response => {
  const results = response.pipeData['customerContractsByContractType']?.data ?? [];
  // results: [{ 'ct.name': 'TypeA', 'e.count': 3 }, { 'ct.name': 'TypeB', 'e.count': 2 }]
});
```

### Common GroupBy Mistake

```ts
// ❌ WRONG - Using 'entity' type for joins within a groupBy query
const query: QlQueryDto = {
  name: 'wrong',
  type: 'view',
  start: {
    type: 'groupBy',
    name: 'cr.CustomerContract',
    as: 'e',
    joins: [
      {
        type: 'entity',  // ❌ WRONG! Must be 'groupBy'
        name: 'contract',
        as: 'c'
      }
    ]
  }
};

// ✅ CORRECT - Using 'groupBy' type for joins
const query: QlQueryDto = {
  name: 'correct',
  type: 'view',
  start: {
    type: 'groupBy',
    name: 'cr.CustomerContract',
    as: 'e',
    joins: [
      {
        type: 'groupBy',  // ✅ CORRECT!
        name: 'contract',
        as: 'c'
      }
    ]
  }
};
```

---

## Inter-Query Dependencies

Inter-query dependencies allow **Query B to use results from Query A** within the same QL request. This enables multi-step data retrieval in a single HTTP call.

### Two Modes

| Mode | Mechanism | Use Case |
|------|-----------|----------|
| **Mode 1: Direct Reference** | `${query:queryName:alias.field}` in filter values | Simple ID lookups — Query A returns IDs, Query B filters by them |
| **Mode 2: Logic-Powered** | Groovy/SpEL scripts transform Query A's results | Complex transformations — filter, aggregate, or reshape before use |

### Key Properties

| Property | On | Type | Description |
|----------|----|------|-------------|
| `dependsOn` | `QlQueryDto` | `string[]` | Names of queries this query depends on |
| `logics` | `QlQueryDto` | `QlLogicDto[]` | Query-level logics for inter-query processing |
| `imports` | `QlLogicDto` | `string[]` | Query names whose results are imported into the logic |

### Rules

- Dependencies must be declared **before** the dependent query in the `queries` array
- `imports` in logics must be a subset of the parent query's `dependsOn`
- No self-dependencies or circular references
- All new fields are optional — queries without `dependsOn` work exactly as before

### Example 1: Mode 1 — Direct Variable Reference

Query A fetches active customers, Query B fetches their tickets:

```ts
this.qlService.builder()
    .query({
        name: 'activeCustomers',
        type: 'view',
        start: { type: 'entity', name: 'cr.Customer', as: 'c' },
        filters: [
            FilterCriteria.create('c.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'customerTickets',
        type: 'view',
        dependsOn: ['activeCustomers'],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            FilterCriteria.create('t.customerId', FilterCriteria.cOperatorIn,
                '${query:activeCustomers:c.id}')
        ]
    })
    .execute()
    .subscribe(result => {
        const tickets = result.get('customerTickets');
    });
```

**How it works:** `${query:activeCustomers:c.id}` is resolved before Query B compiles. It extracts all `c.id` values from Query A's results and injects them as an `IN` list.

### Example 2: Mode 2 — Logic-Powered Processing

Query A fetches contracts, a Groovy script filters high-value ones, Query B uses those IDs:

```ts
this.qlService.builder()
    .query({
        name: 'salesData',
        type: 'view',
        start: { type: 'entity', name: 'cm.Contract', as: 'c' },
        filters: [
            FilterCriteria.create('c.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'highValueTickets',
        type: 'view',
        dependsOn: ['salesData'],
        logics: [
            {
                type: 'map',
                scriptLanguage: 'groovy',
                script: "salesData.findAll { it['c.totalAmount'] > 10000 }.collect { it['c.id'] }",
                resultName: 'targetIds',
                imports: ['salesData']
            }
        ],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            FilterCriteria.create('t.contractId', FilterCriteria.cOperatorIn, '${targetIds}')
        ]
    })
    .execute()
    .subscribe(result => {
        const tickets = result.get('highValueTickets');
    });
```

### Example 3: Chained Dependencies

Three queries where C depends on B, and B depends on A:

```ts
this.qlService.builder()
    .query({
        name: 'departments',
        type: 'view',
        start: { type: 'entity', name: 'um.Department', as: 'd' },
        filters: [
            FilterCriteria.create('d.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'users',
        type: 'view',
        dependsOn: ['departments'],
        start: { type: 'entity', name: 'um.User', as: 'u' },
        filters: [
            FilterCriteria.create('u.departmentId', FilterCriteria.cOperatorIn,
                '${query:departments:d.id}')
        ]
    })
    .query({
        name: 'tickets',
        type: 'view',
        dependsOn: ['users'],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            FilterCriteria.create('t.assignedUserId', FilterCriteria.cOperatorIn,
                '${query:users:u.id}')
        ]
    })
    .execute()
    .subscribe(result => {
        const tickets = result.get('tickets');
    });
```

### Dependency-Only Queries

A query referenced only as a dependency (no pipe) will still execute but won't appear in the response. The builder auto-generates pipes, so to exclude a dependency-only query from results, use manual pipe configuration:

```ts
const request = new QlRequestDto();
request.queries = [queryA, queryB];
request.pipes = [
    // Only create pipe for queryB — queryA is dependency-only
    { name: 'result', type: 'simple', simpleQuery: 'queryB' }
];
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Self-dependency | Request rejected with validation error |
| Non-existent dependency | Request rejected with validation error |
| Wrong declaration order | Request rejected with validation error |
| Logic import not in dependsOn | Request rejected with validation error |
| Empty dependency results | Filter becomes empty IN → 0 rows returned (not an error) |

### When to Use Inter-Query Dependencies

**Use when:**
- You need to filter Query B by results from Query A (e.g., "get tickets for active customers")
- You need to chain multiple data lookups in sequence
- Complex data transformations need to happen between queries
- You want to avoid multiple HTTP calls for related sequential queries

**Don't use when:**
- A simple JOIN would suffice (more efficient)
- Queries are independent and can run in parallel (standard batching is better)
- The relationship can be expressed with a single query's filters

---

## Anti-Patterns (FORBIDDEN)

❌ Using forkJoin with QL
❌ Accessing results by query name
❌ Omitting aliases
❌ Manual filter or sorting object creation
❌ Multiple HTTP calls instead of batching
❌ Traversing FK relationships with dot notation (e.g., `e.customer.name`)
❌ Using relationship name without `Id` suffix for FK fields **in filters**
❌ Using `Id` suffix for FK fields **in groupBy fields** (use relationship name instead)
❌ Splitting QL query construction into multiple intermediate variables (e.g., separate `const` for each join)
❌ **Using `type: 'entity'` for joins within a `groupBy` query (must use `type: 'groupBy'`)**
❌ **Manual QlRequestDto construction for direct QL usage (use QlQueryBuilder instead)**

---

## Validation Script

**Location:** `.claude/skills/ql/scripts/check-guidelines.js`

**IMPORTANT:** Only run on Claude-generated files (NOT legacy code).

**What it validates:**
- QlRequestDto usage
- No forkJoin with QL
- pipeData access
- FilterCriteria.create() usage
- No manual filter objects
- new Sorting() usage
- No fields ending with 'DtoId'
- Single-assignment rule (no intermediate QlJoinDto variables)

**Usage:**
```bash
cd .claude/skills/ql/scripts && node check-guidelines.js
```

**Auto-correction workflow:**
1. Claude generates code using QL
2. Run validation script
3. If errors found → Claude fixes violations
4. Re-run validation
5. Repeat until ✅ all checks pass

**Claude should NEVER leave a file with validation errors.**

---

## STOP-AND-ASK Rule

If you are unsure:
1. **STOP**
2. Review [ql-reference.md](ql-reference.md)
3. **ASK** before implementing

---

## Additional Resources

- **Detailed documentation:** [ql-reference.md](ql-reference.md) - Complete API reference
- **Examples:** [ql-examples.md](ql-examples.md) - Real-world usage patterns
- **Validation script:** `skills/ql/scripts/check-guidelines.js`

---

## Summary

QL is a unified, performant, declarative data retrieval system. When used correctly:
- ✅ Predictable data access
- ✅ Optimal performance
- ✅ Scalable query architecture
- ✅ Reduced backend coupling
