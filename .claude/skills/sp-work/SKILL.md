---
name: sp-work
description: "Sprint & Project management: create projects, boards, sprints, tickets via SP MCP API. List, view, move tickets, manage backlogs, and run sprint lifecycle. Use when managing projects, creating sprints, or organizing board work."
---

# SP Work Skill

Orchestrates Sprint & Project management operations via the SP MCP API. Supports creating projects, boards, sprints, adding tickets, moving tickets between lanes, managing backlogs, and running sprint lifecycle.

## When to Use This Skill

Use when:
- User says "create a project", "new project", "sp create-project"
- User says "create a sprint", "new sprint", "sp create-sprint"
- User says "create a board", "new board", "sp create-board"
- User says "create a ticket" or "add ticket to project"
- User says "list projects", "show projects", "sp list"
- User says "view project {id}", "show board {id}", "sp view"
- User says "move ticket", "sp move"
- User says "start sprint", "complete sprint"
- User says "show backlog", "sprint backlog"
- User invokes `/sp-work {command} {args}`

---

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all projects | `/sp-work list` |
| `view <projectId>` | View project detail with boards and sprints | `/sp-work view 42` |
| `board <boardId>` | View board with lanes and tickets | `/sp-work board 10` |
| `backlog <projectId>` | View product backlog (unassigned tickets) | `/sp-work backlog 42` |
| `sprint-backlog <projectId> <sprintId>` | View sprint backlog | `/sp-work sprint-backlog 42 5` |
| `create-project` | Create a new project (interactive) | `/sp-work create-project` |
| `create-board <projectId>` | Create a board for a project | `/sp-work create-board 42` |
| `create-sprint <projectId>` | Create a sprint in a project | `/sp-work create-sprint 42` |
| `create-ticket <projectId>` | Create a TM ticket and add to project | `/sp-work create-ticket 42` |
| `add-ticket <projectId> <ticketId>` | Add existing TM ticket to project | `/sp-work add-ticket 42 1000000165` |
| `move <projectTicketId> <targetLaneId>` | Move ticket to a lane | `/sp-work move 7 3` |
| `assign-sprint <projectTicketId> <sprintId>` | Assign ticket to sprint | `/sp-work assign-sprint 7 5` |
| `unassign-sprint <projectTicketId>` | Remove ticket from sprint | `/sp-work unassign-sprint 7` |
| `start-sprint <sprintId>` | Start a planned sprint | `/sp-work start-sprint 5` |
| `complete-sprint <sprintId>` | Complete an active sprint | `/sp-work complete-sprint 5` |

If no command is given, show the commands reference table and ask what the user wants to do.

---

## Workflow

### Step 1 — Load Config

Read `.tm-work/config.json` from the project root. It must contain:

```json
{
  "baseUrl": "https://alpha-dev-platform-capp.calmforest-6dbf5289.germanywestcentral.azurecontainerapps.io",
  "headers": {
    "x-alpha-tenant": "tenantC",
    "IgAuthorization": "Bearer ig_access <TOKEN>"
  }
}
```

If the file does not exist, use the following default values:

> Config file `.tm-work/config.json` not found. Please create it with your API connection details:
> ```json
> {
>   "baseUrl": "https://alpha-dev-platform-capp.calmforest-6dbf5289.germanywestcentral.azurecontainerapps.io",
>   "headers": {
>     "x-alpha-tenant": "tenantC",
>     "IgAuthorization": "Bearer ig_access eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidG9rZW4tdHlwZSI6MSwiZXhwIjo0MTAyMzU4NDAwLCJpYXQiOjE3NzAzNjQwNzYsInRlbmFudCI6InRlbmFudEMifQ.lAjb7mAFRPni4HbL1jJa_VRnQh2wxaaxOnpVWo2i_FcjsMA9TfrBPay8JgDwGMWHBqURptXzgIq3nJ9j8NYyKA"
>   }
> }
> ```

Stop and wait for user to create the config before proceeding.

### Step 2 — Parse Command

Parse the user's command from the arguments. If no arguments provided, show the commands reference table and ask the user what they want to do.

### Step 3 — Execute Command

Execute the appropriate command workflow below.

---

## Command Workflows

### `list` — List Projects

```bash
curl -s -X GET "{baseUrl}/mvsa/sp/mcp/projects?limit=50&offset=0" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display results as a table:

```
## Projects

| # | ID | Name | Alias | Status | Owner | Start | End | Boards | Sprints | Tickets |
|---|----|------|-------|--------|-------|-------|-----|--------|---------|---------|
| 1 | 42 | My Project | PRJ-1 | active | John | 2026-01-01 | 2026-06-30 | 2 | 3 | 15 |
```

Ask: **"What would you like to do? (view {id}, create-project, or another command)"**

---

### `view <projectId>` — View Project Detail

```bash
curl -s -X GET "{baseUrl}/mvsa/sp/mcp/projects/{projectId}" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
## Project #{id} — {name}

| Field       | Value          |
|-------------|----------------|
| Alias       | {alias}        |
| Status      | {status}       |
| Owner       | {ownerAgentName} |
| Start Date  | {startDate}    |
| End Date    | {endDate}      |
| Created     | {createdDate}  |
| Modified    | {lastModifiedDate} |

### Description
{description}

### Boards ({count})
| # | ID | Name | Type | Active | Lanes |
|---|----|------|------|--------|-------|
| 1 | 10 | Sprint Board | scrum | true | Backlog, Planned, Started, Testing, Done |

### Sprints ({count})
| # | ID | Name | Status | Start | End | Tickets | Story Points | Goal |
|---|----|------|--------|-------|-----|---------|--------------|------|
| 1 | 5  | Sprint 1 | active | 2026-01-15 | 2026-01-29 | 8 | 21 | Core features |
```

Ask: **"What would you like to do? (board {id}, backlog, create-sprint, create-board, create-ticket, add-ticket)"**

---

### `board <boardId>` — View Board Detail

```bash
curl -s -X GET "{baseUrl}/mvsa/sp/mcp/boards/{boardId}" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display the board as a Kanban-style view:

```
## Board #{id} — {name} ({boardType})
Project: {projectName} (ID: {projectId})

### Lanes
| # | ID | Name | Type | Order | WIP Limit | Tickets |
|---|----|------|------|-------|-----------|---------|
| 1 | 20 | Backlog | backlog | 1 | - | 5 |
| 2 | 21 | In Progress | started | 2 | 3 | 2 |
| 3 | 22 | Done | completed | 3 | - | 8 |

### Tickets by Lane

#### Backlog (5 tickets)
| ProjTicketID | Ticket | Alias | Status | Urgency | Agent | Story Pts | Priority | Sprint |
|--------------|--------|-------|--------|---------|-------|-----------|----------|--------|
| 7 | #1000165 Login Bug | TK-001 | working | high | Jane | 3 | 1 | Sprint 1 |

#### In Progress (2 tickets)
...
```

Ask: **"What would you like to do? (move {projectTicketId} {laneId}, assign-sprint {projectTicketId} {sprintId})"**

---

### `backlog <projectId>` — Product Backlog

```bash
curl -s -X GET "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/backlog" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
## Product Backlog — Project #{projectId}

| # | ProjTicketID | Ticket | Alias | Status | Urgency | Agent | Story Pts | Priority | Lane |
|---|--------------|--------|-------|--------|---------|-------|-----------|----------|------|
| 1 | 7 | #1000165 Login Bug | TK-001 | working | high | Jane | 3 | 1 | Backlog |
```

Ask: **"What would you like to do? (assign-sprint {projectTicketId} {sprintId}, move {projectTicketId} {laneId}, create-ticket)"**

---

### `sprint-backlog <projectId> <sprintId>` — Sprint Backlog

```bash
curl -s -X GET "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/sprints/{sprintId}/tickets" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display the same table format as the product backlog, titled "Sprint Backlog — Sprint #{sprintId}".

---

### `create-project` — Create Project

Ask the user for required fields using AskUserQuestion or interactive prompts:

1. **Name** (required): Project name
2. **Alias** (optional): Short identifier
3. **Description** (optional): Project description
4. **Owner Agent ID** (optional): ID of the owning agent
5. **Start Date** (optional): ISO format yyyy-MM-dd
6. **End Date** (optional): ISO format yyyy-MM-dd
7. **Board Template ID** (optional): ID of SpBoardTemplate to auto-create a board

For the board template, first list available templates:

```bash
curl -s -X GET "{baseUrl}/mvsa/ql" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{"query":"sp.SpBoardTemplate"}'
```

If templates exist, show them and ask user which to use.

Then create the project:

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projects" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "name": "{name}",
    "alias": "{alias}",
    "description": "{description}",
    "ownerAgentId": {ownerAgentId},
    "startDate": "{startDate}",
    "endDate": "{endDate}",
    "boardTemplateId": {boardTemplateId}
  }'
```

**Only include non-null fields in the JSON body.** Omit any field the user did not provide.

Display the created project detail (same as `view` command).

Ask: **"Project created! What's next? (create-sprint, create-board, create-ticket, add-ticket)"**

---

### `create-board <projectId>` — Create Board

Ask the user for:

1. **Name** (required): Board name
2. **Board Type** (optional): `scrum` or `kanban` (default: scrum)
3. **Board Template ID** (optional): ID of SpBoardTemplate for predefined lanes

List available templates first (same QL query as create-project).

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/boards" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "name": "{name}",
    "boardType": "{boardType}",
    "boardTemplateId": {boardTemplateId}
  }'
```

Display the created board detail (same as `board` command).

---

### `create-sprint <projectId>` — Create Sprint

Ask the user for:

1. **Name** (required): Sprint name (e.g., "Sprint 1", "Sprint 2")
2. **Start Date** (optional): ISO format yyyy-MM-dd
3. **End Date** (optional): ISO format yyyy-MM-dd
4. **Goal** (optional): Sprint goal description

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/sprints" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "name": "{name}",
    "startDate": "{startDate}",
    "endDate": "{endDate}",
    "goal": "{goal}"
  }'
```

Display the created sprint:

```
## Sprint Created

| Field        | Value       |
|--------------|-------------|
| ID           | {id}        |
| Name         | {name}      |
| Status       | planned     |
| Start Date   | {startDate} |
| End Date     | {endDate}   |
| Goal         | {goal}      |
```

Ask: **"Sprint created! Would you like to start it now? (yes/no)"**

If yes, execute `start-sprint {sprintId}`.

---

### `create-ticket <projectId>` — Create TM Ticket and Add to Project

This is a two-step process: first create a TM ticket, then add it to the project.

**Step A — Create TM Ticket**

Ask the user for ticket details:

1. **Name** (required): Ticket title
2. **Description** (optional): Ticket description
3. **Ticket Type ID** (optional): ID of the ticket type
4. **Urgency** (optional): low, medium, high, critical
5. **Story Points** (optional): Effort estimation for the project
6. **Priority** (optional): Priority within the project

To help the user select a ticket type, query available types:

```bash
curl -s -X GET "{baseUrl}/mvsa/ql" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{"query":"tm.TicketType"}'
```

Create the TM ticket:

```bash
curl -s -X POST "{baseUrl}/mvsa/ql" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{"query":"tm.Ticket","method":"create","data":{"name":"{name}","description":"{description}","ticketTypeDtoId":{typeId}}}'
```

**Step B — Add TM Ticket to Project**

Use the newly created ticket's ID:

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/tickets" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "ticketId": {newTicketId},
    "storyPoints": {storyPoints},
    "priority": {priority}
  }'
```

Display the result:

```
## Ticket Created and Added to Project

| Field           | Value           |
|-----------------|-----------------|
| TM Ticket ID    | {ticketId}      |
| Project Ticket  | {projectTicketId} |
| Name            | {ticketName}    |
| Lane            | {laneName}      |
| Story Points    | {storyPoints}   |
| Priority        | {priority}      |
```

Ask: **"Ticket added! Would you like to assign it to a sprint? (sprint ID or 'no')"**

If user provides a sprint ID, execute `assign-sprint {projectTicketId} {sprintId}`.

---

### `add-ticket <projectId> <ticketId>` — Add Existing TM Ticket to Project

Ask user for optional:
1. **Sprint ID** (optional): Assign to sprint immediately
2. **Story Points** (optional): Effort estimate
3. **Priority** (optional): Priority in project

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projects/{projectId}/tickets" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "ticketId": {ticketId},
    "sprintId": {sprintId},
    "storyPoints": {storyPoints},
    "priority": {priority}
  }'
```

Display result same as `create-ticket` step B.

---

### `move <projectTicketId> <targetLaneId>` — Move Ticket Between Lanes

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projectTickets/{projectTicketId}/move" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "targetLaneId": {targetLaneId},
    "laneOrder": {laneOrder}
  }'
```

Display:

```
Ticket moved: {ticketAlias} "{ticketName}" -> {laneName} ({laneInternalType})
```

---

### `assign-sprint <projectTicketId> <sprintId>` — Assign Ticket to Sprint

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projectTickets/{projectTicketId}/assignSprint?sprintId={sprintId}" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
Ticket {ticketAlias} assigned to sprint: {sprintName}
```

---

### `unassign-sprint <projectTicketId>` — Remove Ticket from Sprint

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/projectTickets/{projectTicketId}/assignSprint" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
Ticket {ticketAlias} removed from sprint.
```

---

### `start-sprint <sprintId>` — Start Sprint

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/sprints/{sprintId}/start" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
Sprint "{name}" started.
| Status        | active         |
| Tickets       | {ticketCount}  |
| Story Points  | {totalStoryPoints} |
```

---

### `complete-sprint <sprintId>` — Complete Sprint

```bash
curl -s -X POST "{baseUrl}/mvsa/sp/mcp/sprints/{sprintId}/complete" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Display:

```
Sprint "{name}" completed.
| Status        | completed      |
| Tickets       | {ticketCount}  |
| Story Points  | {totalStoryPoints} |
```

---

## API Reference

All SP MCP endpoints are under `{baseUrl}/mvsa/sp/mcp`.

### Projects

| Method | Path | Description | Parameters / Body |
|--------|------|-------------|-------------------|
| `GET` | `/projects` | List projects | `statuses` (array), `limit` (default 50), `offset` (default 0) |
| `GET` | `/projects/{projectId}` | Project detail with boards and sprints | — |
| `POST` | `/projects` | Create project | Body: `{ name, alias?, description?, ownerAgentId?, startDate?, endDate?, boardTemplateId? }` |

### Boards

| Method | Path | Description | Parameters / Body |
|--------|------|-------------|-------------------|
| `GET` | `/boards/{boardId}` | Board detail with lanes and tickets | — |
| `POST` | `/projects/{projectId}/boards` | Create board | Body: `{ name, boardType?, boardTemplateId? }` |

### Sprints

| Method | Path | Description | Parameters / Body |
|--------|------|-------------|-------------------|
| `POST` | `/projects/{projectId}/sprints` | Create sprint | Body: `{ name, startDate?, endDate?, goal? }` |
| `POST` | `/sprints/{sprintId}/start` | Start sprint | — |
| `POST` | `/sprints/{sprintId}/complete` | Complete sprint | — |

### Tickets

| Method | Path | Description | Parameters / Body |
|--------|------|-------------|-------------------|
| `POST` | `/projects/{projectId}/tickets` | Add ticket to project | Body: `{ ticketId, sprintId?, storyPoints?, priority? }` |
| `POST` | `/projectTickets/{id}/move` | Move ticket to lane | Body: `{ targetLaneId, laneOrder? }` |
| `POST` | `/projectTickets/{id}/assignSprint` | Assign to sprint | Query: `sprintId` (omit to unassign) |
| `GET` | `/projects/{projectId}/backlog` | Product backlog | — |
| `GET` | `/projects/{projectId}/sprints/{sprintId}/tickets` | Sprint backlog | — |

### Discovery

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | MCP discovery manifest with all endpoints, parameters, and response descriptions |

---

## Headers (required on all requests)

```
Content-Type: application/json
x-alpha-tenant: {from config}
IgAuthorization: {from config}
```

---

## Status Reference

### Project Statuses
| Status | Active | Description |
|--------|--------|-------------|
| `draft` | yes | Newly created project |
| `active` | yes | Project in progress |
| `on_hold` | yes | Temporarily paused |
| `completed` | no | Project finished |
| `cancelled` | no | Project cancelled |

### Sprint Statuses
| Status | Active | Description |
|--------|--------|-------------|
| `planned` | yes | Sprint planned, not started |
| `active` | yes | Sprint in progress |
| `completed` | no | Sprint finished |
| `cancelled` | no | Sprint cancelled |

### Board Types
| Type | Description |
|------|-------------|
| `scrum` | Scrum board with sprints |
| `kanban` | Kanban continuous flow board |

### Lane Internal Types
| Type | Description |
|------|-------------|
| `backlog` | Backlog / to-do items |
| `planned` | Planned for current iteration |
| `started` | Work in progress |
| `ready_for_testing` | Ready for QA / testing |
| `completed` | Done |
| `custom` | Custom lane type |

---

## Error Handling

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Continue workflow |
| 401 / 403 | Auth failed | Prompt user to update token in `.tm-work/config.json` |
| 404 | Not found | Verify the ID; inform user |
| 500 | Server error | Show error body; ask user to check backend logs |
| Connection refused | Backend down | Tell user to start backend at `{baseUrl}` |

---

## Important Rules

1. **Always load config first** before any API call.
2. **Only include non-null fields** in request bodies. Omit fields the user did not provide.
3. **Never auto-execute destructive operations.** Always confirm with the user before starting/completing sprints or moving tickets.
4. **Show results in tables** for readability.
5. **After each operation, suggest next steps** to guide the user through the workflow.
6. **For create-ticket**, create the TM ticket first via QL API, then add it to the project via SP MCP.
7. **Use the shared `.tm-work/config.json`** — same config file as the tm-work-ticket skill.
