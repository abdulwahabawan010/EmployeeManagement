# Acceptance Checklist: Workflow Engine (WF)

Use this checklist to verify compliance with WF module standards.

## Service Usage

- [ ] Process operations use `WfProcessService`
- [ ] Activity operations use `WfActivityService`

## Process Management

- [ ] Processes are started via `startProcess()`
- [ ] Process status is not modified directly
- [ ] `WfProcessTypeResult` is used for process outcomes
- [ ] Field bindings are used for data passing

## Activity Types

- [ ] Activity types are understood: object, notification, start_process, ticket_create, decision, document_upload_and_list
- [ ] Activity validation is not skipped

## Best Practices

- [ ] `WfProcessService` is the entry point for process operations
- [ ] Processes are not created without `WfProcessType`
- [ ] Proper result types are defined for process outcomes
