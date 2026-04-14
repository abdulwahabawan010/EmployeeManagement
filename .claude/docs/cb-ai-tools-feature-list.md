# CB AI Tools & Workflows - Feature List

## Overview

This document defines the interface-first implementation of AI tools and workflows for the CB (Cognitive Backend) module. The CB module serves as the AI orchestration layer for the entire system.

## Architecture Principles

1. **Interface-First** - Hardcoded implementations using Spring component interfaces
2. **Module-Provided Tools** - Each module can provide domain-specific tools
3. **Type Safety** - Compile-time checks with generic input/output types
4. **Debug-First** - Every execution can be traced step-by-step
5. **LG Integration** - Logic-based tools use the LG module's execution infrastructure

## Phase 1: Core Framework (MUST)

### Interfaces

| ID | Feature | Description | Package |
|----|---------|-------------|---------|
| IF-001 | CbTool Interface | Base interface for all tools with generic I/O types | `cb.ai.tool` |
| IF-002 | CbLlmTool Interface | Extension for LLM-based tools with prompt methods | `cb.ai.tool` |
| IF-003 | CbLogicTool Interface | Extension for LG Logic-based tools | `cb.ai.tool` |
| IF-004 | CbHybridTool Interface | Extension for LLM+Logic validation tools | `cb.ai.tool` |
| IF-005 | CbWorkflow Interface | Base interface for workflows orchestrating tools | `cb.ai.workflow` |
| IF-006 | AbstractCbWorkflow | Base class with helper methods for tool execution | `cb.ai.workflow` |

### Context & Result Classes

| ID | Feature | Description | Package |
|----|---------|-------------|---------|
| IF-007 | CbToolContext | Execution context with debug flag and metadata | `cb.ai.context` |
| IF-008 | CbWorkflowContext | Workflow context with step results and traces | `cb.ai.context` |
| IF-009 | CbToolResult | Tool execution result with output, timing, tokens | `cb.ai.result` |
| IF-010 | CbWorkflowResult | Workflow result with all step traces | `cb.ai.result` |
| IF-011 | CbToolDebugInfo | Debug information (prompts, responses, etc.) | `cb.ai.result` |
| IF-012 | CbWorkflowStepTrace | Individual step trace in workflow | `cb.ai.result` |

### Services

| ID | Feature | Description | Package |
|----|---------|-------------|---------|
| IF-013 | CbToolRegistry | Auto-discover and register all CbTool beans | `cb.ai.registry` |
| IF-014 | CbWorkflowRegistry | Auto-discover and register all CbWorkflow beans | `cb.ai.registry` |
| IF-015 | CbExecutionService | Execute tools/workflows with tracking | `cb.ai.service` |
| IF-016 | CbExecutionTracker | Track and persist execution history | `cb.ai.service` |

### DTOs

| ID | Feature | Description | Package |
|----|---------|-------------|---------|
| IF-017 | CbToolInfo | Tool metadata for listing | `cb.ai.dto` |
| IF-018 | CbWorkflowInfo | Workflow metadata for listing | `cb.ai.dto` |
| IF-019 | CbExecutionRequest | Generic execution request DTO | `cb.ai.dto` |
| IF-020 | CbExecutionResponse | Generic execution response DTO | `cb.ai.dto` |

---

## Phase 2: Built-in Tools (MUST)

### Knowledge Tools

| ID | Tool | Type | Description |
|----|------|------|-------------|
| BT-001 | EntityDiscoveryTool | LLM | Find entities matching natural language description |
| BT-002 | AttributeDiscoveryTool | LLM | Find attributes for entities by description |
| BT-003 | JoinPathFinderTool | LOGIC | Calculate optimal join paths between entities |
| BT-004 | DomainConceptResolverTool | LLM | Map business terms to technical entities using synonyms |
| BT-005 | SchemaContextTool | LOGIC | Build comprehensive schema context for LLM prompts |

### Language Understanding Tools

| ID | Tool | Type | Description |
|----|------|------|-------------|
| BT-006 | IntentClassifierTool | LLM | Classify user intent (list, aggregate, compare, trend) |
| BT-007 | EntityMentionExtractorTool | LLM | Extract entity references from text |
| BT-008 | TemporalExpressionTool | HYBRID | Parse date/time expressions to concrete dates |
| BT-009 | FilterExpressionTool | HYBRID | Extract filter conditions from natural language |
| BT-010 | AggregationExpressionTool | LLM | Extract grouping and aggregation requirements |

### Query Tools

| ID | Tool | Type | Description |
|----|------|------|-------------|
| BT-011 | QlQueryComposerTool | LLM | Compose QL query from specifications |
| BT-012 | QlQueryValidatorTool | LOGIC | Validate QL query structure and references |
| BT-013 | QlQueryExplainerTool | LLM | Explain query in natural language |
| BT-014 | QlExecutorTool | LOGIC | Execute QL query and return results |

### Output Tools

| ID | Tool | Type | Description |
|----|------|------|-------------|
| BT-015 | VisualizationSuggesterTool | LLM | Suggest appropriate chart types for data |
| BT-016 | NarrativeGeneratorTool | LLM | Generate text summary of results |

---

## Phase 3: Built-in Workflows (MUST)

| ID | Workflow | Description | Tools Used |
|----|----------|-------------|------------|
| BW-001 | ReportFromPromptWorkflow | Generate report from natural language | IntentClassifier, EntityDiscovery, TemporalExpression, FilterExpression, JoinPathFinder, QlQueryComposer, QlQueryValidator, QlExecutor, VisualizationSuggester |
| BW-002 | EntitySearchWorkflow | Search entities by description | EntityDiscovery, AttributeDiscovery, SchemaContext |
| BW-003 | QueryBuilderWorkflow | Build QL from structured input | JoinPathFinder, QlQueryComposer, QlQueryValidator |
| BW-004 | DataExplorerWorkflow | Explore entity relationships | EntityDiscovery, JoinPathFinder, SchemaContext |

---

## Phase 4: API Layer (MUST)

### REST Endpoints

| ID | Method | Endpoint | Description |
|----|--------|----------|-------------|
| API-001 | GET | `/api/cb/ai/tools` | List all available tools |
| API-002 | GET | `/api/cb/ai/tools/{alias}` | Get tool details |
| API-003 | POST | `/api/cb/ai/tools/{alias}/execute` | Execute a tool |
| API-004 | GET | `/api/cb/ai/workflows` | List all available workflows |
| API-005 | GET | `/api/cb/ai/workflows/{alias}` | Get workflow details |
| API-006 | POST | `/api/cb/ai/workflows/{alias}/execute` | Execute a workflow |
| API-007 | GET | `/api/cb/ai/executions/{id}` | Get execution trace |
| API-008 | GET | `/api/cb/ai/executions` | List recent executions |

### Controller

| ID | Feature | Description |
|----|---------|-------------|
| API-009 | CbAiToolController | REST controller for tool operations |
| API-010 | CbAiWorkflowController | REST controller for workflow operations |

---

## Phase 5: Frontend Playgrounds (MUST)

| ID | Feature | Description |
|----|---------|-------------|
| FE-001 | Tool Playground Page | Interactive tool testing with input editor |
| FE-002 | Workflow Playground Page | Workflow testing with debug visualization |
| FE-003 | Debug Console Component | Step-by-step execution trace viewer |
| FE-004 | LLM Details Expander | View system/user prompts and responses |
| FE-005 | Execution History Component | Browse past executions |

---

## Tool Input/Output Specifications

### EntityDiscoveryTool

**Input:**
```java
class EntityDiscoveryInput {
    String query;                    // Natural language description
    List<String> moduleFilter;       // Optional: limit to modules
    int maxResults = 5;              // Max entities to return
}
```

**Output:**
```java
class EntityDiscoveryOutput {
    List<EntityMatch> matches;
}

class EntityMatch {
    String entityAlias;              // e.g., "cr.Customer"
    double confidence;               // 0.0 - 1.0
    String reasoning;                // Why this matches
    String purpose;                  // From entity documentation
}
```

### IntentClassifierTool

**Input:**
```java
class IntentClassifierInput {
    String text;                     // User's prompt
    List<String> possibleIntents;    // Optional: constrain intents
}
```

**Output:**
```java
class IntentClassifierOutput {
    String intent;                   // Primary intent
    double confidence;               // 0.0 - 1.0
    List<String> subIntents;         // Secondary intents
    Map<String, Double> allScores;   // All intent scores
}
```

### FilterExpressionTool

**Input:**
```java
class FilterExpressionInput {
    String text;                     // User's prompt
    List<String> availableEntities;  // Entities in scope
    TemporalContext temporalContext; // From TemporalExpressionTool
}
```

**Output:**
```java
class FilterExpressionOutput {
    List<FilterExpression> filters;
    List<String> warnings;           // Ambiguities found
}

class FilterExpression {
    String entityAlias;
    String attributeName;
    String operator;                 // EQ, NE, GT, LT, LIKE, IN, etc.
    Object value;
    String originalText;             // The text that generated this
}
```

### QlQueryComposerTool

**Input:**
```java
class QlQueryComposerInput {
    String primaryEntity;            // Main entity alias
    List<JoinSpec> joins;            // Join specifications
    List<FilterExpression> filters;  // Filter conditions
    String intent;                   // list, aggregate, etc.
    List<AggregationSpec> aggregations;
    List<String> groupBy;
    List<SortSpec> orderBy;
    Integer limit;
}
```

**Output:**
```java
class QlQueryComposerOutput {
    QlRequestDto qlRequest;          // The composed query
    String explanation;              // Human-readable explanation
}
```

### ReportFromPromptWorkflow

**Input:**
```java
class ReportPromptInput {
    String prompt;                   // Natural language prompt
    int maxResults = 1000;           // Max rows to return
    boolean includeVisualization = true;
    boolean debugEnabled = false;
}
```

**Output:**
```java
class ReportResult {
    QlRequestDto qlQuery;            // The generated query
    List<Map<String, Object>> results;
    int rowCount;
    String intent;                   // Detected intent
    List<String> entitiesUsed;       // Entities in query
    ChartSuggestion visualization;   // Suggested chart
    String narrative;                // Text summary (optional)
}
```

---

## Debug Information Structure

```java
class CbToolDebugInfo {
    // For LLM tools
    String systemPrompt;
    String userPrompt;
    String llmResponse;
    String modelUsed;
    int promptTokens;
    int completionTokens;

    // For Logic tools
    String logicAlias;
    Map<String, Object> logicInput;
    Map<String, Object> logicOutput;
    String logicLanguage;            // SpEL, Groovy, etc.

    // General
    Map<String, Object> additionalInfo;
}

class CbWorkflowStepTrace {
    int stepOrder;
    String toolAlias;
    String toolName;
    Instant startTime;
    Duration duration;
    Object input;                    // Serialized input
    Object output;                   // Serialized output
    boolean success;
    String errorMessage;
    Integer tokensUsed;
    CbToolDebugInfo debugInfo;
}
```

---

## Implementation Notes

### LG Integration

Logic-based tools should use the LG module's `LogicExecutorService`:

```java
@Autowired
private LogicExecutorService logicExecutorService;

// In tool execution:
Logic logic = logicRepository.findByAlias(getLogicAlias());
LogicExecutionResult result = logicExecutorService.execute(logic, input);
```

### OpenAI Integration

LLM-based tools should use the existing `OpenAIService`:

```java
@Autowired
private OpenAIService openAIService;

// In tool execution:
OpenAIResponse response = openAIService.chat(systemPrompt, userPrompt);
```

### Error Handling

All tools should:
1. Catch exceptions and return failed `CbToolResult`
2. Include error details in debug info
3. Not throw exceptions that break workflow execution

### Testing

Each tool should have:
1. Unit tests with mocked dependencies
2. Integration tests with test data
3. Test cases for error scenarios

---

## File Structure

```
backend/src/main/java/com/mvs/backend/cb/
├── ai/
│   ├── tool/
│   │   ├── CbTool.java
│   │   ├── CbLlmTool.java
│   │   ├── CbLogicTool.java
│   │   ├── CbHybridTool.java
│   │   └── impl/
│   │       ├── knowledge/
│   │       │   ├── EntityDiscoveryTool.java
│   │       │   ├── AttributeDiscoveryTool.java
│   │       │   ├── JoinPathFinderTool.java
│   │       │   └── ...
│   │       ├── language/
│   │       │   ├── IntentClassifierTool.java
│   │       │   ├── TemporalExpressionTool.java
│   │       │   └── ...
│   │       ├── query/
│   │       │   ├── QlQueryComposerTool.java
│   │       │   ├── QlQueryValidatorTool.java
│   │       │   └── ...
│   │       └── output/
│   │           ├── VisualizationSuggesterTool.java
│   │           └── ...
│   ├── workflow/
│   │   ├── CbWorkflow.java
│   │   ├── AbstractCbWorkflow.java
│   │   └── impl/
│   │       ├── ReportFromPromptWorkflow.java
│   │       ├── EntitySearchWorkflow.java
│   │       └── ...
│   ├── context/
│   │   ├── CbToolContext.java
│   │   └── CbWorkflowContext.java
│   ├── result/
│   │   ├── CbToolResult.java
│   │   ├── CbWorkflowResult.java
│   │   ├── CbToolDebugInfo.java
│   │   └── CbWorkflowStepTrace.java
│   ├── registry/
│   │   ├── CbToolRegistry.java
│   │   └── CbWorkflowRegistry.java
│   ├── service/
│   │   ├── CbExecutionService.java
│   │   └── CbExecutionTracker.java
│   ├── dto/
│   │   ├── input/
│   │   │   ├── EntityDiscoveryInput.java
│   │   │   └── ...
│   │   ├── output/
│   │   │   ├── EntityDiscoveryOutput.java
│   │   │   └── ...
│   │   └── api/
│   │       ├── CbToolInfo.java
│   │       ├── CbWorkflowInfo.java
│   │       └── ...
│   └── controller/
│       ├── CbAiToolController.java
│       └── CbAiWorkflowController.java
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | Claude | Initial feature list |
