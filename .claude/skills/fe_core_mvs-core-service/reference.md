# MvsCoreService Reference

## What MvsCoreService Is

MvsCoreService is the **central service registry and factory** for the application. It acts as a **dynamic service resolver** that retrieves the appropriate CRUD service, component, or metadata for any entity type at runtime.

## Core Responsibilities

1. **Dynamic Service Resolution** - Get any entity's service by type alias (e.g., `'cr.Customer'`)
2. **Component Discovery** - Retrieve object/page components for any entity
3. **Metadata Access** - Get entity icons, labels, and display information
4. **Centralized Registry** - Single source of truth for entity-service mappings

## Service Map Architecture

MvsCoreService relies on `dtoServiceMap`:

```typescript
// dto.service.map.ts
export const dtoServiceMap = new Map<string, DtoServiceInfo>([
    ['cr.Customer', { service: CustomerService, entityName: 'Customer' }],
    ['tm.Ticket', { service: TicketService, entityName: 'Ticket' }],
]);
```

When `getCrudService('cr.Customer')` is called:
1. Looks up `'cr.Customer'` in `dtoServiceMap`
2. Gets the service class (CustomerService)
3. Uses Angular's injector to instantiate it
4. Initializes and returns the service

## Entity Type Alias Format

**Pattern:** `{module}.{EntityName}`

| Module | Entity | Alias |
|--------|--------|-------|
| Customer Relations | Customer | `cr.Customer` |
| Ticket Management | Ticket | `tm.Ticket` |
| Contract Management | Contract | `cm.Contract` |
| Core | Country | `core.Country` |

## Common Module Prefixes

| Prefix | Module |
|--------|--------|
| `cr` | Customer Relations |
| `tm` | Ticket Management |
| `cm` | Contract Management |
| `am` | Agent Management |
| `bm` | Billing Management |
| `as` | Appointment Scheduling |
| `core` | Core |

## API Reference

### Service Resolution

```typescript
getCrudService<T extends MvsCrudService>(objectType: string): T | null
```

### Component Resolution

```typescript
getObjectComponent(objectType: string, mode: MvsCrudModeEnum, viewType?: any): Type<ObjectBaseComponent>
getObjectPageComponent(objectType: string): Type<any>
getObjectListComponent(objectType: string, mode: MvsCrudModeEnum): Type<any>
getObjectComponentNavigationItems(objectType: string): NavigationItem[]
```

### Metadata Access

```typescript
getObjectIcon(objectType: string): string
getObjectLabels(objectType: string): string[]
getObjectTypeId(objectType: string): Observable<number>
```

### Global Service Access

```typescript
getObjectService(): MvsObjectService
getPageService(): PageService
getPageContextService(): PageContextService
```

## Relationship with Other Systems

**With MvsCrudService:** MvsCoreService is the factory that creates MvsCrudService instances.

**With Widget System:** Widgets use MvsCoreService to work with any entity dynamically.

**With Navigation System:** Navigation uses MvsCoreService to get components for entity display.

## Troubleshooting

### Service Returns Null
- **Cause:** Entity not registered in `dtoServiceMap`
- **Solution:** Add entry to `dto.service.map.ts`

### TypeScript Errors with Custom Methods
- **Cause:** Not using type parameter
- **Solution:** Use `getCrudService<CustomerService>('cr.Customer')`

### Component Not Found
- **Cause:** Service's `getObjectComponent()` returns null
- **Solution:** Implement `getObjectComponent()` in entity service
