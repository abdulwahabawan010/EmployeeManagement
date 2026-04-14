# Entity Registry Skill

## Purpose

This skill provides a centralized registry of all backend entities, their relationships, and fields. It enables validation of entity names and join names when writing QL queries.

## When to Use

Use this skill when:
- Writing QL queries that reference entities
- Validating entity names in `start.name` property
- Validating join names in `joins[].name` property (direct relationships)
- Looking up reverse relationships for OneToMany joins (`module.Entity#attributeName` format)
- Looking up available relationships for an entity
- Understanding the data model structure

## Registry Files

The registry data is located in `.claude/skills/fe_core_entity_registry/data/`:

| File | Format | Purpose |
|------|--------|---------|
| `entity-registry.json` | JSON | Machine-readable registry for programmatic lookup |
| `entity-registry.md` | Markdown | Human-readable documentation with all entities and relationships |

## How to Use the Registry

### 1. Validate Entity Names

When writing QL queries, the `start.name` property must match a valid entity from the registry.

```typescript
// Lookup in entity-registry.json: entities["bm.Invoice"]
start: {
  type: 'entity',
  name: 'bm.Invoice',  // Must exist in registry
  as: 'e'
}
```

**Entity Name Format:** `{moduleCode}.{ClassName}`

Examples:
- `bm.Invoice` - Billing Management Invoice
- `cr.Customer` - Customer Relationship Customer
- `tm.Ticket` - Ticket Management Ticket

### 2. Validate Join Names

When defining joins, the `name` property must match a relationship field from the source entity.

```typescript
// Lookup in entity-registry.json: entities["bm.Invoice"].relationships
joins: [
  {
    type: 'entity',
    name: 'customer',  // Must be a relationship field on Invoice
    as: 'c',
    joinType: 'left'
  }
]
```

**Join Name:** The relationship field name (e.g., `customer`, `contract`, `assignedUser`)

### 3. Look Up Available Relationships

Before writing joins, check the entity's relationships in the registry:

```json
// From entity-registry.json
"bm.Invoice": {
  "relationships": [
    { "joinName": "customer", "targetEntity": "Customer", "type": "ManyToOne" },
    { "joinName": "billingRun", "targetEntity": "BillingRun", "type": "ManyToOne" }
  ]
}
```

### 4. Look Up Reverse Relationships (OneToMany)

The registry also includes **reverse relationships** - entities that point TO the current entity. These are derived by scanning all entities to find which have ManyToOne/OneToOne relationships pointing back.

The naming format is based on `MetaService.deriveJoins()`:
```java
join.setName(type.getAlias() + "#" + attribute.getName());
```

```json
// From entity-registry.json
"bm.CustomerBillingAccount": {
  "relationships": [...],
  "reverseRelationships": [
    {
      "qlJoinName": "bm.CustomerBillingAccountBalance#customerBillingAccount",
      "sourceEntity": "CustomerBillingAccountBalance",
      "sourceEntityQlName": "bm.CustomerBillingAccountBalance",
      "sourceAttribute": "customerBillingAccount",
      "type": "OneToMany"
    }
  ]
}
```

**Using Reverse Joins in QL:**

```typescript
// Join from CustomerBillingAccount to its balances (OneToMany)
joins: [
  {
    type: 'entity',
    name: 'bm.CustomerBillingAccountBalance#customerBillingAccount',  // Format: module.Entity#attributeName
    as: 'bal',
    joinType: 'left',
    onlyFirst: true  // Often needed for OneToMany to get single record
  }
]
```

**Reverse Join Name Format:**
- Pattern: `{sourceModule}.{SourceEntity}#{attributeOnSourcePointingToTarget}`
- `qlJoinName`: The exact value to use in `joins[].name`
- `sourceEntity`: The entity class that points to this entity
- `sourceAttribute`: The field name on the source entity that creates this relationship

## Updating the Registry

When backend entities change, regenerate the registry:

```bash
cd .claude/skills/fe_core_entity_registry/scripts
node generate-entity-registry.js
```

### Command Options

```bash
node generate-entity-registry.js [options]

Options:
  --backend-path <path>  Path to backend source (default: backend/src/main/java/com/mvs/backend)
  --output-dir <path>    Output directory (default: ../data)
  --help, -h             Show help
```

## Integration with fe_core_ql

This skill complements the `fe_core_ql` skill by providing the data model reference needed for:

1. **Entity Validation:** Ensure `start.name` uses valid entity names
2. **Join Validation:** Ensure `joins[].name` uses valid relationship names
3. **Field Validation:** Ensure filter/sort fields exist on the entity

### Validation Flow

```
1. Read QL query being written
2. Look up entity in registry: entities[entityName]
3. For each join:
   - If join name contains "#" → it's a reverse join, check reverseRelationships for qlJoinName
   - Otherwise → check relationships for joinName
4. For FK fields in filters:
   - Verify field exists on entity or joined entity
```

## Common Module Codes

| Code | Module Name |
|------|-------------|
| am | Agent Management |
| as | Appointment Scheduling |
| bd | Billing Dunning |
| bm | Billing Management |
| cc | Core Configuration |
| cm | Contract Management |
| cr | Customer Relationship |
| dm | Document Management |
| ns | Notification System |
| tm | Ticket Management |
| um | User Management |
| wf | Workflow Engine |

## Example Usage

### Looking Up Entity for QL Query

**Task:** Write a QL query for invoices

1. Open `entity-registry.md`
2. Find "Invoice" under BM module
3. Note QL name: `bm.Invoice`
4. Note relationships: `customer`, `billingRun`, etc.

```typescript
const query: QlQueryDto = {
  name: 'invoices',
  type: 'view',
  start: {
    type: 'entity',
    name: 'bm.Invoice',  // From registry
    as: 'e'
  },
  joins: [
    {
      type: 'entity',
      name: 'customer',  // From registry relationships
      as: 'c',
      joinType: 'left'
    }
  ]
};
```

### Verifying Join Chain

**Task:** Join from Invoice → Customer → Person

1. Look up `bm.Invoice` relationships → has `customer`
2. Look up `cr.Customer` relationships → has `person`
3. Build nested join:

```typescript
joins: [
  {
    type: 'entity',
    name: 'customer',
    as: 'c',
    joinType: 'left',
    joins: [
      {
        type: 'entity',
        name: 'person',
        as: 'p',
        joinType: 'left'
      }
    ]
  }
]
```

### Using Reverse Relationships

**Task:** Get CustomerBillingAccount with its latest balance (OneToMany relationship)

1. Look up `bm.CustomerBillingAccount` in registry
2. Check `reverseRelationships` array → find `bm.CustomerBillingAccountBalance#customerBillingAccount`
3. Build join using `qlJoinName`:

```typescript
const query: QlQueryDto = {
  name: 'accountsWithBalance',
  type: 'view',
  start: {
    type: 'entity',
    name: 'bm.CustomerBillingAccount',
    as: 'e'
  },
  joins: [
    {
      type: 'entity',
      name: 'bm.CustomerBillingAccountBalance#customerBillingAccount',  // From reverseRelationships.qlJoinName
      as: 'bal',
      joinType: 'left',
      onlyFirst: true  // Get only the first/latest balance
    }
  ],
  fields: [
    { name: 'id' },
    { name: 'bal.balance' },
    { name: 'bal.validFrom' }
  ]
};
```

**When to use reverse joins:**
- Fetching child records (balances, transactions, history)
- Getting aggregated data from related entities
- Building parent → children queries

## Troubleshooting

### Entity Not Found

If an entity name isn't in the registry:
1. Check spelling and case
2. Verify module code is correct
3. Regenerate registry if entity was recently added

### Join Name Not Found

If a relationship isn't in the registry:
1. Check the source entity's relationships list
2. Use the field name, not the target entity name
3. Regenerate registry if relationship was recently added

### Reverse Relationship Not Found

If a reverse relationship (OneToMany) isn't in the registry:
1. Check the `reverseRelationships` array on the target entity
2. Verify the correct format: `module.Entity#attributeName`
3. Ensure the source entity has a ManyToOne/OneToOne pointing to this entity
4. Regenerate registry if the relationship was recently added

**Common mistakes:**
```typescript
// ❌ WRONG - Using ../EntityName format (this is NOT correct)
name: '../CustomerBillingAccountBalance'

// ❌ WRONG - Missing the attribute name
name: 'bm.CustomerBillingAccountBalance'

// ✅ CORRECT - Full format: module.Entity#attributeName
name: 'bm.CustomerBillingAccountBalance#customerBillingAccount'
```

### Registry Out of Date

Symptoms:
- New entities not found
- Missing relationships
- Outdated field lists

Solution:
```bash
node .claude/skills/fe_core_entity_registry/scripts/generate-entity-registry.js
```