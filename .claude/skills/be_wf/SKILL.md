---
name: be_wf
description: "Backend: Expert guidance on Workflow Engine (WF) module including workflow processes, process types, steps, activities, and transitions. Use when working with workflows, process types, steps, activities, or transitions."
---

# WF (Workflow) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/wf/documentation.md`

## When to Use This Skill

Use when:
- Working with workflows
- Managing process types
- Implementing steps
- Handling activities
- Managing transitions

## Core Entities

### Configuration (Templates)
- **WfProcessType** - Workflow template
- **WfProcessTypeStep** - Step in template
- **WfProcessTypeStepActivity** - Activity in step

### Runtime (Instances)
- **WfProcess** - Active workflow
- **WfProcessStep** - Running step
- **WfProcessStepActivity** - Running activity

## Activity Types

```java
object                    // Object creation/modification
notification              // Send notification
start_process             // Start nested workflow
ticket_create             // Create ticket
decision                  // User decision
document_upload_and_list  // Document management
```

## Key Services

### WfProcessService
```java
WfProcess startProcess(WfProcessType, Map<WfProcessTypeField, Object> fields)
void resumeProcess(WfProcessAccess)
void cancelProcess(WfProcess)
void completeProcess(WfProcess, WfProcessTypeResult)
List<WfProcess> getProcessesForEntity(Entity entity)
```

## Implementation Pattern

```java
@Autowired WfProcessService processService;

// Start workflow
Map<WfProcessTypeField, Object> fields = new HashMap<>();
fields.put(customerField, customer);

WfProcess process = processService.startProcess(processType, fields);

// Get processes for entity
List<WfProcess> processes = processService.getProcessesForEntity(customer);
```

## Best Practices

### DO:
- Use WfProcessService for all process operations
- Define proper WfProcessTypeResult for outcomes
- Use field bindings for data passing

### DON'T:
- Don't modify process status directly
- Don't skip activity validation
- Don't create processes without WfProcessType

## Primary Entry Point
`WfProcessService` for process operations, `WfActivityService` for activities

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)