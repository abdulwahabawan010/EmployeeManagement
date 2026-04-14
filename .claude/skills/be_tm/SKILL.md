---
name: be_tm
description: "Backend: Expert guidance on Ticket Management (TM) module including ticket lifecycle, types, actions, assignments, and ticket workflows. Use when working with tickets, ticket types, ticket actions, assignments, or ticket workflows."
---

# TM (Ticket Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/tm/documentation.md`

## When to Use This Skill

Use when:
- Working with tickets
- Managing ticket types
- Implementing ticket actions
- Handling assignments
- Managing ticket workflows

## Core Entities

- **Ticket** (`tmTicket`) - Central ticket entity
- **TicketType** (`tmTicketType`) - Type configuration
- **TicketGroup** (`tmTicketGroup`) - Grouping
- **TicketObject** (`tmTicketObject`) - Entity links
- **TicketComment** (`tmTicketComment`) - Agent comments
- **TicketAction** (`tmTicketAction`) - Actions/TODOs

## Status Values (TmStatusEnum)

- `draft` - Initial state (active)
- `assigned` - Awaiting work (active)
- `working` - Being worked on (active)
- `awaiting_customer` - Waiting for customer (active)
- `awaiting_partner` - Waiting for partner (active)
- `on_hold` - On hold (active)
- `resolved` - Completed (inactive)
- `cancelled` - Cancelled (inactive)

## Key Services

### TicketService
```java
Ticket createTicket(TicketType type)
Ticket createTicket(TicketType type, Function<Ticket, Ticket> funcAdjustTicketBeforeSave)
TicketObject addObjectToTicket(Ticket ticket, Entity entity)
Ticket closeTicket(Ticket, TmStatusEnum status, TicketTypeCompleteStatus, LocalDate, String)
```

## Implementation Pattern

```java
// Create ticket
TicketType type = ...;
Ticket ticket = ticketService.createTicket(type);

// Create with customization
Ticket ticket = ticketService.createTicket(type, t -> {
    t.setName("Custom name");
    t.setUrgency(TmUrgencyEnum.high);
    return t;
});

// Add object to ticket
ticketService.addObjectToTicket(ticket, customer);
```

## Best Practices

### DO:
- Use createTicket methods
- Use adjustment function for custom logic
- Use addObjectToTicket for linking

### DON'T:
- Don't manually create tickets without service
- Don't directly set status
- Don't bypass service methods

## Primary Entry Point
`TicketService` for all ticket operations

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)