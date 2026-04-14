# CB AI Query & Output Tools

## Overview

This document describes the query building and output formatting tools for the CB (Cognitive Backend) AI module. These tools enable natural language to QL query translation and intelligent result presentation.

## Architecture

The tools are organized into two main packages:
- `cb.ai.tool.impl.query` - Query building and execution tools
- `cb.ai.tool.impl.output` - Result formatting and visualization tools

Each tool implements one of three interfaces:
- `CbLlmTool<I, O>` - LLM-based tools that use language models
- `CbLogicTool<I, O>` - Logic-based tools using pure code
- `CbHybridTool<I, O>` - Combination of LLM processing with logic validation

## Query Tools

### 1. TemporalExpressionTool (HYBRID)

**Purpose**: Parses natural language temporal expressions into concrete date ranges.

**Package**: `cb.ai.tool.impl.query`

**Input** (`TemporalExpressionInput`):
```java
String text;                    // "last quarter", "this year", "past 30 days"
LocalDate referenceDate;        // Reference date for relative expressions
String locale;                  // Optional locale for language-specific parsing
```

**Output** (`TemporalExpressionOutput`):
```java
TemporalType type;             // DATE, RANGE, or RELATIVE
LocalDate startDate;           // Start of the date range
LocalDate endDate;             // End of the date range (null for DATE type)
String originalText;           // The original input text
String description;            // Human-readable description
double confidence;             // 0.0 - 1.0
```

**Supported Expressions**:
- Single dates: "today", "yesterday", "June 15, 2024"
- Ranges: "between Jan and March", "January 2024"
- Relative: "last quarter", "this year", "past 30 days", "last week"

**Validation Rules**:
- Start date cannot be after end date
- Date range cannot exceed 10 years
- RANGE type requires both start and end dates

---

### 2. FilterExpressionTool (HYBRID)

**Purpose**: Extracts filter conditions from natural language and validates against schema.

**Package**: `cb.ai.tool.impl.query`

**Input** (`FilterExpressionInput`):
```java
String text;                              // "customers from Germany with revenue > 10000"
List<String> availableEntities;           // ["cr.Customer", "cm.Contract"]
TemporalExpressionOutput temporalContext; // From TemporalExpressionTool
Map<String, List<String>> schemaInfo;     // Entity -> attribute names
```

**Output** (`FilterExpressionOutput`):
```java
List<FilterExpression> filters;    // Extracted filter conditions
List<String> warnings;             // Ambiguities found
List<String> unparsedFragments;    // Parts that couldn't be parsed
double confidence;                 // 0.0 - 1.0
```

**Filter Expression Structure**:
```java
String entityAlias;                // "cr.Customer"
String attributeName;              // "status", "country"
FilterOperator operator;           // EQ, NE, GT, LT, GTE, LTE, LIKE, IN, etc.
Object value;                      // Filter value
Object valueTo;                    // For BETWEEN operator
```

**Supported Operators**:
| Operator | Description | Example |
|----------|-------------|---------|
| EQ | Equal | status = "active" |
| NE | Not equal | status != "inactive" |
| GT | Greater than | amount > 1000 |
| LT | Less than | amount < 500 |
| GTE | Greater or equal | amount >= 1000 |
| LTE | Less or equal | amount <= 500 |
| LIKE | Contains pattern | name contains "John" |
| IN | In list | status in ("active", "pending") |
| IS_NULL | Is null | email is null |
| IS_NOT_NULL | Is not null | email is not null |
| BETWEEN | Between range | amount between 100 and 500 |

**Validation Rules**:
- Entity alias must exist in available entities (warning if not)
- Attribute must exist in entity schema (warning if not)
- BETWEEN requires both value and valueTo
- IS_NULL/IS_NOT_NULL should not have values

---

### 3. AggregationExpressionTool (LLM)

**Purpose**: Extracts aggregation and grouping requirements from natural language.

**Package**: `cb.ai.tool.impl.query`

**Input** (`AggregationExpressionInput`):
```java
String text;                              // "total sales by region"
String intent;                            // "aggregate", "trend", "compare"
Map<String, List<FieldInfo>> availableFields;  // Available fields with types
```

**Output** (`AggregationExpressionOutput`):
```java
List<AggregationSpec> aggregations;       // Aggregation specifications
List<String> groupByFields;               // Fields to group by
List<HavingCondition> havingConditions;   // HAVING filters
List<SortSpec> suggestedSorting;          // Suggested sort order
double confidence;
String explanation;
```

**Aggregation Types**:
| Type | SQL Function | Use Case |
|------|--------------|----------|
| COUNT | COUNT(*) | "how many customers" |
| SUM | SUM(field) | "total revenue" |
| AVG | AVG(field) | "average order value" |
| MIN | MIN(field) | "minimum price" |
| MAX | MAX(field) | "maximum amount" |
| COUNT_DISTINCT | COUNT(DISTINCT field) | "unique customers" |

---

### 4. QlQueryComposerTool (LLM)

**Purpose**: Composes valid QL queries from specifications.

**Package**: `cb.ai.tool.impl.query`

**Input** (`QlQueryComposerInput`):
```java
String primaryEntity;                     // "cr.Customer"
List<JoinSpec> joins;                     // Join specifications
List<FilterExpression> filters;           // Filter conditions
String intent;                            // "list", "aggregate"
List<AggregationSpec> aggregations;       // Aggregation specs
List<String> groupBy;                     // Group by fields
List<OrderBySpec> orderBy;                // Sort specifications
Integer limit;                            // Max results
Integer offset;                           // Pagination offset
List<String> selectAttributes;            // Specific attributes to select
```

**Output** (`QlQueryComposerOutput`):
```java
QlRequestDto qlRequest;           // The composed QL query
String explanation;               // Human-readable explanation
String queryName;                 // Generated query name
boolean hasAggregations;
int joinCount;
int filterCount;
List<String> warnings;
double confidence;
```

**Example Generated QL Query**:
```json
{
  "queries": [
    {
      "name": "customer_list_query",
      "type": "view",
      "start": {
        "type": "entity",
        "name": "cr.Customer",
        "as": "customer",
        "joins": [
          {
            "type": "entity",
            "name": "cm.Contract",
            "as": "contract",
            "joinType": "left"
          }
        ]
      },
      "filters": [
        {
          "field": "status",
          "operation": "EQ",
          "value": "active"
        }
      ],
      "sortings": [
        {"fieldName": "name", "direction": "ASC"}
      ],
      "paging": {
        "size": 100,
        "offset": 0
      }
    }
  ]
}
```

---

### 5. QlQueryValidatorTool (LOGIC)

**Purpose**: Validates QL query structure, entity aliases, and filter types.

**Package**: `cb.ai.tool.impl.query`

**Input** (`QlQueryValidatorInput`):
```java
QlRequestDto qlRequest;      // Query to validate
boolean strictMode;          // Fail on warnings
boolean validateTypes;       // Validate filter value types
boolean validateJoins;       // Validate join paths
int maxJoins;                // Max allowed joins (0 = unlimited)
int maxFilters;              // Max allowed filters (0 = unlimited)
```

**Output** (`QlQueryValidatorOutput`):
```java
boolean valid;                           // Overall validity
List<ValidationError> errors;            // Critical errors
List<String> warnings;                   // Non-critical issues
List<String> validatedEntities;          // Confirmed entity aliases
List<String> validatedJoins;             // Confirmed join paths
```

**Validation Error Codes**:
| Code | Description |
|------|-------------|
| NULL_REQUEST | QlRequestDto is null |
| NO_QUERIES | No queries defined |
| NO_START | Query has no start definition |
| NO_ENTITY | Start has no entity name |
| ENTITY_NOT_FOUND | Entity alias not found in system |
| MISSING_VALUE | Filter value required but missing |
| MISSING_VALUE_TO | BETWEEN requires valueTo |

---

### 6. QlExecutorTool (LOGIC)

**Purpose**: Executes QL queries and returns results.

**Package**: `cb.ai.tool.impl.query`

**Input** (`QlExecutorInput`):
```java
QlRequestDto qlRequest;      // Query to execute
int maxResults;              // Max results (default: 1000)
boolean skipValidation;      // Skip pre-validation
long timeoutMs;              // Execution timeout
String queryName;            // Specific query/pipe name
boolean includeMetadata;     // Include column metadata
```

**Output** (`QlExecutorOutput`):
```java
List<Map<String, Object>> results;   // Query results
int rowCount;                        // Rows returned
int totalCount;                      // Total matching rows (-1 if unknown)
long executionTimeMs;                // Execution time
boolean truncated;                   // Results truncated
List<ColumnMetadata> columns;        // Column metadata (if requested)
boolean success;
String errorMessage;
```

---

## Output Tools

### 7. VisualizationSuggesterTool (LLM)

**Purpose**: Suggests appropriate visualizations for query results.

**Package**: `cb.ai.tool.impl.output`

**Input** (`VisualizationSuggesterInput`):
```java
List<Map<String, Object>> dataSample;  // Sample data rows
String intent;                          // "list", "aggregate", "trend"
List<AggregationSpec> aggregations;     // Applied aggregations
List<String> groupByFields;             // Group by fields
List<ColumnInfo> columns;               // Column metadata
int totalRowCount;
String originalPrompt;
```

**Output** (`VisualizationSuggesterOutput`):
```java
List<ChartSuggestion> suggestions;   // Ranked chart suggestions
ChartSuggestion primarySuggestion;   // Top recommendation
String explanation;
List<String> dataInsights;
```

**Supported Chart Types**:
| Type | Best For |
|------|----------|
| BAR | Categorical comparisons (< 12 categories) |
| BAR_HORIZONTAL | Many categories or long labels |
| LINE | Time series, trends |
| AREA | Cumulative values over time |
| PIE / DONUT | Part-of-whole (< 8 categories) |
| SCATTER | Correlation analysis |
| TABLE | Detailed data, many columns |
| METRIC | Single KPI value |
| HEATMAP | Two-dimensional categorical data |
| BAR_STACKED | Part-of-whole across categories |
| BAR_GROUPED | Multiple series comparison |

---

### 8. NarrativeGeneratorTool (LLM)

**Purpose**: Generates human-readable summaries of query results.

**Package**: `cb.ai.tool.impl.output`

**Input** (`NarrativeGeneratorInput`):
```java
List<Map<String, Object>> results;   // Query results
String originalPrompt;               // Original user question
String intent;
List<AggregationSpec> aggregations;
List<String> groupByFields;
List<ColumnInfo> columns;
int totalRowCount;
String language;                     // "en" or "de"
DetailLevel detailLevel;             // BRIEF, STANDARD, DETAILED
```

**Output** (`NarrativeGeneratorOutput`):
```java
String narrative;                    // Main narrative text
List<Highlight> highlights;          // Key findings
String summary;                      // One-line summary
boolean answersQuestion;
double confidence;
```

**Highlight Types**:
| Type | Description |
|------|-------------|
| MAX_VALUE | Highest value in data |
| MIN_VALUE | Lowest value in data |
| TOTAL | Sum or total |
| AVERAGE | Average value |
| COUNT | Count of items |
| TREND | Trend or change |
| PATTERN | Notable pattern or anomaly |
| COMPARISON | Comparison between groups |
| INSIGHT | General observation |

---

## Dependencies

All tools require these Spring beans:
- `OpenAIService` - For LLM calls (LLM and HYBRID tools)
- `ObjectMapper` - For JSON parsing

Query tools may also need:
- `GenericObjectTypeService` - For entity validation
- `MetaService` - For schema information
- `QlService` - For query execution
- `QlDtoRequestService` / `QlDtoResponseService` - For DTO conversion

---

## Usage Example

```java
// 1. Parse temporal expression
TemporalExpressionInput tempInput = TemporalExpressionInput.builder()
    .text("last quarter")
    .referenceDate(LocalDate.now())
    .build();

CbToolResult<TemporalExpressionOutput> tempResult =
    temporalExpressionTool.execute(tempInput, CbToolContext.defaults());

// 2. Extract filters
FilterExpressionInput filterInput = FilterExpressionInput.builder()
    .text("active customers from Germany")
    .availableEntities(List.of("cr.Customer"))
    .temporalContext(tempResult.getOutput())
    .build();

CbToolResult<FilterExpressionOutput> filterResult =
    filterExpressionTool.execute(filterInput, CbToolContext.defaults());

// 3. Compose query
QlQueryComposerInput composerInput = QlQueryComposerInput.builder()
    .primaryEntity("cr.Customer")
    .filters(filterResult.getOutput().getFilters())
    .intent("list")
    .limit(100)
    .build();

CbToolResult<QlQueryComposerOutput> queryResult =
    qlQueryComposerTool.execute(composerInput, CbToolContext.defaults());

// 4. Validate query
QlQueryValidatorInput validatorInput = QlQueryValidatorInput.builder()
    .qlRequest(queryResult.getOutput().getQlRequest())
    .validateTypes(true)
    .build();

CbToolResult<QlQueryValidatorOutput> validationResult =
    qlQueryValidatorTool.execute(validatorInput, CbToolContext.defaults());

// 5. Execute query
if (validationResult.getOutput().isValid()) {
    QlExecutorInput executorInput = QlExecutorInput.builder()
        .qlRequest(queryResult.getOutput().getQlRequest())
        .maxResults(100)
        .build();

    CbToolResult<QlExecutorOutput> execResult =
        qlExecutorTool.execute(executorInput, CbToolContext.defaults());

    // 6. Generate narrative
    NarrativeGeneratorInput narrativeInput = NarrativeGeneratorInput.builder()
        .results(execResult.getOutput().getResults())
        .originalPrompt("Show active customers from Germany")
        .totalRowCount(execResult.getOutput().getRowCount())
        .build();

    CbToolResult<NarrativeGeneratorOutput> narrativeResult =
        narrativeGeneratorTool.execute(narrativeInput, CbToolContext.defaults());
}
```

---

## Error Handling

All tools follow consistent error handling:

1. **Tool Execution Errors**: Return `CbToolResult.failure(message, exception)`
2. **LLM Parse Errors**: Use fallback logic or return default output
3. **Validation Errors**: Collected in output, tool may still succeed
4. **Debug Mode**: When `context.isDebugEnabled()`, include full debug info

---

## Testing

Unit tests are located in:
```
backend/src/test/java/com/mvs/backend/cb/ai/tool/impl/query/
backend/src/test/java/com/mvs/backend/cb/ai/tool/impl/output/
```

Each test class covers:
- Basic tool metadata (alias, type)
- Successful execution with valid input
- Handling of invalid LLM responses
- Validation logic (for HYBRID tools)
- Debug info generation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial implementation |
