# Config Node View Reference

Complete API reference for `mvs-config-node-view` component.

## Component Location

**Path**: `frontend/features/core/shared/components/mvs-config-node-view/`

**Files**:
- `mvs-config-node-view.component.ts` - Main component
- `mvs-config-node-view.component.html` - Template
- `data/config-node-view.interfaces.ts` - TypeScript interfaces
- `data/config-node-type.enum.ts` - Node type enum
- `data/config-view-mode.enum.ts` - View mode enum
- `directive/mvs-config-node-template.directive.ts` - Template directive

---

## Backend Integration

The config node view integrates with the backend Two-Layer CRUD Service Architecture:

### API Endpoints Used

| Operation | HTTP Method | Endpoint | Backend Service |
|-----------|-------------|----------|-----------------|
| Load root entity | GET | `/api/entities/{id}` | `ObjectCrudDtoService.get()` |
| Load navigation children | GET | `/api/entities/{entityType}/?fk={fkId}={rootId}` | `ObjectCrudDtoService.get()` with filtering |
| Load terminal relationships | GET | `/api/entities/{relatedEntityType}/?fk={fkId}={terminalId}` | `ObjectCrudDtoService.get()` with filtering |
| Create child | POST | `/api/entities` | `ObjectCrudDtoService.create()` |
| Update entity | PUT | `/api/entities/{id}` | `ObjectCrudDtoService.update()` |
| Delete entity | DELETE | `/api/entities/{id}` | `ObjectCrudDtoService.delete()` |

### Service Layer Architecture

```
Frontend Node View
    │
    ▼ [HTTP REST API]
Backend Controllers
    │
    ▼
ObjectCrudDtoService (DTO Layer)
    │  ├── DTO ↔ ObjectAccess conversion
    │  ├── Input validation
    │  └── Delegate to ObjectCrudService
    │
    ▼
ObjectCrudService (Entity Layer)
    │  ├── Authorization checks (AuthObjectAccessEnum)
    │  ├── Business validation (CheckService)
    │  ├── onBefore* hooks (same transaction)
    │  ├── entityManager.persist/merge/remove
    │  ├── on* hooks (same transaction)
    │  └── Publish domain events
    │
    ▼ [TRANSACTION COMMITS]
    │
    ▼
PostCommitEventListener
    │  └── onAfter*Committed hooks (workflows, notifications)
```

### Authorization Flow

1. Frontend sends request with `canAdd`/`canEdit` UI state
2. Backend `ObjectCrudService` checks `AuthObjectAccessEnum` permissions
3. If authorized, operation proceeds with `OnObjectChange` event handlers
4. Post-commit hooks trigger workflows/notifications after save

**For detailed backend implementation**, see:
- `be_core_documentation` skill → "Two-Layer CRUD Service Architecture"
- `be_core_documentation` skill → "OnObjectChange Interface Methods"

---

## Component Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `config` | `ConfigNodeViewConfig` | YES | Configuration object defining structure |
| `rootEntityId` | `number` | YES | ID of the root entity |
| `rootEntityName` | `string` | YES | Display name of the root entity |
| `rootEntityIcon` | `string` | NO | FontAwesome icon class |

---

## Component Outputs

| Output | Event Type | Description |
|--------|------------|-------------|
| `onNodeSelect` | `ConfigNodeSelectEvent` | Emitted when a terminal node is clicked |
| `onAddChild` | `ConfigNodeAddEvent` | Emitted when add button is clicked |
| `onNodeExpand` | `ConfigNodeExpandEvent` | Emitted when node expands/collapses |
| `onBusyChange` | `boolean` | Emitted during data loading |
| `onDataLoaded` | `void` | Emitted when initial data is loaded |

---

## Event Interfaces

### ConfigNodeSelectEvent

```typescript
interface ConfigNodeSelectEvent {
    node: ConfigNode | null;        // The clicked node (null for hierarchical entries)
    entityType: string;              // Entity type to navigate to
    entityId: number;                // Entity ID to navigate to
}
```

### ConfigNodeAddEvent

```typescript
interface ConfigNodeAddEvent {
    parentNode: ConfigNode;          // Parent node where child will be added
    entityType: string;              // Entity type to create
    context: {                       // Parent entities for pre-filling FKs
        entityType: string;
        entityId: number;
    }[];
}
```

### ConfigNodeExpandEvent

```typescript
interface ConfigNodeExpandEvent {
    node: ConfigNode;                // The node that expanded/collapsed
    expanded: boolean;               // New expanded state
}
```

---

## Configuration Interfaces

### ConfigNodeViewConfig

```typescript
interface ConfigNodeViewConfig {
    root: ConfigNodeRootConfig;
    navigationItems: ConfigNodeNavigationItem[];
    terminalRelationships: {
        [entityType: string]: ConfigNodeTerminalRelationship[]
    };
    displayOptions?: ConfigNodeDisplayOptions;
}
```

### ConfigNodeRootConfig

```typescript
interface ConfigNodeRootConfig {
    entityType: string;      // Full entity type (e.g., 'tm.TicketType')
    badgeLabel?: string;     // Badge text (default: entityType.toUpperCase())
    defaultIcon?: string;    // FontAwesome icon
}
```

### ConfigNodeNavigationItem

```typescript
interface ConfigNodeNavigationItem {
    id: string;              // Unique ID for template matching
    label: string;           // Display label
    icon: string;            // FontAwesome icon
    entityType: string;      // Child entity type
    foreignKey: string;      // FK field WITHOUT 'Id' suffix
    canAdd?: boolean;        // Show add button (default: true)
    displayField?: string;   // Field to display (default: 'name')
}
```

### ConfigNodeTerminalRelationship

```typescript
interface ConfigNodeTerminalRelationship {
    id: string;              // Unique ID
    label: string;           // Display label
    icon: string;            // FontAwesome icon
    entityType: string;      // Related entity type
    foreignKey: string;      // FK field WITHOUT 'Id' suffix
    canAdd?: boolean;        // Show add button
    displayField?: string;   // Field to display (supports $parent, dot notation)
}
```

### ConfigNodeDisplayOptions

```typescript
interface ConfigNodeDisplayOptions {
    expandLabel?: string;         // Default: 'AUSKLAPPEN'
    collapseLabel?: string;       // Default: 'EINKLAPPEN'
    entriesLabel?: string;        // Default: 'Einträge'
    relationsLabel?: string;      // Default: 'Relationen'
    showMoreLabel?: string;       // Default: 'weitere anzeigen'
    showLessLabel?: string;       // Default: 'Weniger anzeigen'
    noResultsLabel?: string;      // Default: 'Keine Einträge gefunden'
    searchPlaceholder?: string;   // Default: 'Suchen...'
    newestLabel?: string;         // Default: 'Neueste'
    oldestLabel?: string;         // Default: 'Älteste'
}
```

---

## Node Type Enum

```typescript
enum ConfigNodeTypeEnum {
    ROOT,                // Root/parent entity
    NAVIGATION,          // Category header
    BRANCH,              // Branch node (legacy)
    CHILD,               // Child node (legacy)
    TERMINAL,            // Individual entity node
    COLLAPSED_LIST,      // List view for non-expandable items
    HIERARCHICAL_LIST    // List view for expandable items
}
```

---

## View Mode Enum

```typescript
enum ConfigViewModeEnum {
    NODE_VIEW, // Hierarchical node visualization
    STANDARD // Standard view with tabs/tables    
}
```

---

## Template Directive

### mvs-config-node-template-directive

```typescript
@Directive({
    selector: '[mvs-config-node-template-directive]'
})
export class MvsConfigNodeTemplateDirective {
    @Input() forNavigationId: string;      // Match by navigation item ID
    @Input() forEntityType: string;        // Match by entity type
    @Input() forNodeType: ConfigNodeTypeEnum; // Match by node type
}
```

### Template Matching Priority

1. `forNavigationId` only - Most specific
2. `forEntityType` + `forNodeType` - Distinguish NAVIGATION vs TERMINAL
3. `forEntityType` only - Backward compatibility

### Template Context Variables

```typescript
// For TERMINAL nodes with entity data
{
    entity: DtoDetail;      // Full entity object
    node: ConfigNode;       // Node object
    displayName: string;    // Resolved display name
    displayField: string;   // Configured displayField
}

// For NAVIGATION nodes
{
    entity: {},             // Empty object
    node: ConfigNode;
    displayName: string;
    displayField: string;
}

// For hierarchical list entries
{
    entry: ConfigNodeHierarchicalListEntry;
    displayName: string;
}
```

---

## Required Imports

```typescript
import {ConfigNodeViewConfig} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-view.interfaces";
import {
    ConfigNodeSelectEvent,
    ConfigNodeAddEvent
} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-view.interfaces";
import {ConfigNodeTypeEnum} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-type.enum";
import {ConfigViewModeEnum} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-view-mode.enum";
import {MvsObjectNavigationService} from "frontend/features/core/shared/navigation/mvs-object-navigation.service";
import {MvsObjectNavigationEntry} from "frontend/features/core/shared/navigation/mvs-object-navigation-entry";
import {MvsObjectNavigationActionEnum} from "frontend/features/core/shared/navigation/mvs-object-navigation-action-enum";
import {ObjectIdentifier} from "frontend/features/core/shared/basic/object-identifier";
```

---

## Display Field Values

| Value | Description | Example Result |
|-------|-------------|----------------|
| `'name'` | Direct field access | `entity.name` |
| `'product.name'` | Nested field (dot notation) | `entity.product.name` |
| `'$parent'` | Parent reference | `"ParentName (ID: 123)"` |

---

## Component Behavior

### Data Loading

1. Component receives `config` and `rootEntityId`
2. Loads all navigation item children via parallel API calls
3. Builds node tree with ROOT and NAVIGATION nodes
4. Terminal nodes are created for each child entity
5. Emits `onDataLoaded` when complete

### Expansion

1. Clicking NAVIGATION node expands/collapses terminal children
2. Clicking TERMINAL node with relationships:
   - Loads nested relationships via API
   - Creates nested NAVIGATION nodes for each relationship
   - Emits `onBusyChange` during loading

### Node Selection

1. Clicking TERMINAL node without relationships emits `onNodeSelect`
2. Parent component handles navigation

### Adding Children

1. Clicking add button on NAVIGATION node emits `onAddChild`
2. Event includes `context` array with parent entities
3. Parent component navigates to create page with pre-filled FKs

---

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| FK includes 'Id' suffix | Children don't load | Use `ticketType` not `ticketTypeId` |
| Missing navigation item ID | Template doesn't match | Add unique `id` to each item |
| Wrong displayField | Shows "Entry-123" | Verify field exists on entity |
| Empty terminalRelationships | Node shows 0 relations | Include even if empty `{}` |
| Not hiding navigation in Node View | Sidebar shows items | Call `removeNavigationItems()` |
