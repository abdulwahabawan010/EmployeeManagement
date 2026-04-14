# MvsCrudService Reference

## What MvsCrudService Is

MvsCrudService is the **abstract base class** that provides standardized CRUD operations for all entities. Every entity service (CustomerService, ContractService, TicketService, etc.) extends from MvsCrudService to inherit generic backend communication capabilities.

## Primary Goals

1. **Standardization** - All entities follow the same API patterns
2. **Code Reuse** - Generic operations implemented once, used everywhere
3. **Consistency** - Same method signatures across all services
4. **Extensibility** - Services can add custom endpoints while inheriting generic ones

## Generic CRUD Operations

| Method | Signature | Returns |
|--------|-----------|---------|
| `list` | `list(request: ObjectRequestList)` | `Observable<DtoList<any>>` |
| `get` | `get(id, importObjectContext?, includeForm?, resolveEntities?, resolveEntityLevels?, formAction?, formMode?, sgUseCaseId?)` | `Observable<DtoDetail>` |
| `getLight` | `getLight(id: number)` | `Observable<DtoDetail>` |
| `create` | `create(dto: DtoDetail, importObjectContext?)` | `Observable<DtoDetail>` |
| `update` | `update(dto: DtoDetail, importObjectContext?)` | `Observable<DtoDetail>` |
| `delete` | `delete(id: number)` | `Observable<DtoDetail>` |
| `deleteSoft` | `deleteSoft(id: number)` | `Observable<DtoDetail>` |

## Advanced List Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `listByAttribute` | `listByAttribute(attribute: string, value: any, sorting?: Sorting[])` | `Observable<DtoList>` |
| `listByAttributeValues` | `listByAttributeValues(attribute: string, values: any[])` | `Observable<DtoList<any>>` |
| `getByAttribute` | `getByAttribute(attribute: string, value: any)` | `Observable<DtoDetail>` |
| `search` | `search(value: string)` | `Observable<DtoList>` |
| `groupBy` | `groupBy(request: ObjectRequestListGroupBy)` | `Observable<DtoList>` |

## Service Configuration Methods

| Method | Returns |
|--------|---------|
| `getObjectComponent(mode: MvsCrudModeEnum, viewType?: any)` | `Type<ObjectBaseComponent>` |
| `getObjectPageComponent()` | `Type<any>` |
| `getObjectIcon()` | `string` |
| `getObjectLabels()` | `string[]` |

## Built-in Features

- **DTO transformation** - Automatic conversion between frontend/backend formats
- **Form integration** - Template retrieval, form metadata
- **Error handling** - Standardized error processing
- **Object change broadcasting** - Notify other components of changes
- **Import/Export support** - Batch operations

## Relationship with Other Systems

**With ObjectRequestList:** `list()` method accepts ObjectRequestList for advanced queries with filtering, sorting, pagination, and complex relations.

**With MvsCoreService:** MvsCoreService acts as a factory to retrieve any entity's CRUD service dynamically.

**With Widget System:** Widgets automatically use MvsCrudService to fetch data.
