---
name: be_am
description: "Backend: Expert guidance on Agent Management (AM) module including agent lifecycle, scheduling, pools, activities, and geographic assignments. Use when working with agents, agent pools, schedules, activities, or agent hierarchy."
---

# AM (Agent Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/am/documentation.md`

## When to Use This Skill

Use when:
- Working with agents
- Managing agent pools
- Implementing schedules
- Tracking activities
- Handling agent hierarchy

## Core Entities

- **Agent** (`amAgent`) - Central agent entity
- **AgentPool** (`amAgentPool`) - Groups agents
- **AgentActivity** (`amAgentActivity`) - Planned activities
- **AgentScheduleDay** (`amAgentScheduleDay`) - Daily schedule
- **AgentScheduleWeek** (`amAgentScheduleWeek`) - Weekly schedule
- **AgentGeoArea** (`amAgentGeoArea`) - Geographic assignment

## Key Services

### AgentService
```java
Agent getLoggedOnAgent()
Agent getDefinedLoggedOnAgent()  // throws if not found
List<Agent> getActiveAgents()
```

### AgentScheduleService
```java
AgentDayScheduleRuntime getAgentScheduleForDay(Agent, LocalDate)
```

### AgentPoolService
```java
Set<Agent> getAgents(AgentPool pool)
```

## Best Practices

### DO:
- Use `getDefinedLoggedOnAgent()` when agent is required
- Use shared `AgentScheduleService` for schedule resolution
- Query via services, not direct repository access

### DON'T:
- Don't create Agent entities manually
- Don't bypass AgentService for agent queries
- Don't hardcode agent IDs

## Primary Entry Point
`AgentService` for agent operations, `AgentScheduleService` for schedules

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
