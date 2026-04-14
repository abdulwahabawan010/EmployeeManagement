---
name: widget-reference
description: Detailed technical reference for Widget Factory methods, parameters, and data providers
---

# Widget Technical Reference

This document contains detailed technical specifications. For governance rules, see `SKILL.md`.

---

## 1. WidgetFactory Methods (AUTHORITATIVE)

**Source:** `frontend/features/core/shared/widget/service/widget.factory.ts`

### 1.1 QL-Based Methods (PREFERRED)

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createWidgetTableEntityQl` | Table widget for entity lists with QL | alias, name, entity, noDataText, filters?, sortings?, resolveFkeyTexts?, ...params |
| `createWidgetListEntityQl` | List widget for entity lists with QL | alias, name, entity, noDataText, filters?, sortings?, resolveFkeyTexts?, ...params |
| `createWidgetSelectableEntityQl` | Selectable widget for master-detail | alias, name, entity, noDataText, filters?, sortings?, ...params |
| `createWidgetTableEntityBasicQl` | Table with default noDataText | alias, name, entity, filters?, sortings?, resolveFkeyTexts?, ...params |
| `createWidgetListEntityBasicQl` | List with default noDataText | alias, name, entity, filters?, sortings?, allowParameters?, ...params |
| `createWidgetTableEntityFkeyResolveQl` | Table with FK text resolution | alias, name, entity, filters?, sortings?, ...params |
| `createWidgetTreeTableEntityQl` | Tree table widget with QL | alias, name, entity, noDataText, filters?, sortings? |
| `createWidgetTableQl` | Table with custom QlQueryDto | alias, name, qlQueryDto, ...params |
| `createWidgetListQl` | List with custom QlQueryDto | alias, name, uiComponent, qlQueryDto, ...params |
| `createWidgetDataQl` | Data widget with custom QlQueryDto | alias, name, qlQueryDto, ...params |
| `createQlWidget` | Generic QL widget | alias, name, entity, uiComponent, noDataText, filters?, sortings?, resolveFkeyTexts?, ...params |
| `createWidgetQl` | QL widget with joins | alias, name, entity, uiComponent, filters?, sortings?, joins?, ...params |

### 1.2 Entity-Based Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createWidgetEntityData` | Data widget for single record display | alias, name, dataProviderObject, objectId, ...params |
| `createWidgetForm` | Form widget for create/edit | alias, name, dataProviderObject, objectId?, ...params |
| `createWidgetObject` | Object widget with toolbar | alias, name, dataProviderObject, objectId?, ...params |
| `createWidgetObjectWithCallback` | Object widget with callbacks | alias, name, dataProviderObject, functionCallbacks, objectId?, ...params |
| `createWidgetTableEntity` | Table widget for entity lists | alias, name, dataProviderObject, noDataText, dataProviderListRequest, ...params |
| `createWidgetListEntity` | List widget for entity lists | alias, name, dataProviderObject, noDataText, dataProviderListRequest, ...params |
| `createWidgetTreeTableEntity` | Tree table widget | alias, name, dataProviderObject, noDataText, dataProviderListRequest, ...params |
| `createWidgetListWithDetailEntity` | List with detail panel | alias, name, dataProviderObject, noDataText, dataProviderListRequest, ...params |
| `createWidgetListWithDetailEntityBasic` | List with detail (basic) | alias, name, dataProviderObject |
| `createWidgetListWithDetailEntityAndCallback` | List with detail + callbacks | alias, name, dataProviderObject, noDataText, dataProviderListRequest, functionCallbacks, ...params |

### 1.3 Transient Data Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createWidgetTransient` | In-memory data widget | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject, dataTransient, ...params |
| `createWidgetTransientExpandable` | Expandable transient data | alias, name, uiComponent, dataProviderObject, dataTransient, request, ...params |

### 1.4 Aggregation Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createWidgetGroupBy` | GroupBy widget for aggregations | idAlias, name, uiComponent, dataSource, dataProviderObject, fieldCategory, fieldCategoryCount, filterCriteriaList, groupingAttribute, attributeLabel |

### 1.5 Report Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createReportChartWidget` | Chart widget from report | alias, name, dataProviderObject, ...params |
| `createReportWidget` | Table widget from report | alias, name, dataProviderObject, noDataText, dataProviderListRequest, ...params |

### 1.6 Low-Level Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createWidget` | Base widget creation | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject, ...params |
| `createWidgetList` | Base list widget creation | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject, noDataText, dataProviderListRequest, ...params |
| `createWidgetListBasic` | Basic list widget | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject |
| `createWidgetListRefresh` | List widget with refresh | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject, noDataText, dataProviderListRequest, uiRefresh, ...params |
| `createWidgetListComplex` | Complex list widget | alias, name, uiComponent, dataProvider, dataSource, dataProviderObject, noDataText, dataProviderListRequest, ...params |

### 1.7 Utility Methods

| Method | Use Case | Parameters |
|--------|----------|------------|
| `createToolbarButton` | Create toolbar button | label, icon, display, action, tooltip |
| `createToolbarButtons` | Create toolbar buttons array | ...buttons |

---

## 2. Widget Types (uiComponent Values)

| Widget Type | When to Use | Factory Method |
|-------------|-------------|----------------|
| `table` | Large datasets with sorting/filtering/pagination | `createWidgetTableEntityQl` |
| `list` | Multiple records with custom layout | `createWidgetListEntityQl` |
| `listWithDetail` | List with expandable detail panel | `createWidgetListWithDetailEntity` |
| `data` | Single record details (read-only) | `createWidgetEntityData` |
| `form` | Creating or editing a single record | `createWidgetForm` |
| `object` | Full CRUD operations with toolbar | `createWidgetObject` |
| `chart` | Data visualization and analytics | `createWidgetGroupBy` with chart params |
| `category` | Grouped/categorical data | `createWidgetGroupBy` |
| `selectable` | Master-detail selection workflows | `createWidgetSelectableEntityQl` |
| `timeline` | Chronological event display | `createQlWidget` with uiComponent='timeline' |
| `treeTable` | Hierarchical parent-child data | `createWidgetTreeTableEntityQl` |
| `card` | Card-based display | `createQlWidget` with uiComponent='card' |

---

## 3. Data Provider Configuration

### 3.1 Valid Combinations (MANDATORY)

| dataSource | dataProvider | Use Case |
|------------|--------------|----------|
| `entity` | `list` | Standard entity CRUD operations |
| `entity.groupBy` | `list` | Aggregated entity data (charts, statistics) |
| `ql` | `list` | Complex queries with joins |
| `transient` | `transient` | In-memory data (no backend calls) |
| `report` | `list` | Pre-configured report data |
| `os` | `list` | Object browser (legacy) |

**Invalid combinations will cause runtime errors.**

### 3.2 Selection Guide

| Scenario | Data Source |
|----------|-------------|
| Simple entity CRUD | `entity` |
| Complex joins | `ql` |
| Aggregations/statistics | `entity.groupBy` |
| In-memory data | `transient` |
| Pre-configured reports | `report` |

---

## 4. Widget Parameters

### 4.1 Common Parameters (All Widgets)

| Parameter | Type | Description |
|-----------|------|-------------|
| `size` | 'S' \| 'M' \| 'L' | Widget size |
| `showHeader` | boolean | Show widget header |
| `widgetHeight` | string | CSS height value |
| `autoRefresh` | boolean | Enable auto-refresh |
| `autoRefreshSeconds` | number | Refresh interval |

### 4.2 Table Widget Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `paging` | number | Items per page |
| `filter` | boolean | Enable column filtering |
| `sorting` | boolean | Enable column sorting |
| `selectionMode` | 'none' \| 'single' \| 'multi' | Row selection mode |
| `showSelectCheckbox` | boolean | Show selection checkboxes |
| `editView` | 'field' \| 'form' \| 'object' \| 'dialog' | Edit mode |
| `showGridlines` | boolean | Show grid lines |
| `striped` | boolean | Alternating row colors |

### 4.3 List Widget Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `objectWidget` | 'data' \| 'form' \| 'object' | Detail widget type |
| `listColumns` | number | Number of columns |
| `paging` | number | Items per page |
| `itemDecorator` | string | Item decoration style |

### 4.4 Data Widget Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `columns` | number | Grid columns |
| `labelPosition` | 'left' \| 'top' \| 'none' | Label position |
| `showEmpty` | boolean | Show empty fields |

### 4.5 Chart Widget Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chartType` | 'bar' \| 'line' \| 'pie' \| 'doughnut' | Chart type |
| `chartField1st` | string | First axis field |
| `chartField2nd` | string | Second axis field |
| `chartAggregateFunction` | 'count' \| 'sum' \| 'avg' \| 'min' \| 'max' | Aggregation |
| `showLegend` | boolean | Show legend |
| `chartHeight` | string | CSS height |

---

## 5. FilterCriteria Operators

| Operator | Constant | Description |
|----------|----------|-------------|
| Equal | `FilterCriteria.cOperatorEqual` | Exact match |
| Not Equal | `FilterCriteria.cOperatorNotEqual` | Not equal |
| Greater Than | `FilterCriteria.cOperatorGreaterThan` | Numeric/date > |
| Greater or Equal | `FilterCriteria.cOperatorGreaterEqual` | Numeric/date >= |
| Less Than | `FilterCriteria.cOperatorLowerThan` | Numeric/date < |
| Less or Equal | `FilterCriteria.cOperatorLowerEqual` | Numeric/date <= |
| Contains | `FilterCriteria.cOperatorContainsPattern` | String contains |
| Starts With | `FilterCriteria.cOperatorStartsWith` | String starts with |
| In | `FilterCriteria.cOperatorIn` | Value in list |
| Not In | `FilterCriteria.cOperatorInNot` | Value not in list |
| Is Null | `FilterCriteria.cOperatorIsNull` | Field is NULL |
| Is Not Null | `FilterCriteria.cOperatorIsNotNull` | Field is not NULL |

---

## 6. Widget Events

| Event | Type | Description |
|-------|------|-------------|
| `onObjectSelect` | `ObjectIdentifierData` | User selects a row/item |
| `onObjectsSelect` | `ObjectIdentifierData[]` | User selects multiple rows |
| `onObjectCreate` | `ObjectIdentifierData` | Record created |
| `onObjectUpdate` | `ObjectIdentifierData` | Record updated |
| `onObjectDelete` | `ObjectIdentifierData` | Record deleted |
| `onFilterChange` | `MutableAreaFilterChangeEvent` | User applies/removes filters |
| `onLoadData` | `DtoList` | Widget loads data |

---

## 7. Required Imports

```typescript
// Core widget imports
import { WidgetFactory } from 'features/core/shared/widget/service/widget.factory';
import { WidgetData } from 'features/core/shared/widget/widget-data';
import { WidgetDataParam } from 'features/core/shared/widget/widget-data-param';

// Event handling
import { ObjectIdentifierData } from 'features/core/shared/basic/object-identifier-data';
import { DtoList } from 'features/core/shared/dto/dto.list';

// Filtering and sorting
import { FilterCriteria } from 'features/core/shared/filter/api/filter.criteria';
import { Sorting } from 'features/core/shared/misc/sorting';

// Pre-fill and callbacks
import {
  WidgetFunctionCallBackCreate,
  WidgetToolbarCreateInterface
} from 'features/core/shared/helper/widget-function-call-back-create';
```

---

## 8. Component Inheritance Hierarchy

```
MvsWidgetComponentComponent (abstract base)
├── MvsWidgetListComponent
│   ├── MvsWidgetTableComponent
│   │   └── MvsWidgetTreeTableComponent
│   ├── MvsWidgetCategoryComponent
│   │   └── MvsWidgetCardComponent
│   └── MvsWidgetTimelineComponent
├── MvsWidgetDataComponent
├── MvsWidgetFormComponent
│   └── MvsWidgetObjectComponent
└── MvsWidgetChartComponent
```

---

## 9. Directory Structure

```
widget/
├── component/
│   ├── runtime/
│   │   └── implementations/
│   │       ├── mvs-widget-table/
│   │       ├── mvs-widget-list/
│   │       └── ...
│   └── config/
│       └── implementations/
│           ├── mvs-widget-config-table/
│           └── ...
├── service/
│   ├── widget.factory.ts
│   └── widget-config.service.ts
└── model/
    ├── widget-data.ts
    └── widget-config-dto.ts
```
