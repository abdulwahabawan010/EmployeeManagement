---
name: be_bm
description: "Backend: Expert guidance on Billing Management (BM) module including billing runs, SEPA integration, payment processing, reminders, and transactions. Use when working with billing, invoices, SEPA, payments, reminders, or transactions."
---

# BM (Billing Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/bm/documentation.md`

## When to Use This Skill

Use when:
- Working with billing
- Managing invoices
- Implementing SEPA
- Handling payments
- Managing reminders
- Processing transactions

## Core Entities

- **BillingRun** (`bmBillingRun`) - Billing cycle
- **BillingRunType** (`bmBillingRunType`) - Configuration
- **CustomerBillingAccount** (`bmCustomerBillingAccount`) - Payment mandate
- **CustomerBillingAccountTransaction** (`bmCustomerBillingAccountTransaction`) - Customer transaction with running balance
- **CustomerBillingAccountTransactionSepa** (`bmCustomerBillingAccountTransactionSepa`) - SEPA reference data (mandateId, endToEndId)
- **ContractPaymentPlanned** (`bmContractPaymentPlanned`) - Planned payment
- **PaymentSepaTransaction** (`bmPaymentSepaTransaction`) - SEPA transaction
- **CreditorBankAccount** (`bmCreditorBankAccount`) - Company bank account
- **CreditorBankAccountTransaction** (`bmCreditorBankAccountTransaction`) - Incoming bank transaction
- **CreditorBankAccountImport** (`bmCreditorBankAccountImport`) - CAMT import batch
- **CustomerIbanHistory** (`bmCustomerIbanHistory`) - Historical IBAN-to-account mappings
- **CustomerStandingOrderHistory** (`bmCustomerStandingOrderHistory`) - Standing order patterns

## Detailed Documentation

- [Customer Billing Account Transaction](customer-billing-account-transaction.md) - Complete guide to transactions, reference fields (refSepa, refContractPaymentPlanned, refCreditorBankAccountTransaction, refChainedTransaction), running balance calculation, and API usage
- [Creditor Bank Account Transaction Assignment](../../../backend/src/main/java/com/mvs/backend/bm/services/assignment/README.md) - Automatic payment matching and assignment system

## SEPA Support

- **PAIN 008** (Direct Debit): v2.02, v3.02, v8.00-v8.08
- **CAMT** (Bank Statement): ISO 20022 compliant

## Key Services

### BmBillingService
```java
BillingRun createBillingRun(BillingRunType, LocalDate startDate)
void generatePayments(BillingRun)
void processInvoicing(BillingRun)
```

### BmSepaService
```java
SepaDocument parseSepaFile(byte[] content)
void validateSepaFile(SepaDocument)
byte[] generateSepaDirectDebitFile(BillingRun)
```

### BmPaymentAllocateService
```java
AllocationResult allocatePayment(CreditorBankAccountTransaction)
void autoAllocatePayments(List<CreditorBankAccountTransaction>)
```

### BmCreditorBankAccountTransactionAssignmentService
Automatic payment assignment using multiple strategies.

```java
// Find potential matches for a transaction
AssignSearchResult assignTransaction(CreditorBankAccountTransaction transaction)

// Auto-assign if perfect match found
List<CustomerBillingAccountTransaction> autoAssignTransaction(
    BmTransactionAssignmentRuntime runtime,
    CreditorBankAccountTransaction transaction)
```

**Assignment Strategies (Priority Order):**
1. `EndToEndId` - SEPA unique ID (PERFECT match)
2. `MandateId` - SEPA mandate (PERFECT/VERY_GOOD)
3. `Standing Order History` - Historical pattern (VERY_GOOD)
4. `Remittance Text` - Full-text search (GOOD/POOR)
5. `IBAN History` - Previous payments (varies)
6. `Customer Bank Account` - Registered IBAN (varies)

**Assignment Ratings:**
- `PERFECT` - Auto-assignable
- `VERY_GOOD` - Auto-assignable (single match)
- `GOOD` - Manual review recommended
- `POOR` - Low confidence
- `GUESS` - Very low confidence

### BmCreditorBankAccountTransactionService
Orchestrates batch transaction processing.

```java
// Batch process transactions for auto-assignment
void autoAssignTransactions(
    BmTransactionAssignmentRuntime runtime,
    Set<Long> transactionIds)

// Determine transaction type from bank codes
CreditorBankAccountCreditTransactionType deriveTransactionType(
    CreditorBankAccountTransaction transaction)
```

### BmCustomerAccountTransactionService
```java
TransactionListResult getTransactionsWithBalance(Long billingAccountId, boolean ascending, int pageSize, Long anchorTransactionId, String loadDirection, boolean includeDetails)
List<CustomerBillingAccountTransaction> createFromCreditorTransaction(BmTransactionAssignmentRuntime, CreditorBankAccountTransaction, CustomerBillingAccount, ...)
void cancelTransaction(CustomerBillingAccountTransaction, CustomerBillingTransactionCancellationReason)
```

## Assignment Result Classes

**Package:** `com.mvs.backend.bm.services.assignment`

| Class | Description |
|-------|-------------|
| `AssignSearchResult` | Container for search results with source tracking |
| `EntityAndRating<T>` | Base class for entity-rating pairs |
| `CustomerAndRating` | Customer with assignment rating |
| `CustomerBillingAccountAndRating` | Billing account with rating |
| `CustomerBillingAccountTransactionAndRating` | SEPA transaction with rating |
| `ObjectAndRating` | Generic object ID with search rating |
| `ObjectsAndRatings` | Collection with deduplication logic |

## Billing Run Lifecycle

```
NEW → IN_GENERATION → GENERATED → IN_INVOICING → INVOICED
    → IN_SEPA_DIRECT_DEBIT → SEPA_DIRECT_DEBIT_COMPLETED → COMPLETED
```

## Best Practices

### DO:
- Use BillingRunService for billing run management
- Use BmSepaService for all SEPA file operations
- Process billing runs through proper status transitions

### DON'T:
- Don't modify billing run status directly
- Don't parse SEPA files manually
- Don't skip SEPA file validation

## Primary Entry Point
`BmBillingService` for billing, `BmSepaService` for SEPA

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)