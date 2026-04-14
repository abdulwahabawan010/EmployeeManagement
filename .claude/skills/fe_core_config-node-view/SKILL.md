---
name: fe_core_config-node-view
description: "Frontend: Expert guidance on canvas-based configuration node views for visualizing hierarchical entity relationships. Use when converting simple table/list views to interactive graph node visualizations. Covers node types, display scenarios, interactions, and canvas controls."
---

# Config Node View

## Overview

Canvas-based visualization system for displaying hierarchical configuration data as interactive node graphs. Transforms flat table/list views into visual representation showing parent-child relationships.

---

## When to Use

✅ **Use when:**
- Configuration has hierarchical relationships
- Multiple entity types are connected
- Visual exploration preferred over tables
- Parent-child entity relationships need visualization

❌ **Do NOT use when:**
- Data is flat with no relationships
- Simple CRUD table is sufficient
- 1000+ nodes (performance)

---

## Decision Rule (CRITICAL)

```
Step 1: Check for SELECTABLE WIDGET (linked entities)
├── YES → Hierarchical List with expandable entries showing linked data
└── NO  → Regular list

Step 2: Check child count
├── ≤5 children  → Individual Terminal nodes
└── >5 children  → Collapsed List or Hierarchical List
```

---

## Page Structures

### Standard Structure
```
Root → Branch (tabs) → Children/Entries
```

### With Terminal Relationships
```
Root → Branch → Children → Terminal Relationships → Grandchildren
```

---

## Node Types

| Type | Purpose | Connects To |
|------|---------|-------------|
| **ROOT** | Entry point, page title | Branch |
| **NAVIGATION** | Category items with icon (like sidebar tabs) | Root → Branch |
| **BRANCH** | Tabs/categories | Root/Navigation → Children |
| **CHILD** | Intermediate nested level | Parent → Children |
| **TERMINAL** | Leaf node, no children | Parent only |
| **COLLAPSED_LIST** | >5 children as list card | Parent only |
| **HIERARCHICAL_LIST** | Nested parent-child table | Parent → Expanded children |

---

## Display Rules

| Condition | Display |
|-----------|---------|
| ≤5 children | Individual Terminal nodes (10px gap) |
| >5 children | Collapsed List with stacked cards |
| Children have children | Hierarchical List with expand buttons |
| **Selectable widget** | **Hierarchical List with linked entity children** |

---

## Selectable Widget Pattern (IMPORTANT)

When table view uses a **selectable widget** (clicking filters another list), this indicates a **parent-child entity relationship** that must be visualized in node view.

### Detection
```
Table View: Selectable widget on Entity A → filters Entity B list
Node View: Entity A entries are expandable → show linked Entity B children
```


### Behavior
- Parent entries displayed in Hierarchical List
- Each entry shows child count from linked entity
- EXPAND button reveals linked children
- Connection lines from parent entry to child nodes

---

## Node Interactions

| Action | Behavior |
|--------|----------|
| **Expand/Collapse** | Shows/hides children, recalculates layout |
| **Show More** | Click stacked cards → scrollable list with search/sort |
| **Show Less** | Collapse back to 5 items, **repositions expanded terminal children** |
| **Search** | Filter by name (case-insensitive) |
| **Sort** | Toggle: none → newest → oldest → none |
| **Add Child** | "+" icon when `canAdd=true`, opens create dialog |
| **Edit** | Pen icon on terminal nodes when `canEdit=true`, opens edit dialog |
| **Select** | Click node → view entity in read-only dialog |
| **Instant Update** | New entities appear immediately in expanded terminal node relationships (no API call) |

---

## Dialog-Based Event Handlers (REQUIRED)

Config Node View uses **MvsUiObjectService** to open modal dialogs for create/edit/view operations. This is the standard pattern - do NOT use sidebar navigation.

### Imports Required

```typescript
import {MvsUiObjectService} from "../../../../../../core/shared/object/service/mvs-ui-object.service";
import {MvsCrudModeEnum} from "../../../../../../core/shared/service/crud/mvs-crud-mode.enum";

// Import entity DTOs for default value creation
import {EntityDto} from "path/to/entity.dto";
```

### Constructor Injection

```typescript
constructor(
    protected route: ActivatedRoute,
    protected coreService: MvsCoreService,
    protected confirmationService: ConfirmationService,
    protected messageService: MvsMessageService,
    protected mvsUiObjectService: MvsUiObjectService  // Required for dialogs
) {
    super(coreService, messageService, confirmationService, observerService);
}
```

### Event Handler Implementation

```typescript
// 1. SELECT - Opens read-only dialog
handleNodeSelect(event: ConfigNodeSelectEvent): void {
    if (event.entityId && event.entityType) {
        this.mvsUiObjectService.openObjectViaDialog(
            null,                  // importObjectContext
            event.entityType,      // 'um.RoleAuthModule'
            event.entityId,        // existing ID
            null,                  // defaultCreateDto (not needed for read)
            true,                  // readonly
            false,                 // disabled
            null,                  // onChangeFunction (no callback for read-only)
            MvsCrudModeEnum.read   // mode
        );
    }
}

// 2. ADD CHILD (+) - Opens create dialog with pre-filled FK
handleAddChild(event: ConfigNodeAddEvent): void {
    if (event.entityType) {
        const defaultDto = this.createDefaultDtoForEntityType(event.entityType, event.context);

        this.mvsUiObjectService.openObjectViaDialog(
            null,
            event.entityType,
            0,                     // 0 = create mode
            defaultDto,            // Pre-filled DTO with FK values
            false,                 // readonly
            false,                 // disabled
            () => this.onDialogSave(),  // Callback after save
            MvsCrudModeEnum.create
        );
    }
}

// 3. EDIT (pen) - Opens edit dialog
handleNodeEdit(event: ConfigNodeEditEvent): void {
    if (event.entityId && event.entityType) {
        this.mvsUiObjectService.openObjectViaDialog(
            null,
            event.entityType,
            event.entityId,        // existing ID
            null,                  // defaultCreateDto (loads from API)
            false,
            false,
            () => this.onDialogSave(),  // Callback after save
            MvsCrudModeEnum.update
        );
    }
}

// 4. BUSY STATE - Tracks loading state
handleNodeBusyChange(busy: boolean): void {
    this.busy = busy;
}

// 5. SAVE CALLBACK - Refresh after dialog closes
private onDialogSave(): void {
    // Node view component handles cache updates automatically
    // Use this for additional refresh logic if needed
}
```

### Creating Default DTOs with Pre-Filled Foreign Keys

The `createDefaultDtoForEntityType()` helper creates DTOs with foreign key values pre-filled from context:

```typescript
private createDefaultDtoForEntityType(
    entityType: string,
    context: Array<{entityType: string; entityId: number}>
): any {
    const rootId = this.objectIdentifier.objectId;

    switch (entityType) {
        case 'um.RoleAuthModule': {
            const dto = new RoleAuthModuleDto();
            dto.roleDtoId = rootId;  // Pre-fill FK to root
            return dto;
        }
        case 'cr.RoleAuthCustomerRegion': {
            const dto = new RoleAuthCustomerRegionDto();
            // Find parent entity from context
            const customerContext = context?.find(c => c.entityType === 'cr.RoleAuthCustomer');
            dto.roleAuthCustomerDtoId = customerContext?.entityId;
            return dto;
        }
        default:
            return null;
    }
}
```

### Context Parameter Structure

The `event.context` array contains parent entity references:

```typescript
// When adding RoleAuthCustomerRegion (child of RoleAuthCustomer, which is child of Role)
context = [
    {entityType: 'um.Role', entityId: 123},
    {entityType: 'cr.RoleAuthCustomer', entityId: 456}
]
```

### Dialog Modes

| Mode | `MvsCrudModeEnum` | Use Case |
|------|-------------------|----------|
| **Read** | `MvsCrudModeEnum.read` | Viewing entity (select node) |
| **Create** | `MvsCrudModeEnum.create` | Adding new child (+ button) |
| **Update** | `MvsCrudModeEnum.update` | Editing existing (pen button) |

### HTML Template Binding

```html
<mvs-config-node-view
    [config]="roleNodeViewConfig"
    [rootEntityId]="objectIdentifier.objectId"
    (onNodeSelect)="handleNodeSelect($event)"
    (onAddChild)="handleAddChild($event)"
    (onNodeEdit)="handleNodeEdit($event)"
    (onBusyChange)="handleNodeBusyChange($event)">
</mvs-config-node-view>
```

---

## Instant Cache Updates (CRITICAL)

When adding a new entity through a dialog (e.g., adding a "Ticket Mapping" to an expanded "Test 123" terminal), the new entity must appear **instantly** in the node view without requiring a page refresh or API reload.

### Implementation Pattern

```typescript
// 1. Dialog onSave callback calls addEntityToCache()
onSave(entity: DtoDetail) {
    this.nodeViewComponent.addEntityToCache('tm.TicketTypeActionTicketMapping', entity);
}

// 2. addEntityToCache() updates cache and rebuilds tree
addEntityToCache(entityType: string, entity: DtoDetail): void {
    // Update relatedData cache
    this.relatedData[entityType].push(entity);

    // Update terminalNodeData cache for expanded terminals
    const affectedIds = this.updateTerminalNodeDataCache(entityType, entity);

    // FIRST rebuild tree (creates new node references)
    this.buildNodeTree();

    // THEN find affected terminals from NEW tree and rebuild their children
    affectedIds.forEach(nodeId => {
        const terminalNode = this.findNodeById(nodeId);
        if (terminalNode) {
            this.rebuildTerminalNodeChildren(terminalNode);
        }
    });

    // Recalculate positions and connections
    this.calculateNodePositions();
    this.calculateConnectionLines();
}
```

### Critical Order of Operations

**WRONG** (causes stale references):
```typescript
affectedTerminals.forEach(t => this.rebuildTerminalNodeChildren(t));  // Uses OLD references
this.buildNodeTree();  // Creates NEW references, losing changes
```

**CORRECT** (preserves changes):
```typescript
this.buildNodeTree();  // Creates NEW references FIRST
affectedIds.forEach(id => {  // Use IDs, not node references
    const terminalNode = this.findNodeById(id);  // Find NEW reference
    if (terminalNode) {
        this.rebuildTerminalNodeChildren(terminalNode);  // Use NEW reference
    }
});
```

---

## Cache Key Management

Terminal nodes inside COLLAPSED_LIST and HIERARCHICAL_LIST use prefixed cache keys to avoid conflicts:

| Context | Cache Key Format | Example |
|---------|-----------------|---------|
| COLLAPSED_LIST item | `collapsed-item-${terminalNode.id}` | `collapsed-item-tm.TicketTypeAction-104` |
| HIERARCHICAL_LIST entry | `hierarchical-entry-${entry.id}` | `hierarchical-entry-tm.TicketTypeAction-104` |
| Regular terminal node | `${terminalNode.id}` | `tm.TicketTypeAction-104` |

### Why Prefixes Matter

Without prefixes, if a regular terminal node with ID `tm.TicketTypeAction-104` and a COLLAPSED_LIST item with the same ID both exist, they would overwrite each other's cached relationship data.

---

## FK Field Fallback Pattern

Entity DTOs may store foreign keys as `fkField` (e.g., `ticketTypeAction`) or `fkField + 'DtoId'` (e.g., `ticketTypeActionDtoId`). Always check both:

```typescript
const fkValue = entity[fkField] || entity[fkField + 'DtoId'];
```

---

## COLLAPSED_LIST Position Calculation

When `showAllEntries` is true, search-sort-controls appear at the top (~52px height). The Y position calculation MUST account for this:

```typescript
const searchSortControlsHeight = collapsedListParent.showAllEntries ? 52 : 0;
const itemY = collapsedListParent.y + contentPadding + headerHeight +
               searchSortControlsHeight + (itemIndex * itemHeight) + nameCenterY;
```

### Connection Line Origin

For COLLAPSED_LIST items, connection lines start from the **RIGHT edge of the COLLAPSED_LIST container** at the item's Y position:

```typescript
const containerWidth = 280;  // COLLAPSED_LIST width from CSS
const parentX = collapsedListParent.x + containerWidth;
const parentY = itemY;  // Item's Y position within the list
```

---

## Z-Index Hierarchy

Parent nodes must have higher z-index than children to prevent visual overlap:

| Node Type | Z-Index | Purpose |
|-----------|---------|---------|
| COLLAPSED_LIST / HIERARCHICAL_LIST | 10 | Container, above all children |
| from-hierarchical-entry | 5 | Nodes created from hierarchical entries |
| Regular nodes | 2 | Default node level |

```scss
.node-collapsed-list, .node-hierarchical-list {
    z-index: 10;  /* Above all child nodes */
}

.config-node.from-hierarchical-entry {
    z-index: 5;  /* Below parents, above regular nodes */
}

.config-node {
    z-index: 2;  /* Default level */
}
```

---

## Chevron Visibility Logic

Chevron (expand button) should ONLY appear when terminal relationships are configured for that entity type:

```typescript
// WRONG - shows chevron based on childCount
@if (node.childCount > 0 || node.hasMatchingRelationships) { ... }

// CORRECT - only checks configured relationships
@if (node.hasMatchingRelationships) { ... }
```

Where `hasMatchingRelationships` is set based on filtered relationships from `terminalRelationships` config.

---

## Show Less Repositioning

When "Weniger" (Show Less) is clicked, COLLAPSED_LIST height changes. Expanded terminal children must be repositioned:

```typescript
toggleShowAllEntries(node: ConfigNode, event: Event): void {
    node.showAllEntries = !node.showAllEntries;

    // Find expanded terminals and reposition their children
    const expandedTerminals = this.findExpandedTerminalNodesInList(node);
    expandedTerminals.forEach(terminalNode => {
        this.rebuildTerminalNodeChildren(terminalNode);
    });

    this.calculateConnectionLines();
}
```

**Check tracking maps** (not `children` array):
```typescript
private findExpandedTerminalNodesInList(listNode: ConfigNode): ConfigNode[] {
    if (listNode.type === ConfigNodeTypeEnum.COLLAPSED_LIST) {
        return listNode.children.filter(child =>
            this.expandedCollapsedListItems[`collapsed-item-${child.id}`]
        );
    }
    // Similar for HIERARCHICAL_LIST
}
```

---

## Terminal Node Edit Button

### Configuration

The edit button on terminal nodes is controlled by the `canEdit` property in the node view configuration:

```typescript
// In ConfigNodeNavigationItem interface
{
    id: 'actions',
    label: 'Aktionen',
    entityType: 'tm.TicketTypeAction',
    canAdd: true,
    canEdit: true,  // Shows edit button on terminal nodes
}

// For entities without edit capability
{
    id: 'completeStatus',
    label: 'Fertigstellungsstatus',
    entityType: 'tm.TicketTypeCompleteStatus',
    canAdd: true,
    canEdit: false,  // No edit button on terminal nodes
}
```

### When to Use `canEdit`

The `canEdit` property should match the Standard View widget behavior:

| Standard View Widget | Node View `canEdit` |
|---------------------|---------------------|
| Has 3-dots edit menu (`formEdit=true`) | `canEdit: true` |
| No 3-dots edit menu (`formEdit=false`) | `canEdit: false` |

**Reference entities** (lookup data like Fertigstellungsstatus, Zusatzfelder) typically have `canEdit: false` to prevent inline modifications.

### Backend Integration

The node view works with backend CRUD services through the API layer:

| Frontend Action | Backend Service | API Endpoint |
|-----------------|-----------------|--------------|
| Load entities | `ObjectCrudDtoService.get()` | `GET /api/entities/{id}` |
| Add child | `ObjectCrudDtoService.create()` | `POST /api/entities` |
| Edit entity | `ObjectCrudDtoService.update()` | `PUT /api/entities/{id}` |
| Delete entity | `ObjectCrudDtoService.delete()` | `DELETE /api/entities/{id}` |

**Authorization**: The backend `ObjectCrudService` checks `AuthObjectAccessEnum.read/write` permissions. The frontend `canAdd`/`canEdit` properties should align with backend authorization rules.

**For detailed backend CRUD service patterns**, see: `be_core_documentation` skill → "Two-Layer CRUD Service Architecture"

### Implementation

1. Add `canEdit?: boolean` to `ConfigNodeNavigationItem` and `ConfigNodeTerminalRelationship` interfaces
2. Add `canEdit?: boolean` to `ConfigNode` interface
3. Set `canEdit` in node view config per entity type
4. Pass `canEdit` when creating terminal nodes in `buildNodeTree()` and `buildTerminalNodeChildren()`
5. Conditionally render edit button: `@if (node.canEdit)`

---

## Canvas Controls

| Control | Action |
|---------|--------|
| Zoom In/Out | ±10% (50%-200%) |
| Reset | 100%, pan (0,0) |
| Mouse Drag | Pan canvas |
| Ctrl+Scroll | Zoom |

---

## Anti-Patterns (FORBIDDEN)

- ❌ All nodes expanded by default
- ❌ Not recalculating positions after expand/collapse
- ❌ Missing connection lines for hierarchical entries
- ❌ Hardcoding entity types
- ❌ **Using sidebar navigation** - use MvsUiObjectService.openObjectViaDialog() instead
- ❌ **Ignoring selectable widgets** (missing linked entity relationships)
- ❌ **Flat display for entities with parent-child links**
- ❌ **Showing edit button on all terminal nodes** - must match Standard View `formEdit` behavior
- ❌ **Forgetting to set `canEdit` explicitly** - `undefined` is treated as falsy in `@if` directive
- ❌ **Not pre-filling foreign keys in default DTO** - causes FK validation errors on create
- ❌ **Using node references after `buildNodeTree()`** - causes stale reference bugs, use IDs instead
- ❌ **Not accounting for search-sort-controls height** when calculating Y positions for `showAllEntries=true`
- ❌ **Inconsistent cache keys** - must use prefixes for COLLAPSED_LIST/HIERARCHICAL_LIST
- ❌ **Assuming FK field name** - always check both `fkField` and `fkField + 'DtoId'`
- ❌ **Checking `children.length` instead of tracking maps** for COLLAPSED_LIST expanded state

---

## Summary

| Structure | Hierarchy |
|-----------|-----------|
| **Standard** | Root → Branch → Children |
| **Collapsed** | >5 children as stacked list card |
| **Hierarchical** | Expandable entries with nested children |
| **Terminal Relationships** | Parent → Terminal → Terminal Relationship → Grandchildren |

**Key Decisions:**
1. Check for selectable widgets indicating linked entity relationships
2. Use MvsUiObjectService.openObjectViaDialog() for all create/edit/view operations
3. Pre-fill foreign keys in default DTOs from context

---

## Additional Resources

- **Dialog Service:** `fe_core_object-service` skill → MvsUiObjectService
- **Backend CRUD:** `be_core_documentation` skill → "Two-Layer CRUD Service Architecture"

---

## Suggestions & Best Practices

### 1. Use IDs Instead of Node References for State Tracking

When tracking state across tree rebuilds, use node IDs instead of node references:

```typescript
// GOOD - Uses IDs that survive tree rebuilds
private expandedNodeIds: string[] = {};

// BAD - Uses references that become stale
private expandedNodes: ConfigNode[] = [];
```

### 2. Centralize Cache Key Generation

Create a helper method to generate cache keys consistently:

```typescript
private getTerminalCacheKey(node: ConfigNode): string {
    const parentNode = this.findListParentNode(node);
    if (parentNode?.type === ConfigNodeTypeEnum.COLLAPSED_LIST) {
        return `collapsed-item-${node.id}`;
    } else if (parentNode?.type === ConfigNodeTypeEnum.HIERARCHICAL_LIST) {
        return `hierarchical-entry-${node.id}`;
    }
    return node.id;
}
```

### 3. Position Constants in One Place

Define CSS measurements as constants to avoid magic numbers:

```typescript
private readonly COLLAPSED_LIST = {
    WIDTH: 280,
    CONTENT_PADDING: 16,
    HEADER_HEIGHT: 45,
    ITEM_HEIGHT: 103,
    SEARCH_SORT_CONTROLS_HEIGHT: 52
};
```

### 4. Debug Logging for Complex State

Add comprehensive logging for state changes in development:

```typescript
console.log('[MvsConfigNodeView] State:', {
    expandedKeys: Object.keys(this.expandedCollapsedListItems),
    allNodesCount: this.allNodes.length,
    connectionLinesCount: this.connectionLines.length
});
```

### 5. Deferred Position Recalculation

When multiple state changes happen (e.g., expand + show more), batch position calculations:

```typescript
// Instead of recalculating after each change:
this.expandNode(node);
this.calculatePositions();  // Unnecessary
this.toggleShowAll(list);
this.calculatePositions();  // Unnecessary

// Do this:
this.expandNode(node);
this.toggleShowAll(list);
this.calculatePositions();  // Once at the end
```

### 6. Connection Line Caching

For large graphs, cache connection line calculations when nodes haven't moved:

```typescript
private needsRecalculation: boolean = true;

recalculateConnections() {
    if (!this.needsRecalculation) return;
    this.calculateConnectionLines();
    this.needsRecalculation = false;
}

markDirty() {
    this.needsRecalculation = true;
}
```

### 7. Virtual Scrolling for Large Lists

For COLLAPSED_LIST with 100+ items, consider virtual scrolling:

```typescript
// Only render visible items + buffer
visibleChildren = allChildren.slice(
    scrollTop - BUFFER,
    scrollTop + VIEWPORT_HEIGHT + BUFFER
);
```

### 8. Persistent Expansion State

Save expansion state to localStorage for better UX:

```typescript
saveExpansionState() {
    const expandedIds = Object.keys(this.expandedCollapsedListItems);
    localStorage.setItem(`nodeview-${this.config.root.entityType}-expanded`, JSON.stringify(expandedIds));
}

restoreExpansionState() {
    const saved = localStorage.getItem(`nodeview-${this.config.root.entityType}-expanded`);
    if (saved) {
        // Restore expanded state
    }
}
```

### 9. Animation for State Changes

Add smooth transitions for expand/collapse:

```scss
.config-node {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.connection-line {
    transition: stroke 0.3s ease, d 0.3s ease;
}
```

### 10. Performance Monitoring

Track rendering performance for large graphs:

```typescript
private perfLog(label: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    if (duration > 16) {  // > 1 frame
        console.warn(`[Perf] ${label} took ${duration.toFixed(2)}ms`);
    }
}
```
