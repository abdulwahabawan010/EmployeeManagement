# QL Examples - Real-World Usage Patterns

## Table of Contents

1. [Simple Query](#simple-query)
2. [Query with Filters](#query-with-filters)
3. [Query with Joins](#query-with-joins)
4. [Query with Pagination](#query-with-pagination)
5. [Query with Multiple Joins and Filters](#query-with-multiple-joins-and-filters)
6. [Widget Factory Examples](#widget-factory-examples)
7. [Complex Nested Joins](#complex-nested-joins)
8. [FK Field Reference Examples](#fk-field-reference-examples)

---

## Simple Query

Fetch all active customers.

```ts
const query: QlQueryDto = {
  name: 'customers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.Customer',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'customers',
  type: 'simple',
  simpleQuery: 'customers',
  settings: {
    includeForm: true,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const customers = res.pipeData['customers']?.data ?? [];
  console.log(`Found ${customers.length} active customers`);
});
```

---

## Query with Filters

Fetch customers whose name contains "Smith" and are located in Germany.

```ts
const query: QlQueryDto = {
  name: 'germanSmithCustomers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.Customer',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.name', FilterCriteria.cOperatorContainsPattern, 'Smith'),
    FilterCriteria.create('e.country', FilterCriteria.cOperatorEqual, 'Germany'),
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ],
  sortings: [
    new Sorting('e.name', true)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'germanSmithCustomers',
  type: 'simple',
  simpleQuery: 'germanSmithCustomers',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const customers = res.pipeData['germanSmithCustomers']?.data ?? [];
});
```

---

## Query with Joins

Fetch tickets with their assigned users.

```ts
const query: QlQueryDto = {
  name: 'ticketsWithUsers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'tm.Ticket',
    as: 'e'
  },
  joins: [
    {
      joinType: 'left',
      type: 'entity',
      name: 'assignedUser',
      as: 'u'
    }
  ],
  filters: [
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'OPEN')
  ],
  sortings: [
    new Sorting('e.createdDate', false)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'ticketsWithUsers',
  type: 'simple',
  simpleQuery: 'ticketsWithUsers',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const tickets = res.pipeData['ticketsWithUsers']?.data ?? [];
  tickets.forEach(ticket => {
    console.log(`Ticket #${ticket.id} assigned to ${ticket.assignedUser?.name}`);
  });
});
```

---

## Query with Pagination

Fetch customers with pagination (page 2, 20 records per page).

```ts
const pageIndex = 1;  // 0-based (page 2)
const pageSize = 20;

const query: QlQueryDto = {
  name: 'pagedCustomers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.Customer',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ],
  sortings: [
    new Sorting('e.name', true)
  ],
  paging: {
    pageIndex: pageIndex,
    pageSize: pageSize
  }
};

const pipe: QlExportPipeDto = {
  name: 'pagedCustomers',
  type: 'simple',
  simpleQuery: 'pagedCustomers',
  settings: {
    includeForm: false,
    includeCount: true  // REQUIRED for pagination
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const customers = res.pipeData['pagedCustomers']?.data ?? [];
  const totalCount = res.pipeData['pagedCustomers']?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  console.log(`Page ${pageIndex + 1} of ${totalPages}`);
  console.log(`Showing ${customers.length} of ${totalCount} total customers`);
});
```

---

## Query with Multiple Joins and Filters

Fetch contracts where customer country is Germany and assigned user is active.

```ts
const query: QlQueryDto = {
  name: 'germanContracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'e'
  },
  joins: [
    {
      joinType: 'left',
      type: 'entity',
      name: 'customer',
      as: 'c'
    },
    {
      joinType: 'left',
      type: 'entity',
      name: 'assignedUser',
      as: 'u'
    }
  ],
  filters: [
    FilterCriteria.create('c.country', FilterCriteria.cOperatorEqual, 'Germany'),
    FilterCriteria.create('u.enabled', FilterCriteria.cOperatorEqual, true),
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE')
  ],
  sortings: [
    new Sorting('e.createdDate', false)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'germanContracts',
  type: 'simple',
  simpleQuery: 'germanContracts',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const contracts = res.pipeData['germanContracts']?.data ?? [];
  contracts.forEach(contract => {
    console.log(`Contract ${contract.id} - Customer: ${contract.customer?.name}, User: ${contract.assignedUser?.name}`);
  });
});
```

---

## Widget Factory Examples

### Example 1: List Widget with QL

```ts
const filter = FilterCriteria.create('e.id', FilterCriteria.cOperatorEqual, 28274);

this.listSingleWidget = WidgetFactory.createWidgetListEntityBasicQl(
  'test.widget.broadcast.subscription.test.widget.list.single.ql',
  'List Single Widget',
  'ci.InsurableObject',
  [filter],
  [new Sorting('e.createdDate', false)]
);
```

### Example 2: Dashboard Widget with Joins

```ts
const filters = [
  FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'PENDING'),
  FilterCriteria.create('u.enabled', FilterCriteria.cOperatorEqual, true)
];

const sortings = [
  new Sorting('e.priority', false),
  new Sorting('e.createdDate', false)
];

this.dashboardWidget = WidgetFactory.createWidgetListEntityBasicQl(
  'dashboard.pending.tickets',
  'Pending Tickets',
  'tm.Ticket',
  filters,
  sortings
);
```

### Example 3: Field Value List Entry Widget

```ts
const filedValueListId = 123;

const qlQueryDto: QlQueryDto = {
  name: 'fieldValueEntries',
  type: 'view',
  filters: [
    FilterCriteria.create('fvl.id', FilterCriteria.cOperatorEqual, filedValueListId)
  ],
  sortings: [
    new Sorting('e.id', false)
  ],
  start: {
    name: 'cc.FieldValueListEntry',
    as: 'e',
    type: 'entity',
    joins: [
      {
        joinType: 'left',
        type: 'entity',
        name: 'fieldValueList',
        as: 'fvl'
      }
    ]
  }
};

const pipe: QlExportPipeDto = {
  name: 'fieldValueEntries',
  type: 'simple',
  simpleQuery: 'fieldValueEntries',
  settings: {
    includeForm: false,
    includeCount: false
  }
};

const request = new QlRequestDto();
request.queries = [qlQueryDto];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const entries = res.pipeData['fieldValueEntries']?.data ?? [];
});
```

---

## Complex Nested Joins

Fetch tickets with customer and customer's address (3-level hierarchy).

```ts
const query: QlQueryDto = {
  name: 'ticketsWithCustomerAddress',
  type: 'view',
  start: {
    type: 'entity',
    name: 'tm.Ticket',
    as: 'e'
  },
  joins: [
    {
      joinType: 'left',
      type: 'entity',
      name: 'customer',
      as: 'c',
      joins: [  // Nested join on customer
        {
          joinType: 'left',
          type: 'entity',
          name: 'address',
          as: 'a'
        }
      ]
    },
    {
      joinType: 'left',
      type: 'entity',
      name: 'assignedUser',
      as: 'u'
    }
  ],
  filters: [
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'OPEN'),
    FilterCriteria.create('a.country', FilterCriteria.cOperatorEqual, 'Germany')
  ],
  sortings: [
    new Sorting('e.createdDate', false)
  ]
};

const pipe: QlExportPipeDto = {
  name: 'ticketsWithCustomerAddress',
  type: 'simple',
  simpleQuery: 'ticketsWithCustomerAddress',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

const request = new QlRequestDto();
request.queries = [query];
request.pipes = [pipe];

this.qlService.query(request).subscribe(res => {
  const tickets = res.pipeData['ticketsWithCustomerAddress']?.data ?? [];
  tickets.forEach(ticket => {
    console.log(`Ticket #${ticket.id}`);
    console.log(`  Customer: ${ticket.customer?.name}`);
    console.log(`  Address: ${ticket.customer?.address?.street}, ${ticket.customer?.address?.city}`);
    console.log(`  Assigned to: ${ticket.assignedUser?.name}`);
  });
});
```

---

## FK Field Reference Examples

### Example 1: Filter by FK Field (Customer ID)

```ts
const customerId = 12345;

const query: QlQueryDto = {
  name: 'customerContracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'e'
  },
  filters: [
    // ✅ CORRECT - FK field with Id suffix
    FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, customerId)
  ]
};
```

### Example 2: Filter by Regular Field (Status)

```ts
const query: QlQueryDto = {
  name: 'activeContracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'e'
  },
  filters: [
    // ✅ CORRECT - Regular field without Id suffix
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE')
  ]
};
```

### Example 3: Filter by Related Entity Attribute (JOIN Required)

Get all contracts where the customer's name equals "Max".

```ts
const query: QlQueryDto = {
  name: 'maxContracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'e'
  },
  joins: [
    {
      type: 'simpleAttribute',
      name: 'customer',  // FK attribute name (without Id suffix in join)
      as: 'c'            // Alias for joined entity
    }
  ],
  filters: [
    // ✅ CORRECT - Filter on joined entity's regular field
    FilterCriteria.create('c.name', FilterCriteria.cOperatorEqual, 'Max'),

    // ✅ CORRECT - Filter on root entity's FK field
    FilterCriteria.create('e.customerId', FilterCriteria.cOperatorGreaterThan, 0)
  ]
};
```

### Example 4: Complex FK and Regular Field Mix

```ts
const customerId = 123;
const userId = 456;

const query: QlQueryDto = {
  name: 'specificContracts',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.CustomerContract',
    as: 'e'
  },
  filters: [
    // FK fields - with Id suffix
    FilterCriteria.create('e.customerId', FilterCriteria.cOperatorEqual, customerId),
    FilterCriteria.create('e.assignedUserId', FilterCriteria.cOperatorEqual, userId),

    // Regular fields - without Id suffix
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'ACTIVE'),
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true),
    FilterCriteria.create('e.type', FilterCriteria.cOperatorEqual, 'PREMIUM')
  ],
  sortings: [
    new Sorting('e.createdDate', false)
  ]
};
```

---

## Batching Multiple Queries

Execute multiple independent queries in a single request.

```ts
// Query 1: Active customers
const customersQuery: QlQueryDto = {
  name: 'activeCustomers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'cr.Customer',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ]
};

const customersPipe: QlExportPipeDto = {
  name: 'activeCustomers',
  type: 'simple',
  simpleQuery: 'activeCustomers',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

// Query 2: Open tickets
const ticketsQuery: QlQueryDto = {
  name: 'openTickets',
  type: 'view',
  start: {
    type: 'entity',
    name: 'tm.Ticket',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.status', FilterCriteria.cOperatorEqual, 'OPEN')
  ]
};

const ticketsPipe: QlExportPipeDto = {
  name: 'openTickets',
  type: 'simple',
  simpleQuery: 'openTickets',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

// Query 3: Active users
const usersQuery: QlQueryDto = {
  name: 'activeUsers',
  type: 'view',
  start: {
    type: 'entity',
    name: 'um.User',
    as: 'e'
  },
  filters: [
    FilterCriteria.create('e.enabled', FilterCriteria.cOperatorEqual, true)
  ]
};

const usersPipe: QlExportPipeDto = {
  name: 'activeUsers',
  type: 'simple',
  simpleQuery: 'activeUsers',
  settings: {
    includeForm: false,
    includeCount: true
  }
};

// Batch all queries in a single request
const request = new QlRequestDto();
request.queries = [customersQuery, ticketsQuery, usersQuery];
request.pipes = [customersPipe, ticketsPipe, usersPipe];

// Execute once - all queries batched automatically
this.qlService.query(request).subscribe(res => {
  const customers = res.pipeData['activeCustomers']?.data ?? [];
  const tickets = res.pipeData['openTickets']?.data ?? [];
  const users = res.pipeData['activeUsers']?.data ?? [];

  console.log(`Customers: ${customers.length}`);
  console.log(`Tickets: ${tickets.length}`);
  console.log(`Users: ${users.length}`);
});
```

---

## Inter-Query Dependency Examples

### Example 1: Mode 1 — Direct Variable Reference

Fetch active customers, then fetch their tickets using customer IDs from Query A:

```ts
this.qlService.builder()
    .query({
        name: 'activeCustomers',
        type: 'view',
        start: { type: 'entity', name: 'cr.Customer', as: 'c' },
        filters: [
            FilterCriteria.create('c.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'customerTickets',
        type: 'view',
        dependsOn: ['activeCustomers'],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            // ${query:activeCustomers:c.id} resolves to list of IDs from Query A
            FilterCriteria.create('t.customerId', FilterCriteria.cOperatorIn,
                '${query:activeCustomers:c.id}')
        ],
        sortings: [
            new Sorting('t.createdDate', false)
        ]
    })
    .execute()
    .subscribe(result => {
        const customers = result.get('activeCustomers');
        const tickets = result.get('customerTickets');
        console.log(`Found ${tickets.length} tickets for ${customers.length} active customers`);
    });
```

### Example 2: Mode 2 — Logic-Powered with Groovy

Fetch contracts, use a Groovy script to filter high-value ones, then fetch related tickets:

```ts
this.qlService.builder()
    .query({
        name: 'contracts',
        type: 'view',
        start: { type: 'entity', name: 'cm.Contract', as: 'c' },
        filters: [
            FilterCriteria.create('c.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'highValueTickets',
        type: 'view',
        dependsOn: ['contracts'],
        logics: [
            {
                type: 'map',
                scriptLanguage: 'groovy',
                script: "contracts.findAll { it['c.totalAmount'] > 10000 }.collect { it['c.id'] }",
                resultName: 'highValueContractIds',
                imports: ['contracts']
            }
        ],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            FilterCriteria.create('t.contractId', FilterCriteria.cOperatorIn,
                '${highValueContractIds}')
        ]
    })
    .execute()
    .subscribe(result => {
        const tickets = result.get('highValueTickets');
    });
```

### Example 3: Chained Dependencies (A → B → C)

Three-level chain: departments → users → tickets:

```ts
this.qlService.builder()
    .query({
        name: 'activeDepartments',
        type: 'view',
        start: { type: 'entity', name: 'um.Department', as: 'd' },
        filters: [
            FilterCriteria.create('d.entityStatus', FilterCriteria.cOperatorEqual, 3)
        ]
    })
    .query({
        name: 'departmentUsers',
        type: 'view',
        dependsOn: ['activeDepartments'],
        start: { type: 'entity', name: 'um.User', as: 'u' },
        filters: [
            FilterCriteria.create('u.departmentId', FilterCriteria.cOperatorIn,
                '${query:activeDepartments:d.id}')
        ]
    })
    .query({
        name: 'userTickets',
        type: 'view',
        dependsOn: ['departmentUsers'],
        start: { type: 'entity', name: 'tm.Ticket', as: 't' },
        filters: [
            FilterCriteria.create('t.assignedUserId', FilterCriteria.cOperatorIn,
                '${query:departmentUsers:u.id}')
        ]
    })
    .execute()
    .subscribe(result => {
        const tickets = result.get('userTickets');
        console.log(`Tickets assigned to users in active departments: ${tickets.length}`);
    });
```

### Example 4: Dependency-Only Query (No Pipe)

Query A provides data for Query B but doesn't need its own results in the response:

```ts
// Using manual request construction for fine-grained pipe control
const queryA: QlQueryDto = {
    name: 'intermediateData',
    type: 'view',
    start: { type: 'entity', name: 'cr.Customer', as: 'c' },
    filters: [
        FilterCriteria.create('c.entityStatus', FilterCriteria.cOperatorEqual, 3)
    ]
};

const queryB: QlQueryDto = {
    name: 'finalResult',
    type: 'view',
    dependsOn: ['intermediateData'],
    start: { type: 'entity', name: 'tm.Ticket', as: 't' },
    filters: [
        FilterCriteria.create('t.customerId', FilterCriteria.cOperatorIn,
            '${query:intermediateData:c.id}')
    ]
};

const request = new QlRequestDto();
request.queries = [queryA, queryB];
// Only create pipe for finalResult — intermediateData executes but has no pipe
request.pipes = [
    { name: 'finalResult', type: 'simple', simpleQuery: 'finalResult',
      settings: { includeCount: true } }
];

this.qlService.query(request).subscribe(res => {
    const tickets = res.pipeData['finalResult']?.data ?? [];
    const count = res.pipeData['finalResult']?.info?.totalCount ?? 0;
});
```

### Example 5: Combining Dependencies with GroupBy

Use dependencies with aggregation queries:

```ts
this.qlService.builder()
    .query({
        name: 'vipCustomers',
        type: 'view',
        start: { type: 'entity', name: 'cr.Customer', as: 'c' },
        filters: [
            FilterCriteria.create('c.customerTypeId', FilterCriteria.cOperatorEqual, vipTypeId)
        ]
    })
    .query({
        name: 'ticketStatsByVip',
        type: 'view',
        dependsOn: ['vipCustomers'],
        start: {
            type: 'groupBy',
            name: 'tm.Ticket',
            as: 'e',
            fields: [
                { name: 'ticketType' },
                { name: '*', function: 'count', as: 'count' }
            ]
        },
        filters: [
            FilterCriteria.create('e.customerId', FilterCriteria.cOperatorIn,
                '${query:vipCustomers:c.id}')
        ]
    })
    .execute()
    .subscribe(result => {
        const stats = result.get('ticketStatsByVip');
        // stats: [{ 'e.ticketType': 1, 'e.count': 15 }, { 'e.ticketType': 2, 'e.count': 8 }]
    });
```

---

## Common Patterns Summary

### Pattern 1: Simple List Fetch
```ts
start → filters → sortings → execute
```

### Pattern 2: List with Pagination
```ts
start → filters → sortings → paging → includeCount: true → execute
```

### Pattern 3: Fetch with Related Data
```ts
start → joins → filters on both entities → execute
```

### Pattern 4: Nested Relationships
```ts
start → joins (with nested joins) → filters on any level → execute
```

### Pattern 5: Multiple Independent Queries
```ts
multiple queries + multiple pipes → single request → single subscribe
```

### Pattern 6: Dependent Queries (Mode 1 — Direct Reference)
```ts
queryA → queryB(dependsOn: [queryA], filter: ${query:queryA:alias.field}) → single request
```

### Pattern 7: Dependent Queries (Mode 2 — Logic-Powered)
```ts
queryA → queryB(dependsOn: [queryA], logics: [script], filter: ${resultName}) → single request
```

### Pattern 8: Chained Dependencies
```ts
queryA → queryB(dependsOn: [queryA]) → queryC(dependsOn: [queryB]) → single request
```
