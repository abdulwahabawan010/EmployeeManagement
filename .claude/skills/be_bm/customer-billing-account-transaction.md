# Customer Billing Account Transaction

This document provides detailed guidance on the `CustomerBillingAccountTransaction` entity and the `BmCustomerAccountTransactionService`, including reference fields, transaction lifecycle, and API usage.

## Entity Overview

**Entity Name:** `bmCustomerBillingAccountTransaction`
**Package:** `com.mvs.backend.bm.model`
**Service:** `BmCustomerAccountTransactionService`

A `CustomerBillingAccountTransaction` represents a financial transaction on a customer's billing account. It tracks credits (payments received) and debits (charges) with their status, amount, and various reference links to source systems.

## Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Primary key |
| `billingRun` | BillingRun | The billing run that created this transaction |
| `customer` | Customer | The customer this transaction belongs to |
| `billingAccount` | CustomerBillingAccount | The billing account for this transaction |
| `transactionDirection` | BillingTransactionDirection | CREDIT (0) or DEBIT (1) |
| `transactionType` | CustomerBillingTransactionType | Type classification of transaction |
| `status` | CustomerBillingTransactionStatus | ACTIVE, PENDING, or CANCELLED |
| `valutaDate` | LocalDate | Value date of the transaction |
| `amount` | BigDecimal | Transaction amount (always positive) |
| `currency` | Currency | Transaction currency |
| `creditPaymentMethod` | PaymentMethod | How credit was received (SEPA, SELF, etc.) |
| `cancellationReason` | CustomerBillingTransactionCancellationReason | Reason if cancelled |

## Reference Fields (ref*)

The transaction entity contains several reference fields that link to related entities. These are crucial for understanding the origin and context of each transaction.

### refContractPaymentPlanned

**Type:** `ContractPaymentPlanned`
**Relationship:** ManyToOne
**Purpose:** Links to a planned contract payment that generated this transaction.

**Contains:**
- `id` - Payment planned ID
- `startDate` - Period start date
- `endDate` - Period end date
- `contract` - The contract reference, which provides:
  - `contractIdentifier` - Contract number (VSNR)
  - `startDate` / `endDate` - Contract validity period
  - `partner` - Insurance partner (company name)
  - `contractType` - Type of contract

**Use Case:** When a billing run processes contract payments, each generated transaction references the `ContractPaymentPlanned` that defined the expected payment.

### refSepa

**Type:** `CustomerBillingAccountTransactionSepa`
**Relationship:** OneToOne (with CascadeType.ALL)
**Purpose:** Contains SEPA Direct Debit information when the transaction was created via SEPA collection.

**Contains:**
- `id` - SEPA record ID
- `iban` - Bank account IBAN
- `bic` - Bank identifier code
- `accountHolderName` - Name on the bank account
- `endToEndId` - SEPA end-to-end reference
- `mandateIdentifier` - SEPA mandate reference
- `mandateDateOfSignature` - Date mandate was signed
- `status` - PaymentSepaDirectDebitStatus (PREPARED, PROCESSED, FAILED)
- `sequenceType` - FRST, RCUR, OOFF, FNAL
- `paymentInfId` - Payment information ID

**Use Case:** When a SEPA Direct Debit is initiated, a transaction is created with `status=PENDING` and linked `refSepa`. When the bank confirms collection, status changes to `ACTIVE`.

### refCreditorBankAccountTransaction

**Type:** `CreditorBankAccountTransaction`
**Relationship:** ManyToOne
**Purpose:** Links to an incoming bank transaction (from CAMT import) that was allocated to this customer transaction.

**Contains:**
- `id` - Creditor transaction ID
- `creditorBankAccount` - The bank account receiving the payment
- `valueDate` - Bank value date
- `amount` / `currency` - Payment amount
- `chargesAndTaxAmount` / `chargesAndTaxCurrency` - Bank charges
- `endToEndId` - SEPA end-to-end reference
- `creditorIban` - Receiving IBAN
- `debtorIban` - Sending IBAN
- `debtorName` - Name of sender
- `mandateId` - SEPA mandate reference
- `remittanceUnstructured` - Payment reference text

**Use Case:** When a bank statement (CAMT) is imported and payments are allocated, this reference connects the customer transaction to the original bank entry.

### refChainedTransaction

**Type:** `CustomerBillingAccountTransaction`
**Relationship:** ManyToOne (self-reference)
**Purpose:** Links to a previous transaction when a transaction is cancelled and replaced, or when transactions are related.

**Contains:**
- `id` - Original transaction ID
- `transactionType.name` - Type of the original transaction
- `valutaDate` - Date of the original transaction
- `amount` / `currency` - Original amount

**Use Case:**
1. **Cancellation with replacement:** When a SEPA debit fails and a new credit transaction is created, the new one links to the original via `refChainedTransaction`.
2. **Charge separation:** When bank charges are separated from the main transaction, they may reference the main transaction.

## Transaction Status Lifecycle

```
PENDING ────────────────> ACTIVE
    │                        │
    │                        │
    └───────> CANCELLED <────┘
```

- **PENDING:** Transaction is prepared but not yet confirmed (e.g., SEPA Direct Debit initiated but not processed)
- **ACTIVE:** Transaction is confirmed and affects the account balance
- **CANCELLED:** Transaction was cancelled and no longer affects the balance

## Service Methods

### getTransactionsWithBalance

Fetches transactions with calculated running balance, supporting bi-directional pagination.

```java
TransactionListResult getTransactionsWithBalance(
    Long billingAccountId,
    boolean ascending,
    int pageSize,
    @Nullable Long anchorTransactionId,
    @Nullable String loadDirection,
    boolean includeDetails
)
```

**Parameters:**
- `billingAccountId` - The billing account ID
- `ascending` - Sort direction (true = oldest first)
- `pageSize` - Number of transactions per page
- `anchorTransactionId` - Optional transaction to paginate from
- `loadDirection` - "older", "newer", or "both" (relative to anchor)
- `includeDetails` - Whether to fetch and include ref* entity details

**Returns:** `TransactionListResult` record containing:
- `transactions` - List of `TransactionWithBalanceData`
- `hasOlder` / `hasNewer` - Pagination flags
- `oldestTransactionId` / `newestTransactionId` - Boundary IDs
- `currentBalance` - Current account balance
- `currency` - Account currency
- `totalTransactionCount` - Total transactions in account

### createFromCreditorTransaction

Creates customer transactions from an incoming creditor bank transaction.

```java
List<CustomerBillingAccountTransaction> createFromCreditorTransaction(
    BmTransactionAssignmentRuntime runtime,
    CreditorBankAccountTransaction creditorTransaction,
    CustomerBillingAccount customerBillingAccount,
    @Nullable CustomerBillingAccountTransaction referenceCustomerTransaction,
    BmCreditorBankAccountTransactionStatus newCreditorTransactionStatus,
    CustomerBillingAccountTransactionAssignmentSource assignmentSource,
    CustomerBillingAccountTransactionAssignmentRating assignmentRating,
    @Nullable CustomerBillingTransactionType predefinedTransactionType
)
```

This method:
1. Determines transaction direction from creditor transaction
2. Derives transaction type from billing run configuration
3. Creates transaction(s) with appropriate references
4. Handles charge separation when applicable
5. Updates creditor transaction status
6. Triggers SEPA return processing for debits

### createTransientTransaction

Creates a transaction entity without persisting it (useful for batch operations).

```java
CustomerBillingAccountTransaction createTransientTransaction(
    CustomerBillingAccount billingAccount,
    BillingRun billingRun,
    BillingTransactionDirection transactionDirection,
    CustomerBillingTransactionType transactionType,
    LocalDate valutaDate,
    BigDecimal amount,
    Currency currency,
    @Nullable ContractPaymentPlanned refContractPaymentPlanned
)
```

## REST API Endpoint

### POST /mvsa/bm/customerBillingAccountTransactions/withBalance

Request body:
```json
{
  "billingAccountId": 123,
  "direction": "asc",
  "pageSize": 20,
  "anchorTransactionId": null,
  "loadDirection": null,
  "includeDetails": true
}
```

Response:
```json
{
  "transactions": [
    {
      "id": 456,
      "valutaDate": "2024-01-15",
      "transactionDirection": "CREDIT",
      "status": "ACTIVE",
      "amount": 100.00,
      "currency": "EUR",
      "transactionTypeName": "Vertragszahlung",
      "transactionTypeId": 1,
      "runningBalance": 250.00,
      "refSepaId": null,
      "refCreditorBankAccountTransactionId": 789,
      "billingRunId": 10,
      "refContractPaymentPlannedId": 555,
      "refChainedTransactionId": null,
      "detail": {
        "contractPaymentPlanned": {
          "id": 555,
          "startDate": "2024-01-01",
          "endDate": "2024-01-31",
          "contractId": 100,
          "contractIdentifier": "VS-12345",
          "partnerName": "Allianz",
          "contractTypeName": "Haftpflicht"
        },
        "creditorBankAccountTransaction": {
          "id": 789,
          "creditorBankAccountName": "Hauptkonto",
          "valueDate": "2024-01-15",
          "amount": 100.00,
          "debtorName": "Max Mustermann",
          "debtorIban": "DE89370400440532013000"
        }
      }
    }
  ],
  "hasOlder": true,
  "hasNewer": false,
  "oldestTransactionId": 456,
  "newestTransactionId": 456,
  "currentBalance": 250.00,
  "currency": "EUR",
  "totalTransactionCount": 42
}
```

## Running Balance Calculation

The running balance is calculated chronologically from the earliest transaction:

1. Transactions are sorted by `valutaDate` and `id`
2. Balance before the result set is calculated via aggregate query
3. Each transaction is applied:
   - CREDIT: `balance += amount`
   - DEBIT: `balance -= amount`
4. Only ACTIVE and PENDING transactions are included

## Best Practices

### DO:
- Always use `getTransactionsWithBalance` for displaying transaction history with balances
- Set `includeDetails=true` only when the UI needs to display reference information
- Use pagination to avoid loading all transactions at once
- Check transaction status before performing operations

### DON'T:
- Don't modify transaction status directly - use `cancelTransaction()` or `reduceTransaction()`
- Don't calculate balances manually - always use the service method
- Don't skip access checks - the controller validates access before calling service methods
- Don't persist transactions created with `createTransientTransaction` without proper validation
