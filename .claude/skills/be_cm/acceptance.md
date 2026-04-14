# Acceptance Checklist: Contract Management (CM)

Use this checklist to verify compliance with CM module standards.

## Service Usage

- [ ] Contract operations use `ContractService`
- [ ] Partner operations use `PartnerService`

## Entity Access

- [ ] Contract retrieval uses `ContractAccess` pattern
- [ ] Authorization check is performed via `access.checkAccess()`
- [ ] Entity is obtained via `access.getEntity()`

## Best Practices

- [ ] Contract status is not modified directly
- [ ] Authorization checks are not bypassed
- [ ] Contracts are not created without `ContractType`
- [ ] Status transitions are handled properly
