---
name: be_ns
description: "Backend: Expert guidance on Notification System (NS) module including multi-channel notifications, email/SMS sending, notification templates, and notification providers. Use when working with notifications, email/SMS sending, notification templates, or notification providers."
---

# NS (Notification Service) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/ns/documentation.md`

## When to Use This Skill

Use when:
- Working with notifications
- Sending email/SMS
- Managing notification templates
- Implementing notification providers

## Supported Channels

- **Email** - `CoChannelTypeEnum.email`
- **SMS** - `CoChannelTypeEnum.sms`
- **Push Notification** - `CoChannelTypeEnum.push_notification`
- **Microsoft Teams** - `CoChannelTypeEnum.ms_teams`
- **WhatsApp** - `CoChannelTypeEnum.whatsapp`

## Core Entities

- **NsNotificationType** - Template configuration
- **NsNotification** - Sent/pending notification
- **NsNotificationRecipient** - Recipient link
- **NsNotificationChannel** - Channel-specific data

## Key Services

### NsNotificationService
```java
NsNotification sendSingleRecipientNotification(
    NsNotificationTypeSource notificationTypeSource,
    Entity recipient,
    List<CoChannelTypeEnum> channels,
    Map<NsNotificationTypeField, Object> variables
)

void sendSingleRecipientNotificationAsync(...)

NsNotification sendSingleNotification(NsNotificationSingleSendRequest sendRequest)
```

## Status Values

- `pending` - Created, not yet sent
- `waiting` - Suspended
- `processed` - Successfully sent
- `error` - Error occurred

## Implementation Pattern

```java
@Autowired NsNotificationService notificationService;

notificationService.sendSingleRecipientNotification(
    source,
    recipient,
    channels,
    variables
);
```

## Best Practices

### DO:
- Always use `NsNotificationService` as entry point
- Use `NsNotificationSingleSendRequest` factory methods
- Handle exceptions when sending notifications

### DON'T:
- Never access internal notification services directly
- Never skip variable validation
- Never hardcode notification type IDs

## Primary Entry Point
`NsNotificationService` for all notification operations

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)