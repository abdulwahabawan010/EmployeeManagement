# Acceptance Checklist: Agent Management (AM)

Use this checklist to verify compliance with AM module standards.

## Service Usage

- [ ] Agent retrieval uses `AgentService`
- [ ] `getDefinedLoggedOnAgent()` is used when agent is required (throws if not found)
- [ ] `getLoggedOnAgent()` is used when agent is optional
- [ ] Schedule operations use `AgentScheduleService`
- [ ] Pool operations use `AgentPoolService`

## Entity Access

- [ ] Queries use services, not direct repository access
- [ ] Agent entities are not created manually

## Best Practices

- [ ] Agent IDs are not hardcoded
- [ ] `AgentService` is not bypassed for agent queries
- [ ] `AgentScheduleService` is used for schedule resolution
