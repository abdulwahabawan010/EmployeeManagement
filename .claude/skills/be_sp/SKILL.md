---
name: be_sp
description: "Backend: Expert guidance on Sprint/Project Management (SP) module including projects, boards, sprints, tickets, and endpoint security. Use when working with projects, boards, sprints, project tickets, or SP security."
---

# SP (Sprint/Project Management) Module

## When to Use This Skill

Use when:
- Working with projects, boards, sprints, or project tickets
- Implementing or modifying SP module endpoints
- Adding new SP features or MCP endpoints
- Reviewing SP endpoint security
- Integrating SP with other modules

## CRITICAL: Future Module Separation

The SP module will be moved to a **separate backend service** in the near future. All development MUST:
- Keep SP module self-contained with minimal cross-module dependencies
- Use clean API boundaries (REST endpoints, not direct service injection from other modules)
- Avoid tight coupling with core framework internals where possible
- Design any new features with microservice extraction in mind
- Document all cross-module dependencies explicitly

## CRITICAL: Endpoint Security Requirements

**EVERY SP endpoint MUST validate that the logged-on user only has access to their own data.** This is a NON-NEGOTIABLE requirement.

### Security Pattern (MANDATORY for all endpoints)

```java
// REQUIRED: Get the current authenticated agent
Agent currentAgent = agentService.getDefinedLoggedOnAgent();

// REQUIRED: Validate project ownership before ANY operation
private void validateProjectAccess(SpProject project) {
    Agent currentAgent = agentService.getDefinedLoggedOnAgent();
    if (project.getOwnerAgent() == null ||
        !project.getOwnerAgent().getId().equals(currentAgent.getId())) {
        throw new CoreAuthorizationRuntimeException(
            "User does not have access to project " + project.getId());
    }
}

// REQUIRED: Validate transitive ownership for nested entities
private void validateBoardAccess(SpBoard board) {
    validateProjectAccess(board.getProject());
}

private void validateProjectTicketAccess(SpProjectTicket ticket) {
    validateProjectAccess(ticket.getProject());
}
```

### Endpoint Security Checklist (Apply to ALL endpoints)

For EVERY SP endpoint, verify:
- [ ] `GET /projects` - Returns ONLY projects owned by current agent
- [ ] `GET /projects/{id}` - Validates current agent owns this project
- [ ] `POST /projects` - Forces `ownerAgent` to current agent (NOT from request body)
- [ ] `GET /boards/{id}` - Validates current agent owns the parent project
- [ ] `POST /projects/{id}/boards` - Validates current agent owns the project
- [ ] `POST /projects/{id}/sprints` - Validates current agent owns the project
- [ ] `POST /sprints/{id}/start` - Validates current agent owns the parent project
- [ ] `POST /sprints/{id}/complete` - Validates current agent owns the parent project
- [ ] `POST /projects/{id}/tickets` - Validates current agent owns the project
- [ ] `POST /projectTickets/{id}/move` - Validates ownership AND target lane belongs to same project
- [ ] `POST /projectTickets/{id}/assignSprint` - Validates ownership AND sprint belongs to same project
- [ ] `GET /projects/{id}/backlog` - Validates current agent owns the project
- [ ] `GET /projects/{id}/sprints/{sprintId}/tickets` - Validates ownership chain
- [ ] `GET /boards/{id}/my-tickets` - Already partially secured (filters by current agent's assignments)

### Cross-Project Operation Prevention

MUST validate that operations don't cross project boundaries:
```java
// When moving tickets, validate same project
if (!pt.getProject().getId().equals(targetLane.getBoard().getProject().getId())) {
    throw new CoreAuthorizationRuntimeException("Target lane not in the same project");
}

// When assigning sprints, validate same project
if (sprint != null && !sprint.getProject().getId().equals(pt.getProject().getId())) {
    throw new CoreAuthorizationRuntimeException("Sprint not in the same project");
}
```

## Core Entities

| Entity | JPA Name | Purpose |
|--------|----------|---------|
| **SpProject** | `spProject` | Project container (name, alias, status, ownerAgent, dates) |
| **SpBoard** | `spBoard` | View/lens for a project (scrum/kanban, linked to project) |
| **SpBoardLane** | `spBoardLane` | Board columns (backlog, planned, started, testing, completed) |
| **SpSprint** | `spSprint` | Time-boxed iteration (linked to project, not board) |
| **SpProjectTicket** | `spProjectTicket` | Central entity: wraps TM Ticket with project/sprint/lane context |
| **SpBoardTemplate** | `spBoardTemplate` | Predefined board configurations |
| **SpBoardTemplateLane** | `spBoardTemplateLane` | Predefined lanes for templates |

### Entity Relationships

```
SpProject (1) ─── (*) SpBoard ─── (*) SpBoardLane
    │                                       │
    ├── (*) SpSprint                        │
    │       │                               │
    └── (*) SpProjectTicket ───────────────┘
                │
                └── (1) Ticket (TM module)
```

**Key Design:**
- `SpProjectTicket` is the central entity linking everything
- Board = view/lens (NOT a data container); sprint = property on SpProjectTicket
- A ticket belongs to a project, is displayed on a board lane, and optionally assigned to a sprint

## Enums

| Enum | Values |
|------|--------|
| **SpProjectStatusEnum** | `draft` (active), `active` (active), `on_hold` (active), `completed`, `cancelled` |
| **SpSprintStatusEnum** | `planned` (active), `active` (active), `completed`, `cancelled` |
| **SpBoardTypeEnum** | `scrum`, `kanban` |
| **SpLaneTypeInternal** | `backlog`, `planned`, `started`, `ready_for_testing`, `completed`, `custom` |

**CRITICAL Enum Note:** `SpProjectStatusEnum` has a value named `active`. The boolean field MUST be named `activeStatus` (not `active`) to avoid collision.

## Key Services

### SpProjectService
```java
Optional<SpProject> findById(Long id)
SpProject save(SpProject project)
```

### SpProjectTicketService
```java
SpProjectTicket addTicketToProject(SpProject project, Ticket ticket, SpBoardLane defaultLane, SpSprint sprint)
SpProjectTicket moveToLane(SpProjectTicket pt, SpBoardLane targetLane, Integer laneOrder)
SpProjectTicket assignToSprint(SpProjectTicket pt, SpSprint sprint)
List<SpProjectTicket> getBoardTickets(SpBoard board)
```

### SpMcpService (MCP API business logic)
```java
// Project operations
List<SpMcpProjectListItemDto> listProjects(List<String> statuses, Integer limit, Integer offset)
SpMcpProjectDetailDto getProjectDetail(Long projectId)
SpMcpProjectDetailDto createProject(SpMcpCreateProjectRequestDto request)

// Board operations
SpMcpBoardDetailDto getBoardDetail(Long boardId)
SpMcpBoardDetailDto getMyBoardTickets(Long boardId)  // Only current agent's tickets
SpMcpBoardDetailDto createBoard(Long projectId, SpMcpCreateBoardRequestDto request)

// Sprint operations
SpMcpSprintDto createSprint(Long projectId, SpMcpCreateSprintRequestDto request)
SpMcpSprintDto startSprint(Long sprintId)
SpMcpSprintDto completeSprint(Long sprintId)

// Ticket operations
SpMcpBoardTicketDto addTicketToProject(Long projectId, SpMcpAddTicketRequestDto request)
SpMcpBoardTicketDto moveTicket(Long projectTicketId, SpMcpMoveTicketRequestDto request)
SpMcpBoardTicketDto assignTicketToSprint(Long projectTicketId, Long sprintId)

// Backlog
List<SpMcpBoardTicketDto> getProductBacklog(Long projectId)
List<SpMcpBoardTicketDto> getSprintBacklog(Long projectId, Long sprintId)
```

## Controllers

### SpMcpController (`/mvsa/sp/mcp`)
Primary API for project management operations. All endpoints listed above.

### SpMcpDiscoveryController (`/mvsa/sp/mcp`)
- `GET /` - Returns MCP discovery manifest with all endpoints, parameters, and descriptions

### Standard CRUD Controllers (at `/mvsa/sp/`)
- `SpProjectController` - CRUD for projects
- `SpBoardController` - CRUD for boards
- `SpBoardLaneController` - CRUD for board lanes
- `SpSprintController` - CRUD for sprints
- `SpProjectTicketController` - CRUD for project tickets
- `SpBoardTemplateController` - CRUD for board templates

## Cross-Module Integrations

| Module | Integration | Purpose |
|--------|-------------|---------|
| **TM** | Ticket, TicketType | Ticket data (name, status, assignee, urgency) |
| **AM** | Agent, AgentService | Agent ownership and identification |
| **RP** | SpDailyWorkReportProvider | Reporting integration |

**Note:** Keep cross-module dependencies minimal. The SP module will be extracted to a separate service.

## MCP DTOs

| DTO | Purpose |
|-----|---------|
| **SpMcpProjectListItemDto** | Project list summary |
| **SpMcpProjectDetailDto** | Full project with boards and sprints |
| **SpMcpBoardDetailDto** | Board with lanes and tickets |
| **SpMcpBoardTicketDto** | Ticket within board context |
| **SpMcpSprintDto** | Sprint information |
| **SpMcpCreateProjectRequestDto** | Project creation request |
| **SpMcpCreateBoardRequestDto** | Board creation request |
| **SpMcpCreateSprintRequestDto** | Sprint creation request |
| **SpMcpAddTicketRequestDto** | Add ticket to project request |
| **SpMcpMoveTicketRequestDto** | Move ticket request (targetLaneId, laneOrder) |

## Implementation Notes

### EntityOrderPriority
- `SpProjectTicket` implements `EntityOrderPriority`
- Requires both getter AND setter: field must be named `orderPriority`

### EntityMetaCategory
- Use ONLY: `configuration`, `systemSpecificConfiguration`, `runtimeData`
- Import: `com.mvs.backend.core.annotations.EntityDetail` and `EntityMetaCategory`

## Best Practices

### DO:
- Validate project ownership on EVERY endpoint
- Force `ownerAgent` to current user when creating projects
- Validate same-project constraints when moving tickets or assigning sprints
- Use `AgentService.getDefinedLoggedOnAgent()` to get current user
- Keep cross-module dependencies minimal (future extraction)
- Use `SpMcpService` for all MCP business logic
- Return only the current user's data in list endpoints

### DON'T:
- Don't allow users to see other users' projects
- Don't allow cross-project ticket moves or sprint assignments
- Don't allow `ownerAgentId` to be set from request body (always use current agent)
- Don't add tight coupling to core framework (future microservice extraction)
- Don't bypass ownership validation for any endpoint
- Don't expose internal entity structure to the customer web app (use EX module as gateway)

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
