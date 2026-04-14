---
name: tm-work-ticket
description: "Ticket-driven development: fetch TM ticket from MCP API, find related tickets, analyze codebase, plan and implement across backend/frontend following all skills, create tests, regenerate schema, and post completion comment. Use when working on a ticket, implementing a ticket, or given a ticket ID."
---

# TM Work Ticket Skill

Orchestrates full ticket-driven development: fetch ticket data, find related tickets, analyze the codebase, plan implementation, execute across backend/frontend, create tests, and post a completion comment.

## When to Use This Skill

Use when:
- User says "work on ticket {id}" or "implement ticket {id}"
- User provides a ticket ID and expects full implementation
- User says "tm-work-ticket {id}" or invokes `/tm-work-ticket {id}`

---

## Workflow

### Step 1 — Obtain Ticket ID

Accept the ticket ID from the user's argument (e.g., `/tm-work-ticket 1000000165`). If no ID is provided, ask the user for the ticket ID.

### Step 2 — Load Config

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

### Step 3 — Fetch Full Ticket

Call the MCP API to get the full ticket:

```bash
curl -s -X GET "{baseUrl}/mvsa/tm/mcp/tickets/{ticketId}/full" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

**Error handling:**
- **401/403** — Tell user: "Authentication failed. Please update the token in `.tm-work/config.json`."
- **404** — Tell user: "Ticket {id} not found. Verify the ticket ID."
- **Connection refused** — Tell user: "Cannot reach API at {baseUrl}. Is the backend running?"

### Step 4 — Save Locally

Write the full ticket JSON response to `.tm-work/tickets/{ticketId}.json`.

Create the directory if it doesn't exist:
```bash
mkdir -p .tm-work/tickets
```

### Step 5 — Display Summary

Present the ticket to the user in a readable format:

```
## Ticket #{id} — {name}

| Field           | Value                  |
|-----------------|------------------------|
| Status          | {status}               |
| Urgency         | {urgency}              |
| Type            | {ticketTypeName}       |
| Group           | {ticketGroupName}      |
| Assigned Agent  | {assignedAgentName}    |
| Agent Pool      | {assignedAgentPoolName}|
| Due Date        | {dueDate}              |
| Created         | {createdDate}          |
| Last Modified   | {lastModifiedDate}     |

### Description
{description}

### Comments ({count})
- [{date}] {comment} (by agent/eu)

### Actions ({actionCount} total, {actionPendingCount} pending, {actionMandatoryPendingCount} mandatory pending)
- [{status}] {actionName} — {actionDescription}

### Linked Objects ({count})
- {objectType}: {objectName} (ID: {objectId})

### Documents ({count})
- {documentName} ({documentType}, {size})

### Ticket Data (Custom Fields)
- {fieldName}: {fieldValue}
```

**Important:** Do NOT display document base64 content inline. Only show document metadata.

### Step 6 — Find Related Tickets

Fetch all open tickets using active statuses:

```bash
curl -s -X GET "{baseUrl}/mvsa/tm/mcp/tickets?statuses=draft,assigned,working,awaiting_customer,awaiting_partner,on_hold,awaiting_appointment&limit=200" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Analyze the returned ticket list and find related tickets by scoring similarity:
- **Same ticket type** (+3 points)
- **Same ticket group** (+2 points)
- **Keyword overlap in name/description** (+1 per shared significant keyword)
- **Same linked objects** (+3 per shared linked object)

Present the **top 5-10** related tickets in a table:

```
## Related Tickets

| # | ID       | Name                      | Type    | Group   | Similarity Reason              |
|---|----------|---------------------------|---------|---------|-------------------------------|
| 1 | 10000123 | Implement XYZ endpoint    | Feature | Backend | Same type, keyword: "endpoint" |
| 2 | 10000456 | Add XYZ DTO               | Feature | Backend | Same group, same linked object |
```

Ask the user: **"Which related tickets should I include for context? (comma-separated numbers, or 'none')"**

For each selected ticket, fetch the full data and save to `.tm-work/tickets/{selectedTicketId}.json`.

### Step 7 — Analyze Codebase

Based on ticket content (description, comments, linked objects, custom fields), identify:

1. **Relevant backend modules** — Use Glob/Grep to find matching entities, services, controllers
2. **Relevant frontend features** — Use Glob/Grep to find matching components, services, DTOs
3. **Existing patterns** — Read key files to understand current implementation style

For each identified area, read the most relevant files to build context.

### Step 8 — Plan Mode

Enter plan mode. Present a structured implementation plan:

```
## Implementation Plan for Ticket #{id}

### Summary
{one-paragraph summary of what will be implemented}

### Affected Modules
- Backend: {list of modules}
- Frontend: {list of features}

### Files to Create/Modify
| # | Action | File | Description |
|---|--------|------|-------------|
| 1 | Create | ... | ... |
| 2 | Modify | ... | ... |

### Implementation Order
1. {step} — uses skill: {skill_name}
2. {step} — uses skill: {skill_name}

### Skills to Invoke
- be_core_entity — for new JPA entities
- be_tm — for ticket module patterns
- fe_core_dto — for frontend DTOs
- ... (list all relevant skills)

### Questions / Clarifications
- {any open questions for the user}
```

Wait for user approval before proceeding.

### Step 9 — Implement

Execute the approved plan step by step.

**For each major step:**

1. Invoke the relevant skill for guidance on patterns and conventions
2. Implement the code following skill guidelines
3. Compile-check after each major step:
   - **Backend:** `cd backend && ./gradlew compileJava`
   - **Frontend:** `cd frontend && npx ng build`
4. Fix any compilation errors before proceeding to the next step

**Ticket Traceability — MANDATORY:**

Every code change MUST reference the ticket ID for traceability. Follow these rules:

- **New classes:** Add the ticket ID to the class-level Javadoc:
  ```java
  /**
   * Service for handling customer onboarding workflows.
   *
   * @ticket TM-{ticketId}
   */
  public class CustomerOnboardingService {
  ```

- **New methods:** Add the ticket ID to the method-level Javadoc:
  ```java
  /**
   * Calculates the risk score for a customer profile.
   *
   * @ticket TM-{ticketId}
   */
  public int calculateRiskScore(CustomerProfile profile) {
  ```

- **Modified existing methods/classes:** Add an inline comment at the change site referencing the ticket:
  ```java
  // TM-{ticketId}: Added null check for optional agent pool
  if (agentPool != null) {
      ticket.setAssigneeAgentPool(agentPool);
  }
  ```

- **Frontend TypeScript files:** Use the same pattern:
  ```typescript
  /**
   * Component for displaying customer risk assessment.
   *
   * @ticket TM-{ticketId}
   */
  @Component({ ... })
  export class CustomerRiskComponent {
  ```

- **Modified frontend code:** Inline comment at the change site:
  ```typescript
  // TM-{ticketId}: Added reactive filter for active contracts
  this.activeContracts$ = this.contracts$.pipe(
      filter(c => c.status === 'active')
  );
  ```

**Important:** The ticket ID reference must use the format `TM-{ticketId}` (e.g., `TM-1000000165`). This enables searching the codebase for all changes related to a specific ticket.

**Skill mapping by activity:**

| Activity | Skill |
|----------|-------|
| JPA entities | `be_core_entity` |
| Backend services / architecture | `be_core_documentation` |
| Backend forms | `be_core_form` |
| Backend queries (QL) | `be_core_ql` |
| Module-specific backend | `be_tm`, `be_cm`, `be_cr`, `be_am`, `be_dm`, `be_bm`, `be_si`, `be_jb`, etc. |
| Frontend DTOs | `fe_core_dto` |
| Frontend forms | `fe_core_form` |
| Frontend CRUD services | `fe_core_mvs-crud-service` |
| Frontend components (base) | `fe_core_object-base-component` |
| Frontend CRUD components | `fe_core_crud-object-component` |
| Frontend routing | `fe_core_routing` |
| Frontend pages | `fe_core_page` |
| Frontend widgets | `fe_core_widget` |
| Frontend coding standards | `fe_core_coding-standards` |
| Frontend system guidelines | `fe_core_system-guidelines` |
| Frontend inputs | `fe_core_inputs` |
| Frontend outputs | `fe_core_outputs` |
| Frontend enums | `fe_core_frontend-enum-rules` |
| Frontend QL queries | `fe_core_ql` |

### Step 10 — Tests & Schema

Follow the `be_test` skill for test creation:

1. **Unit tests** — Create tests extending `AbstractTestBaseUnit`
2. **Integration tests** — Create tests extending `AbstractTestBaseIntegration`

If entities were created or modified:

3. **Delete existing schema file:** `rm -f backend/src/test/resources/db/postgre/V1__.sql`
4. **Run schema generation:** `cd backend && ./gradlew integrationTest --tests "*SchemaGenerationTest*"`
5. **Fix any issues** until schema generates successfully

Run all tests:

```bash
cd backend && ./gradlew unitTest
cd backend && ./gradlew integrationTest
```

Fix failures before proceeding.

### Step 11 — Post Completion Comment

After successful implementation, post a comment to the ticket:

```bash
curl -s -X POST "{baseUrl}/mvsa/tm/mcp/tickets/{ticketId}/comments" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "comment": "Implementation completed by Claude Code.\n\nChanges:\n- {summary of files created/modified}\n- {summary of tests created}\n\nSkills used: {list of skills invoked}",
    "euVisible": false
  }'
```

Then ask the user: **"Would you like to change the ticket status? Current status: {status}. Available transitions: {list active statuses}. Or 'no' to keep current status."**

If user wants to change status:
```bash
curl -s -X POST "{baseUrl}/mvsa/tm/mcp/tickets/{ticketId}/status" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "newStatus": "{selected_status}",
    "comment": "Status changed after implementation by Claude Code."
  }'
```

**NEVER auto-change ticket status.** Always ask the user first.

---

## API Reference

All endpoints are under `{baseUrl}/mvsa/tm/mcp/tickets`.

| Method | Path | Description | Parameters |
|--------|------|-------------|------------|
| `GET` | `/` | List tickets | `statuses` (comma-sep), `typeId`, `groupId`, `limit` (default 50), `offset` (default 0) |
| `GET` | `/{id}/short` | Short ticket view | — |
| `GET` | `/{id}/full` | Full ticket with docs, linked objects | — |
| `POST` | `/{id}/status` | Change ticket status | Body: `{ "newStatus", "comment", "closingDate?", "closingStatusId?" }` |
| `POST` | `/{id}/comments` | Add comment | Body: `{ "comment", "euVisible?" }` |
| `GET` | `/template` | Get ticket type template (fields + defaults) | `ticketTypeId` (required) |
| `POST` | `/` | Create a new ticket | Body: `McpCreateTicketRequestDto` (see below) |

### Ticket Creation Workflow

To create a ticket, follow this 2-step flow:

**Step 1 — Discover fields via template:**
```bash
curl -s -X GET "{baseUrl}/mvsa/tm/mcp/tickets/template?ticketTypeId={typeId}" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}"
```

Returns `TmMcpTicketTemplateDto` with:
- `ticketTypeId`, `ticketTypeName`, `ticketGroupName`
- `defaultUrgency`, `defaultStatus`, `defaultEuVisible` — type defaults
- `coreFields` — standard ticket fields (name, description, urgency, dueDate, etc.)
- `dataFields` — custom TicketTypeField definitions with name, fieldType, mandatory, description, fieldOrder

**Step 2 — Create ticket:**
```bash
curl -s -X POST "{baseUrl}/mvsa/tm/mcp/tickets" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{
    "ticketTypeId": 100,
    "name": "My Ticket",
    "description": "Details here",
    "urgency": "medium",
    "assigneeAgentId": 1,
    "dueDate": "2026-03-01",
    "linkedObjectId": 500,
    "linkedObjectTypeAlias": "cr.Customer",
    "ticketData": {
      "custom_field_1": "value1",
      "custom_field_2": 42
    }
  }'
```

**Request body fields:**
- `ticketTypeId` (long, **required**) — the ticket type ID
- `name` (string, optional) — defaults to ticket type name
- `description` (string, optional) — ticket description
- `euDescription` (string, optional) — end-user visible description
- `euVisible` (boolean, optional) — defaults from ticket type
- `urgency` (string, optional) — TmUrgencyEnum name (e.g. `low`, `medium`, `high`, `critical`)
- `assigneeAgentId` (long, optional) — agent to assign
- `assigneeAgentPoolId` (long, optional) — agent pool to assign
- `dueDate` (date, optional) — ISO format `yyyy-MM-dd`
- `linkedObjectId` (long, optional) — object to link after creation
- `linkedObjectTypeAlias` (string, optional) — e.g. `cr.Customer`
- `ticketData` (object, optional) — custom field values keyed by TicketTypeField name

Returns a `TmMcpTicketShortDto` with the created ticket details.

### Updating Ticket Fields via Regular CRUD Endpoints

The MCP API provides a focused set of endpoints (list, read, create, status change, comments). For any update not directly supported by the MCP API (e.g., reassigning a ticket, changing urgency, updating due date, etc.), use the **regular entity CRUD endpoints** instead.

Each entity has a standard `ObjectCrudController` endpoint at `/mvsa/{module}/{entity-plural}`. For tickets this is:

```
GET    {baseUrl}/mvsa/tm/tickets/{id}       — read ticket DTO
PUT    {baseUrl}/mvsa/tm/tickets/{id}       — update ticket fields
```

**How to update a ticket field:**

1. **Discover the DTO field name** — `GET /mvsa/tm/tickets/{id}` and inspect the JSON keys. DTO field names follow the pattern `{fieldName}DtoId` for associations (e.g., `assigneeAgentDtoId`, `assigneeAgentPoolDtoId`, `typeDtoId`).
2. **Send a PUT** with only the fields you want to change:

```bash
curl -s -X PUT "{baseUrl}/mvsa/tm/tickets/{ticketId}" \
  -H "Content-Type: application/json" \
  -H "x-alpha-tenant: {tenant}" \
  -H "IgAuthorization: {auth}" \
  -d '{"assigneeAgentDtoId": 1000000100}'
```

**Common ticket DTO fields:**

| DTO Field | Description |
|-----------|-------------|
| `assigneeAgentDtoId` | Assigned agent (by agent ID) |
| `assigneeAgentPoolDtoId` | Assigned agent pool (by pool ID) |
| `typeDtoId` | Ticket type |
| `urgency` | Urgency level |
| `dueDate` | Due date |

**This pattern applies to all entities**, not just tickets. Any entity managed by an `ObjectCrudController` can be read and updated via `GET`/`PUT` at `/mvsa/{module}/{entity-plural}/{id}`.

### Headers (required on all requests)

```
Content-Type: application/json
x-alpha-tenant: {from config}
IgAuthorization: {from config}
```

---

## Status Reference

### Active Statuses (work in progress)
| Status | Description |
|--------|-------------|
| `draft` | Newly created |
| `assigned` | Assigned to agent |
| `working` | Actively being worked on |
| `awaiting_customer` | Waiting for customer response |
| `awaiting_partner` | Waiting for partner response |
| `on_hold` | Temporarily paused |
| `awaiting_appointment` | Waiting for scheduled appointment |

### Terminal Statuses (completed)
| Status | Description |
|--------|-------------|
| `resolved` | Work completed |
| `cancelled` | Ticket cancelled |
| `closed` | Ticket closed |

---

## Error Handling

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Continue workflow |
| 401 / 403 | Auth failed | Prompt user to update token in `.tm-work/config.json` |
| 404 | Not found | Verify ticket ID; inform user |
| 500 | Server error | Show error body; ask user to check backend logs |
| Connection refused | Backend down | Tell user to start backend at `{baseUrl}` |

---

## Resuming Work

When resuming work on a previously fetched ticket:

1. **Check cache** — Look for `.tm-work/tickets/{ticketId}.json`
2. **Compare freshness** — Fetch the ticket's `lastModifiedDate` via `/short` endpoint and compare with cached version
3. **If stale** — Re-fetch full ticket and update cache
4. **Review git diff** — Run `git diff` to see what's already been implemented
5. **Continue from where left off** — Skip completed steps, resume at the next pending step