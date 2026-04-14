---
name: be_core_ql
description: "Backend: Expert guidance on Alpha Query Language (QL) implementation in com.mvs.backend.core.ql for declarative data retrieval, aggregations, joins, inter-query dependencies, and SQL generation. Use when implementing QL queries, understanding query processing, inter-query dependencies, or debugging QL issues."
---

# Alpha Query Language (QL) - Backend Implementation

## Overview

Alpha Query Language (QL) is a declarative data retrieval system implemented in `com.mvs.backend.core.ql`. It provides a unified API for fetching data with support for filtering, sorting, pagination, joins, and aggregations.

**Package:** `com.mvs.backend.core.ql`

**REST Endpoint:** `/mvsa/core/ql/query`

---

## Package Structure

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for QL queries |
| `execution/` | Query plan generation, compilation, execution |
| `data/` | Query results, metadata, extraction |
| `dp/` | Pluggable data provider interface |
| `dp/impl/jdbc/` | **SQL generation and execution** |
| `query/` | QL query structure (QlQuery, QlQueryContent, QlQueryContentField) |
| `join/` | Relationship definitions (QlJoin, QlJoinType) |
| `dto/data/` | Data Transfer Objects for API serialization |
| `pipe/` & `export/` | Output formatting (simple, object, view) |
| `logic/` | Custom transformation scripts |
| `enums/` | Type constants (QlQueryType, QlJoinType) |

---

## Core Concepts

### Query Types (`type` field)

The `type` field on `QlQueryStartDto` or `QlJoinDto` determines how data is processed:

| Type | Purpose | Returns |
|------|---------|---------|
| `entity` | Standard entity query | Individual records |
| `groupBy` | Aggregation query with GROUP BY | Grouped/aggregated results |
| `meta` | Metadata query | Schema information |

### Query vs Pipe

- **Query** (`QlQueryDto`): Defines WHAT data to fetch
- **Pipe** (`QlExportPipeDto`): Defines HOW data is returned

Results are always accessed via pipe name: `response.pipeData[pipeName]`

---

## Type: "entity" - Standard Queries

Use `type: "entity"` for retrieving individual records.

```java
QlQueryStartDto queryStartDto = new QlQueryStartDto();
queryStartDto.setType("entity");
queryStartDto.setName("xx.XxCarPilotCar");
queryStartDto.setAs("c");
```

**Frontend JSON equivalent:**
```json
{
  "type": "entity",
  "name": "xx.XxCarPilotCar",
  "as": "c"
}
```

---

## Type: "groupBy" - Aggregation Queries

Use `type: "groupBy"` for COUNT, SUM, AVG, MIN, MAX aggregations.

### Key Concepts

1. **Regular fields** in `fields[]` become GROUP BY columns
2. **Function fields** (with `function` property) become aggregation expressions
3. **`filters`** → WHERE clause (applied before GROUP BY)
4. **`functionFilters`** → HAVING clause (applied after GROUP BY)

### Available Aggregation Functions

| Function | Description | Field Name |
|----------|-------------|------------|
| `count` | Row count | `"*"` for COUNT(*), or field name |
| `sum` | Sum of values | Field name to sum |
| `avg` | Average | Field name to average |
| `min` | Minimum value | Field name |
| `max` | Maximum value | Field name |

### Creating Fields

**Regular field (for GROUP BY):**
```java
QlQueryContentFieldDto.createRegular("modelId", null, null, null)
```

**Function field (for aggregation):**
```java
QlQueryContentFieldDto.createFunction(
    "*",           // Field name (* for COUNT all)
    "count",       // Aggregation function
    "count",       // Alias in result
    "Total Count", // Label
    "Long"         // Data type
)
```

---

## GroupBy Examples

### Example 1: Simple COUNT with GROUP BY

Count cars grouped by model:

```java
QlQueryDto queryDto = new QlQueryDto();
queryDto.setName("carCountByModel");
queryDto.setType(QlQueryType.view.getExternalKey());

QlQueryStartDto queryStartDto = new QlQueryStartDto();
queryStartDto.setType("groupBy");  // KEY: groupBy type
queryStartDto.setName("xx.XxCarPilotCar");
queryStartDto.setAs("c");
queryStartDto.setFields(List.of(
    // GROUP BY column
    QlQueryContentFieldDto.createRegular("modelId", null, null, null),
    // Aggregation: COUNT(*)
    QlQueryContentFieldDto.createFunction("*", "count", "carCount", "Car Count", "Long")
));

queryDto.setStart(queryStartDto);
```

**Generated SQL:**
```sql
SELECT c.model_id, COUNT(*) as c_carCount
FROM xx_car_pilot_car c
GROUP BY c.model_id
```

### Example 2: Multiple Aggregations

```java
queryStartDto.setFields(List.of(
    QlQueryContentFieldDto.createRegular("modelId", null, null, null),
    QlQueryContentFieldDto.createFunction("*", "count", "count", "Count", "Long"),
    QlQueryContentFieldDto.createFunction("price", "avg", "avgPrice", "Avg Price", "BigDecimal"),
    QlQueryContentFieldDto.createFunction("price", "sum", "totalPrice", "Total", "BigDecimal"),
    QlQueryContentFieldDto.createFunction("price", "max", "maxPrice", "Max", "BigDecimal")
));
```

**Generated SQL:**
```sql
SELECT c.model_id, COUNT(*) as c_count, AVG(c.price) as c_avgPrice,
       SUM(c.price) as c_totalPrice, MAX(c.price) as c_maxPrice
FROM xx_car_pilot_car c
GROUP BY c.model_id
```

### Example 3: GroupBy with WHERE Filter

Filter records BEFORE grouping:

```java
queryDto.setFilters(List.of(
    new FilterCriteria("c.status", FilterCriteria.EQ, "ACTIVE")
));
```

**Generated SQL:**
```sql
SELECT c.model_id, COUNT(*) as c_count
FROM xx_car_pilot_car c
WHERE c.status = 'ACTIVE'
GROUP BY c.model_id
```

### Example 4: GroupBy with HAVING Filter

Filter grouped results AFTER aggregation:

```java
queryDto.setFunctionFilters(List.of(
    new FilterCriteria("c.count", FilterCriteria.GE, 2L)
));
```

**Generated SQL:**
```sql
SELECT c.model_id, COUNT(*) as c_count
FROM xx_car_pilot_car c
GROUP BY c.model_id
HAVING COUNT(*) >= 2
```

### Example 5: GroupBy in a Join

Join entity to grouped data from another entity:

```java
// Start: Car entity
QlQueryStartDto queryStartDto = new QlQueryStartDto();
queryStartDto.setType("entity");
queryStartDto.setName("xx.XxCarPilotCar");
queryStartDto.setAs("c");

// Join: GroupBy CarPrice by model with AVG
QlJoinDto groupByJoin = new QlJoinDto();
groupByJoin.setType("groupBy");  // KEY: groupBy in join
groupByJoin.setName("xx.XxCarPilotCarPrice");
groupByJoin.setAs("a");

// Aggregation field
groupByJoin.setFields(List.of(
    QlQueryContentFieldDto.createFunction("price", "avg", "avgPrice", "Avg Price", "BigDecimal")
));

// GROUP BY configuration with join condition
groupByJoin.setTypeGroupBy(
    new QlQueryContentGroupBy(
        List.of(new QlQueryContentGroupByFieldDto("model", null)),  // GROUP BY model
        "a.model = c.model"  // Join condition
    )
);

queryStartDto.setJoins(List.of(groupByJoin));
```

---

## GroupBy with Nested Joins

**CRITICAL RULE:** When performing `groupBy` over multiple joined entities, ALL join levels must use `type: "groupBy"`, not `type: "entity"`.

### Factory Methods

| Method | Type | Use Case |
|--------|------|----------|
| `QlJoinDto.createEntityNtoOneJoin()` | `"entity"` | Standard entity joins |
| `QlJoinDto.createGroupByNtoOneJoin()` | `"groupBy"` | Joins within groupBy queries |

### Example 6: Simple GroupBy on Entity Field (test17)

Group CustomerContract by entityStatus with count:

```java
// Build QL query with groupBy
QlQueryDto queryDto = new QlQueryDto();
queryDto.setName("customerContractsByStatus");
queryDto.setType(QlQueryType.view.getExternalKey());

QlQueryStartDto queryStartDto = new QlQueryStartDto();
queryDto.setStart(queryStartDto);
queryStartDto.setType("groupBy");  // KEY: groupBy type
queryStartDto.setName("cr.CustomerContract");
queryStartDto.setAs("e");
queryStartDto.setFields(
    List.of(
        // GROUP BY column
        QlQueryContentFieldDto.createRegular("entityStatus", null, null, null),
        // Aggregation: COUNT(*)
        QlQueryContentFieldDto.createFunction("*", "count", "count", "Contract Count", "Long")
    )
);

// Filter by customerId
queryDto.setFilters(List.of(
    new FilterCriteria("e.customerId", FilterCriteria.EQ, customerId)
));

// Create pipe
QlExportPipeDto pipe = new QlExportPipeDto();
pipe.setName("customerContractsByStatus");
pipe.setType("simple");
pipe.setSimpleQuery("customerContractsByStatus");
pipe.setSettings(new QlExportPipeSettingsDto(false, true, false));
```

**Result:** Returns rows grouped by entityStatus with count per status.

### Example 7: GroupBy with Nested Joins (test18)

Group CustomerContract by ContractType.name through nested joins:

```java
// Build QL query with joins and groupBy
QlQueryDto queryDto = new QlQueryDto();
queryDto.setName("customerContractsByContractType");
queryDto.setType(QlQueryType.view.getExternalKey());

QlQueryStartDto queryStartDto = new QlQueryStartDto();
queryDto.setStart(queryStartDto);
queryStartDto.setType("groupBy");  // KEY: groupBy type
queryStartDto.setName("cr.CustomerContract");
queryStartDto.setAs("e");

// Create join: CustomerContract -> Contract -> ContractType
// CRITICAL: Use createGroupByNtoOneJoin() NOT createEntityNtoOneJoin()
QlJoinDto joinContract = QlJoinDto.createGroupByNtoOneJoin("contract", "c");
QlJoinDto joinContractType = QlJoinDto.createGroupByNtoOneJoin("contractType", "ct");

// Set fields on the deepest join (the field to group by)
joinContractType.setFields(List.of(
    QlQueryContentFieldDto.createRegular("name", null, null, null)
));

// Nest the joins
joinContract.addJoin(joinContractType);
queryStartDto.setJoins(List.of(joinContract));

// Aggregation on start entity
queryStartDto.setFields(List.of(
    QlQueryContentFieldDto.createFunction("*", "count", "count", "Contract Count", "Long")
));

// Filter by customerId
queryDto.setFilters(List.of(
    new FilterCriteria("e.customerId", FilterCriteria.EQ, customerId)
));
```

**Generated SQL (conceptual):**
```sql
SELECT ct.name, COUNT(*) as e_count
FROM cr_customer_contract e
LEFT JOIN cm_contract c ON e.contract_id = c.id
LEFT JOIN cm_contract_type ct ON c.contract_type_id = ct.id
WHERE e.customer_id = ?
GROUP BY ct.name
```

### GroupBy Join Rules Summary

| Scenario | Start Type | Join Type | Factory Method |
|----------|------------|-----------|----------------|
| Simple entity query | `"entity"` | `"entity"` | `createEntityNtoOneJoin()` |
| Simple groupBy (no joins) | `"groupBy"` | N/A | N/A |
| GroupBy with joins | `"groupBy"` | `"groupBy"` | `createGroupByNtoOneJoin()` |

**Key Points:**
1. When `start.type = "groupBy"`, all joined entities must also use `type: "groupBy"`
2. The GROUP BY fields can be on any level (start entity or joined entities)
3. Fields to group by are specified in the `fields` array of the appropriate entity/join
4. Aggregation functions (count, sum, etc.) are typically on the start entity

---

i## Inter-Query Dependencies

Inter-query dependencies allow **Query B to use results from Query A** within the same QL request. This enables multi-step data retrieval without multiple HTTP calls.

### Two Modes

| Mode | Mechanism | Use Case |
|------|-----------|----------|
| **Mode 1: Direct Reference** | `${query:queryName:alias.field}` in filter values | Simple ID lookups — Query A returns IDs, Query B filters by them |
| **Mode 2: Logic-Powered** | Groovy/SpEL scripts transform Query A's results | Complex transformations — filter, aggregate, or reshape data before use |

### Key Fields

**On `QlQueryDto`:**
- `dependsOn` (`List<String>`) — Names of queries this query depends on. Dependencies must be declared **before** the dependent query.
- `logics` (`List<QlLogicDto>`) — Query-level logics for inter-query processing (Mode 2).

**On `QlLogicDto`:**
- `imports` (`List<String>`) — Query names whose results are imported into the logic script. Must be a subset of the parent query's `dependsOn`.

### Execution Flow

```
generatePlans(ALL) → compilePlans(independent only) → executePlans():
  for each query (in declaration order):
    if independent: execute (already compiled)
    if dependent: resolve deps → execute logics → compile → execute
```

Dependent queries use **deferred compilation** — they skip `compilePlans()` and compile just before execution, after their dependencies have produced results.

### Validation Rules

| Rule | Error Message |
|------|---------------|
| No self-dependency | "Query 'X' cannot depend on itself" |
| Dependency must exist | "Query 'X' depends on 'Y' which does not exist" |
| Declaration order | "Query 'X' depends on 'Y' but 'Y' must be declared before 'X'" |
| Logic imports subset | "Logic import 'X' is not listed in dependsOn for query 'Y'" |

### Example 1: Mode 1 — Direct Variable Reference (Backend Java)

Query A fetches active model IDs, Query B filters cars by those IDs:

```java
// Query A: Get active models
QlQueryDto queryA = new QlQueryDto();
queryA.setName("activeModels");
queryA.setType(QlQueryType.view.getExternalKey());
QlQueryStartDto startA = new QlQueryStartDto();
startA.setType("entity");
startA.setName("xx.XxCarPilotModel");
startA.setAs("m");
queryA.setStart(startA);
queryA.setFilters(List.of(
    new FilterCriteria("m.entityStatus", FilterCriteria.EQ, 3)
));

// Query B: Get cars whose modelId is IN the results of Query A
QlQueryDto queryB = new QlQueryDto();
queryB.setName("carsByActiveModel");
queryB.setType(QlQueryType.view.getExternalKey());
queryB.setDependsOn(List.of("activeModels"));  // Declare dependency
QlQueryStartDto startB = new QlQueryStartDto();
startB.setType("entity");
startB.setName("xx.XxCarPilotCar");
startB.setAs("c");
queryB.setStart(startB);
queryB.setFilters(List.of(
    // ${query:activeModels:m.id} resolves to List of IDs from Query A
    new FilterCriteria("c.modelId", FilterCriteria.IN, "${query:activeModels:m.id}")
));
```

### Example 2: Mode 2 — Logic-Powered Processing (Backend Java)

Query A fetches models, a Groovy script extracts IDs where name matches a pattern, Query B uses those IDs:

```java
// Query A: Get all models
QlQueryDto queryA = new QlQueryDto();
queryA.setName("allModels");
queryA.setType(QlQueryType.view.getExternalKey());
QlQueryStartDto startA = new QlQueryStartDto();
startA.setType("entity");
startA.setName("xx.XxCarPilotModel");
startA.setAs("m");
queryA.setStart(startA);

// Query B: Filter cars by model IDs derived via Groovy script
QlQueryDto queryB = new QlQueryDto();
queryB.setName("filteredCars");
queryB.setType(QlQueryType.view.getExternalKey());
queryB.setDependsOn(List.of("allModels"));

// Logic: Groovy script filters models and extracts IDs
QlLogicDto logic = new QlLogicDto();
logic.setType("map");
logic.setScriptLanguage("groovy");
logic.setScript("allModels.findAll { it['m.name']?.contains('Sport') }.collect { it['m.id'] }");
logic.setResultName("sportModelIds");
logic.setImports(List.of("allModels"));  // Must be subset of dependsOn
queryB.setLogics(List.of(logic));

QlQueryStartDto startB = new QlQueryStartDto();
startB.setType("entity");
startB.setName("xx.XxCarPilotCar");
startB.setAs("c");
queryB.setStart(startB);
queryB.setFilters(List.of(
    new FilterCriteria("c.modelId", FilterCriteria.IN, "${sportModelIds}")
));
```

### Example 3: Chained Dependencies

Three queries where C depends on B, and B depends on A:

```java
// Query A: Get brands
QlQueryDto queryA = new QlQueryDto();
queryA.setName("brands");
// ... (entity query for xx.XxCarPilotBrand)

// Query B: Get models for those brands
QlQueryDto queryB = new QlQueryDto();
queryB.setName("models");
queryB.setDependsOn(List.of("brands"));
queryB.setFilters(List.of(
    new FilterCriteria("m.brandId", FilterCriteria.IN, "${query:brands:b.id}")
));
// ... (entity query for xx.XxCarPilotModel)

// Query C: Get cars for those models
QlQueryDto queryC = new QlQueryDto();
queryC.setName("cars");
queryC.setDependsOn(List.of("models"));
queryC.setFilters(List.of(
    new FilterCriteria("c.modelId", FilterCriteria.IN, "${query:models:m.id}")
));
// ... (entity query for xx.XxCarPilotCar)
```

### Dependency-Only Queries

A query referenced only as a dependency (no pipe) will still execute but won't appear in the response. This is useful for intermediate data:

```java
// This query has no pipe — it only provides data for queryB
queryA.setName("intermediateData");
// No pipe for "intermediateData"

// Only queryB has a pipe
QlExportPipeDto pipe = new QlExportPipeDto();
pipe.setName("result");
pipe.setSimpleQuery("queryB");
```

### Implementation Files

| File | Purpose |
|------|---------|
| `QlQueryDto.java` | `dependsOn` and `logics` fields |
| `QlLogicDto.java` | `imports` field |
| `QlQuery.java` | Domain model with `hasDependencies()` helper |
| `QlRequestRuntime.java` | `executedQueryResults` map for sharing results |
| `QlDtoRequestService.java` | Validation in `validateQueryDependencies()` |
| `QlQueryExecutionService.java` | Deferred compilation, dependency resolution, logic execution |

### Test Coverage

| Test | Description | Location |
|------|-------------|----------|
| `test200()` | Mode 1: Direct reference (models → cars) | `QlSpringTests` |
| `test201()` | Mode 2: Groovy logic (models → script → cars) | `QlSpringTests` |
| `test202()` | Dependency-only query (no pipe) | `QlSpringTests` |
| `test203()` | Backward compatibility (standard query unchanged) | `QlSpringTests` |
| `test204()` | Self-dependency validation rejection | `QlSpringTests` |
| `test205()` | Non-existent dependency rejection | `QlSpringTests` |
| `test206()` | Wrong declaration order rejection | `QlSpringTests` |
| `test207()` | Empty dependency results → empty IN → 0 rows | `QlSpringTests` |
| `test208()` | Chained dependencies (brands → models → cars) | `QlSpringTests` |
| Unit tests | 25 tests covering validation, patterns, runtime | `QlInterQueryDependencyUnitTest` |

### Best Practices

**DO:**
- Declare dependencies in the correct order (dependency before dependent)
- Use Mode 1 for simple ID lookups (more efficient, no script overhead)
- Use Mode 2 when you need to transform, filter, or reshape data before use
- Keep logic scripts simple and focused

**DON'T:**
- Don't create circular dependencies (validated at request time)
- Don't reference queries that don't exist in `dependsOn`
- Don't use `imports` in logics for queries not listed in `dependsOn`
- Don't assume execution order — it follows declaration order

---

## SQL Generation Process

The QL system converts queries to SQL through these steps:

1. **DTO Conversion** → `QlDtoRequestService.fromDto()`
2. **Query Planning** → `QlQueryExecutionService.generatePlans()`
3. **Compilation** → `QlDpEntityJdbcProviderImplCompiler.compile()`
4. **SQL Building** → `QlJdbcSqlBuilder` constructs SQL
5. **Execution** → `QlDpEntityJdbcProviderImplExecutor` runs SQL
6. **Data Extraction** → Results mapped to QL data structures

### Key Implementation Files

| File | Purpose |
|------|---------|
| `QlDpEntityJdbcProviderImplCompiler.java` | Query compilation, GROUP BY resolution |
| `QlJdbcSqlBuilder.java` | SQL string construction |
| `QlDpJdbcMemberHandler.java` | Field → column mapping |
| `QlDpEntityJdbcConditionsResolver.java` | WHERE/HAVING conditions |

### GroupBy Processing (Compiler lines 482-502)

```java
private void _resolveGroupBy(QlQueryContent content, QlJdbcSqlBuilder sqlBuilder,
        List<QlQueryContentField> fields) {
    for (QlQueryContentField field : fields) {
        // Skip aggregation functions, process only regular fields
        if (field.getFieldType() == null || !field.getFieldType().equals("function")) {
            // Add to GROUP BY clause
            sqlBuilder.addGroupByAttribute(
                new QlJdbcSqlBuilder.GroupByTokenAttribute(memberName.dbSelectName())
            );
        }
    }
}
```

---

## Response Structure

```json
{
  "pipeData": {
    "pipe_name": {
      "status": "success",
      "data": [
        { "c.modelId": 5, "c.count": 12, "c.avgPrice": 25000.50 },
        { "c.modelId": 2, "c.count": 8, "c.avgPrice": 32000.00 }
      ],
      "info": {
        "hasCount": true,
        "totalCount": 20
      },
      "metrics": {
        "metricRuntimeMs": 45
      }
    }
  }
}
```

**Field naming:** `<alias>.<fieldName>` (e.g., `c.modelId`, `c.count`)

---

## Test Examples

Integration tests are located at:
- `test/java/com/mvs/backend/test/core/ql/integration/QlJoinIntegrationTests.java`
- `test/java/com/mvs/backend/test/core/ql/spring/QlSpringTests.java`

### Key Test Methods

| Test | Description | Location |
|------|-------------|----------|
| `test12()` | Basic groupBy with COUNT | `QlJoinIntegrationTests` |
| `test13()` | GroupBy with WHERE filter | `QlJoinIntegrationTests` |
| `test14()` | GroupBy with HAVING filter | `QlJoinIntegrationTests` |
| `test17()` | **GroupBy on entity field (entityStatus)** | `QlJoinIntegrationTests` |
| `test18()` | **GroupBy with nested joins (ContractType.name)** | `QlJoinIntegrationTests` |
| `test1010()` | GroupBy in join with AVG | `QlSpringTests` |

---

## Best Practices

### DO:
- Use `type: "groupBy"` for aggregations instead of fetching all records
- Use `functionFilters` for HAVING clause conditions
- Use `filters` for WHERE clause conditions (before grouping)
- Specify correct `dataType` in function fields for proper result mapping
- Use `"*"` as field name for COUNT(*)
- **Use `QlJoinDto.createGroupByNtoOneJoin()` for joins within groupBy queries**
- **Set `type: "groupBy"` on ALL join levels when the start entity uses groupBy**

### DON'T:
- Don't mix regular and function fields incorrectly
- Don't use `filters` when you need HAVING (use `functionFilters`)
- Don't forget to specify the join condition in `typeGroupBy.where`
- **Don't use `createEntityNtoOneJoin()` within a groupBy query - use `createGroupByNtoOneJoin()`**

---

## See Also

- Frontend QL Skill: `fe_core_ql`
- Full documentation: `backend/src/main/java/com/mvs/backend/core/ql/ql-documentation.md`