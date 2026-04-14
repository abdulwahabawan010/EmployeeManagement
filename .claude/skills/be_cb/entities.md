# CB Module - Entity Documentation

This document describes all 14 entities in the CB (Cognitive Backend) module.

## Entity Overview

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| CbEntityDocumentation | Stores business documentation for entities | → CbAttributeDocumentation (1:N) |
| CbAttributeDocumentation | Stores documentation for entity attributes | → CbEntityDocumentation (N:1) |
| CbDomainConcept | Defines business domain terms | → CbSynonym (1:N) |
| CbSynonym | Maps synonyms to domain concepts | → CbDomainConcept (N:1) |
| CbBusinessRule | Defines reusable QL filter rules | Standalone |
| CbQueryTemplate | Stores predefined query templates | → CbQueryTemplateParameter (1:N) |
| CbQueryTemplateParameter | Parameters for query templates | → CbQueryTemplate (N:1) |
| CbQueryLog | Logs all query executions | → CbQueryFeedback (1:N) |
| CbQueryFeedback | User feedback on query results | → CbQueryLog (N:1) |
| CbTrainingData | ML training data from feedback | Standalone |
| CbModelVersion | Tracks ML model versions | Standalone |
| CbCoverageMetric | Documentation coverage metrics | Standalone |
| CbConversationSession | Multi-turn conversation sessions | → CbConversationTurn (1:N) |
| CbConversationTurn | Individual turns in conversations | → CbConversationSession (N:1) |

---

## Documentation Entities

### CbEntityDocumentation

Stores extended business documentation for system entities.

```java
@Entity(name = "cbEntityDocumentation")
public class CbEntityDocumentation extends AuditableEntity {

    @Column(unique = true)
    private String objectTypeAlias;           // e.g., "cr.Customer"

    @Column(length = 4000)
    private String businessDescription;       // Business description

    @Column(length = 2000)
    private String usageNotes;                // Usage hints

    @Column(length = 500)
    private String domainContext;             // Domain context

    private LocalDateTime lastReviewedAt;     // Last review date

    private Long reviewedByUserId;            // Reviewer user ID

    @OneToMany(mappedBy = "entityDocumentation")
    private List<CbAttributeDocumentation> attributeDocumentations;
}
```

**Key Points:**
- `objectTypeAlias` must be unique and match existing entity aliases
- Referenced by `CbAttributeDocumentation` for attribute-level documentation
- Used by Schema Linking Engine for NL to QL mapping

---

### CbAttributeDocumentation

Stores documentation for individual entity attributes.

```java
@Entity(name = "cbAttributeDocumentation")
public class CbAttributeDocumentation extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "entity_documentation_id")
    private CbEntityDocumentation entityDocumentation;

    private String attributeName;             // e.g., "firstName"

    @Column(length = 2000)
    private String businessDescription;       // What this attribute represents

    @Column(length = 1000)
    private String exampleValues;             // Example values

    @Column(length = 1000)
    private String validationRules;           // Validation rules description
}
```

**Key Points:**
- Always linked to a parent `CbEntityDocumentation`
- `attributeName` must match the actual entity attribute name
- Used for fine-grained NL query understanding

---

## Knowledge Base Entities

### CbDomainConcept

Defines business domain terms and their meanings.

```java
@Entity(name = "cbDomainConcept")
public class CbDomainConcept extends AuditableEntity {

    @Column(unique = true)
    private String term;                      // e.g., "active contract"

    @Column(length = 2000)
    private String definition;                // Business definition

    @Column(length = 100)
    private String category;                  // Category grouping

    @OneToMany(mappedBy = "concept")
    private List<CbSynonym> synonyms;
}
```

**Key Points:**
- `term` is the canonical form of the concept
- Categories help organize concepts (e.g., "Contract Management", "Customer")
- Synonyms are linked for NL understanding

---

### CbSynonym

Maps synonyms to domain concepts with relationship types.

```java
@Entity(name = "cbSynonym")
public class CbSynonym extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "concept_id")
    private CbDomainConcept concept;

    private String synonym;                   // e.g., "running contract"

    @Enumerated(EnumType.STRING)
    private CbSynonymType type;               // EXACT, BROADER, NARROWER, RELATED
}
```

**CbSynonymType Values:**
| Value | Description | Example |
|-------|-------------|---------|
| EXACT | Same meaning | "active contract" ↔ "running contract" |
| BROADER | More general term | "contract" is broader than "active contract" |
| NARROWER | More specific term | "premium contract" is narrower than "contract" |
| RELATED | Related but different | "customer" is related to "contract" |

---

### CbBusinessRule

Defines reusable QL filter rules that can be auto-applied.

```java
@Entity(name = "cbBusinessRule")
public class CbBusinessRule extends AuditableEntity {

    private String name;                      // Rule name

    @Column(length = 2000)
    private String description;               // Rule description

    @Column(columnDefinition = "TEXT")
    private String qlFilterJson;              // FilterCriteria as JSON

    private String objectTypeAlias;           // Target entity alias

    private Boolean isActive;                 // Whether rule is active
}
```

**qlFilterJson Example:**
```json
[
  {"field": "status", "operation": "EQ", "value": "ACTIVE"},
  {"field": "endDate", "operation": "GT", "value": "NOW()"}
]
```

---

## Query Template Entities

### CbQueryTemplate

Stores predefined query templates for common queries.

```java
@Entity(name = "cbQueryTemplate")
public class CbQueryTemplate extends AuditableEntity {

    private String name;                      // Template name

    @Column(length = 2000)
    private String description;               // Template description

    @Column(length = 500)
    private String intentPattern;             // Regex/NL pattern for matching

    @Column(columnDefinition = "TEXT")
    private String qlRequestJson;             // QlRequestDto as JSON

    @Column(columnDefinition = "TEXT")
    private String parameterDefinitionsJson;  // Slot definitions

    private Boolean isActive;                 // Whether template is active

    private Integer priority;                 // Matching priority (higher = first)

    @OneToMany(mappedBy = "template")
    private List<CbQueryTemplateParameter> parameters;
}
```

**Key Points:**
- Templates have near 100% accuracy when matched
- `intentPattern` is checked first before LLM generation
- Higher priority templates are checked first

---

### CbQueryTemplateParameter

Defines parameters for query templates.

```java
@Entity(name = "cbQueryTemplateParameter")
public class CbQueryTemplateParameter extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "template_id")
    private CbQueryTemplate template;

    private String parameterName;             // e.g., "customerName"

    private String dataType;                  // e.g., "STRING", "INTEGER"

    @Column(length = 500)
    private String extractionPattern;         // How to extract from NL

    private String defaultValue;              // Default if not found
}
```

---

## Logging & Feedback Entities

### CbQueryLog

Logs all query executions for analytics.

```java
@Entity(name = "cbQueryLog")
public class CbQueryLog extends AuditableEntity {

    private Long userId;                      // User who executed

    @Column(length = 2000)
    private String naturalLanguageQuery;      // Original NL query

    @Column(columnDefinition = "TEXT")
    private String generatedQlJson;           // Generated QlRequestDto

    private BigDecimal confidence;            // Confidence score (0-1)

    private Long latencyMs;                   // Execution time in ms

    @Enumerated(EnumType.STRING)
    private CbQueryStatus status;             // SUCCESS, FAILED, CLARIFICATION_NEEDED

    @Column(length = 1000)
    private String errorMessage;              // Error message if failed

    private LocalDateTime executedAt;         // Execution timestamp

    @OneToMany(mappedBy = "queryLog")
    private List<CbQueryFeedback> feedbacks;
}
```

**CbQueryStatus Values:**
| Value | Description |
|-------|-------------|
| SUCCESS | Query executed successfully |
| FAILED | Query generation or execution failed |
| CLARIFICATION_NEEDED | Ambiguous query, user clarification required |

---

### CbQueryFeedback

Captures user feedback on query results.

```java
@Entity(name = "cbQueryFeedback")
public class CbQueryFeedback extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "query_log_id")
    private CbQueryLog queryLog;

    private Long userId;                      // User who gave feedback

    private Boolean wasHelpful;               // Thumbs up/down

    private Integer rating;                   // 1-5 stars

    @Column(length = 2000)
    private String feedbackComment;           // Optional comment

    private Boolean wasApplied;               // Was result used?

    @Column(columnDefinition = "TEXT")
    private String correctedQlJson;           // User-corrected query

    private LocalDateTime feedbackAt;         // Feedback timestamp
}
```

---

## Machine Learning Entities

### CbTrainingData

Stores training data for ML model improvement.

```java
@Entity(name = "cbTrainingData")
public class CbTrainingData extends AuditableEntity {

    @Column(length = 2000)
    private String naturalLanguageQuery;      // Input NL query

    @Column(columnDefinition = "TEXT")
    private String qlRequestJson;             // Expected output QL

    private Boolean isPositiveExample;        // Good (true) or bad (false) example

    private BigDecimal qualityScore;          // Quality score (0-1)

    @Column(length = 50)
    private String source;                    // FEEDBACK, MANUAL, GENERATED

    private Boolean usedForTraining;          // Already used for training?

    private LocalDateTime capturedAt;         // When captured

    // For RAG - vector embedding (requires pgvector)
    // @Column(columnDefinition = "vector(1536)")
    // private float[] embedding;
}
```

---

### CbModelVersion

Tracks ML model versions and their performance.

```java
@Entity(name = "cbModelVersion")
public class CbModelVersion extends AuditableEntity {

    private String name;                      // Model name

    private Integer version;                  // Version number

    @Enumerated(EnumType.STRING)
    private CbModelStatus status;             // DRAFT, TRAINING, ACTIVE, DEPRECATED

    @Column(columnDefinition = "TEXT")
    private String configurationJson;         // Model configuration

    private BigDecimal accuracy;              // Model accuracy (0-1)

    private LocalDateTime trainedAt;          // Training completion time

    private Integer trainingSampleSize;       // Number of training samples
}
```

**CbModelStatus Values:**
| Value | Description |
|-------|-------------|
| DRAFT | Model configuration in progress |
| TRAINING | Model is being trained |
| ACTIVE | Currently active production model |
| DEPRECATED | Replaced by newer version |

---

### CbCoverageMetric

Tracks documentation coverage per module/entity.

```java
@Entity(name = "cbCoverageMetric")
public class CbCoverageMetric extends AuditableEntity {

    private String moduleName;                // e.g., "cr", "cm"

    private String objectTypeAlias;           // Optional, for entity-level

    private Integer totalElements;            // Total elements count

    private Integer documentedElements;       // Documented elements count

    private BigDecimal coveragePercent;       // Coverage percentage

    private LocalDateTime calculatedAt;       // Calculation timestamp
}
```

---

## Conversation Entities

### CbConversationSession

Manages multi-turn conversation sessions.

```java
@Entity(name = "cbConversationSession")
public class CbConversationSession extends AuditableEntity {

    private Long userId;                      // Session owner

    private LocalDateTime startedAt;          // Session start

    private LocalDateTime lastActivityAt;     // Last activity

    @Enumerated(EnumType.STRING)
    private CbSessionStatus status;           // ACTIVE, COMPLETED, EXPIRED

    @Column(columnDefinition = "TEXT")
    private String contextJson;               // Accumulated context

    @OneToMany(mappedBy = "session")
    private List<CbConversationTurn> turns;
}
```

**CbSessionStatus Values:**
| Value | Description |
|-------|-------------|
| ACTIVE | Session is active |
| COMPLETED | Session completed normally |
| EXPIRED | Session expired due to timeout |

---

### CbConversationTurn

Individual turns within a conversation session.

```java
@Entity(name = "cbConversationTurn")
public class CbConversationTurn extends AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "session_id")
    private CbConversationSession session;

    private Integer turnNumber;               // Turn sequence number

    @Column(length = 2000)
    private String userInput;                 // User's input

    @Column(columnDefinition = "TEXT")
    private String responseJson;              // System response

    private LocalDateTime timestamp;          // Turn timestamp
}
```

---

## Entity Relationships Diagram

```
┌─────────────────────────────┐
│  CbEntityDocumentation      │
│  (objectTypeAlias: unique)  │
└─────────────┬───────────────┘
              │ 1:N
              ▼
┌─────────────────────────────┐
│  CbAttributeDocumentation   │
└─────────────────────────────┘

┌─────────────────────────────┐
│  CbDomainConcept            │
│  (term: unique)             │
└─────────────┬───────────────┘
              │ 1:N
              ▼
┌─────────────────────────────┐
│  CbSynonym                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│  CbQueryTemplate            │
└─────────────┬───────────────┘
              │ 1:N
              ▼
┌─────────────────────────────┐
│  CbQueryTemplateParameter   │
└─────────────────────────────┘

┌─────────────────────────────┐
│  CbQueryLog                 │
└─────────────┬───────────────┘
              │ 1:N
              ▼
┌─────────────────────────────┐
│  CbQueryFeedback            │
└─────────────────────────────┘

┌─────────────────────────────┐
│  CbConversationSession      │
└─────────────┬───────────────┘
              │ 1:N
              ▼
┌─────────────────────────────┐
│  CbConversationTurn         │
└─────────────────────────────┘

Standalone Entities:
┌─────────────────────────────┐
│  CbBusinessRule             │
│  CbTrainingData             │
│  CbModelVersion             │
│  CbCoverageMetric           │
└─────────────────────────────┘
```
