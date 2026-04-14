# CB Module - REST API Documentation

This document describes the REST API endpoints for the CB (Cognitive Backend) module.

## Base URL

All CB endpoints are prefixed with `/mvsa/cb`.

---

## Query Endpoints

### Process Natural Language Query

Translates a natural language query to a QL query without executing it.

```
POST /mvsa/cb/query
```

**Request Body:**
```json
{
  "query": "Show me all active contracts for customer Marko Milakovic",
  "sessionId": 123,  // Optional: for multi-turn conversations
  "options": {
    "maxAlternatives": 3,
    "includeExplanation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "type": "search",
        "entity": "cr.Customer",
        "term": "Marko Milakovic"
      }
    ],
    "qlRequest": {
      "queries": [{
        "name": "activeContracts",
        "start": {
          "name": "cr.Customer",
          "as": "c"
        },
        "joins": [
          { "name": "cm.Contract#customer", "as": "co", "joinType": "inner" }
        ],
        "filters": [
          { "field": "c.id", "operation": "EQ", "value": "${searchResult}" },
          { "field": "co.status", "operation": "EQ", "value": "ACTIVE" }
        ]
      }]
    },
    "explanation": "This query searches for customer 'Marko Milakovic' and retrieves all their contracts with status ACTIVE.",
    "confidence": 0.92,
    "alternatives": [
      {
        "interpretation": "Active contracts by contract name",
        "confidence": 0.45
      }
    ]
  }
}
```

---

### Execute Natural Language Query

Translates AND executes the query, returning results.

```
POST /mvsa/cb/query/execute
```

**Request Body:**
```json
{
  "query": "How many customers do we have in Munich?",
  "options": {
    "limit": 100,
    "offset": 0
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qlRequest": { ... },
    "explanation": "Counting customers where city equals 'Munich'",
    "confidence": 0.95,
    "results": {
      "count": 42,
      "executionTimeMs": 125
    }
  }
}
```

---

### Validate Query

Validates a natural language query without execution.

```
POST /mvsa/cb/query/validate
```

**Request Body:**
```json
{
  "query": "Show me active contracts"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "qlRequest": { ... },
    "warnings": [
      "No customer filter specified - query may return large result set"
    ],
    "securityCheck": {
      "passed": true,
      "complexityScore": 3
    }
  }
}
```

---

## Conversation Endpoints

### Start Conversation Session

Creates a new multi-turn conversation session.

```
POST /mvsa/cb/conversation/start
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 456,
    "startedAt": "2024-01-15T10:30:00Z",
    "status": "ACTIVE"
  }
}
```

---

### Add Conversation Turn

Adds a turn to an existing conversation.

```
POST /mvsa/cb/conversation/{sessionId}/turn
```

**Request Body:**
```json
{
  "userInput": "How many contracts do they have?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "turnNumber": 2,
    "interpretation": "Count contracts for previously mentioned customers",
    "qlRequest": { ... },
    "contextUsed": {
      "resolvedReferences": {
        "they": "customers from Munich (from turn 1)"
      }
    }
  }
}
```

---

### End Conversation Session

Ends an active conversation session.

```
POST /mvsa/cb/conversation/{sessionId}/end
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 456,
    "totalTurns": 5,
    "endedAt": "2024-01-15T10:45:00Z",
    "status": "COMPLETED"
  }
}
```

---

## Feedback Endpoints

### Submit Feedback

Submits user feedback for a query.

```
POST /mvsa/cb/feedback
```

**Request Body:**
```json
{
  "queryLogId": 789,
  "wasHelpful": true,
  "rating": 5,
  "comment": "Exactly what I needed!",
  "correctedQlJson": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackId": 101,
    "message": "Thank you for your feedback!"
  }
}
```

---

## Coverage Endpoints

### Get Coverage Overview

Returns documentation coverage for all modules.

```
GET /mvsa/cb/coverage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "moduleName": "cr",
        "totalEntities": 15,
        "documentedEntities": 12,
        "coveragePercent": 80.0,
        "calculatedAt": "2024-01-15T00:00:00Z"
      },
      {
        "moduleName": "cm",
        "totalEntities": 20,
        "documentedEntities": 8,
        "coveragePercent": 40.0,
        "calculatedAt": "2024-01-15T00:00:00Z"
      }
    ],
    "overallCoverage": 57.14
  }
}
```

---

### Refresh Coverage Metrics

Triggers recalculation of all coverage metrics.

```
POST /mvsa/cb/coverage/refresh
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Coverage refresh initiated",
    "estimatedCompletionTimeMs": 5000
  }
}
```

---

### Get Module Coverage Detail

Returns detailed coverage for a specific module.

```
GET /mvsa/cb/coverage/{moduleName}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moduleName": "cr",
    "coveragePercent": 80.0,
    "entities": [
      {
        "objectTypeAlias": "cr.Customer",
        "hasDocumentation": true,
        "attributesCovered": 10,
        "totalAttributes": 12,
        "attributeCoveragePercent": 83.33
      },
      {
        "objectTypeAlias": "cr.Contact",
        "hasDocumentation": false,
        "attributesCovered": 0,
        "totalAttributes": 8,
        "attributeCoveragePercent": 0
      }
    ]
  }
}
```

---

## Template Management Endpoints

### List Query Templates

```
GET /mvsa/cb/templates
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | Filter by active status |
| page | int | Page number (0-based) |
| size | int | Page size |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Active Customer Contracts",
        "description": "Shows active contracts for a customer",
        "intentPattern": ".*active.*contracts.*customer.*",
        "isActive": true,
        "priority": 100
      }
    ],
    "totalElements": 15,
    "totalPages": 2
  }
}
```

---

### Create Query Template

```
POST /mvsa/cb/templates
```

**Request Body:**
```json
{
  "name": "Customer Contracts by Status",
  "description": "Retrieves contracts filtered by status",
  "intentPattern": ".*contracts.*status.*",
  "qlRequestJson": "{\"queries\":[{\"name\":\"contracts\",\"start\":{\"name\":\"cm.Contract\"}}]}",
  "parameters": [
    {
      "parameterName": "status",
      "dataType": "STRING",
      "extractionPattern": "status\\s+(?:is\\s+)?(\\w+)"
    }
  ],
  "isActive": true,
  "priority": 50
}
```

---

### Update Query Template

```
PUT /mvsa/cb/templates/{id}
```

---

### Delete Query Template

```
DELETE /mvsa/cb/templates/{id}
```

---

## Knowledge Base Endpoints

### Domain Concepts

```
GET    /mvsa/cb/concepts              # List all concepts
POST   /mvsa/cb/concepts              # Create concept
GET    /mvsa/cb/concepts/{id}         # Get concept
PUT    /mvsa/cb/concepts/{id}         # Update concept
DELETE /mvsa/cb/concepts/{id}         # Delete concept
```

**Create Concept Request:**
```json
{
  "term": "premium customer",
  "definition": "A customer with annual revenue above 100,000 EUR",
  "category": "Customer Segmentation"
}
```

---

### Synonyms

```
GET    /mvsa/cb/synonyms              # List all synonyms
POST   /mvsa/cb/synonyms              # Create synonym
GET    /mvsa/cb/synonyms/{id}         # Get synonym
PUT    /mvsa/cb/synonyms/{id}         # Update synonym
DELETE /mvsa/cb/synonyms/{id}         # Delete synonym
```

**Create Synonym Request:**
```json
{
  "conceptId": 1,
  "synonym": "VIP customer",
  "type": "EXACT"
}
```

---

### Business Rules

```
GET    /mvsa/cb/rules                 # List all rules
POST   /mvsa/cb/rules                 # Create rule
GET    /mvsa/cb/rules/{id}            # Get rule
PUT    /mvsa/cb/rules/{id}            # Update rule
DELETE /mvsa/cb/rules/{id}            # Delete rule
```

**Create Rule Request:**
```json
{
  "name": "Active Only",
  "description": "Filter to show only active records",
  "objectTypeAlias": "cm.Contract",
  "qlFilterJson": "[{\"field\":\"status\",\"operation\":\"EQ\",\"value\":\"ACTIVE\"}]",
  "isActive": true
}
```

---

## Analytics Endpoints

### Query Analytics

```
GET /mvsa/cb/analytics/queries
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| from | date | Start date (ISO format) |
| to | date | End date (ISO format) |
| status | string | Filter by query status |
| userId | long | Filter by user |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 1500,
    "successRate": 0.87,
    "averageLatencyMs": 245,
    "averageConfidence": 0.82,
    "byStatus": {
      "SUCCESS": 1305,
      "FAILED": 120,
      "CLARIFICATION_NEEDED": 75
    },
    "topFailedPatterns": [
      {
        "pattern": "complex join queries",
        "count": 45,
        "suggestion": "Consider adding more query templates"
      }
    ],
    "queryTrend": [
      { "date": "2024-01-14", "count": 150 },
      { "date": "2024-01-15", "count": 175 }
    ]
  }
}
```

---

## Model Version Endpoints

### List Model Versions

```
GET /mvsa/cb/models
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "GPT-4 Fine-tuned",
      "version": 3,
      "status": "ACTIVE",
      "accuracy": 0.89,
      "trainedAt": "2024-01-10T00:00:00Z",
      "trainingSampleSize": 5000
    },
    {
      "id": 2,
      "name": "GPT-4 Fine-tuned",
      "version": 2,
      "status": "DEPRECATED",
      "accuracy": 0.85,
      "trainedAt": "2024-01-01T00:00:00Z",
      "trainingSampleSize": 3000
    }
  ]
}
```

---

### Activate Model Version

```
POST /mvsa/cb/models/{id}/activate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Model version 4 activated",
    "previousActiveVersion": 3
  }
}
```

---

## Entity Documentation Endpoints

Standard CRUD endpoints for entity documentation:

```
GET    /mvsa/cb/entityDocumentations           # List all
POST   /mvsa/cb/entityDocumentations           # Create
GET    /mvsa/cb/entityDocumentations/{id}      # Get by ID
PUT    /mvsa/cb/entityDocumentations/{id}      # Update
DELETE /mvsa/cb/entityDocumentations/{id}      # Delete
```

**Create Request:**
```json
{
  "objectTypeAlias": "cr.Customer",
  "businessDescription": "Represents a customer in the CRM system",
  "usageNotes": "Primary entity for customer queries",
  "domainContext": "Customer Relationship Management"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "CB_001",
    "message": "Query could not be parsed",
    "details": "Unable to identify target entity from input",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| CB_001 | Query parsing failed |
| CB_002 | Schema linking failed |
| CB_003 | Security validation failed |
| CB_004 | Entity not found |
| CB_005 | Unauthorized access |
| CB_006 | Query execution failed |
| CB_007 | Session expired |
| CB_008 | Rate limit exceeded |

---

## Authentication

All CB endpoints require authentication via JWT token:

```
Authorization: Bearer <jwt_token>
```

The token must include the user's permissions. CB respects RBAC permissions for entity access.

---

## Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Query endpoints | 60 requests/minute |
| Feedback endpoint | 30 requests/minute |
| Admin endpoints | 120 requests/minute |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705315860
```
