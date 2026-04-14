# CB AI Workflows & REST API Documentation

## Overview

The CB AI module provides a workflow orchestration system for AI-powered data operations. This document covers the built-in workflows and the REST API for executing tools and workflows.

## Architecture

```
+------------------+     +------------------+     +------------------+
|   REST API       |---->|   Execution      |---->|   Workflows      |
|   Controllers    |     |   Service        |     |   & Tools        |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
|   API DTOs       |     |   Execution      |     |   Tool           |
|   (Request/Resp) |     |   Tracker        |     |   Registry       |
+------------------+     +------------------+     +------------------+
```

## Workflows

### 1. ReportFromPromptWorkflow

**Alias:** `report-from-prompt`

**Purpose:** Generates a complete report from a natural language prompt by orchestrating multiple tools.

**Input:**
```json
{
  "prompt": "Show me all active customers from last month",
  "maxResults": 1000,
  "includeVisualization": true,
  "includeNarrative": false,
  "debugEnabled": false
}
```

**Output:**
```json
{
  "qlQuery": { /* QlRequestDto */ },
  "qlQueryJson": "{ \"queries\": [...] }",
  "results": [{ "id": 1, "name": "Customer A", ... }],
  "rowCount": 42,
  "totalRowCount": 42,
  "intent": "list",
  "intentConfidence": 0.95,
  "entitiesUsed": ["cr.Customer"],
  "visualization": {
    "chartType": "table",
    "categoryFields": ["name"],
    "valueFields": ["status"],
    "title": "Active Customers"
  },
  "queryExplanation": "Lists all customers with status ACTIVE created in the last 30 days",
  "warnings": []
}
```

**Steps:**
1. **Classify Intent** - Determines the user's intent (list, aggregate, compare, trend)
2. **Extract Entity Mentions** - Finds entity references in the text
3. **Discover Entities** - Resolves mentions to actual entities
4. **Parse Temporal Expressions** - Extracts date constraints
5. **Extract Filters** - Extracts filter conditions
6. **Find Join Paths** - Calculates joins (if multiple entities)
7. **Extract Aggregations** - Extracts grouping/aggregation (if intent requires)
8. **Compose Query** - Builds the QL query
9. **Validate Query** - Validates query structure
10. **Execute Query** - Executes the query
11. **Suggest Visualization** - Suggests chart types (optional)

**Conditional Steps:**
- Aggregation step is skipped for "list" intent
- Visualization step is skipped if `includeVisualization` is false
- Join step is skipped for single-entity queries

---

### 2. EntitySearchWorkflow

**Alias:** `entity-search`

**Purpose:** Searches for entities matching a natural language description.

**Input:**
```json
{
  "query": "customer information",
  "moduleFilter": ["cr", "ct"],
  "includeAttributes": true,
  "maxResults": 10,
  "minConfidence": 0.5
}
```

**Output:**
```json
{
  "entities": [
    {
      "entityAlias": "cr.Customer",
      "entityName": "Customer",
      "moduleAlias": "cr",
      "purpose": "Represents a customer in the system",
      "confidence": 0.92,
      "reasoning": "Direct match on customer keyword",
      "attributes": [
        {
          "name": "id",
          "dataType": "Long",
          "purpose": "Primary key",
          "required": true,
          "isReference": false
        }
      ]
    }
  ],
  "totalCount": 1,
  "schemaContext": "Entity: cr.Customer\n  - id: Long (PK)\n  - name: String..."
}
```

**Steps:**
1. **Discover Entities** - Finds matching entities
2. **Get Attributes** - Gets attributes for each entity (if requested)
3. **Build Schema Context** - Builds formatted schema context

---

### 3. QueryBuilderWorkflow

**Alias:** `query-builder`

**Purpose:** Builds a QL query from structured input specifications.

**Input:**
```json
{
  "primaryEntity": "cr.Customer",
  "joinEntities": ["ct.Contract"],
  "filters": [
    {
      "fieldName": "status",
      "operator": "EQ",
      "value": "ACTIVE"
    }
  ],
  "aggregations": [
    {
      "function": "COUNT",
      "alias": "customerCount"
    }
  ],
  "groupBy": ["status"],
  "orderBy": [
    {
      "fieldName": "status",
      "descending": false
    }
  ],
  "limit": 100,
  "includeExplanation": true
}
```

**Output:**
```json
{
  "qlRequest": { /* QlRequestDto */ },
  "qlRequestJson": "{ \"queries\": [...] }",
  "explanation": "Groups customers by status and counts them",
  "validationResult": {
    "valid": true,
    "errors": [],
    "warnings": ["Consider adding index on status column"]
  },
  "joinPaths": [
    {
      "sourceEntity": "cr.Customer",
      "targetEntity": "ct.Contract",
      "pathDescription": "Customer -> Contract via customerId",
      "hops": 1,
      "joinType": "INNER"
    }
  ]
}
```

**Steps:**
1. **Find Join Paths** - Calculates joins (if multiple entities)
2. **Compose Query** - Builds the QL query
3. **Validate Query** - Validates structure and references
4. **Explain Query** - Generates explanation (optional)

---

### 4. DataExplorerWorkflow

**Alias:** `data-explorer`

**Purpose:** Explores an entity's schema, relationships, and sample data.

**Input:**
```json
{
  "entityAlias": "cr.Customer",
  "depth": 1,
  "includeSampleData": true,
  "sampleSize": 5,
  "includeStats": false
}
```

**Output:**
```json
{
  "entity": {
    "entityAlias": "cr.Customer",
    "entityName": "Customer",
    "moduleAlias": "cr",
    "purpose": "Represents a customer",
    "attributes": [
      {
        "name": "id",
        "dataType": "Long",
        "purpose": "Primary key",
        "required": true
      }
    ],
    "recordCount": 1250
  },
  "relatedEntities": [
    {
      "entityAlias": "ct.Contract",
      "entityName": "Contract",
      "relationshipType": "ONE_TO_MANY",
      "relationshipDescription": "via Customer.id -> Contract.customerId",
      "distance": 1,
      "joinPath": "cr.Customer.id = ct.Contract.customerId"
    }
  ],
  "sampleData": [
    { "id": 1, "name": "ACME Corp", "status": "ACTIVE" }
  ],
  "schemaContext": "..."
}
```

**Steps:**
1. **Get Entity Attributes** - Retrieves attribute information
2. **Build Schema Context** - Builds formatted context
3. **Find Related Entities** - Discovers relationships (if depth > 0)
4. **Get Sample Data** - Fetches sample records (if requested)

---

## REST API

### Tool Endpoints

#### List All Tools
```
GET /api/cb/ai/tools
```

**Response:**
```json
[
  {
    "alias": "intent-classifier",
    "name": "Intent Classifier",
    "description": "Classifies user intent from natural language",
    "type": "LLM",
    "inputClass": "IntentClassifierInput",
    "outputClass": "IntentClassifierOutput",
    "requiresLlm": true
  }
]
```

#### Get Tool Details
```
GET /api/cb/ai/tools/{alias}
```

**Response:**
```json
{
  "alias": "intent-classifier",
  "name": "Intent Classifier",
  "description": "Classifies user intent from natural language",
  "type": "LLM",
  "inputClass": "IntentClassifierInput",
  "outputClass": "IntentClassifierOutput",
  "requiresLlm": true
}
```

#### Execute Tool
```
POST /api/cb/ai/tools/{alias}/execute
```

**Request:**
```json
{
  "input": {
    "text": "Show me all customers"
  },
  "debugEnabled": false,
  "sessionId": "optional-session-id",
  "timeoutMs": 30000
}
```

**Response:**
```json
{
  "toolAlias": "intent-classifier",
  "success": true,
  "output": {
    "intent": "list",
    "confidence": 0.95,
    "subIntents": [],
    "allScores": { "list": 0.95, "aggregate": 0.05 }
  },
  "durationMs": 250,
  "tokensUsed": 150,
  "debugInfo": null
}
```

---

### Workflow Endpoints

#### List All Workflows
```
GET /api/cb/ai/workflows
```

**Response:**
```json
[
  {
    "alias": "report-from-prompt",
    "name": "Report from Prompt",
    "description": "Generates a report from natural language",
    "inputClass": "ReportPromptInput",
    "outputClass": "ReportResult",
    "toolAliases": ["intent-classifier", "entity-discovery", ...],
    "stepNames": ["Classify Intent", "Discover Entities", ...]
  }
]
```

#### Get Workflow Details
```
GET /api/cb/ai/workflows/{alias}
```

#### Execute Workflow
```
POST /api/cb/ai/workflows/{alias}/execute
```

**Request:**
```json
{
  "input": {
    "prompt": "Show me all active customers",
    "maxResults": 100,
    "includeVisualization": true
  },
  "debugEnabled": true,
  "sessionId": "optional-session-id",
  "correlationId": "optional-correlation-id",
  "timeoutMs": 120000
}
```

**Response:**
```json
{
  "workflowAlias": "report-from-prompt",
  "executionId": "abc-123",
  "success": true,
  "output": { /* ReportResult */ },
  "totalDurationMs": 2500,
  "totalTokensUsed": 850,
  "stepsExecuted": 10,
  "stepsSkipped": 1,
  "stepTraces": [
    {
      "stepOrder": 1,
      "stepName": "Classify Intent",
      "toolAlias": "intent-classifier",
      "toolName": "Intent Classifier",
      "success": true,
      "durationMs": 250,
      "tokensUsed": 150,
      "input": { "text": "Show me all active customers" },
      "output": { "intent": "list", "confidence": 0.95 }
    }
  ]
}
```

---

### Execution History Endpoints

#### List Recent Executions
```
GET /api/cb/ai/executions?limit=50&type=WORKFLOW
```

**Query Parameters:**
- `limit` (optional, default: 50) - Maximum executions to return
- `type` (optional) - Filter by TOOL or WORKFLOW

**Response:**
```json
[
  {
    "executionId": "abc-123",
    "type": "WORKFLOW",
    "alias": "report-from-prompt",
    "name": "Report from Prompt",
    "success": true,
    "startTime": "2026-02-05T10:30:00Z",
    "durationMs": 2500,
    "tokensUsed": 850,
    "userId": 123
  }
]
```

#### Get Execution Details
```
GET /api/cb/ai/executions/{id}
```

**Response:**
```json
{
  "summary": {
    "executionId": "abc-123",
    "type": "WORKFLOW",
    "alias": "report-from-prompt",
    "success": true,
    "durationMs": 2500
  },
  "input": { /* original input */ },
  "output": { /* execution output */ },
  "stepTraces": [ /* step details if workflow */ ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request (bad input format) |
| 404 | Tool/workflow/execution not found |
| 500 | Internal server error |

### Error Response Format
```json
{
  "toolAlias": "intent-classifier",
  "success": false,
  "errorMessage": "Tool not found: unknown-tool"
}
```

### Workflow Failure Response
```json
{
  "workflowAlias": "report-from-prompt",
  "executionId": "abc-123",
  "success": false,
  "errorMessage": "Failed to discover entities: No matching entities found",
  "failedStep": "Discover Entities",
  "stepsExecuted": 2,
  "stepTraces": [ /* partial traces */ ]
}
```

---

## Debug Mode

When `debugEnabled: true` is set in the request:

### Tool Debug Info
```json
{
  "debugInfo": {
    "systemPrompt": "You are an intent classifier...",
    "userPrompt": "Classify: Show me all customers",
    "llmResponse": "{ \"intent\": \"list\", ... }",
    "modelUsed": "gpt-4",
    "promptTokens": 100,
    "completionTokens": 50
  }
}
```

### Workflow Step Traces
```json
{
  "stepTraces": [
    {
      "stepOrder": 1,
      "stepName": "Classify Intent",
      "toolAlias": "intent-classifier",
      "startTime": "2026-02-05T10:30:00Z",
      "duration": "PT0.250S",
      "input": { /* tool input */ },
      "output": { /* tool output */ },
      "success": true,
      "tokensUsed": 150,
      "debugInfo": { /* LLM details */ }
    },
    {
      "stepOrder": 7,
      "stepName": "Extract Aggregations",
      "toolAlias": "aggregation-expression",
      "skipped": true,
      "skipReason": "Intent 'list' does not require aggregation"
    }
  ]
}
```

---

## Package Structure

```
cb.ai.workflow/
  CbWorkflow.java           - Base workflow interface
  AbstractCbWorkflow.java   - Base class with helper methods
  impl/
    ReportFromPromptWorkflow.java
    EntitySearchWorkflow.java
    QueryBuilderWorkflow.java
    DataExplorerWorkflow.java

cb.ai.controller/
  CbAiToolController.java      - Tool REST endpoints
  CbAiWorkflowController.java  - Workflow REST endpoints

cb.ai.dto.workflow/
  ReportPromptInput.java
  ReportResult.java
  EntitySearchInput.java
  EntitySearchResult.java
  QueryBuilderInput.java
  QueryBuilderResult.java
  DataExplorerInput.java
  DataExplorerResult.java

cb.ai.dto.api/
  CbToolInfo.java
  CbWorkflowInfo.java
  CbToolExecuteRequest.java
  CbToolExecuteResponse.java
  CbWorkflowExecuteRequest.java
  CbWorkflowExecuteResponse.java
  CbExecutionSummary.java
```

---

## Testing

### Unit Tests
Located in: `backend/src/test/java/com/mvs/backend/cb/ai/workflow/`

- `ReportFromPromptWorkflowTest.java`
- `EntitySearchWorkflowTest.java`
- `QueryBuilderWorkflowTest.java`
- `DataExplorerWorkflowTest.java`

### Controller Tests
Located in: `backend/src/test/java/com/mvs/backend/cb/ai/controller/`

- `CbAiToolControllerTest.java`
- `CbAiWorkflowControllerTest.java`

### Running Tests
```bash
# Run all CB AI tests
./gradlew test --tests "com.mvs.backend.cb.ai.*"

# Run specific workflow tests
./gradlew test --tests "com.mvs.backend.cb.ai.workflow.*"

# Run controller tests
./gradlew test --tests "com.mvs.backend.cb.ai.controller.*"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial implementation |
