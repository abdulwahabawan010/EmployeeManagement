# CB Module - Service Layer Documentation

This document describes the service layer architecture and implementations for the CB (Cognitive Backend) module.

## Service Overview

| Service | Responsibility |
|---------|---------------|
| CbQueryService | Main orchestrator for NL → QL translation |
| CbSchemaLinkingService | Maps NL terms to schema elements |
| CbKnowledgeBaseService | Manages domain concepts, synonyms, rules |
| CbCoverageService | Calculates documentation coverage |
| CbTrainingService | Handles ML training data and feedback |
| CbSecurityService | Query validation and security checks |
| CbConversationService | Multi-turn conversation management |

---

## CbQueryService

**Purpose:** Main orchestration service for natural language to QL query translation.

### Key Methods

```java
@Service
public class CbQueryService {

    /**
     * Translates a natural language query to QlRequestDto.
     *
     * @param nlQuery Natural language query string
     * @param userId User making the request
     * @return CbQueryResponse with generated QL query
     */
    public CbQueryResponse processNaturalLanguageQuery(String nlQuery, Long userId);

    /**
     * Translates and immediately executes the query.
     *
     * @param nlQuery Natural language query string
     * @param userId User making the request
     * @return CbQueryExecutionResponse with query results
     */
    public CbQueryExecutionResponse executeNaturalLanguageQuery(String nlQuery, Long userId);

    /**
     * Validates a generated query without execution.
     *
     * @param nlQuery Natural language query string
     * @return CbValidationResponse with validation results
     */
    public CbValidationResponse validateQuery(String nlQuery);
}
```

### Processing Pipeline

```
┌─────────────────┐
│ Natural Language │
│     Query       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. Template     │  Check CbQueryTemplate for exact/fuzzy match
│    Matching     │
└────────┬────────┘
         │ (if no match)
         ▼
┌─────────────────┐
│ 2. Intent       │  Extract intent using LLM
│    Extraction   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Entity       │  Identify entities mentioned in query
│    Recognition  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Schema       │  Map terms to schema (CbSchemaLinkingService)
│    Linking      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. QL Query     │  Generate QlRequestDto
│    Generation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Security     │  Validate query (CbSecurityService)
│    Validation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. Self-        │  Fix if validation fails (up to 3 attempts)
│    Correction   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   QlRequestDto  │
└─────────────────┘
```

### Response DTOs

```java
public class CbQueryResponse {
    private List<CbOperation> operations;        // Pre-query operations (search, etc.)
    private QlRequestDto qlRequest;              // Generated QL query
    private String explanation;                  // Human-readable explanation
    private BigDecimal confidence;               // Confidence score (0-1)
    private List<CbAlternative> alternatives;    // Alternative interpretations
    private CbClarificationRequest clarification; // If clarification needed
}

public class CbOperation {
    private String type;        // "search", "filter", etc.
    private String entity;      // Target entity alias
    private String term;        // Search term
}

public class CbAlternative {
    private String interpretation;
    private QlRequestDto qlRequest;
    private BigDecimal confidence;
}

public class CbClarificationRequest {
    private String question;
    private List<CbClarificationOption> options;
}
```

---

## CbSchemaLinkingService

**Purpose:** Maps natural language terms to schema elements (entities, attributes, joins).

### Key Methods

```java
@Service
public class CbSchemaLinkingService {

    /**
     * Links a term to matching entities.
     *
     * @param term Natural language term
     * @return List of matched entities with confidence scores
     */
    public List<CbSchemaMatch> linkTermToEntities(String term);

    /**
     * Links a term to matching attributes.
     *
     * @param term Natural language term
     * @param entityAlias Optional entity context
     * @return List of matched attributes
     */
    public List<CbSchemaMatch> linkTermToAttributes(String term, String entityAlias);

    /**
     * Finds optimal join path between two entities.
     *
     * @param fromEntity Source entity alias
     * @param toEntity Target entity alias
     * @return List of join definitions for the path
     */
    public List<JoinDefinition> findJoinPath(String fromEntity, String toEntity);

    /**
     * Resolves synonyms for a term.
     *
     * @param term Term to resolve
     * @return Canonical term and alternatives
     */
    public CbSynonymResolution resolveSynonyms(String term);
}
```

### Schema Matching Algorithm

1. **Direct Match:** Check if term exactly matches entity/attribute name
2. **Synonym Lookup:** Check CbSynonym table for mapped terms
3. **Documentation Search:** Search CbEntityDocumentation/CbAttributeDocumentation
4. **Fuzzy Matching:** Use edit distance for typo tolerance
5. **LLM Fallback:** Use LLM for semantic matching

### Join Path Discovery

Uses graph-based algorithm:
- Nodes = Entities
- Edges = MetaDataJoin relationships
- Weights = Path length + relevance score

```java
public class JoinDefinition {
    private String name;          // e.g., "cr.CustomerContract#customer"
    private String as;            // Alias
    private String joinType;      // "inner", "left", "right"
}
```

---

## CbKnowledgeBaseService

**Purpose:** Manages domain knowledge including concepts, synonyms, and business rules.

### Key Methods

```java
@Service
public class CbKnowledgeBaseService {

    /**
     * Finds domain concepts matching a query.
     *
     * @param query Search query
     * @return Matching domain concepts
     */
    public List<CbDomainConcept> findConcepts(String query);

    /**
     * Gets all synonyms for a concept.
     *
     * @param conceptId Concept ID
     * @return List of synonyms
     */
    public List<CbSynonym> getSynonyms(Long conceptId);

    /**
     * Gets applicable business rules for an entity.
     *
     * @param objectTypeAlias Entity alias
     * @return Active business rules
     */
    public List<CbBusinessRule> getBusinessRules(String objectTypeAlias);

    /**
     * Applies business rules to a QL query.
     *
     * @param qlRequest Original QL request
     * @param ruleNames Rule names to apply
     * @return Modified QL request with rules applied
     */
    public QlRequestDto applyBusinessRules(QlRequestDto qlRequest, List<String> ruleNames);
}
```

### Business Rule Application

```java
// Example: Apply "Active Contracts" rule
CbBusinessRule rule = knowledgeBaseService.getBusinessRules("cm.Contract")
    .stream()
    .filter(r -> r.getName().equals("Active Contracts"))
    .findFirst()
    .orElse(null);

if (rule != null) {
    List<FilterCriteria> ruleFilters = objectMapper.readValue(
        rule.getQlFilterJson(),
        new TypeReference<List<FilterCriteria>>() {}
    );

    // Add filters to QL query
    qlQuery.getFilters().addAll(ruleFilters);
}
```

---

## CbCoverageService

**Purpose:** Calculates and tracks documentation coverage metrics.

### Key Methods

```java
@Service
public class CbCoverageService {

    /**
     * Calculates coverage for all modules.
     *
     * @return Coverage metrics per module
     */
    public List<CbCoverageMetric> calculateAllModuleCoverage();

    /**
     * Calculates coverage for a specific module.
     *
     * @param moduleName Module name (e.g., "cr", "cm")
     * @return Coverage metric for the module
     */
    public CbCoverageMetric calculateModuleCoverage(String moduleName);

    /**
     * Calculates coverage for a specific entity.
     *
     * @param objectTypeAlias Entity alias
     * @return Coverage metric for the entity
     */
    public CbCoverageMetric calculateEntityCoverage(String objectTypeAlias);

    /**
     * Refreshes all coverage metrics (batch job).
     */
    public void refreshAllCoverageMetrics();
}
```

### Coverage Calculation Logic

```java
// Module-level coverage
int totalEntities = countEntitiesInModule(moduleName);
int documentedEntities = countDocumentedEntitiesInModule(moduleName);
BigDecimal coverage = BigDecimal.valueOf(documentedEntities)
    .divide(BigDecimal.valueOf(totalEntities), 4, RoundingMode.HALF_UP)
    .multiply(BigDecimal.valueOf(100));

// Entity-level coverage
int totalAttributes = countAttributesInEntity(objectTypeAlias);
int documentedAttributes = countDocumentedAttributesInEntity(objectTypeAlias);
// Plus: entity description present? usage notes? domain context?
```

---

## CbTrainingService

**Purpose:** Handles ML training data collection and model training orchestration.

### Key Methods

```java
@Service
public class CbTrainingService {

    /**
     * Creates training data from user feedback.
     *
     * @param feedback User feedback
     * @return Created training data
     */
    public CbTrainingData createTrainingDataFromFeedback(CbQueryFeedback feedback);

    /**
     * Collects training data ready for training.
     *
     * @param limit Maximum records to retrieve
     * @return Training data records
     */
    public List<CbTrainingData> collectTrainingData(int limit);

    /**
     * Initiates model training with collected data.
     *
     * @return New model version
     */
    public CbModelVersion initiateTraining();

    /**
     * Gets the currently active model version.
     *
     * @return Active model or null
     */
    public CbModelVersion getActiveModelVersion();

    /**
     * Activates a model version.
     *
     * @param modelVersionId Model version to activate
     */
    public void activateModelVersion(Long modelVersionId);
}
```

### Training Data Flow

```
┌─────────────────┐
│ CbQueryFeedback │
│  (wasHelpful,   │
│   rating,       │
│   correctedQl)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CbTrainingData  │
│  (positive/     │
│   negative      │
│   examples)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Training        │
│ Pipeline        │
│ (when threshold │
│  reached)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CbModelVersion  │
│ (new version    │
│  with accuracy) │
└─────────────────┘
```

---

## CbSecurityService

**Purpose:** Validates queries for security risks and access permissions.

### Key Methods

```java
@Service
public class CbSecurityService {

    /**
     * Validates a QL query for security issues.
     *
     * @param qlRequest Query to validate
     * @return Validation result
     */
    public CbSecurityValidation validateQuery(QlRequestDto qlRequest);

    /**
     * Checks for injection patterns in input.
     *
     * @param input User input string
     * @return true if patterns detected
     */
    public boolean checkInjectionPatterns(String input);

    /**
     * Verifies user has access to queried entities.
     *
     * @param userId User ID
     * @param entityAliases Entities to check
     * @return true if all access allowed
     */
    public boolean checkAccessPermissions(Long userId, List<String> entityAliases);

    /**
     * Calculates query complexity score.
     *
     * @param qlRequest Query to analyze
     * @return Complexity score (reject if too high)
     */
    public int calculateQueryComplexity(QlRequestDto qlRequest);
}
```

### Security Checks

1. **Injection Detection:** SQL/NoSQL injection patterns
2. **RBAC Verification:** User permissions for entities
3. **Complexity Limits:** Prevent resource-intensive queries
4. **Rate Limiting:** Query frequency per user

```java
public class CbSecurityValidation {
    private boolean valid;
    private List<String> violations;
    private int complexityScore;
    private List<String> unauthorizedEntities;
}
```

---

## CbConversationService

**Purpose:** Manages multi-turn conversation sessions with context.

### Key Methods

```java
@Service
public class CbConversationService {

    /**
     * Starts a new conversation session.
     *
     * @param userId User starting the session
     * @return New session
     */
    public CbConversationSession startSession(Long userId);

    /**
     * Adds a turn to an existing session.
     *
     * @param sessionId Session ID
     * @param userInput User's input
     * @return Response with context-aware interpretation
     */
    public CbConversationTurn addTurn(Long sessionId, String userInput);

    /**
     * Gets session context for query processing.
     *
     * @param sessionId Session ID
     * @return Accumulated context
     */
    public CbConversationContext getSessionContext(Long sessionId);

    /**
     * Ends a conversation session.
     *
     * @param sessionId Session to end
     */
    public void endSession(Long sessionId);
}
```

### Context Management

```java
public class CbConversationContext {
    private List<String> referencedEntities;     // Entities mentioned
    private Map<String, Object> resolvedValues;  // Resolved references
    private String currentFocus;                 // Current topic
    private List<String> previousQueries;        // Query history
}
```

### Pronoun Resolution Example

```
Turn 1: "Show me all customers from Munich"
        → Resolves to: cr.Customer, filter: city = "Munich"
        → Context: referencedEntities = ["cr.Customer"]

Turn 2: "How many contracts do they have?"
        → "they" resolves to "customers from Munich"
        → Generates: COUNT(cm.Contract) WHERE customer IN (previous result)
```

---

## Service Dependencies

```
                    ┌─────────────────┐
                    │  CbQueryService │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│CbSchemaLinking  │ │CbKnowledgeBase  │ │ CbSecurity      │
│    Service      │ │    Service      │ │    Service      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────┐ ┌─────────────────┐
│   Core Meta     │ │  CB Entities    │
│   Services      │ │  (Domain KB)    │
└─────────────────┘ └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ CbCoverage      │       │ CbTraining      │
│    Service      │       │    Service      │
└─────────────────┘       └─────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐       ┌─────────────────┐
│ CbCoverageMetric│       │ CbTrainingData  │
│ CbEntityDoc     │       │ CbModelVersion  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│ CbConversation  │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│CbConversation   │
│ Session/Turn    │
└─────────────────┘
```
