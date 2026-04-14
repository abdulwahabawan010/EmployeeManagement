# Acceptance Checklist: Sprint/Project Management (SP)

Use this checklist to verify compliance with SP module standards.

## CRITICAL: Endpoint Security (Must Pass ALL)

- [ ] **Every GET endpoint** validates the authenticated user owns the requested project
- [ ] **Every POST/PUT endpoint** validates the authenticated user owns the target project
- [ ] **Project creation** forces `ownerAgent` to the current authenticated agent
- [ ] **List endpoints** return ONLY the current user's projects/data
- [ ] **Board access** validates project ownership transitively
- [ ] **Sprint operations** validate project ownership transitively
- [ ] **Ticket moves** validate both ownership and same-project constraint
- [ ] **Sprint assignments** validate both ownership and same-project constraint
- [ ] **No cross-project operations** are possible (tickets can't move between projects)
- [ ] `AgentService.getDefinedLoggedOnAgent()` is called in every service method

## Module Separation Readiness

- [ ] No unnecessary cross-module dependencies added
- [ ] Clean API boundaries maintained
- [ ] No tight coupling to core framework internals
- [ ] All cross-module dependencies are documented
- [ ] New features designed with microservice extraction in mind

## Service Usage

- [ ] All MCP operations go through `SpMcpService`
- [ ] `SpProjectTicketService` used for ticket-project operations
- [ ] `SpProjectService` used for project CRUD
- [ ] Board creation supports template-based lane generation

## Entity Patterns

- [ ] `SpProjectStatusEnum` uses `activeStatus` field (NOT `active`)
- [ ] `EntityOrderPriority` field named `orderPriority` with getter AND setter
- [ ] `EntityMetaCategory` uses only valid values (configuration, systemSpecificConfiguration, runtimeData)
- [ ] Entity import collision avoided (fully qualified `com.mvs.backend.core.model.Entity`)

## Customer Web App Integration

- [ ] SP data accessible to customer web app ONLY through EX module endpoints
- [ ] EX endpoints for SP data validate end-user access via `ExAuthenticationService`
- [ ] No QL queries used for customer web app data retrieval
- [ ] No widgets used for customer web app UI
- [ ] Customer web app uses tailor-made components only

## MCP Endpoints

- [ ] All MCP DTOs properly map entity data
- [ ] Discovery endpoint returns accurate manifest
- [ ] Error responses are meaningful and don't expose internals
- [ ] Pagination supported on list endpoints (limit, offset)
