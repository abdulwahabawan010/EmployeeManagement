# Acceptance Checklist: Customer Relationship (CR)

Use this checklist to verify compliance with CR module standards.

## Service Usage

- [ ] Customer operations use `CustomerService`
- [ ] Customer deletion uses `CustomerDeletionService`
- [ ] Assessment operations use `CustomerAssessmentService`
- [ ] Profile operations use `CustomerProfileService`

## Entity Access

- [ ] Customer retrieval uses `CustomerAccess` pattern
- [ ] Authorization check is performed via `access.checkAccess()`
- [ ] Entity is obtained via `access.getEntity()`

## Best Practices

- [ ] Customers are not deleted without `CustomerDeletionService`
- [ ] Assessment checks are not bypassed
- [ ] Customers are not created without `CustomerType`
- [ ] Bank account operations follow established patterns
