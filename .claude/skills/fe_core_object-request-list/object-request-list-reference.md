# Object Request List - Complete Reference

## Table of Contents

1. [Purpose](#purpose)
2. [Core Concept](#core-concept)
3. [Main Building Blocks](#main-building-blocks)
4. [Mandatory Rules](#mandatory-rules)
5. [Examples](#examples)
6. [Anti-Patterns](#anti-patterns)

---

## Purpose

Object Request List is a declarative, type-safe request model used to retrieve entity data from backend **entity-specific endpoints**.

It allows consumers to define **filters, sorting, pagination, attribute selection, and relationship traversal** without manually composing REST calls or chaining multiple requests.

**The core idea is simple: describe what data is required, not how it is fetched.**

---

## Core Concept

An Object Request List always targets a **known entity**, because it is executed via an entity service (e.g. `customerService.list(...)`).

It consists of:
- Base request (filters, sorting, paging, template options)
- Optional automatic resolution (ObjectRequestSimple)
- Optional explicit relationship traversal (ObjectRequestComplex)

The backend uses **entity metadata** to resolve relationships and return a structured DTO result.

---

## Main Building Blocks

### ObjectRequestList

Defines the complete list request.

**Responsibilities:**
- Filtering (`FilterCriteria`)
- Sorting (`Sorting`)
- Pagination (`PagingDto`)
- Template / form metadata inclusion
- Attribute selection
- Optional simple or complex relationship resolution

**Basic Creation:**
```ts
const request = ObjectRequestList.createBasic(
  includeTemplate: boolean,
  filters: FilterCriteria[],
  sortings: Sorting[]
);
```

**With Pagination:**
```ts
request.pagingDto = new PagingDto(pageIndex, pageSize);
```

---

### ObjectRequestSimple

Automatic relationship resolution.

**Use when:**
- Basic M:1 or 1:1 relations are sufficient
- You do not need to control which relations are fetched
- You want fast prototyping

**Key characteristics:**
- Backend decides which relations to resolve
- Resolution depth is configurable
- Less control, more convenience

**Example:**
```ts
const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestSimple = new ObjectRequestSimple();
request.objectRequestSimple.resolveDepth = 2;
```

---

### ObjectRequestComplex

Explicit relationship definition.

**Use when:**
- Performance matters
- Only specific relations should be fetched
- Deep or nested relations are required
- Filters or sorting must be applied to related entities
- Backend-calculated (virtual) joins are required

ObjectRequestComplex is built as a **tree of nodes**.

**Creation:**
```ts
const complex = ObjectRequestComplex.build(
  includeAttributes: boolean,
  includeDtoId: boolean,
  ...nodes: ObjectRequestComplexNode[]
);
```

**Example:**
```ts
const complex = ObjectRequestComplex.build(
  true,  // include attributes
  false, // exclude DTO ID
  ObjectRequestComplexNode.createSimpleAttributeNode('customer'),
  ObjectRequestComplexNode.createRelationNode(
    'addresses',
    ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
  )
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;
```

---

### ObjectRequestComplexNode

Defines a single node in the relationship tree.

**Two node types exist:**

#### Simple Attribute Node (M:1 / 1:1)

Fetches a single related entity. Automatically appends `Dto` suffix to result property.

**Creation:**
```ts
ObjectRequestComplexNode.createSimpleAttributeNode('customerDetail')
// result property: customerDetailDto
```

**With Nested Nodes:**
```ts
const customerNode = ObjectRequestComplexNode.createSimpleAttributeNode('customer');
customerNode.addNodes(
  ObjectRequestComplexNode.createSimpleAttributeNode('person')
);
```

#### Relation Node (1:N)

Fetches a collection of related entities. Requires an explicit relation definition.

**Creation:**
```ts
ObjectRequestComplexNode.createRelationNode(
  relationshipName: string,
  relation: ObjectRequestRelation
)
```

**Example:**
```ts
const addressesNode = ObjectRequestComplexNode.createRelationNode(
  'addresses',
  ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
);
```

**With Filters:**
```ts
const addressesNode = ObjectRequestComplexNode.createRelationNode(
  'addresses',
  ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
);
addressesNode.filters = [
  FilterCriteria.create('type', FilterCriteria.cOperatorEqual, 'BILLING')
];
```

**Nodes can be nested using `.addNodes(...)`:**
```ts
const customerNode = ObjectRequestComplexNode.createSimpleAttributeNode('customer');
customerNode.addNodes(
  ObjectRequestComplexNode.createSimpleAttributeNode('person'),
  ObjectRequestComplexNode.createRelationNode(
    'addresses',
    ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
  )
);
```

---

### ObjectRequestRelation

Defines how related entities are joined.

**Supported strategies:**

#### Simple Join (M:1 / 1:1)
```ts
ObjectRequestRelation.createSimple()
```

#### List Join (1:N, ALL)
```ts
ObjectRequestRelation.createList(
  entityName: string,      // e.g., 'cr.CustomerAddress'
  foreignKeyAttribute: string  // e.g., 'customer'
)
```

#### Latest / Earliest / Any Binding
```ts
ObjectRequestRelation.createLatest(entityName, foreignKeyAttribute, sortField)
ObjectRequestRelation.createEarliest(entityName, foreignKeyAttribute, sortField)
ObjectRequestRelation.createAny(entityName, foreignKeyAttribute)
```

#### Backend-Calculated Joins

Use `+` prefix for virtual/calculated joins:
```ts
ObjectRequestComplexNode.createRelationNode(
  '+calculatedField',
  ObjectRequestRelation.createList('cr.SomeEntity', 'reference')
)
```

---

## Mandatory Rules

### General Rules

- ObjectRequestList MUST be used with entity services
- Do NOT manually assemble related data in frontend
- Prefer declarative requests over imperative logic

---

### Filtering Rules

**CRITICAL: This rule applies ONLY to ObjectRequestList, NOT to QL (Query Language).**

- Filters MUST be created using `FilterCriteria`
- In ObjectRequestList, foreign key filters MUST use the **relationship name**, not `Id` or `Dto`
- ObjectRequestList does NOT use alias prefixes (no `e.` prefix)

**Correct (ObjectRequestList):**
```ts
FilterCriteria.create('customer', FilterCriteria.cOperatorEqual, customerId)
FilterCriteria.create('enabled', FilterCriteria.cOperatorEqual, true)
FilterCriteria.create('name', FilterCriteria.cOperatorContainsPattern, 'Smith')
```

**Wrong (ObjectRequestList):**
```ts
FilterCriteria.create('customerId', ...)      // Missing relationship name
FilterCriteria.create('customerDtoId', ...)   // Wrong suffix
FilterCriteria.create('e.customer', ...)      // Wrong alias usage
```

> **Note:** QL (Query Language) uses a DIFFERENT convention. See the QL skill documentation for QL-specific filtering rules.

**Common Filter Operators:**
- `FilterCriteria.cOperatorEqual` – Exact match
- `FilterCriteria.cOperatorNotEqual` – Not equal
- `FilterCriteria.cOperatorContainsPattern` – String contains
- `FilterCriteria.cOperatorGreaterThan` – Greater than
- `FilterCriteria.cOperatorLessThan` – Less than
- `FilterCriteria.cOperatorGreaterOrEqual` – Greater or equal
- `FilterCriteria.cOperatorLessOrEqual` – Less or equal
- `FilterCriteria.cOperatorIn` – Value in list
- `FilterCriteria.cOperatorIsNull` – Is null
- `FilterCriteria.cOperatorIsNotNull` – Is not null

---

### Sorting Rules

- Sorting MUST use `new Sorting(field, ascending)`
- Sorting applies independently to main and related entities

**Examples:**
```ts
// Main entity sorting
new Sorting('name', true)          // Ascending A-Z
new Sorting('createdDate', false)  // Descending (newest first)

// Multiple sorting
[
  new Sorting('priority', false),
  new Sorting('createdDate', false)
]

// Sorting on related entity (in node)
addressesNode.sortings = [
  new Sorting('type', true)
];
```

---

### Pagination Rules

- Pagination is 0-based (first page = 0)
- User-facing lists MUST use paging

**Example:**
```ts
const request = ObjectRequestList.createBasic(true, filters, sortings);
request.pagingDto = new PagingDto(0, 20);  // Page 0, 20 items per page

customerService.list(request).subscribe(result => {
  const data = result.entries;
  const totalCount = result.totalCount;
  const totalPages = Math.ceil(totalCount / 20);
});
```

---

### Relationship Rules

- Use Simple Attribute Nodes for M:1 / 1:1
- Use Relation Nodes for 1:N
- Use binding strategies when ALL records are not required
- Keep nesting depth reasonable (max ~3–4 levels)

**Guidelines:**

| Relationship | Use | Example |
|-------------|-----|---------|
| M:1 (Customer → Person) | Simple Attribute Node | `createSimpleAttributeNode('person')` |
| 1:1 (Customer → Detail) | Simple Attribute Node | `createSimpleAttributeNode('customerDetail')` |
| 1:N (Customer → Addresses) | Relation Node | `createRelationNode('addresses', createList(...))` |
| 1:N with filter | Relation Node + filters | Add `node.filters = [...]` |
| Latest record only | Latest binding | `createLatest(...)` |

---

## Examples

### Example 1: Basic List with Filters

```ts
const filters = [
  FilterCriteria.create('enabled', FilterCriteria.cOperatorEqual, true),
  FilterCriteria.create('name', FilterCriteria.cOperatorContainsPattern, 'Smith')
];

const sortings = [
  new Sorting('name', true)
];

const request = ObjectRequestList.createBasic(true, filters, sortings);

customerService.list(request).subscribe(result => {
  console.log(result.entries);
});
```

---

### Example 2: List with Pagination

```ts
const pageIndex = 0;
const pageSize = 20;

const request = ObjectRequestList.createBasic(
  true,
  [FilterCriteria.create('enabled', FilterCriteria.cOperatorEqual, true)],
  [new Sorting('createdDate', false)]
);

request.pagingDto = new PagingDto(pageIndex, pageSize);

customerService.list(request).subscribe(result => {
  const customers = result.entries;
  const totalCount = result.totalCount;
  console.log(`Page ${pageIndex + 1}, showing ${customers.length} of ${totalCount} total`);
});
```

---

### Example 3: Filter by Foreign Key (Relationship Name)

```ts
const customerId = 12345;

const request = ObjectRequestList.createBasic(
  true,
  [FilterCriteria.create('customer', FilterCriteria.cOperatorEqual, customerId)],
  []
);

contractService.list(request).subscribe(result => {
  console.log(result.entries);  // All contracts for customer 12345
});
```

---

### Example 4: Simple Attribute Node (M:1)

```ts
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createSimpleAttributeNode('customer'),
  ObjectRequestComplexNode.createSimpleAttributeNode('assignedUser')
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

contractService.list(request).subscribe(result => {
  result.entries.forEach(contract => {
    console.log(`Customer: ${contract.customerDto?.name}`);
    console.log(`Assigned to: ${contract.assignedUserDto?.name}`);
  });
});
```

---

### Example 5: Relation Node (1:N)

```ts
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createRelationNode(
    'addresses',
    ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
  )
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

customerService.list(request).subscribe(result => {
  result.entries.forEach(customer => {
    console.log(`Customer: ${customer.name}`);
    customer.addresses?.forEach(address => {
      console.log(`  Address: ${address.street}, ${address.city}`);
    });
  });
});
```

---

### Example 6: Nested Relationships (3 levels)

```ts
// Customer → Person → Address
const personNode = ObjectRequestComplexNode.createSimpleAttributeNode('person');
personNode.addNodes(
  ObjectRequestComplexNode.createRelationNode(
    'addresses',
    ObjectRequestRelation.createList('cr.PersonAddress', 'person')
  )
);

const complex = ObjectRequestComplex.build(
  true,
  false,
  personNode
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

customerService.list(request).subscribe(result => {
  result.entries.forEach(customer => {
    console.log(`Customer: ${customer.name}`);
    const person = customer.personDto;
    console.log(`  Person: ${person?.name}`);
    person?.addresses?.forEach(address => {
      console.log(`    Address: ${address.street}`);
    });
  });
});
```

---

### Example 7: Filtered Relation Node

```ts
const addressesNode = ObjectRequestComplexNode.createRelationNode(
  'addresses',
  ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
);

// Filter only BILLING addresses
addressesNode.filters = [
  FilterCriteria.create('type', FilterCriteria.cOperatorEqual, 'BILLING')
];

const complex = ObjectRequestComplex.build(true, false, addressesNode);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;
```

---

### Example 8: Latest Binding (Get Most Recent)

```ts
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createRelationNode(
    'latestInvoice',
    ObjectRequestRelation.createLatest(
      'bm.Invoice',
      'customer',
      'createdDate'  // Sort field for "latest"
    )
  )
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

customerService.list(request).subscribe(result => {
  result.entries.forEach(customer => {
    console.log(`Customer: ${customer.name}`);
    console.log(`Latest invoice: ${customer.latestInvoice?.invoiceNumber}`);
  });
});
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Manual DTO Assembly

**Wrong:**
```ts
customerService.list(basicRequest).subscribe(customers => {
  customers.forEach(customer => {
    // Manually fetching related data
    personService.get(customer.personId).subscribe(person => {
      customer.person = person;
    });
  });
});
```

**Correct:**
```ts
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createSimpleAttributeNode('person')
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

customerService.list(request).subscribe(result => {
  // Data already includes person
  result.entries.forEach(customer => {
    console.log(customer.personDto?.name);
  });
});
```

---

### ❌ Anti-Pattern 2: Using Id Fields in Filters

**Wrong:**
```ts
FilterCriteria.create('customerId', FilterCriteria.cOperatorEqual, 123)
FilterCriteria.create('customerDtoId', FilterCriteria.cOperatorEqual, 123)
```

**Correct:**
```ts
FilterCriteria.create('customer', FilterCriteria.cOperatorEqual, 123)
```

---

### ❌ Anti-Pattern 3: Using RelationNode for M:1

**Wrong:**
```ts
// M:1 relationship - should use Simple Attribute Node
ObjectRequestComplexNode.createRelationNode(
  'customer',
  ObjectRequestRelation.createSimple()
)
```

**Correct:**
```ts
ObjectRequestComplexNode.createSimpleAttributeNode('customer')
```

---

### ❌ Anti-Pattern 4: Fetching Large Collections Without Paging

**Wrong:**
```ts
// No paging - could return thousands of records
const request = ObjectRequestList.createBasic(true, [], []);
customerService.list(request).subscribe(result => {
  // UI freezes with 10,000+ records
});
```

**Correct:**
```ts
const request = ObjectRequestList.createBasic(true, [], []);
request.pagingDto = new PagingDto(0, 20);
customerService.list(request).subscribe(result => {
  // Returns only 20 records at a time
});
```

---

### ❌ Anti-Pattern 5: Deep Nesting Without Justification

**Wrong:**
```ts
// 6 levels deep - performance nightmare
const level6 = ObjectRequestComplexNode.createSimpleAttributeNode('field6');
const level5 = ObjectRequestComplexNode.createSimpleAttributeNode('field5');
level5.addNodes(level6);
const level4 = ObjectRequestComplexNode.createSimpleAttributeNode('field4');
level4.addNodes(level5);
// ... continues
```

**Correct:**
```ts
// 2-3 levels max, only what's needed
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createSimpleAttributeNode('customer'),
  ObjectRequestComplexNode.createSimpleAttributeNode('assignedUser')
);
```

---

## Summary

Object Request List provides a **powerful, metadata-driven, object-oriented way** to retrieve complex entity data in a single backend call.

**When used correctly:**
- ✅ Performance improves (single request vs multiple)
- ✅ Frontend logic stays clean (declarative vs imperative)
- ✅ Backend metadata is leveraged consistently
- ✅ Data access remains scalable and predictable

**Key Takeaways:**
1. Use relationship names, NOT Id fields in filters
2. Use Simple Attribute Nodes for M:1/1:1
3. Use Relation Nodes for 1:N
4. Always paginate user-facing lists
5. Keep nesting depth reasonable (max 3-4 levels)
