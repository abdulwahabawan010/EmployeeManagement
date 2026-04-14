# QL (Query Language) - Complete Reference

## Table of Contents

1. [Mandatory Rules](#mandatory-rules)
   - [QL Preference Rule](#ql-preference-rule-mandatory)
   - [Single-Assignment Rule](#single-assignment-rule-mandatory)
2. [Query Types](#query-types)
   - [Type: entity](#type-entity---standard-queries)
   - [Type: groupBy](#type-groupby---aggregation-queries)
3. [GroupBy Examples](#groupby-examples)
4. [Entity Rules](#entity-rules)
5. [Query Rules](#query-rules)
6. [Pipe Rules](#pipe-rules)
7. [Filter Rules](#filter-rules)
8. [Sorting Rules](#sorting-rules)
9. [Pagination Rules](#pagination-rules)
10. [Joins Rules](#joins-rules)
11. [Performance Rules](#performance-rules)
12. [FK Field Naming Convention](#fk-field-naming-convention)
13. [FK Traversal](#fk-traversal)

---

## Mandatory Rules

### General Rules

- QL MUST be the default data-fetching mechanism
- Do NOT create multiple HTTP calls when QL batching is possible
- Do NOT use forkJoin with multiple QL requests
- Do NOT use forkJoin with multiple service calls (groupBy, list, etc.) when data can be retrieved via a single QL query
- Always define both queries AND pipes
- Use `type: "groupBy"` for aggregations - do NOT fetch all records and aggregate client-side

### QL Preference Rule (MANDATORY)

**ACCEPTANCE CRITERIA: When aggregations (COUNT, SUM, AVG, etc.) are needed, use QL with `type: "groupBy"` for server-side aggregation.**

This rule applies when you need to:
- Count records by a dimension (e.g., count by status, by category)
- Sum amounts by grouping (e.g., total sales by region)
- Calculate averages, min, max by grouping
- Get aggregated KPIs from large datasets

**Why server-side aggregation is required:**
1. **Performance** - Server aggregates millions of records, returns only summary
2. **Bandwidth** - Sends KB instead of MB of raw data
3. **Scalability** - Works regardless of data volume
4. **Consistency** - Single point-in-time calculation

### Anti-Pattern: Client-Side Aggregation

```ts
// ❌ FORBIDDEN - Fetching all records and aggregating client-side
this.qlService.query(request).subscribe(response => {
    const data = response.pipeData['transactions']?.data ?? [];
    // BAD: Processing all records in browser
    const countByStatus = new Map<number, number>();
    for (const item of data) {
        const status = item['e.status'];
        countByStatus.set(status, (countByStatus.get(status) || 0) + 1);
    }
});
```

### Correct Pattern: Server-Side Aggregation with type: "groupBy"

```ts
// ✅ CORRECT - Server does aggregation, returns only summary
const query: QlQueryDto = {
    name: 'transactionCountByStatus',
    type: 'view',
    start: {
        type: 'groupBy',  // KEY: Use groupBy type
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'status' },  // GROUP BY column
            { name: '*', function: 'count', as: 'count' }  // COUNT(*)
        ]
    }
};
```

### Single-Assignment Rule (MANDATORY)

**QL queries MUST be created in a single assignment.** Do NOT split query construction into multiple intermediate variables.

```ts
// ❌ FORBIDDEN - Multiple intermediate variables
const personJoin: QlJoinDto = { type: 'entity', name: 'person', as: 'p', joinType: 'left' };
const customerJoin: QlJoinDto = { type: 'entity', name: 'customer', as: 'c', joinType: 'left', joins: [personJoin] };

const qlQuery: QlQueryDto = {
  name: 'myQuery',
  start: { joins: [customerJoin] }
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
      }
    ]
  }
};
```

---

## Query Types

The `type` field on `start` (QlQueryStartDto) or joins (QlJoinDto) determines how data is processed.

### Type: "entity" - Standard Queries

Use `type: "entity"` for retrieving individual records.

```ts
const query: QlQueryDto = {
    name: 'customers',
    type: 'view',
    start: {
        type: 'entity',
        name: 'cr.Customer',
        as: 'e'
    }
};
```

**Use cases:**
- Listing records
- Single record retrieval
- Data for tables/grids
- Form data

### Type: "groupBy" - Aggregation Queries

Use `type: "groupBy"` for COUNT, SUM, AVG, MIN, MAX aggregations with GROUP BY.

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| Regular fields in `fields[]` | Become GROUP BY columns |
| Function fields (with `function`) | Become aggregation expressions |
| `filters` on query | WHERE clause (applied before GROUP BY) |
| `functionFilters` on query | HAVING clause (applied after GROUP BY) |

**Available Aggregation Functions:**

| Function | Description | Field Name |
|----------|-------------|------------|
| `count` | Row count | `"*"` for COUNT(*), or field name |
| `sum` | Sum of values | Field name to sum |
| `avg` | Average | Field name to average |
| `min` | Minimum value | Field name |
| `max` | Maximum value | Field name |

**Field Structure:**

```ts
// Regular field (becomes GROUP BY column)
{ name: 'billingAreaId' }

// Function field (becomes aggregation)
{ name: '*', function: 'count', as: 'count' }
{ name: 'amount', function: 'sum', as: 'totalAmount' }
{ name: 'price', function: 'avg', as: 'avgPrice' }
```

---

## GroupBy Examples

### Example 1: Simple COUNT by Category

Count transactions by status:

```ts
const query: QlQueryDto = {
    name: 'transactionCountByStatus',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'status' },  // GROUP BY e.status
            { name: '*', function: 'count', as: 'count' }  // COUNT(*)
        ]
    }
};
```

**Result:**
```json
[
    { "e.status": 0, "e.count": 150 },
    { "e.status": 1, "e.count": 42 },
    { "e.status": 2, "e.count": 8 }
]
```

### Example 2: SUM and COUNT with Multiple GROUP BY Columns

KPIs by billing area and direction:

```ts
const query: QlQueryDto = {
    name: 'kpisByAreaAndDirection',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'billingAreaId' },  // GROUP BY
            { name: 'transactionDirection' },  // GROUP BY
            { name: '*', function: 'count', as: 'count' },
            { name: 'amount', function: 'sum', as: 'totalAmount' }
        ]
    },
    filters: [
        FilterCriteria.create('e.status', FilterCriteria.cOperatorIn,
            [TransactionStatus.ACTIVE, TransactionStatus.PENDING])
    ]
};
```

### Example 3: GroupBy with JOIN

Aggregate with data from related entity:

```ts
const query: QlQueryDto = {
    name: 'transactionsByBillingArea',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        joins: [
            {
                type: 'entity',
                name: 'billingRun',
                as: 'br',
                joinType: 'inner',
                joins: [
                    { type: 'entity', name: 'billingArea', as: 'ba', joinType: 'inner' }
                ]
            }
        ],
        fields: [
            { name: 'ba.id', as: 'billingAreaId' },  // GROUP BY joined field
            { name: 'ba.name', as: 'billingAreaName' },
            { name: '*', function: 'count', as: 'transactionCount' },
            { name: 'amount', function: 'sum', as: 'totalAmount' }
        ]
    }
};
```

### Example 4: GroupBy with HAVING (functionFilters)

Filter aggregated results:

```ts
const query: QlQueryDto = {
    name: 'highVolumeCategories',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'categoryId' },
            { name: '*', function: 'count', as: 'count' }
        ]
    },
    functionFilters: [
        FilterCriteria.create('e.count', FilterCriteria.cOperatorGreaterOrEqual, 10)
    ]
};
```

**Generated SQL equivalent:**
```sql
SELECT e.category_id, COUNT(*) as e_count
FROM customer_billing_account_transaction e
GROUP BY e.category_id
HAVING COUNT(*) >= 10
```

### Example 5: Multiple Aggregations

```ts
const query: QlQueryDto = {
    name: 'salesStats',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.Invoice',
        as: 'e',
        fields: [
            { name: 'customerId' },
            { name: '*', function: 'count', as: 'invoiceCount' },
            { name: 'total', function: 'sum', as: 'totalRevenue' },
            { name: 'total', function: 'avg', as: 'avgInvoice' },
            { name: 'total', function: 'min', as: 'minInvoice' },
            { name: 'total', function: 'max', as: 'maxInvoice' }
        ]
    }
};
```

### Example 6: Combining Entity and GroupBy in Same Request

Batch multiple query types:

```ts
// Query 1: List of billing areas (entity)
const areasQuery: QlQueryDto = {
    name: 'billingAreas',
    type: 'view',
    start: {
        type: 'entity',
        name: 'bm.BillingArea',
        as: 'e'
    }
};

// Query 2: KPIs by billing area (groupBy)
const kpisQuery: QlQueryDto = {
    name: 'kpisByArea',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'billingAreaId' },
            { name: '*', function: 'count', as: 'count' },
            { name: 'amount', function: 'sum', as: 'total' }
        ]
    }
};

// Single request with both
const request = new QlRequestDto();
request.queries = [areasQuery, kpisQuery];
request.pipes = [
    { name: 'billingAreas', type: 'simple', simpleQuery: 'billingAreas' },
    { name: 'kpisByArea', type: 'simple', simpleQuery: 'kpisByArea' }
];

this.qlService.query(request).subscribe(response => {
    const areas = response.pipeData['billingAreas']?.data ?? [];
    const kpis = response.pipeData['kpisByArea']?.data ?? [];
});
```

---

## Entity Rules

- Entities must be referenced as `module.EntityName`
- Every query MUST define an alias (commonly `e`)
- All field references MUST use the alias

**Example:**
```ts
start: {
  type: 'entity',
  name: 'cr.Customer',
  as: 'e'
}
```

**Common Entities:**
- `cr.Customer` – Customer entity
- `tm.Ticket` – Ticket entity
- `um.User` – User entity
- `bm.Invoice` – Invoice entity
- `bm.CustomerBillingAccountTransaction` – Transaction entity

---

## Query Rules

- Query names must be unique per request
- Query type must be `view` or `hierarchy`
- Joins may be nested recursively
- Fields must be defined using object notation

**Field Definition:**
```ts
fields: [{ name: 'id' }, { name: 'name' }, { name: 'email' }]
```

**Query Structure:**
```ts
const query: QlQueryDto = {
  name: 'queryName',
  type: 'view',
  start: { /* entity or groupBy */ },
  filters: [ /* WHERE filters */ ],
  functionFilters: [ /* HAVING filters - only for groupBy */ ],
  sortings: [ /* sortings */ ],
  paging: { /* pagination */ }
};
```

---

## Pipe Rules

- Every query must be referenced by a pipe
- Data access must use `response.pipeData[pipeName]`
- Pipe settings must be explicitly defined

**Pipe Structure:**
```ts
const pipe: QlExportPipeDto = {
  name: 'pipeName',
  type: 'simple',
  simpleQuery: 'queryName',
  settings: {
    includeForm: true,
    includeCount: true
  }
};
```

---

## Filter Rules

- ALWAYS use `FilterCriteria.create(...)`
- NEVER construct filter objects manually
- Alias prefix is mandatory (`e.fieldName`)
- **NEVER use string names for enum values** - always use ordinal values

### Enum Filtering (MANDATORY)

```ts
// ❌ FORBIDDEN - Using string names
FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE')

// ✅ CORRECT - Using frontend enum ordinal values
import { TransactionStatus } from '../../enum/transaction-status.enum';
FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, TransactionStatus.ACTIVE)
```

### filters vs functionFilters

| Property | SQL Clause | Applied | Use With |
|----------|------------|---------|----------|
| `filters` | WHERE | Before GROUP BY | Both entity and groupBy |
| `functionFilters` | HAVING | After GROUP BY | Only groupBy |

```ts
// WHERE clause - filter records before grouping
filters: [
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, Status.ACTIVE)
]

// HAVING clause - filter after aggregation
functionFilters: [
    FilterCriteria.create('e.count', FilterCriteria.cOperatorGreaterOrEqual, 10)
]
```

---

## Sorting Rules

- ALWAYS use `new Sorting(...)`
- Field path must include alias

```ts
sortings: [
  new Sorting('e.createdDate', false),  // DESC
  new Sorting('e.name', true)           // ASC
]
```

**Sorting aggregation results:**
```ts
// Sort by aggregated field
sortings: [
  new Sorting('e.count', false)  // Sort by COUNT DESC
]
```

---

## Pagination Rules

- Paging is 0-based
- `includeCount` must be enabled

```ts
paging: {
  pageIndex: 0,
  pageSize: 20
}
```

---

## Joins Rules

- Use aliases for every join
- Use `onlyFirst: true` for single related record
- Joins work with both `type: "entity"` and `type: "groupBy"`

**Join Structure:**
```ts
joins: [
  {
    joinType: 'left',
    type: 'entity',
    name: 'customer',
    as: 'c'
  }
]
```

**Reverse Joins (OneToMany):**
```ts
joins: [
  {
    type: 'entity',
    name: 'bm.CustomerBillingAccountBalance#customerBillingAccount',
    as: 'bal',
    joinType: 'left',
    onlyFirst: true
  }
]
```

---

## Performance Rules

- Use `type: "groupBy"` for aggregations - don't fetch all records
- Select only required fields
- Avoid unnecessary `includeForm`
- Leverage automatic batching

---

## FK Field Naming Convention

**CRITICAL: Before referencing any field, determine if it is a Foreign Key.**

1. **FK fields** → append `Id` suffix: `e.customerId`
2. **Regular fields** → use as-is: `e.name`, `e.status`

---

## FK Traversal

**CRITICAL: You CANNOT traverse FK relationships using dot notation in filters.**

```ts
// ❌ WRONG
FilterCriteria.create('e.customer.name', ...)

// ✅ CORRECT - Use JOIN
joins: [{ type: 'entity', name: 'customer', as: 'c', joinType: 'left' }],
filters: [FilterCriteria.create('c.name', ...)]
```

---

## Inter-Query Dependencies

Inter-query dependencies allow **Query B to use results from Query A** within the same QL request.

### New Properties on QlQueryDto

| Property | Type | Description |
|----------|------|-------------|
| `dependsOn` | `string[]` | Query names this query depends on (must be declared earlier) |
| `logics` | `QlLogicDto[]` | Scripts that process dependency results into variables |

### New Property on QlLogicDto

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `string[]` | Query names whose results are available in the script (must be subset of `dependsOn`) |

### Mode 1: Direct Variable Reference

Use `${query:queryName:alias.field}` in filter values to inject results from a dependency:

```ts
filters: [
    FilterCriteria.create('t.customerId', FilterCriteria.cOperatorIn,
        '${query:activeCustomers:c.id}')
]
```

The pattern `${query:activeCustomers:c.id}` extracts all `c.id` values from the `activeCustomers` query results and replaces the filter value before compilation.

### Mode 2: Logic-Powered

Use `logics` with Groovy/SpEL scripts to transform dependency data:

```ts
logics: [
    {
        type: 'map',
        scriptLanguage: 'groovy',
        script: "salesData.findAll { it['c.amount'] > 10000 }.collect { it['c.id'] }",
        resultName: 'highValueIds',
        imports: ['salesData']
    }
]
```

The script result is stored as variable `${highValueIds}` available in the query's filters.

### Validation Rules

- Dependencies must be declared before the dependent query
- No self-dependencies
- All referenced queries must exist
- Logic `imports` must be a subset of `dependsOn`

### Reference Format

```
${query:<queryName>:<alias>.<field>}
```

- `queryName` — Name of the dependency query
- `alias.field` — Field reference from the dependency's results (e.g., `c.id`, `e.name`)

---

## Complete GroupBy Example

```ts
const query: QlQueryDto = {
    name: 'billingKpis',
    type: 'view',
    start: {
        type: 'groupBy',
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        joins: [
            {
                type: 'entity',
                name: 'billingRun',
                as: 'br',
                joinType: 'inner',
                joins: [
                    { type: 'entity', name: 'billingArea', as: 'ba', joinType: 'inner' }
                ]
            }
        ],
        fields: [
            { name: 'ba.id', as: 'billingAreaId' },
            { name: 'transactionDirection' },
            { name: '*', function: 'count', as: 'count' },
            { name: 'amount', function: 'sum', as: 'totalAmount' }
        ]
    },
    filters: [
        FilterCriteria.create('e.status', FilterCriteria.cOperatorIn,
            [TransactionStatus.ACTIVE, TransactionStatus.PENDING])
    ],
    sortings: [
        new Sorting('e.count', false)
    ]
};

const pipe: QlExportPipeDto = {
    name: 'billingKpis',
    type: 'simple',
    simpleQuery: 'billingKpis',
    settings: { includeCount: true }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
    const kpis = res.pipeData['billingKpis']?.data ?? [];
    // Result: [{ "ba.id": 1, "e.transactionDirection": 0, "e.count": 150, "e.totalAmount": 50000 }, ...]
});
```