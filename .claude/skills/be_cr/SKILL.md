---
name: be_cr
description: "Backend: Expert guidance on Customer Relationship (CR) module including customer lifecycle, profiles, interactions, onboarding, assessments, and bank accounts. Use when working with customers, customer types, profiles, assessments, or bank accounts."
---

# CR (Customer) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/cr/documentation.md`

## When to Use This Skill

Use when:
- Working with customers
- Managing customer types
- Implementing profiles
- Handling assessments
- Managing bank accounts

## Core Entities

- **Customer** (`crCustomer`) - Central customer entity
- **CustomerType** (`crCustomerType`) - Classification
- **CustomerContact** (`crCustomerContact`) - Contact links
- **CustomerBankAccount** (`crCustomerBankAccount`) - Bank account
- **CustomerInteraction** (`crCustomerInteraction`) - Interaction log
- **CustomerOnboarding** (`crCustomerOnboarding`) - Onboarding workflow

## Key Services

### CustomerService
```java
Optional<Customer> getCustomerById(Long id)
Customer createCustomer(CustomerCreateRequest)
String deriveCustomerName(Customer)
```

### CustomerAssessmentService
```java
AssessmentResult runAssessment(Customer, AssessmentGroup)
List<AssessmentGroupCheck> getFailedChecks(Customer)
```

### CustomerProfileService
```java
ProfileCheckResult checkProfile(Customer)
BigDecimal getCompletenessScore(Customer)
```

### CustomerDeletionService
```java
void deleteCustomer(Customer)  // Handles 30+ dependent entities
```

## Access Pattern

```java
CustomerAccess access = genericObjectService.getObjectAccess(
    customerId, CustomerAccess.class
);
access.checkAccess(AuthObjectAccessEnum.read);
Customer customer = access.getEntity();
```

## Best Practices

### DO:
- Use CustomerAccess for customer retrieval
- Use CustomerDeletionService for safe deletion
- Use CustomerAssessmentService for assessment

### DON'T:
- Don't delete customers without CustomerDeletionService
- Don't bypass assessment checks
- Don't create customers without CustomerType

## Primary Entry Point
`CustomerService` for customer operations

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
