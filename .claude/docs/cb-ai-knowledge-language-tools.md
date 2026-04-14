# CB AI Knowledge & Language Tools

This document describes the Knowledge and Language Understanding tools implemented for the CB (Cognitive Backend) AI module.

## Overview

These tools provide the foundation for natural language processing and schema understanding in the CB AI system. They enable:

- **Knowledge Tools**: Understanding and navigating the database schema
- **Language Tools**: Processing and understanding user queries

## Package Structure

```
backend/src/main/java/com/mvs/backend/cb/ai/
├── tool/
│   ├── CbTool.java           # Base interface
│   ├── CbLlmTool.java        # LLM-based tool interface
│   ├── CbLogicTool.java      # Logic-based tool interface
│   └── impl/
│       ├── knowledge/
│       │   ├── EntityDiscoveryTool.java
│       │   ├── AttributeDiscoveryTool.java
│       │   ├── JoinPathFinderTool.java
│       │   ├── DomainConceptResolverTool.java
│       │   └── SchemaContextTool.java
│       └── language/
│           ├── IntentClassifierTool.java
│           └── EntityMentionExtractorTool.java
└── dto/tool/
    ├── EntityDiscoveryInput.java / EntityDiscoveryOutput.java
    ├── AttributeDiscoveryInput.java / AttributeDiscoveryOutput.java
    ├── JoinPathFinderInput.java / JoinPathFinderOutput.java
    ├── DomainConceptResolverInput.java / DomainConceptResolverOutput.java
    ├── SchemaContextInput.java / SchemaContextOutput.java
    ├── IntentClassifierInput.java / IntentClassifierOutput.java
    └── EntityMentionExtractorInput.java / EntityMentionExtractorOutput.java
```

---

## Knowledge Tools

### 1. EntityDiscoveryTool (LLM-based)

**Purpose**: Finds entities in the schema that match a natural language description.

**Alias**: `entity-discovery`

**Input**:
```java
EntityDiscoveryInput {
    String query;                    // Natural language description
    List<String> moduleFilter;       // Optional: limit to modules (e.g., ["cr", "pm"])
    int maxResults = 5;              // Maximum entities to return
}
```

**Output**:
```java
EntityDiscoveryOutput {
    List<EntityMatch> matches;
}

EntityMatch {
    String entityAlias;              // e.g., "cr.Customer"
    double confidence;               // 0.0 - 1.0
    String reasoning;                // Why this entity matches
    String purpose;                  // From entity documentation
}
```

**Example Usage**:
```java
EntityDiscoveryInput input = EntityDiscoveryInput.builder()
    .query("find customer data")
    .maxResults(5)
    .build();

CbToolResult<EntityDiscoveryOutput> result = tool.execute(input, context);
```

**Example Prompt to LLM**:
```
User Query: find customer data
Maximum results to return: 5

Available Entities:
- cr.Customer: Customer management - stores customer information
- pm.Person: Person data management
- cm.Contract: Contract management
...
```

---

### 2. AttributeDiscoveryTool (LLM-based)

**Purpose**: Discovers attributes for an entity, optionally filtered by a natural language query.

**Alias**: `attribute-discovery`

**Input**:
```java
AttributeDiscoveryInput {
    String entityAlias;              // Required: entity to get attributes for
    String query;                    // Optional: filter attributes by description
    List<String> dataTypeFilter;     // Optional: limit to specific data types
    boolean includeReferences = true;
    int maxResults = 50;
}
```

**Output**:
```java
AttributeDiscoveryOutput {
    List<AttributeInfo> attributes;
    String entityAlias;
}

AttributeInfo {
    String name;
    String dataType;
    String purpose;
    String technicalDescription;
    boolean required;
    boolean isReference;
    String referencedEntity;         // If reference
    boolean isEnum;
    List<EnumValue> enumValues;      // If enum
    Double confidence;               // If query was provided
}
```

**Example Usage**:
```java
AttributeDiscoveryInput input = AttributeDiscoveryInput.builder()
    .entityAlias("cr.Customer")
    .query("name fields")
    .build();

CbToolResult<AttributeDiscoveryOutput> result = tool.execute(input, context);
```

---

### 3. JoinPathFinderTool (LOGIC-based)

**Purpose**: Calculates optimal join paths between entities using BFS graph traversal.

**Alias**: `join-path-finder`

**Input**:
```java
JoinPathFinderInput {
    List<String> entities;           // Entity aliases to connect
    int maxPathLength = 3;           // Maximum hops allowed
    String preferredJoinType = "INNER";
}
```

**Output**:
```java
JoinPathFinderOutput {
    List<JoinSpec> joins;
    boolean allConnected;
    List<String> unconnectedEntities;
}

JoinSpec {
    String sourceEntity;
    String sourceAttribute;
    String targetEntity;
    String targetAttribute;
    String joinType;
    int order;
}
```

**Algorithm**: Uses BFS (Breadth-First Search) to find the shortest path between entities in the metadata graph. Builds a bidirectional graph from all entity relationships and finds minimum spanning paths.

**Example Usage**:
```java
JoinPathFinderInput input = JoinPathFinderInput.builder()
    .entities(Arrays.asList("cr.Customer", "ad.Address"))
    .maxPathLength(3)
    .build();

CbToolResult<JoinPathFinderOutput> result = tool.execute(input, context);
```

---

### 4. DomainConceptResolverTool (LLM-based)

**Purpose**: Maps business terms to technical entities and attributes using domain knowledge.

**Alias**: `domain-concept-resolver`

**Input**:
```java
DomainConceptResolverInput {
    List<String> businessTerms;      // Terms to resolve
    List<String> moduleFilter;       // Optional: limit to modules
    boolean includeSynonyms = true;
    double minConfidence = 0.5;
}
```

**Output**:
```java
DomainConceptResolverOutput {
    List<TermMapping> mappings;
    List<String> unresolvedTerms;
}

TermMapping {
    String term;
    String entityAlias;
    String attributeName;            // Null if entity-level mapping
    double confidence;
    String reasoning;
    boolean matchedViaSynonym;
    String matchedSynonym;
    String domainConcept;
}
```

**Resolution Strategy**:
1. First attempts direct matches from CbDomainConcept
2. Then checks CbSynonym for synonym matches
3. Falls back to LLM for remaining terms

**Example Usage**:
```java
DomainConceptResolverInput input = DomainConceptResolverInput.builder()
    .businessTerms(Arrays.asList("customer name", "order date", "total revenue"))
    .build();

CbToolResult<DomainConceptResolverOutput> result = tool.execute(input, context);
```

---

### 5. SchemaContextTool (LOGIC-based)

**Purpose**: Builds comprehensive schema context for LLM prompts.

**Alias**: `schema-context`

**Input**:
```java
SchemaContextInput {
    List<String> entities;           // Entities to include
    boolean includeAttributes = true;
    boolean includeRelationships = true;
    boolean includeDocumentation = true;
    int maxRelationshipDepth = 1;    // Discover related entities
}
```

**Output**:
```java
SchemaContextOutput {
    String schemaContext;            // Formatted markdown text
    int entityCount;
    int attributeCount;
    int relationshipCount;
    int estimatedTokens;
}
```

**Output Format**:
```markdown
# Schema Context

## Entity: cr.Customer
**Purpose**: Customer management
**Description**: Stores customer information including contact details...

### Attributes
- **name** (Text) [required]: Customer Name
- **status** (Text): Status [Enum: ACTIVE, INACTIVE, PENDING]

### Relationships
- **person** -> pm.Person (N:1): Related Person
```

**Example Usage**:
```java
SchemaContextInput input = SchemaContextInput.builder()
    .entities(Arrays.asList("cr.Customer", "pm.Person"))
    .includeDocumentation(true)
    .build();

CbToolResult<SchemaContextOutput> result = tool.execute(input, context);
// Use result.getOutput().getSchemaContext() in LLM prompts
```

---

## Language Tools

### 6. IntentClassifierTool (LLM-based)

**Purpose**: Classifies user intent from natural language queries.

**Alias**: `intent-classifier`

**Input**:
```java
IntentClassifierInput {
    String text;                     // User's query
    List<String> possibleIntents;    // Optional: constrain to specific intents
}
```

**Output**:
```java
IntentClassifierOutput {
    String intent;                   // Primary intent
    double confidence;               // 0.0 - 1.0
    List<String> subIntents;         // Secondary intents
    Map<String, Double> allScores;   // Scores for all intents
}

// Available intents:
Intents.LIST       // Display a list of records
Intents.AGGREGATE  // Calculate sums, averages, etc.
Intents.COMPARE    // Compare values between groups
Intents.TREND      // Show changes over time
Intents.DETAIL     // Show detailed record information
Intents.COUNT      // Count records
Intents.SEARCH     // Find specific records
Intents.FILTER     // Filter records by conditions
```

**Intent Detection Keywords**:
- LIST: "show", "list", "display", "get"
- AGGREGATE: "total", "sum", "average", "by"
- COMPARE: "compare", "versus", "difference"
- TREND: "over time", "by month", "trend"
- COUNT: "how many", "count", "number of"
- SEARCH: "find", "search", "locate"
- FILTER: "where", "with", "having"

**Example Usage**:
```java
IntentClassifierInput input = IntentClassifierInput.builder()
    .text("Show me the total sales by region for last month")
    .build();

CbToolResult<IntentClassifierOutput> result = tool.execute(input, context);
// intent: "aggregate", subIntents: ["filter", "trend"]
```

---

### 7. EntityMentionExtractorTool (LLM-based)

**Purpose**: Extracts entity references from natural language text.

**Alias**: `entity-mention-extractor`

**Input**:
```java
EntityMentionExtractorInput {
    String text;                     // Text to analyze
    boolean includeImplicit = true;  // Include inferred references
}
```

**Output**:
```java
EntityMentionExtractorOutput {
    List<EntityMention> mentions;
}

EntityMention {
    String mentionText;              // The text that mentions the entity
    int startPosition;               // 0-indexed start position
    int endPosition;                 // End position
    boolean implicit;                // Explicit or inferred reference
    double confidence;
}
```

**Mention Types**:
- **Explicit**: Direct entity names ("customers", "contracts")
- **Implicit**: Inferred from context ("their addresses" implies Address entity)

**Example Usage**:
```java
EntityMentionExtractorInput input = EntityMentionExtractorInput.builder()
    .text("Show all customers with their contracts and addresses")
    .includeImplicit(true)
    .build();

CbToolResult<EntityMentionExtractorOutput> result = tool.execute(input, context);
// mentions: [
//   {mentionText: "customers", startPosition: 9, ...},
//   {mentionText: "contracts", startPosition: 30, ...},
//   {mentionText: "addresses", startPosition: 44, ...}
// ]
```

---

## Debug Mode

All tools support debug mode via `CbToolContext.debug()`:

```java
CbToolResult<EntityDiscoveryOutput> result = tool.execute(input, CbToolContext.debug());

if (result.getDebugInfo() != null) {
    // For LLM tools:
    String systemPrompt = result.getDebugInfo().getSystemPrompt();
    String userPrompt = result.getDebugInfo().getUserPrompt();
    String llmResponse = result.getDebugInfo().getLlmResponse();

    // For Logic tools:
    String logicAlias = result.getDebugInfo().getLogicAlias();
    Map<String, Object> additionalInfo = result.getDebugInfo().getAdditionalInfo();
}
```

---

## Error Handling

All tools return `CbToolResult` which handles errors gracefully:

```java
CbToolResult<EntityDiscoveryOutput> result = tool.execute(input, context);

if (result.isSuccess()) {
    EntityDiscoveryOutput output = result.getOutput();
    // Process output
} else {
    String errorMessage = result.getErrorMessage();
    Throwable exception = result.getException();
    // Handle error
}
```

Tools never throw exceptions - all errors are captured in the result object.

---

## Integration with Workflows

These tools are designed to be used in AI workflows:

```java
// In a workflow
CbToolResult<IntentClassifierOutput> intentResult =
    intentClassifierTool.execute(intentInput, context);

CbToolResult<EntityMentionExtractorOutput> mentionResult =
    entityMentionExtractorTool.execute(mentionInput, context);

CbToolResult<EntityDiscoveryOutput> entityResult =
    entityDiscoveryTool.execute(entityInput, context);

CbToolResult<JoinPathFinderOutput> joinResult =
    joinPathFinderTool.execute(joinInput, context);
```

---

## Testing

Unit tests are provided for all tools at:
```
backend/src/test/java/com/mvs/backend/cb/ai/tool/impl/knowledge/
backend/src/test/java/com/mvs/backend/cb/ai/tool/impl/language/
```

Run tests:
```bash
./gradlew test --tests "com.mvs.backend.cb.ai.tool.impl.*"
```

---

## Dependencies

- `OpenAIService` - For LLM-based tools
- `GenericObjectTypeService` - For entity metadata
- `MetaService` - For attribute and join metadata
- `CbEntityDocumentationRepository` - For entity documentation
- `CbAttributeDocumentationRepository` - For attribute documentation
- `CbDomainConceptRepository` - For domain concepts
- `CbSynonymRepository` - For synonyms
