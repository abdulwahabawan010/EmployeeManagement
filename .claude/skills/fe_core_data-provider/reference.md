# Data Provider System Reference

## Architecture Overview

The Data Provider system is an **abstraction layer** between UI components (Widgets) and backend data retrieval. It decouples how data is requested from where it is fetched.

```
┌──────────────────────────────────────────────────────────────────┐
│                         Widget Layer                              │
│  (Tables, Lists, Forms, Charts - need data to display)           │
└────────────────────────┬─────────────────────────────────────────┘
                         │ Subscribes to data events
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Data Provider Layer (DP)                        │
│  (Manages request lifecycle, emits data events)                  │
│                                                                   │
│  Implementations:                                                 │
│  - CoreDpImplList:      For paginated backend data               │
│  - CoreDpImplTransient: For in-memory data                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │ Delegates to appropriate source
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Data Source Layer (DS)                         │
│  Available: Entity, EntityGroupBy, QL, Transient, Report, OS    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Paths

| Layer | Location |
|-------|----------|
| Data Provider (DP) | `features/core/shared/service/dp/` |
| Data Source (DS) | `features/core/shared/service/ds/` |

---

## Core Concepts

| Concept | Description | Purpose |
|---------|-------------|---------|
| **dataSource** | WHERE data comes from | `entity`, `entity.groupBy`, `ql`, `transient`, `report`, `os` |
| **dataProvider** | HOW data is provided | `list` (backend-driven), `transient` (in-memory) |
| **dataProviderObject** | WHAT entity/query | Entity type or query name |

---

## Data Flow

```
Widget Component                    WidgetData
      │ Configure                        │
      └──────────────────────────────────┤
                                         │ - dataSource
      Subscribe                          │ - dataProvider
      │                                  │ - dataProviderObject
      ▼                                  └──────────┬───────────
Data Provider                                       │
      │                                   Initialize │
      │     Request      ┌─────────────┐ ◀─────────┘
      │ ─────────────────▶│ Data Source │
      │                  │  (Backend)   │
      │ ◀────────────────│             │
      │     Response      └─────────────┘
      │
      │ eventDataLoaded
      ▼
Widget (Updates UI)
```

---

## Widget Integration Patterns

### Pattern 1: Entity-Based Widget (Most Common)

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured entity data provider for Customer table widget
 */

const widgetData = new WidgetData();
widgetData.idAlias = 'customer.list.widget';
widgetData.name = 'Customer List';
widgetData.uiComponent = 'table';

// Data Provider configuration
widgetData.dataSource = 'entity';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'cr.Customer';

// Optional: Add default filters
const request = new ObjectRequestList(false, [], []);
request.addFilter(FilterCriteria.create('status', FilterCriteria.cOperatorEqual, 'active'));
widgetData.dataProviderListRequest = request;
```

### Pattern 2: QL Query Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured QL data provider for Customer analytics chart
 */

const widgetData = new WidgetData();
widgetData.idAlias = 'customer.analytics.chart';
widgetData.name = 'Customer Analytics';
widgetData.uiComponent = 'chart';

// Data Provider configuration
widgetData.dataSource = 'ql';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'analytics.customerStats';

// Provide QL request
const qlRequest = new QlRequest();
qlRequest.queries = [...];
widgetData.dataProviderListRequest = qlRequest;
```

### Pattern 3: GroupBy Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured groupBy data provider for Sales by Region chart
 */

widgetData.dataSource = 'entity.groupBy';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'bm.SalesOrder';

const request = new ObjectRequestList(false, [], []);
const groupBy = new ObjectRequestListGroupBy(false, ['region'], [
    new ObjectRequestListAttribute('totalAmount', 'Total Sales', DtoListAttributeRequestAggregateEnum.Sum)
]);
request.setGroupBy(groupBy);
widgetData.dataProviderListRequest = request;
```

### Pattern 4: Transient Data Widget

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured transient data provider for calculation preview
 */

const widgetData = new WidgetData();
widgetData.idAlias = 'temp.data.list';
widgetData.name = 'Temporary Data';
widgetData.uiComponent = 'list';

// Data Provider configuration
widgetData.dataSource = 'transient';
widgetData.dataProvider = 'transient';

// Provide in-memory data
widgetData.dataTransient = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 }
];
```

---

## Common Pitfalls (MUST AVOID)

### PITFALL-1: Forgetting dataProviderObject

**Problem:**
```typescript
// BAD - Missing dataProviderObject
widgetData.dataSource = 'entity';
widgetData.dataProvider = 'list';
// Missing: widgetData.dataProviderObject = 'cr.Customer';
```

**Result:** Data Provider cannot determine which entity to fetch.

**Fix:** ALWAYS set `dataProviderObject` when using `entity`, `ql`, `entity.groupBy`, `report`, or `os`.

---

### PITFALL-2: Wrong Data Provider for Data Source

**Problem:**
```typescript
// BAD - Mismatched combination
widgetData.dataSource = 'transient';  // In-memory data
widgetData.dataProvider = 'list';     // Backend-driven - WRONG!
```

**Result:** Unexpected behavior, may attempt backend call.

**Fix:** Use `dataProvider = 'transient'` when `dataSource = 'transient'`.

---

### PITFALL-3: Missing Request Object for Complex Cases

**Problem:**
```typescript
// BAD - QL without QlRequest
widgetData.dataSource = 'ql';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'myQuery';
// Missing: widgetData.dataProviderListRequest = new QlRequest();
```

**Result:** Data Provider doesn't know how to execute the query.

**Fix:** Provide appropriate request object:
- `ObjectRequestList` for entities
- `QlRequest` for QL queries
- `ObjectRequestListGroupBy` configuration for groupBy

---

### PITFALL-4: Modifying Data Provider After Widget Initialization

**Problem:**
```typescript
// BAD - Post-initialization modification
ngAfterViewInit() {
    widgetData.dataSource = 'entity.groupBy'; // Widget won't react
}
```

**Result:** Widget doesn't react to the change.

**Fix:** Set configuration before `ngOnInit`, or trigger refresh:
```typescript
widgetData.dataSource = 'entity.groupBy';
this.refreshComponent(true);
```

---

### PITFALL-5: Direct Data Provider Manipulation

**Problem:**
```typescript
// BAD - Direct instantiation
this.widgetData.dataProvider = new CoreDpImplList(); // DON'T DO THIS
```

**Result:** Breaks the architecture, bypasses service lifecycle.

**Fix:** ALWAYS configure via WidgetData properties. Let `CoreDpService` handle instantiation.

---

### PITFALL-6: Transient Without Data

**Problem:**
```typescript
// BAD - Transient without data
widgetData.dataSource = 'transient';
widgetData.dataProvider = 'transient';
// Missing: widgetData.dataTransient = [...];
```

**Result:** Widget displays empty data.

**Fix:** ALWAYS provide data via `dataTransient` property or `setTransientData()` method.

---

### PITFALL-7: Empty dataProviderObject

**Problem:**
```typescript
// BAD - Empty or null
widgetData.dataProviderObject = '';
widgetData.dataProviderObject = null;
```

**Result:** Data Provider cannot resolve entity type.

**Fix:** Set a valid entity type string (e.g., `'cr.Customer'`) or query name.

---

## Runtime Operations

### Change Filters

```typescript
// Widget emits filter change event
this.onFilterChange.emit(new MutableAreaFilterChangeEvent(filterCriteria));

// Parent MvsWidgetComponent handles it
this.dataProvider.changeFilter(filterCriteria, false);
```

### Change Page

```typescript
const paging = new PagingDto();
paging.offset = event.first;
paging.limit = event.rows;

this.dataProvider.changePage(paging);
```

### Refresh Data

```typescript
// Re-execute last request
this.dataProvider.getData(this.dataProvider.lastRequest).subscribe(dtoList => {
    // Data automatically emitted via eventDataLoaded
});
```

### Subscribe to Data Events

```typescript
ngOnInit() {
    super.ngOnInit();

    this.dataProvider.subscribeOnDataLoaded(dtoList => {
        console.log('Data loaded:', dtoList.entries.length, 'entries');
        this.processData(dtoList);
    });
}
```

---

## CoreDpImplInterface

All Data Provider implementations MUST implement:

```typescript
interface CoreDpImplInterface {
    // Identity
    id: string;                          // 'list' or 'transient'
    entity: string;                      // Object type or query name
    lastRequest: CoreRequest;            // Cached request

    // Initialization
    init(object: string, datasourceService: CoreDsImplServiceInterface);
    initRequest(request: CoreRequest);

    // Data Operations
    getData(request: CoreRequest): Observable<DtoList>;
    getDataObject(object: string, id: number, request: DtoRequest): Observable<DtoDetail>;

    // Subscriptions
    subscribeOnDataLoaded(next?, error?, complete?): Subscription;
    subscribeOnDataLoading(next?, error?, complete?): Subscription;

    // Modifications
    changeRequest(request: CoreRequest);
    changePage(paging: PagingDto);
    changeFilter(filterCriteria: FilterCriteria[], noEvent: boolean);

    // Lifecycle
    destroy(): void;
}
```

---

## Request Type Matrix

| Request Type | Purpose | Data Source Compatibility |
|--------------|---------|---------------------------|
| `ObjectRequestList` | Standard entity list retrieval | `entity`, `entity.groupBy` |
| `ObjectRequestSimple` | Simple entity resolution | Direct API calls |
| `ObjectRequestComplexNode` | Complex entity hierarchies | `entity` |
| `QlRequest` | Query Language execution | `ql` only |

---

## Required Imports

```typescript
// Data Provider imports
import { WidgetData } from 'features/core/shared/widget/widget-data';

// Request types
import { ObjectRequestList } from 'features/core/shared/api/object-request-list';
import { ObjectRequestSimple } from 'features/core/shared/api/object-request-simple';
import { ObjectRequestComplexNode } from 'features/core/shared/api/object-request-complex-node';
import { QlRequest } from 'features/core/shared/api/ql-request';

// Filtering and sorting
import { FilterCriteria } from 'features/core/shared/filter/api/filter.criteria';
import { Sorting } from 'features/core/shared/misc/sorting';
import { PagingDto } from 'features/core/shared/dto/paging.dto';

// GroupBy
import { ObjectRequestListGroupBy } from 'features/core/shared/api/object-request-list-group-by';
import { ObjectRequestListAttribute } from 'features/core/shared/api/object-request-list-attribute';
import { DtoListAttributeRequestAggregateEnum } from 'features/core/shared/dto/dto-list-attribute-request-aggregate.enum';
```

---

## Responsibilities and Boundaries

### Data Provider IS Responsible For:

- Managing data request lifecycle
- Providing subscription interface
- Caching last request
- Emitting data events
- Delegating to appropriate Data Source

### Data Provider IS NOT Responsible For:

- UI rendering (Widget's job)
- Widget configuration (WidgetConfigDto's job)
- Backend API implementation (Data Source's job)
- Business logic (Service layer's job)
- Form generation (MvsFormDto's job)
