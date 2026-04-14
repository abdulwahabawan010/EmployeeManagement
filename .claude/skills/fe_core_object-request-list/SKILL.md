---
name: fe_core_object-request-list
description: "Frontend: Expert guidance on ObjectRequestList for entity data retrieval including filtering, sorting, pagination, and relationship traversal. Use when fetching entity lists, building dashboards, or resolving entity relationships. Covers ObjectRequestSimple, ObjectRequestComplex, FilterCriteria, and relationship name usage (NOT Id fields)."
---

# Object Request List

## Overview

Object Request List is a **declarative, type-safe request model** used to retrieve entity data from backend entity-specific endpoints.

**Key Principle:** **Describe what data is required, not how it is fetched.**

---

## When to Use This Skill

Use Object Request List when:
- Fetching entity lists
- Fetching single entities with relations
- Building dashboards or tables
- Resolving entity relationships declaratively

**Do NOT use it when:**
- Data is static or purely client-side
- No backend entity endpoint exists
- Data does not belong to an entity

---

## Critical Rules (Apply IMMEDIATELY)

### 1. Decision Rules
- **Simple needs** → ObjectRequestSimple
- **Controlled relations** → ObjectRequestComplex
- **User-facing lists** → Paging mandatory
- **Performance critical** → Limit attributes and relations

### 2. Filtering Rules (DIFFERENT from QL!)

**CRITICAL: ObjectRequestList uses RELATIONSHIP NAMES, NOT Id fields.**

```ts
// ✅ CORRECT - ObjectRequestList uses relationship name
FilterCriteria.create('customer', FilterCriteria.cOperatorEqual, customerId)

// ❌ WRONG - Do NOT use Id suffix
FilterCriteria.create('customerId', ...)
FilterCriteria.create('customerDtoId', ...)

// ❌ WRONG - Do NOT use alias prefix (no 'e.')
FilterCriteria.create('e.customer', ...)
```

> **Important:** This is DIFFERENT from QL (Query Language). QL uses `e.customerId` with Id suffix and alias. ObjectRequestList uses `'customer'` without Id or alias. See QL skill for QL-specific rules.

### 3. Sorting Rules
- ALWAYS use `new Sorting(field, ascending)`
- Sorting applies independently to main and related entities

### 4. Pagination Rules
- Pagination is 0-based
- User-facing lists MUST use paging

### 5. Relationship Rules
- Use Simple Attribute Nodes for M:1 / 1:1
- Use Relation Nodes for 1:N
- Use binding strategies when ALL records are not required
- Keep nesting depth reasonable (max ~3–4 levels)

---

## Core Concepts

### ObjectRequestList

Defines the complete list request with:
- Filtering (`FilterCriteria`)
- Sorting (`Sorting`)
- Pagination (`PagingDto`)
- Template / form metadata inclusion
- Attribute selection
- Optional simple or complex relationship resolution

### ObjectRequestSimple

**Automatic relationship resolution.**

Use when:
- Basic M:1 or 1:1 relations are sufficient
- You don't need to control which relations are fetched
- You want fast prototyping

**Characteristics:**
- Backend decides which relations to resolve
- Resolution depth is configurable
- Less control, more convenience

### ObjectRequestComplex

**Explicit relationship definition.**

Use when:
- Performance matters
- Only specific relations should be fetched
- Deep or nested relations are required
- Filters or sorting must be applied to related entities
- Backend-calculated (virtual) joins are required

**Built as a tree of nodes.**

### ObjectRequestComplexNode

Defines a single node in the relationship tree.

**Two node types:**

#### Simple Attribute Node (M:1 / 1:1)
Fetches a single related entity. Automatically appends `Dto` suffix.

```ts
ObjectRequestComplexNode.createSimpleAttributeNode('customerDetail')
// result property: customerDetailDto
```

#### Relation Node (1:N)
Fetches a collection of related entities.

```ts
ObjectRequestComplexNode.createRelationNode(
  'addresses',
  ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
)
```

Nodes can be nested using `.addNodes(...)`.

### ObjectRequestRelation

Defines how related entities are joined.

**Supported strategies:**
- Simple join (M:1 / 1:1)
- List join (1:N, ALL)
- Latest / Earliest / Any binding
- Backend-calculated joins using `+` prefix

---

## Complete Example: Basic List

```ts
const request = ObjectRequestList.createBasic(
  true,
  [FilterCriteria.create('enabled', FilterCriteria.cOperatorEqual, true)],
  [new Sorting('name', true)]
);

customerService.list(request).subscribe(result => {
  console.log(result.entries);
});
```

---

## Complete Example: Explicit Relations

```ts
const complex = ObjectRequestComplex.build(
  true,
  false,
  ObjectRequestComplexNode.createSimpleAttributeNode('person'),
  ObjectRequestComplexNode.createRelationNode(
    'addresses',
    ObjectRequestRelation.createList('cr.CustomerAddress', 'customer')
  )
);

const request = ObjectRequestList.createBasic(true, [], []);
request.objectRequestComplex = complex;

customerService.list(request).subscribe(result => {
  console.log(result.entries);
});
```

---

## Anti-Patterns (FORBIDDEN)

❌ Manual DTO assembly
❌ Filtering foreign keys using Id fields (use relationship name)
❌ Deep relation trees without justification
❌ Fetching ALL when LATEST or ANY is sufficient
❌ Filtering related entities on the main request
❌ Using RelationNode for M:1 relationships
❌ Fetching large collections without paging
❌ Deep nesting without performance consideration
❌ Manual REST orchestration for entity relations

---

## Validation Script

**Location:** `.claude/skills/object-request-list/scripts/check-guidelines.js`

**IMPORTANT:** Only run on Claude-generated files (NOT legacy code).

**What it validates:**
- FilterCriteria.create() usage
- No DtoId filtering (must use relationship names)
- new Sorting() usage
- PagingDto for user-facing lists
- No manual HttpClient for entity lists

**Usage:**
```bash
cd .claude/skills/object-request-list/scripts && node check-guidelines.js
```

**Auto-correction workflow:**
1. Claude generates code using ObjectRequestList
2. Run validation script
3. If errors found → Claude fixes violations
4. Re-run validation
5. Repeat until ✅ all checks pass

**Claude should NEVER leave a file with validation errors.**

---

## STOP-AND-ASK Rule

If you are unsure:
1. **STOP**
2. Review [object-request-list-reference.md](object-request-list-reference.md)
3. **ASK** before implementing

---

## Additional Resources

- **Detailed documentation:** [object-request-list-reference.md](object-request-list-reference.md) - Complete API reference
- **Validation script:** `.claude/skills/object-request-list/scripts/check-guidelines.js`

---

## Summary

Object Request List provides a powerful, metadata-driven, object-oriented way to retrieve complex entity data in a single backend call.

When used correctly:
- ✅ Performance improves
- ✅ Frontend logic stays clean
- ✅ Backend metadata is leveraged consistently
- ✅ Data access remains scalable and predictable
