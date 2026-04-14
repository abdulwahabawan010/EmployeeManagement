# Acceptance Checklist: Ticket Management (TM)

Use this checklist to verify compliance with TM module standards.

## Service Usage

- [ ] All ticket operations use `TicketService`
- [ ] `createTicket()` methods are used for ticket creation
- [ ] `addObjectToTicket()` is used for entity linking
- [ ] `closeTicket()` is used for proper ticket closure

## Ticket Creation

- [ ] Tickets are not created manually without service
- [ ] `TicketType` is always provided
- [ ] Adjustment function is used for custom logic when needed

## Status Handling

- [ ] Status is not set directly
- [ ] Status values are understood: draft, assigned, working, awaiting_customer, awaiting_partner, on_hold, resolved, cancelled
- [ ] Active vs inactive status distinction is understood

## Best Practices

- [ ] `TicketService` is the entry point for all operations
- [ ] Service methods are not bypassed
- [ ] Ticket linking uses `addObjectToTicket()`
