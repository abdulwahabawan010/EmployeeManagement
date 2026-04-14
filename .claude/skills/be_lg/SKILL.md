---
name: be_lg
description: "Backend: Expert guidance on Logic Module (LG) for scriptable business logic execution including SpEL, Groovy, FreeMarker, and HTTP executors. Use when working with scripted business logic, calculation expressions, logic execution, or variable systems."
---

# LG (Logic) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/lg/documentation.md`

## When to Use This Skill

Use when:
- Working with scripted business logic
- Implementing calculation expressions
- Executing logic scripts
- Managing variable systems

## Logic Languages

- **SpEL** - Spring Expression Language
- **Groovy** - Full scripting
- **FreeMarker** - Template engine
- **HTTP** - REST API calls

## Logic Types

- `condition` - Returns boolean
- `value` - Returns computed value
- `lineFilter` - Filters list elements
- `deriveEntities` - Returns list of entities

## Key Services

### LogicRuntimeService
```java
boolean runCondition(Logic logic, Map<LogicImport, Object> variables)
boolean runConditionWithAliases(Logic logic, Map<String, Object> variables)
List<? extends Entity> runDeriveEntities(Logic logic, Map<LogicImport, Object> variables)
List<? extends Entity> runDeriveEntitiesWithAliases(Logic logic, Map<String, Object> variables)
LogicResult runLogic(Logic logic, Map<LogicImport, Object> variables)
```

### CalculationLogicRuntimeService
Multi-step calculation workflows.

## Implementation Pattern

```java
@Autowired LogicRuntimeService logicRuntimeService;

// Run condition
boolean isEligible = logicRuntimeService.runCondition(
    eligibilityLogic,
    Map.of(customerImport, customer)
);

// Run value logic
LogicResult result = logicRuntimeService.runLogic(logic, variables);
BigDecimal discount = (BigDecimal) result.getRawReturn();

// Run deriveEntities logic
List<? extends Entity> entities = logicRuntimeService.runDeriveEntitiesWithAliases(
    deriveLogic,
    Map.of("customer", customer, "category", category)
);
```

## Best Practices

### DO:
- Use `LogicRuntimeService` as entry point
- Define clear import/export variables
- Add test cases for critical logic

### DON'T:
- Never access executors directly
- Never skip variable validation
- Never create logic without test cases

## Primary Entry Point
`LogicRuntimeService` for logic execution

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)