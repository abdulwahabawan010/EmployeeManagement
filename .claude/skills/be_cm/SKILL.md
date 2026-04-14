---
name: be_cm
description: "Backend: Expert guidance on Contract Management (CM) module including contract lifecycle, pricing, partners, products, and agent assignments. Use when working with contracts, contract types, pricing, partners, or contract lifecycle."
---

# CM (Contract Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/cm/documentation.md`

## When to Use This Skill

Use when:
- Working with contracts
- Managing contract types
- Implementing pricing
- Handling partners
- Managing contract lifecycle

## Core Entities

- **Contract** (`cmContract`) - Main contract entity
- **ContractType** (`cmContractType`) - Type configuration
- **ContractPrice** (`cmContractPrice`) - Pricing structure
- **Partner** (`cmPartner`) - Partner/organization
- **ContractPartner** (`cmContractPartner`) - Contract-partner link
- **Product** (`cmProduct`) - Product configuration

## Key Services

### ContractService
```java
Contract getContractById(Long id)
List<DmDocumentAssignment> getContractDocuments(Contract)
ContractAmountTypeRuntime getContractAmountRuntime(Contract)
```

### PartnerService
```java
Partner createPartner(PartnerCreateConfiguration config)
Optional<Partner> getPartnerById(Long id)
List<Partner> getActivePartners()
```

## Access Pattern

```java
@Autowired GenericObjectService genericObjectService;

ContractAccess access = genericObjectService.getObjectAccess(
    contractId, ContractAccess.class
);
access.checkAccess(AuthObjectAccessEnum.read);
Contract contract = access.getEntity();
```

## Best Practices

### DO:
- Use ContractAccess for contract retrieval
- Use services for all contract operations
- Handle contract status transitions properly

### DON'T:
- Don't modify contract status directly
- Don't bypass authorization checks
- Don't create contracts without ContractType

## Primary Entry Point
`ContractService` for contracts, `PartnerService` for partners

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
