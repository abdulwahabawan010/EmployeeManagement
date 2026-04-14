---
name: be_cb
description: Backend Cognitive Backend (CB) module for AI-powered natural language to QL query translation, including entity documentation, domain knowledge management, query templates, and feedback-driven learning.
---

# CB Module (Cognitive Backend) - Skill Documentation

## Overview

The **CB Module** (Cognitive Backend) is an AI-powered module that translates natural language queries into executable **QL-Queries** (Query Language). It builds upon the CC module (Configuration Core) and uses the existing QL system (`core.ql`) as its primary output format.

### Core Concept

```
Input:  "Give me all active contracts for customer Marko Milakovic"

Output: {
  "operations": [
    { "type": "search", "entity": "cr.Customer", "term": "Marko Milakovic" }
  ],
  "qlRequest": {
    "queries": [{
      "name": "activeContracts",
      "start": {
        "name": "cr.Customer",
        "as": "c",
        "joins": [
          { "name": "cr.CustomerContract#customer", "as": "cc" },
          { "name": "cm.Contract", "as": "co", "joinType": "inner" }
        ]
      },
      "filters": [
        { "field": "c.id", "operation": "EQ", "value": "${searchResult}" },
        { "field": "co.status", "operation": "EQ", "value": "ACTIVE" }
      ]
    }]
  }
}
```

## Skill Documentation Files

| File | Description |
|------|-------------|
| [entities.md](entities.md) | Complete entity model documentation with all 14 CB entities |
| [services.md](services.md) | Service layer architecture and implementations |
| [testing.md](testing.md) | CbTestService patterns and test examples |
| [api.md](api.md) | REST API endpoints documentation |
| [howTo.md](howTo.md) | Usage examples and implementation patterns |

## Dependencies

| Module | Dependency Type | Description |
|--------|----------------|-------------|
| **CC** | Direct | ObjectType, ObjectTypeAttribute, FieldType for dynamic fields |
| **QL** | Direct | QlRequestDto, QlQueryDto, FilterCriteria as output format |
| **SI** | Integration | Search Index for entity search |
| **Core Meta** | Usage | MetaDataEntity, MetaDataAttribute, MetaDataJoin for schema information |
| **Core AI** | Usage | OpenAIService for LLM integration |

## Module Structure

### Backend Package Structure
```
com.mvs.backend.cb/
├── model/
│   ├── CbEntityDocumentation.java
│   ├── CbAttributeDocumentation.java
│   ├── CbDomainConcept.java
│   ├── CbSynonym.java
│   ├── CbBusinessRule.java
│   ├── CbQueryTemplate.java
│   ├── CbQueryTemplateParameter.java
│   ├── CbQueryLog.java
│   ├── CbQueryFeedback.java
│   ├── CbTrainingData.java
│   ├── CbModelVersion.java
│   ├── CbCoverageMetric.java
│   ├── CbConversationSession.java
│   └── CbConversationTurn.java
├── enums/
│   ├── CbSynonymType.java
│   ├── CbModelStatus.java
│   ├── CbQueryStatus.java
│   └── CbSessionStatus.java
├── repository/
│   └── (14 repository interfaces)
├── service/
│   ├── CbQueryService.java
│   ├── CbSchemaLinkingService.java
│   ├── CbKnowledgeBaseService.java
│   ├── CbCoverageService.java
│   ├── CbTrainingService.java
│   └── CbSecurityService.java
└── controller/
    └── (REST controllers)
```

### Frontend Module Structure
```
frontend/features/feature-core/cb/
├── cb.module.ts
├── cb.route.ts
├── cb.entity-provider.ts
├── enum/
│   ├── cb-synonym-type.enum.ts
│   ├── cb-model-status.enum.ts
│   ├── cb-query-status.enum.ts
│   └── cb-session-status.enum.ts
├── model/dto/entity/
│   └── (14 DTO files)
├── service/api/
│   └── (14 service files)
└── page/
    └── cb-config-page/
```

## Entity Alias Reference

| Entity | Alias |
|--------|-------|
| CbEntityDocumentation | `cb.CbEntityDocumentation` |
| CbAttributeDocumentation | `cb.CbAttributeDocumentation` |
| CbDomainConcept | `cb.CbDomainConcept` |
| CbSynonym | `cb.CbSynonym` |
| CbBusinessRule | `cb.CbBusinessRule` |
| CbQueryTemplate | `cb.CbQueryTemplate` |
| CbQueryTemplateParameter | `cb.CbQueryTemplateParameter` |
| CbQueryLog | `cb.CbQueryLog` |
| CbQueryFeedback | `cb.CbQueryFeedback` |
| CbTrainingData | `cb.CbTrainingData` |
| CbModelVersion | `cb.CbModelVersion` |
| CbCoverageMetric | `cb.CbCoverageMetric` |
| CbConversationSession | `cb.CbConversationSession` |
| CbConversationTurn | `cb.CbConversationTurn` |

## Enum Reference

| Enum | Values |
|------|--------|
| `CbSynonymType` | EXACT, BROADER, NARROWER, RELATED |
| `CbModelStatus` | DRAFT, TRAINING, ACTIVE, DEPRECATED |
| `CbQueryStatus` | SUCCESS, FAILED, CLARIFICATION_NEEDED |
| `CbSessionStatus` | ACTIVE, COMPLETED, EXPIRED |

## Quick Start

### 1. Creating Entity Documentation
```java
CbEntityDocumentation doc = new CbEntityDocumentation();
doc.setObjectTypeAlias("cr.Customer");
doc.setBusinessDescription("Represents a customer in the CRM system");
doc.setUsageNotes("Primary entity for customer-related queries");
doc.setDomainContext("Customer Relationship Management");
entityDocumentationRepository.save(doc);
```

### 2. Adding Domain Concepts with Synonyms
```java
CbDomainConcept concept = new CbDomainConcept();
concept.setTerm("active contract");
concept.setDefinition("A contract with status ACTIVE that is currently in effect");
concept.setCategory("Contract Management");
domainConceptRepository.save(concept);

CbSynonym synonym = new CbSynonym();
synonym.setConcept(concept);
synonym.setSynonym("running contract");
synonym.setType(CbSynonymType.EXACT);
synonymRepository.save(synonym);
```

### 3. Creating Business Rules
```java
CbBusinessRule rule = new CbBusinessRule();
rule.setName("Active Contracts Filter");
rule.setDescription("Filters to show only active contracts");
rule.setObjectTypeAlias("cm.Contract");
rule.setQlFilterJson("[{\"field\":\"status\",\"operation\":\"EQ\",\"value\":\"ACTIVE\"}]");
businessRuleRepository.save(rule);
```

## Feature Categories

| Category | Description |
|----------|-------------|
| **MUST** | Essential for MVP |
| **NEED** | Important for production use |
| **NICE** | Differentiation features, later phase |

See the detailed [feature specification](../../docs/cb-features.md) for complete requirements.
