# Acceptance Checklist: Billing Management (BM)

Use this checklist to verify compliance with BM module standards.

## Service Usage

- [ ] Billing run management uses `BmBillingService`
- [ ] SEPA file operations use `BmSepaService`
- [ ] Payment allocation uses `BmPaymentAllocateService`

## SEPA Compliance

- [ ] SEPA files are validated before processing
- [ ] SEPA files are not parsed manually
- [ ] Correct SEPA version is used (PAIN 008 for Direct Debit, CAMT for Bank Statement)

## Billing Run Lifecycle

- [ ] Billing run status transitions follow proper lifecycle
- [ ] Billing run status is not modified directly
- [ ] Lifecycle: NEW -> IN_GENERATION -> GENERATED -> IN_INVOICING -> INVOICED -> ...

## Best Practices

- [ ] `BillingRunService` is used for billing run management
- [ ] SEPA file validation is not skipped
- [ ] Proper status transitions are followed
