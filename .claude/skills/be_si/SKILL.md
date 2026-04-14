---
name: be_si
description: "Backend: Expert guidance on Search Index (SI) module including full-text search, entity indexing, search strategies, and @EntitySearchable/@FieldSearchable annotations. Use when working with full-text search, entity indexing, search strategies, or @FieldSearchable."
---

# SI (Search Index) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/si/documentation.md`

## When to Use This Skill

Use when:
- Working with full-text search
- Implementing entity indexing
- Configuring search strategies
- Using @EntitySearchable/@FieldSearchable

## Annotations

### @EntitySearchable
```java
@EntitySearchable(type = EntitySearchableProvideType.SOURCE)
public class Customer extends AuditableEntity { ... }
```

### @FieldSearchable
```java
@FieldSearchable(
    rating = FieldSearchableRating.veryGood,
    compareStrategy = FieldSearchableCompareStrategy.partialMatch,
    inResultList = true
)
private String name;
```

## Compare Strategies

```java
perfectMatchOnly       // Exact match
perfectMatchWithTrim   // Whitespace removal
perfectMatchClean      // Trim + remove special chars
partialMatch           // Match anywhere
partialMatchStart      // Match at start
similarMatch           // Fuzzy/phonetic
```

## Rating Values

```java
poor      = 50
fair      = 100
ok        = 200
good      = 500
veryGood  = 1000
perfect   = 2500
excellent = 5000
```

## Key Services

### SearchIndexingExtractService
```java
List<IndexedToken> extractTokens(Entity entity, SearchObjectTypeRuntime runtime)
void processDelta(LocalDateTime since)
```

## Implementation Pattern

```java
@Entity
@EntitySearchable(type = EntitySearchableProvideType.SOURCE)
public class MyEntity extends AuditableEntity {

    @FieldSearchable(
        rating = FieldSearchableRating.veryGood,
        compareStrategy = FieldSearchableCompareStrategy.partialMatch
    )
    private String name;

    @FieldSearchable(
        rating = FieldSearchableRating.excellent,
        compareStrategy = FieldSearchableCompareStrategy.perfectMatchClean
    )
    private String identifier;
}
```

## Best Practices

### DO:
- Use appropriate rating for field importance
- Use partialMatch for names/descriptions
- Use perfectMatchClean for identifiers

### DON'T:
- Don't over-index low-value fields
- Don't use fuzzy matching for exact identifiers
- Don't index sensitive data

## Primary Entry Point
`SearchIndexingExtractService` for indexing

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)