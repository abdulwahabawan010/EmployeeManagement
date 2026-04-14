---
name: object-base-component
description: Technical reference for ObjectBaseComponent lifecycle, integration points, and API
---

# ObjectBaseComponent Technical Reference

For governance rules, see `SKILL.md`. For code examples, see `examples.md`.

---

## 1. Base Classes

### ObjectBaseComponent

Abstract base class for entity detail components with automatic data loading.

**Path:** `features/core/shared/object/mvs-object-base/object-base.component.ts`

**Constructor Dependencies:**
- `MvsCoreService` - service resolution
- `MvsMessageService` - user messages
- `ConfirmationService` - confirmation dialogs
- `ObserverService` - real-time updates

### ObjectBaseModeComponent (OBMC)

Navigation-aware base class for components with multiple UI modes/views.

**Path:** `features/core/shared/object/mvs-object-base/object-base-mode.component.ts`

**Constructor Dependencies:**
- `ActivatedRoute` - route parameters

**Key Differences:**
- Receives `dto` as `@Input()` (no automatic loading)
- Built-in `activeNavigationItem` management
- Route-aware navigation state

---

## 2. Lifecycle Flow

### Initialization Sequence

```
ngOnInit()
  └─> initComponent()
       ├─> objectUserAccessService setup
       ├─> objectUserAccessRead()
       └─> onObjectObserve()
  └─> refreshComponent()
       └─> refreshObject(true)
            ├─> refreshMyContext()
            ├─> crudService = coreService.getCrudService(objectType)
            └─> retrieveObject()
                 └─> crudService.get(objectId).subscribe()
                      └─> storeNewDto(dto)
                           ├─> this.dto = dto
                           ├─> onObjectChanged()  ← IMPLEMENT HERE
                           ├─> onObjectChangedPost()
                           └─> postInit()
```

### Lifecycle Hooks

| Hook | When Called | Purpose |
|------|-------------|---------|
| `onObjectChanged()` | Every load/refresh | React to data, set page title, init widgets |
| `postInit()` | Once after first load | One-time setup (sets `initialized = true`) |
| `getNavigation(uiMode)` | When nav items needed | Define tabs/sections per UI mode |
| `isObjectLoaded()` | To check load state | Custom load validation |
| `postObjectObservationRefresh()` | On ObserverService refresh | React to external changes |

### Change Detection

```
ngOnChanges(changes)
  └─> IF objectIdentifier changed AND initialized
       └─> refreshObject(false)
```

### Cleanup

```
ngOnDestroy()
  ├─> objectObserverSubscription.unsubscribe()
  ├─> observerService.removeObject(objectIdentifier)
  ├─> objectUserAccessService.actionBye()
  ├─> removeNavigationItems()
  └─> removeName()
```

---

## 3. Input Properties

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `objectIdentifier` | `ObjectIdentifier` | - | Entity type + ID |
| `importObjectContext` | `DtoImportObjectContext` | - | Parent context for pre-fill |
| `transientDto` | `DtoDetail` | - | In-memory object (skips fetch) |
| `uiMode` | `UiMode` | `'full'` | UI presentation mode |
| `viewType` | `any` | - | Module variation |
| `params` | `any` | - | Additional parameters |
| `navigationItems` | `NavigationItem[]` | - | Navigation items |
| `activeNavigationItems` | `NavigationItem` | - | Currently active item |

---

## 4. Output Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `onObjectLoadSuccessful` | `DtoDetail` | Notify parent of loaded DTO |
| `onObjectLoadError` | `any` | Notify parent of error |
| `onComponentDirty` | `boolean` | Notify unsaved changes |
| `onNavigationItems` | `NavigationItem[]` | Provide navigation to parent |
| `onPageTitle` | `string` | Provide page title |
| `onNameEvent` | `string` | Provide entity name |
| `onBreadcrumbItems` | `MenuItem[]` | Provide breadcrumb |
| `onBackNavigation` | `void` | Request back navigation |
| `onDialogClose` | `void` | Request dialog close |
| `onChangedObject` | `ObjectChangeInformation` | Notify object changes |

---

## 5. UI Modes

| Mode | Layout | Navigation |
|------|--------|------------|
| `'full'` | Full-page, multi-column | All navigation items |
| `'side'` | Side panel, single-column | Essential items only |
| `'mini-side'` | Compact side panel | Minimal items |
| `'inline'` | Embedded in parent | Contextual items |
| `'consultant'` | Consultant-specific | Consultant items |

**Type Definition:** `features/core/shared/object/mvs-object-base/type/ui-mode.type.ts`

```typescript
export type UiMode = 'full' | 'side' | 'mini-side' | 'inline' | 'consultant';
```

---

## 6. NavigationItem Interface

```typescript
interface NavigationItem {
  label: string;           // Display text
  action: string;          // Action identifier (NOT 'route')
  tooltip?: string;
  icon?: string;           // e.g., 'fa-regular fa-info-circle'
  toggleable?: boolean;
  default?: boolean;       // Default active item
  badge?: number | string;
  badgeType?: string;
  divider?: boolean;
  customFunction?: Function;
}
```

**Import Path:** `'features/core/shared/dto/navigation/navigation-item'`

---

## 7. Integration Services

### MvsCoreService
- `getCrudService(objectType)` - Get CRUD service by type alias
- `getObjectComponent(objectType, mode, viewType)` - Get OBC class

### MvsCrudService
- `get(objectId)` - Fetch single object
- `update(dto)` - Save object
- `getObjectComponent(mode, viewType)` - Return OBC class (implement in subclass)

### ObserverService
- `addObject(objectIdentifier)` - Register for notifications
- `removeObject(objectIdentifier)` - Unregister
- `refreshData.subscribe()` - Listen for changes
- `informActivity(objectIdentifier)` - Report activity

### ObjectUserAccessService
- `actionRead(objectId, ?, objectType)` - Track read
- `actionWrite(objectId, ?, objectType)` - Track write
- `actionBye(objectId, ?, objectType)` - Release access

---

## 8. ObjectComponent (Generic Loader)

**Path:** `features/core/shared/object/component/mvs-object/object.component.ts`

Dynamically loads OBC based on entity type:

```
ObjectComponent
  └─> ngOnChanges()
       └─> refreshComponent()
            └─> resolveObjectComponent(mode)
                 └─> coreService.getObjectComponent(objectType, mode, viewType)
                      └─> Entity Service's getObjectComponent()
                           └─> Returns OBC class
            └─> createDynamicObjectComponent(obcClass)
                 └─> viewContainerRef.createComponent()
```

---

## 9. Service Registration

Entity services return OBC class via `getObjectComponent()`:

```typescript
getObjectComponent(mode?: MvsCrudModeEnum, viewType?: any): Type<any> {
  if (mode === MvsCrudModeEnum.create) {
    return null;  // Use default create form
  }
  if (viewType === 'consultant') {
    return EntityConsultantComponent;
  }
  return EntityObjectComponent;
}
```

---

## 10. MvsCrudModeEnum

```typescript
enum MvsCrudModeEnum {
  create,  // Creating new entity
  read,    // View only
  update,  // Editing existing
  delete   // Deleting entity
}
```

---

## 11. Component State Flags

| Flag | Type | Purpose |
|------|------|---------|
| `initialized` | boolean | Component ready (set by postInit) |
| `busy` | boolean | Data loading in progress |
| `objectLoaded` | boolean | DTO matches objectIdentifier |
| `isDirty` | boolean | DTO has been modified |
| `createOnly` | boolean | Skip data retrieval |
| `isQuickViewComponent` | boolean | Skip user access tracking |

---

## 12. Pattern: OBC with UI Mode Views

```
EntityObjectComponent (OBC)
├── Template checks uiMode
│   ├─> 'side' → EntitySideComponent (OBMC)
│   └─> else → EntityFullComponent (OBMC)
│
├── EntityBaseComponent (OBMC) - shared logic
│   ├── EntityFullComponent - full view
│   └── EntitySideComponent - side view
```

Each view component:
- Extends shared base (OBMC)
- Defines own `loadSideBarMenuItems()` with appropriate navigation items
- Has own template for that UI mode

---

## 13. File Locations

| Component | Path |
|-----------|------|
| ObjectBaseComponent | `features/core/shared/object/mvs-object-base/object-base.component.ts` |
| ObjectBaseModeComponent | `features/core/shared/object/mvs-object-base/object-base-mode.component.ts` |
| ObjectComponent | `features/core/shared/object/component/mvs-object/object.component.ts` |
| UiMode | `features/core/shared/object/mvs-object-base/type/ui-mode.type.ts` |
| NavigationItem | `features/core/shared/dto/navigation/navigation-item.ts` |
| MvsCoreService | `features/core/shared/service/mvs-core.service.ts` |
| MvsCrudService | `features/core/shared/service/crud/mvs-crud.service.ts` |
| ObserverService | `features/core/shared/object/service/observer.service.ts` |

---

## 14. Common Pitfalls

| Problem | Cause | Solution |
|---------|-------|----------|
| `Cannot read 'name' of undefined` | dto accessed before init | Add `@if (initialized && dto)` |
| Object not loading | OBC not registered | Add `getObjectComponent()` to service |
| Infinite loop | `refreshObject()` in `onObjectChanged()` | Remove the call |
| Dirty state not tracked | Forgot `markAsDirty()` | Call after dto modification |
| Navigation not showing | Not emitting | Call `onNavigationItems.emit()` |
| User access not released | Forgot super call | Add `super.ngOnDestroy()` |
