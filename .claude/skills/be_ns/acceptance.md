# Acceptance Checklist: Notification System (NS)

Use this checklist to verify compliance with NS module standards.

## Service Usage

- [ ] All notification operations use `NsNotificationService`
- [ ] Internal notification services are never accessed directly

## Notification Sending

- [ ] `NsNotificationSingleSendRequest` factory methods are used
- [ ] Exceptions are handled when sending notifications
- [ ] Appropriate channels are selected (email, SMS, push, Teams, WhatsApp)

## Variable Handling

- [ ] Variable validation is not skipped
- [ ] Notification type IDs are not hardcoded

## Status Handling

- [ ] Status values are understood: pending, waiting, processed, error
- [ ] Status transitions follow expected patterns

## Best Practices

- [ ] `NsNotificationService` is the entry point
- [ ] Factory methods are used for request creation
- [ ] Error handling is implemented
