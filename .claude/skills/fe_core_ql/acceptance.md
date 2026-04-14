# Acceptance Checklist: Frontend QL (Query Language)

Use this checklist to verify compliance with QL standards before submitting code.

---

## Query Structure

- [ ] Query has `name` property (unique identifier)
- [ ] Query has `type` property (`view` or `hierarchy`)
- [ ] Query has `start` with proper configuration
- [ ] Query is created in **single assignment** (no intermediate variables for joins)

---

## Type Selection

- [ ] `type: "entity"` used for standard data retrieval (lists, single records)
- [ ] `type: "groupBy"` used for aggregations (COUNT, SUM, AVG, MIN, MAX)
- [ ] Type is appropriate for the use case

---

## Aggregation Queries (type: "groupBy")

When using `type: "groupBy"`:

- [ ] `start.fields` contains regular fields for GROUP BY columns
- [ ] `start.fields` contains function fields for aggregations
- [ ] Function fields have `function` property (`count`, `sum`, `avg`, `min`, `max`)
- [ ] Function fields have `as` property for result alias
- [ ] `"*"` used as field name for COUNT(*)
- [ ] `filters` used for WHERE clause (before GROUP BY)
- [ ] `functionFilters` used for HAVING clause (after GROUP BY)
- [ ] **NO client-side aggregation** - all aggregation done server-side via `type: "groupBy"`

---

## Aliases

- [ ] Root entity has an alias (typically `e`)
- [ ] All joined entities have unique aliases
- [ ] Field references use correct alias prefix (`e.fieldName`, `c.amount`)
- [ ] Aggregation fields reference correct alias (`e.count`, `ba.id`)

---

## Filters

- [ ] All filters use `FilterCriteria.create(...)`
- [ ] No manual filter object construction
- [ ] Filter field paths include alias prefix (`e.status`, `c.name`)
- [ ] Enum values use **ordinal values from frontend enums** (not string names)
- [ ] `filters` vs `functionFilters` used correctly for WHERE vs HAVING

---

## Sorting

- [ ] All sorting uses `new Sorting(...)`
- [ ] Sort field paths include alias prefix
- [ ] Aggregation result sorting uses correct alias (`e.count`, not just `count`)

---

## Pipes

- [ ] Every query has a corresponding pipe
- [ ] Pipe `simpleQuery` references the correct query name
- [ ] Results accessed via **pipe name**: `response.pipeData[pipeName]`
- [ ] Results NOT accessed by query name

---

## Joins

- [ ] All joins have `type` property (`entity` or `groupBy`)
- [ ] All joins have unique aliases
- [ ] Reverse joins use correct format: `module.Entity#attributeName`
- [ ] `onlyFirst: true` used when only single related record needed
- [ ] Joins with `type: "groupBy"` have `typeGroupBy` configuration

---

## Performance

- [ ] `type: "groupBy"` used for aggregations (not fetching all records)
- [ ] No client-side aggregation (Map/reduce/forEach for counting/summing)
- [ ] `includeForm: false` when form metadata not needed
- [ ] `includeCount: true` only when pagination needed
- [ ] Queries batched in single request when possible

---

## Anti-Patterns (MUST NOT HAVE)

- [ ] ❌ NO `forkJoin` with multiple QL requests
- [ ] ❌ NO client-side aggregation (`for` loops counting/summing data)
- [ ] ❌ NO string enum values in filters (`'ACTIVE'` instead of enum ordinal)
- [ ] ❌ NO intermediate variables for join construction
- [ ] ❌ NO dot notation FK traversal (`e.customer.name`)
- [ ] ❌ NO accessing results by query name (must use pipe name)
- [ ] ❌ NO `ObjectRequestListGroupBy` for new code (use QL `type: "groupBy"`)

---

## Quick Validation

Run these checks on your code:

1. **Search for client-side aggregation:**
   - `new Map()` with counting logic
   - `for (const item of data)` with accumulator
   - `.reduce()` for summing

2. **Search for deprecated patterns:**
   - `ObjectRequestListGroupBy`
   - `forkJoin` with QL
   - String enum values in filters

3. **Verify groupBy usage:**
   - If you need COUNT/SUM/AVG → use `type: "groupBy"`
   - If you're iterating data to count → refactor to `type: "groupBy"`

---

## Example: Compliant GroupBy Query

```ts
// ✅ COMPLIANT
const query: QlQueryDto = {
    name: 'kpisByStatus',
    type: 'view',
    start: {
        type: 'groupBy',  // ✓ Server-side aggregation
        name: 'bm.CustomerBillingAccountTransaction',
        as: 'e',
        fields: [
            { name: 'status' },  // ✓ GROUP BY column
            { name: '*', function: 'count', as: 'count' },  // ✓ Aggregation
            { name: 'amount', function: 'sum', as: 'total' }  // ✓ Aggregation
        ]
    },
    filters: [
        FilterCriteria.create('e.status', FilterCriteria.cOperatorIn,  // ✓ FilterCriteria.create
            [TransactionStatus.ACTIVE, TransactionStatus.PENDING])  // ✓ Enum ordinals
    ]
};

const pipe: QlExportPipeDto = {
    name: 'kpisByStatus',  // ✓ Has pipe
    type: 'simple',
    simpleQuery: 'kpisByStatus'
};

// ✓ Single request, results by pipe name
this.qlService.query(request).subscribe(res => {
    const kpis = res.pipeData['kpisByStatus']?.data ?? [];  // ✓ Pipe name access
});
```

---

## Example: Non-Compliant Code (REJECT)

```ts
// ❌ NON-COMPLIANT - Multiple issues
const query: QlQueryDto = {
    name: 'transactions',
    type: 'view',
    start: {
        type: 'entity',  // ❌ Should be 'groupBy' for aggregation
        name: 'bm.Transaction',
        as: 'e'
    },
    filters: [
        FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE')  // ❌ String enum
    ]
};

this.qlService.query(request).subscribe(res => {
    const data = res.pipeData['transactions']?.data ?? [];
    // ❌ Client-side aggregation - should use type: 'groupBy'
    const countByArea = new Map<number, number>();
    for (const item of data) {
        const areaId = item['e.billingAreaId'];
        countByArea.set(areaId, (countByArea.get(areaId) || 0) + 1);
    }
});
```
