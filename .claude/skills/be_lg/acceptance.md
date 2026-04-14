# Acceptance Checklist: Logic Module (LG)

Use this checklist to verify compliance with LG module standards.

## Service Usage

- [ ] Logic execution uses `LogicRuntimeService`
- [ ] Multi-step calculations use `CalculationLogicRuntimeService`

## Logic Implementation

- [ ] Executors are never accessed directly
- [ ] Variable validation is not skipped
- [ ] Logic has test cases for critical functionality

## Variable Handling

- [ ] Import/export variables are clearly defined
- [ ] Variables are properly typed
- [ ] `runCondition()` is used for boolean results
- [ ] `runLogic()` is used for value results

## Supported Languages

- [ ] SpEL is used for Spring expressions
- [ ] Groovy is used for full scripting needs
- [ ] FreeMarker is used for templates
- [ ] HTTP is used for REST API calls

## Best Practices

- [ ] `LogicRuntimeService` is the entry point
- [ ] Test cases exist for critical logic
- [ ] Variables are validated before execution
