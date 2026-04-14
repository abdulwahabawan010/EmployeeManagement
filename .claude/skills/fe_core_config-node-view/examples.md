# Config Node View Implementation Examples

This document contains complete implementation patterns for `mvs-config-node-view`.

## Pattern 1: Basic Configuration Entity

Use this pattern for entities with direct child relationships (e.g., tm.TicketType).

### Configuration File

**File**: `shared/ticket-type-node-view-config.ts`

```typescript
import {ConfigNodeViewConfig} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-view.interfaces";

/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Node view configuration for tm.TicketType entity with actions, notifications, and their nested relationships
 */
export const TICKET_TYPE_NODE_VIEW_CONFIG: ConfigNodeViewConfig = {
    root: {
        entityType: 'tm.TicketType',
        badgeLabel: 'TICKET TYPE',
        defaultIcon: 'fa-regular fa-typewriter'
    },
    navigationItems: [
        {
            id: 'actions',
            label: 'Aktionen',
            icon: 'fa-solid fa-hand-point-right',
            entityType: 'tm.TicketTypeAction',
            foreignKey: 'ticketType',
            canAdd: true,
            displayField: 'name'
        },
        {
            id: 'notifications',
            label: 'Benachrichtigung',
            icon: 'fa-regular fa-bell',
            entityType: 'tm.TicketTypeNotificationType',
            foreignKey: 'ticketType',
            canAdd: true,
            displayField: 'name'
        }
    ],
    terminalRelationships: {
        'tm.TicketTypeAction': [
            {
                id: 'ticketMapping',
                label: 'Ticket Mapping',
                icon: 'fa-solid fa-link',
                entityType: 'tm.TicketTypeActionTicketMapping',
                foreignKey: 'ticketTypeAction',
                canAdd: true,
                displayField: '$parent'
            }
        ]
    }
};
```

### Component TypeScript

**File**: `ticket-type-object.component.ts`

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Component
 * SubType: Configuration
 * Reason: TicketType object component with node view for hierarchical child entity configuration
 *
 * Backend Integration:
 * - Node view data is loaded via backend ObjectCrudDtoService (DTO layer)
 * - Add/Edit operations navigate to object pages that use ObjectCrudDtoService endpoints
 * - Authorization is handled by backend ObjectCrudService (entity layer)
 * - For backend patterns, see: be_core_documentation skill → "Two-Layer CRUD Service Architecture"
 */

import {Component} from '@angular/core';
import {ObjectBaseComponent} from "frontend/features/core/shared/object/mvs-object-base/object-base.component";
import {TICKET_TYPE_NODE_VIEW_CONFIG} from "./shared/ticket-type-node-view-config";
import {
    ConfigNodeSelectEvent,
    ConfigNodeAddEvent
} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-view.interfaces";
import {MvsObjectNavigationService} from "frontend/features/core/shared/navigation/mvs-object-navigation.service";
import {MvsObjectNavigationEntry} from "frontend/features/core/shared/navigation/mvs-object-navigation-entry";
import {MvsObjectNavigationActionEnum} from "frontend/features/core/shared/navigation/mvs-object-navigation-action-enum";
import {ObjectIdentifier} from "frontend/features/core/shared/basic/object-identifier";
import {ConfigViewModeEnum} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-view-mode.enum";

@Component({
    selector: 'ticket-type-object-component',
    templateUrl: './ticket-type-object.component.html',
    styleUrls: ['./ticket-type-object.component.scss'],
    standalone: false
})
export class TicketTypeObjectComponent extends ObjectBaseComponent {

    readonly ConfigViewModeEnum = ConfigViewModeEnum;
    viewMode: ConfigViewModeEnum = ConfigViewModeEnum.NODE_VIEW;
    readonly ticketTypeNodeViewConfig = TICKET_TYPE_NODE_VIEW_CONFIG;

    constructor(
        protected navigationService: MvsObjectNavigationService
    ) {
        super();
    }

    onObjectChanged(): void {
        const title = `${this.dto.name} - Konfiguration`;
        this.setPageTitle(title);
        this.updateNavigationItems();
    }

    private updateNavigationItems(): void {
        if (this.viewMode === ConfigViewModeEnum.NODE_VIEW) {
            this.removeNavigationItems();
        }
    }

    onViewModeChange(mode: ConfigViewModeEnum): void {
        this.viewMode = mode;
        this.updateNavigationItems();
    }

    handleNodeSelect(event: ConfigNodeSelectEvent): void {
        if (event.entityId && event.entityType) {
            const entry = MvsObjectNavigationEntry.createNavigationEntry(
                event.entityType,
                event.entityId,
                'object',
                event.node?.name || '',
                '', '', '',
                MvsObjectNavigationActionEnum.edit,
                'side'
            );
            this.navigationService.navigateTo(entry, 'right');
        }
    }

    handleAddChild(event: ConfigNodeAddEvent): void {
        if (event.entityType) {
            const context: ObjectIdentifier[] = event.context.map(
                ctx => new ObjectIdentifier(ctx.entityType, ctx.entityId)
            );

            const entry = MvsObjectNavigationEntry.createNavigationEntry(
                event.entityType,
                null,
                'object',
                '', '', '',
                MvsObjectNavigationActionEnum.create,
                'side'
            );

            entry.context = context;
            this.navigationService.navigateTo(entry, 'right');
        }
    }

    handleNodeViewBusyChange(busy: boolean): void {
        // Optional: handle loading state
    }

    handleNodeViewDataLoaded(): void {
        // Optional: handle data loaded event
    }
}
```

### Component HTML

**File**: `ticket-type-object.component.html`

```html
<!--
  AI:
  Status: "in progress"
  Type: Component
  SubType: Configuration
  Reason: TicketType object component with node view for hierarchical child entity configuration
-->

@if (initialized && dto) {
    <div class="ticket-type-container">

        <!-- View Mode Switcher -->
        <div class="view-mode-switcher mb-4 flex align-items-center justify-content-end gap-2">
            <p-selectButton
                [options]="[
                    { label: 'Node View', value: ConfigViewModeEnum.NODE_VIEW, icon: 'fa-diagram-project fa-light' },
                    { label: 'Standard View', value: ConfigViewModeEnum.STANDARD, icon: 'fa-table-columns fa-light' }
                ]"
                [(ngModel)]="viewMode"
                (onChange)="onViewModeChange($event.value)"
                optionLabel="label"
                optionValue="value"
                [style]="{'min-width': '200px'}">
                <ng-template pTemplate="selectedItem" let-option>
                    <i [class]="option.icon"></i>
                    <span class="ml-2">{{ option.label }}</span>
                </ng-template>
                <ng-template pTemplate="item" let-option>
                    <i [class]="option.icon"></i>
                    <span class="ml-2">{{ option.label }}</span>
                </ng-template>
            </p-selectButton>
        </div>

        @if (viewMode === ConfigViewModeEnum.NODE_VIEW) {
            <!-- Node View -->
            <mvs-config-node-view
                    [config]="ticketTypeNodeViewConfig"
                    [rootEntityId]="objectIdentifier.objectId"
                    [rootEntityName]="dto.name"
                    [rootEntityIcon]="dto?.image"
                    (onNodeSelect)="handleNodeSelect($event)"
                    (onAddChild)="handleAddChild($event)"
                    (onBusyChange)="handleNodeViewBusyChange($event)"
                    (onDataLoaded)="handleNodeViewDataLoaded()">

                <!-- Custom template for notifications with nested DTO name -->
                <ng-template mvs-config-node-template-directive
                             forEntityType="tm.TicketTypeNotificationType"
                             [forNodeType]="ConfigNodeTypeEnum.TERMINAL"
                             let-entity="entity">
                    <div class="custom-node-title" style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-weight: 500;">{{ entity?.notificationTypeDtoName }}</span>
                        @if (entity?.description) {
                            <span style="font-size: 12px; color: #64748b;">{{ entity.description }}</span>
                        }
                    </div>
                </ng-template>

            </mvs-config-node-view>
        } @else {
            <!-- Standard View -->
            <mvs-crud-object [objectIdentifier]="objectIdentifier" [mode]="'view'">
            </mvs-crud-object>
        }
    </div>
}
```

---

## Pattern 2: Entity with Multiple Child Categories

Use this pattern for entities with many different child types (e.g., bd.DunningType).

### Configuration File

**File**: `shared/dunning-type-node-view-config.ts`

```typescript
import {ConfigNodeViewConfig} from "frontend/features/core/shared/components/mvs-config-node-view/data/config-node-view.interfaces";

/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Node view configuration for bd.DunningType entity with 8 child categories (levels, charges, conditions, etc.)
 */
export const DUNNING_TYPE_NODE_VIEW_CONFIG: ConfigNodeViewConfig = {
    root: {
        entityType: 'bd.DunningType',
        badgeLabel: 'DUNNING TYPE',
        defaultIcon: 'fa-solid fa-file-invoice-dollar'
    },
    navigationItems: [
        {
            id: 'levels',
            label: 'Levels',
            icon: 'fa-solid fa-layer-group',
            entityType: 'bd.DunningTypeLevel',
            foreignKey: 'dunningType',
            canAdd: true,
            displayField: 'name'
        },
        {
            id: 'charges',
            label: 'Charges',
            icon: 'fa-solid fa-euro-sign',
            entityType: 'bd.DunningTypeCharge',
            foreignKey: 'dunningType',
            canAdd: true,
            displayField: 'name'
        },
        {
            id: 'start',
            label: 'Start Conditions',
            icon: 'fa-solid fa-play',
            entityType: 'bd.DunningTypeStart',
            foreignKey: 'dunningType',
            canAdd: true,
            displayField: 'name'
        },
        {
            id: 'stop',
            label: 'Stop Conditions',
            icon: 'fa-solid fa-stop',
            entityType: 'bd.DunningTypeStop',
            foreignKey: 'dunningType',
            canAdd: true,
            displayField: 'name'
        }
    ],
    terminalRelationships: {
        'bd.DunningTypeLevel': [],
        'bd.DunningTypeCharge': [],
        'bd.DunningTypeStart': [],
        'bd.DunningTypeStop': []
    }
};
```

---

## Pattern 3: Entity with Nested Display Field

Use when entity has a nested DTO field for display name.

### Configuration with Nested Field

```typescript
{
    id: 'notifications',
    label: 'Benachrichtigung',
    icon: 'fa-regular fa-bell',
    entityType: 'tm.TicketTypeNotificationType',
    foreignKey: 'ticketType',
    displayField: 'notificationTypeDto.name'  // Nested field
}
```

### Alternative: Custom Template

```html
<ng-template mvs-config-node-template-directive
             forEntityType="tm.TicketTypeNotificationType"
             [forNodeType]="ConfigNodeTypeEnum.TERMINAL"
             let-entity="entity">
    <div class="custom-node-title">
        <span>{{ entity?.notificationTypeDtoName || 'Notification ' + entity?.id }}</span>
        @if (entity?.channel) {
            <span class="channel">{{ entity.channel }}</span>
        }
    </div>
</ng-template>
```

---

## Pattern 4: Complex Entity Display

Use when entity needs multiple fields combined for display.

### Custom Template with Multiple Fields

```html
<ng-template mvs-config-node-template-directive
             forEntityType="bd.DunningTypeLevel"
             [forNodeType]="ConfigNodeTypeEnum.TERMINAL"
             let-entity="entity">
    <div class="custom-node-title" style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span class="level-badge" style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px;">
                {{ entity?.levelNumber }}
            </span>
            <span style="font-weight: 500;">{{ entity?.name }}</span>
        </div>
        @if (entity?.days !== undefined) {
            <span style="font-size: 12px; color: #64748b;">
                {{ entity.days }} Tage nach Fälligkeit
            </span>
        }
        @if (entity?.chargeAmount) {
            <span style="font-size: 12px; color: #059669;">
                Gebühr: {{ entity.chargeAmount }} €
            </span>
        }
    </div>
</ng-template>
```

---

## Pattern 5: Using Navigation ID for Template Matching

Use when you want to target a specific navigation item only.

### Template by Navigation ID

```html
<!-- This template ONLY matches the 'actions' navigation item header -->
<ng-template mvs-config-node-template-directive
             forNavigationId="actions"
             [forNodeType]="ConfigNodeTypeEnum.NAVIGATION"
             let-node="node">
    <div class="custom-nav-header">
        <i class="fa-solid fa-bolt" style="color: #f59e0b;"></i>
        <span class="nav-title">{{ node.name }}</span>
        <span class="action-count">{{ node.childCount }} Aktionen</span>
    </div>
</ng-template>

<!-- This template matches ALL terminal nodes for actions -->
<ng-template mvs-config-node-template-directive
             forNavigationId="actions"
             [forNodeType]="ConfigNodeTypeEnum.TERMINAL"
             let-entity="entity">
    <div class="custom-terminal-title">
        <i class="fa-solid fa-play"></i>
        <span>{{ entity?.name }}</span>
    </div>
</ng-template>
```

---

## Pattern 6: Entity with Hierarchical Relationships

Use when child entities also have their own children.

### Configuration with Terminal Relationships

```typescript
export const TICKET_TYPE_NODE_VIEW_CONFIG: ConfigNodeViewConfig = {
    root: {
        entityType: 'tm.TicketType',
        badgeLabel: 'TICKET TYPE',
        defaultIcon: 'fa-regular fa-typewriter'
    },
    navigationItems: [
        {
            id: 'actions',
            label: 'Aktionen',
            icon: 'fa-solid fa-hand-point-right',
            entityType: 'tm.TicketTypeAction',
            foreignKey: 'ticketType',
            canAdd: true,
            displayField: 'name'
        }
    ],
    terminalRelationships: {
        'tm.TicketTypeAction': [
            {
                id: 'ticketMapping',
                label: 'Ticket Mapping',
                icon: 'fa-solid fa-link',
                entityType: 'tm.TicketTypeActionTicketMapping',
                foreignKey: 'ticketTypeAction',
                canAdd: true,
                displayField: '$parent'
            },
            {
                id: 'processMapping',
                label: 'Process Mapping',
                icon: 'fa-solid fa-diagram-project',
                entityType: 'tm.TicketTypeActionProcessMapping',
                foreignKey: 'ticketTypeAction',
                canAdd: true,
                displayField: 'processDefinitionName'
            }
        ]
    }
};
```

This creates:
- Root → Actions (nav)
  - Action 1 (terminal) → Ticket Mapping, Process Mapping (nested)
  - Action 2 (terminal) → Ticket Mapping, Process Mapping (nested)

---

## Quick Reference: Configuration Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `root.entityType` | string | YES | Full entity type (e.g., 'tm.TicketType') |
| `root.badgeLabel` | string | NO | Badge text (default: entityType.toUpperCase()) |
| `root.defaultIcon` | string | NO | FontAwesome icon |
| `navigationItems` | array | YES | Direct child categories |
| `navigationItems[].id` | string | YES | Unique ID for template matching |
| `navigationItems[].label` | string | YES | Display label |
| `navigationItems[].icon` | string | YES | FontAwesome icon |
| `navigationItems[].entityType` | string | YES | Child entity type |
| `navigationItems[].foreignKey` | string | YES | FK field WITHOUT 'Id' |
| `navigationItems[].canAdd` | boolean | NO | Show add button (default: true) |
| `navigationItems[].displayField` | string | NO | Field to display (default: 'name') |
| `terminalRelationships` | object | YES | Nested relationships (can be empty) |
| `displayOptions` | object | NO | UI label overrides |

---

## Quick Reference: Template Context Variables

```html
<ng-template mvs-config-node-template-directive
             let-entity="entity"
             let-node="node"
             let-displayName="displayName"
             let-displayField="displayField">
    <!-- entity: Full entity data (DtoDetail) for TERMINAL nodes -->
    <!-- node: ConfigNode object with all node properties -->
    <!-- displayName: Resolved display name from displayField -->
    <!-- displayField: The configured displayField value -->
</ng-template>
```

| Variable | Type | Available For | Description |
|----------|------|---------------|-------------|
| `entity` | DtoDetail | TERMINAL | Full entity data with all fields |
| `node` | ConfigNode | All | Node object with properties |
| `displayName` | string | All | Resolved display name |
| `displayField` | string | All | Configured displayField |
