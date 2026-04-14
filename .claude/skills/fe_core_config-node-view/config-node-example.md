# Config Node View - Implementation Guide

This document provides detailed implementation examples for creating config node views.

---

## Component Structure

```
your-module/
└── component/
    └── protected-components/
        └── your-config-node/
            ├── your-config-node.component.ts
            ├── your-config-node.component.html
            ├── your-config-node.component.scss
            └── data/
                ├── config-node.interface.ts
                └── config-node-type.enum.ts
```

---

## Data Interfaces

### config-node-type.enum.ts

```typescript
export enum ConfigNodeTypeEnum {
    ROOT,
    NAVIGATION,
    BRANCH,
    CHILD,
    TERMINAL,
    COLLAPSED_LIST,
    HIERARCHICAL_LIST
}
```

### config-node.interface.ts

```typescript
import {ConfigNodeTypeEnum} from "./config-node-type.enum";

export interface ConfigNodeProperty {
    key: string;
    value: string;
}

export interface HierarchicalListEntry {
    id: string;
    name: string;
    entityType: string;
    entityId?: number;
    createdDate?: Date;
    entryCount: number;
    expanded?: boolean;
    children?: ConfigNode[];
}

export interface ConfigNode {
    id: string;
    name: string;
    type: ConfigNodeTypeEnum;
    entityType: string;
    entityId?: number;
    parentId: string | null;
    childCount: number;
    description?: string;
    properties: ConfigNodeProperty[];
    children?: ConfigNode[];
    expanded?: boolean;
    x?: number;
    y?: number;
    createdDate?: Date;
    canAdd?: boolean;
    isShowMore?: boolean;
    parentNode?: ConfigNode;
    totalChildren?: number;
    visibleChildren?: ConfigNode[];
    remainingCount?: number;
    // Hierarchical list properties
    hierarchicalEntries?: HierarchicalListEntry[];
    visibleEntries?: HierarchicalListEntry[];
    childEntityType?: string;
    showAllEntries?: boolean;
    // Search and sort properties
    searchTerm?: string;
    sortOrder?: 'newest' | 'oldest';
    // Navigation node properties
    icon?: string;
    navigationId?: string;
}
```

---

## Component Implementation

### Basic Component Structure

```typescript
@Component({
    selector: 'your-config-node',
    templateUrl: './your-config-node.component.html',
    styleUrls: ['./your-config-node.component.scss']
})
export class YourConfigNodeComponent implements OnInit {

    rootNode: ConfigNode;
    allNodes: ConfigNode[] = [];
    connectionLines: ConnectionLine[] = [];

    // Canvas state
    zoom: number = 100;
    panX: number = 0;
    panY: number = 0;

    // Layout constants
    readonly NODE_WIDTH = 200;
    readonly NODE_HEIGHT = 120;
    readonly HORIZONTAL_GAP = 100;
    readonly VERTICAL_GAP = 50;
    readonly CHILD_NODE_VERTICAL_GAP = 10;
    readonly MAX_VISIBLE_CHILDREN = 5;
    readonly ROOT_X = 80;
    readonly ROOT_Y = 250;

    ConfigNodeTypeEnum = ConfigNodeTypeEnum;

    constructor(
        protected coreService: MvsCoreService,
        protected navigationService: MvsObjectNavigationService
    ) {}

    ngOnInit(): void {
        this.loadConfigurationData();
    }
}
```

### Analyze Page Structure

```typescript
// Check if page has left navigation
checkForLeftNavigation(): boolean {
    // Check if navigationItems array exists and has items
    return this.navigationItems && this.navigationItems.length > 0;
}

loadConfigurationData(): void {
    this.busy = true;

    // Load data from services
    forkJoin({
        // Add your data requests here
    }).subscribe({
        next: (results) => {
            if (this.checkForLeftNavigation()) {
                this.buildNavigationStructure(results);
            } else {
                this.buildSimpleStructure(results);
            }
            this.calculateNodePositions();
            this.calculateConnectionLines();
            this.busy = false;
        }
    });
}
```

### Build Node Tree - Simple Structure

```typescript
buildSimpleStructure(data: any): void {
    // Create root node
    this.rootNode = {
        id: 'root',
        name: 'Configuration Title',
        type: ConfigNodeTypeEnum.ROOT,
        entityType: 'root',
        parentId: null,
        childCount: this.tabs.length,
        description: 'CFG-ID',
        properties: [{key: 'Branches', value: String(this.tabs.length)}],
        children: [],
        expanded: true,
        canAdd: false
    };

    // Add tabs as branch nodes
    this.tabs.forEach(tab => {
        const branchNode: ConfigNode = {
            id: `branch-${tab.entityType}`,
            name: tab.label,
            type: ConfigNodeTypeEnum.BRANCH,
            entityType: tab.entityType,
            parentId: 'root',
            childCount: tab.entries.length,
            properties: [],
            children: [],
            expanded: false,
            canAdd: true
        };

        // Add entries as children
        tab.entries.forEach(entry => {
            const childNode: ConfigNode = {
                id: `${tab.entityType}-${entry.id}`,
                name: entry.name,
                type: ConfigNodeTypeEnum.TERMINAL,
                entityType: tab.entityType,
                entityId: entry.id,
                parentId: branchNode.id,
                childCount: 0,
                properties: [],
                children: [],
                expanded: false,
                createdDate: entry.createdDate,
                canAdd: false
            };
            branchNode.children.push(childNode);
        });

        this.rootNode.children.push(branchNode);
    });
}
```

### Build Node Tree - Navigation Structure

```typescript
buildNavigationStructure(data: any): void {
    // Create root node
    this.rootNode = {
        id: 'root',
        name: 'Configuration Title',
        type: ConfigNodeTypeEnum.ROOT,
        entityType: 'root',
        parentId: null,
        childCount: this.navigationItems.length,
        description: 'CFG-ID',
        properties: [{key: 'Sections', value: String(this.navigationItems.length)}],
        children: [],
        expanded: true,
        canAdd: false
    };

    // Add navigation items
    this.navigationItems.forEach(navItem => {
        const navNode: ConfigNode = {
            id: `nav-${navItem.id}`,
            name: navItem.label,
            type: ConfigNodeTypeEnum.NAVIGATION,
            entityType: 'navigation',
            parentId: 'root',
            childCount: navItem.tabs.length,
            icon: navItem.icon,
            navigationId: navItem.id,
            properties: [],
            children: [],
            expanded: false,
            canAdd: false
        };

        // Add tabs as branch nodes under navigation
        navItem.tabs.forEach(tab => {
            const branchNode: ConfigNode = {
                id: `branch-${tab.entityType}`,
                name: tab.label,
                type: ConfigNodeTypeEnum.BRANCH,
                entityType: tab.entityType,
                parentId: navNode.id,
                childCount: tab.entries.length,
                properties: [],
                children: [],
                expanded: false,
                canAdd: true
            };

            // Add entries as children
            tab.entries.forEach(entry => {
                const childNode: ConfigNode = {
                    id: `${tab.entityType}-${entry.id}`,
                    name: entry.name,
                    type: ConfigNodeTypeEnum.TERMINAL,
                    entityType: tab.entityType,
                    entityId: entry.id,
                    parentId: branchNode.id,
                    childCount: 0,
                    properties: [],
                    children: [],
                    expanded: false,
                    createdDate: entry.createdDate,
                    canAdd: false
                };
                branchNode.children.push(childNode);
            });

            navNode.children.push(branchNode);
        });

        this.rootNode.children.push(navNode);
    });
}
```

---

## Template Examples

### Root Node

```html
@if (node.type === ConfigNodeTypeEnum.ROOT) {
    <div class="node-content root-content">
        <div class="node-header">
            <span class="status-badge">CONFIGURATION</span>
        </div>
        <div class="node-title">{{ node.name }}</div>
        <div class="node-id">ID: {{ node.description }}</div>
        <div class="node-footer">
            @for (prop of node.properties; track prop.key) {
                <div class="node-property">
                    <span class="property-value">{{ prop.value }}</span>
                    <span class="property-key">{{ prop.key }}</span>
                </div>
            }
        </div>
    </div>
}
```

### Navigation Node

```html
@if (node.type === ConfigNodeTypeEnum.NAVIGATION) {
    <div class="node-content navigation-content">
        <div class="node-header">
            @if (node.icon) {
                <i [class]="node.icon + ' nav-icon'"></i>
            }
            <span class="node-title">{{ node.name }}</span>
        </div>
        <div class="node-child-count">{{ node.childCount }} tabs</div>
        @if (isExpandable(node)) {
            <button class="expand-btn"
                    [class.expanded]="node.expanded"
                    (click)="toggleExpand(node, $event)">
                {{ node.expanded ? 'COLLAPSE' : 'EXPAND' }}
            </button>
        }
    </div>
}
```

### Branch Node

```html
@if (node.type === ConfigNodeTypeEnum.BRANCH) {
    <div class="node-content branch-content">
        <div class="node-header">
            <span class="node-title">{{ node.name }}</span>
            @if (isAddable(node)) {
                <button class="add-btn" (click)="addChild(node, $event)">
                    <i class="fa-light fa-plus"></i>
                </button>
            }
        </div>
        <div class="node-child-count">{{ node.childCount }} entries</div>
        @if (isExpandable(node)) {
            <button class="expand-btn"
                    [class.expanded]="node.expanded"
                    (click)="toggleExpand(node, $event)">
                {{ node.expanded ? 'COLLAPSE' : 'EXPAND' }}
            </button>
        }
    </div>
}
```

### Terminal Node

```html
@if (node.type === ConfigNodeTypeEnum.TERMINAL) {
    <div class="node-content terminal-content">
        <div class="node-header">
            <span class="node-title">{{ node.name }}</span>
        </div>
        <div class="node-meta">
            <span class="node-id">ID: {{ node.entityId }}</span>
            @if (node.createdDate) {
                <span class="node-date">{{ formatDate(node.createdDate) }}</span>
            }
        </div>
    </div>
}
```

### Collapsed List Node

```html
@if (node.type === ConfigNodeTypeEnum.COLLAPSED_LIST) {
    <div class="node-content collapsed-list-content"
         [class.show-all-mode]="node.showAllEntries">
        <div class="collapsed-list-header">{{ node.name }}</div>

        <!-- Search and Sort (when showing all) -->
        @if (node.showAllEntries) {
            <div class="search-sort-controls">
                <div class="search-input-wrapper">
                    <i class="fa-light fa-search"></i>
                    <input type="text" placeholder="Search..."
                           [value]="node.searchTerm || ''"
                           (input)="onSearchChange(node, $event)"/>
                </div>
                <button class="sort-btn" (click)="toggleSort(node, $event)">
                    <i class="fa-light fa-arrow-down-wide-short"></i>
                </button>
            </div>
        }

        <!-- List Items -->
        <div class="collapsed-list-items" [class.scrollable]="node.showAllEntries">
            @for (child of getFilteredChildren(node); track child.id) {
                <div class="collapsed-list-item" (click)="selectChildFromList(child, $event)">
                    <div class="item-name">{{ child.name }}</div>
                    <div class="item-date">{{ formatDate(child.createdDate) }}</div>
                </div>
            }
        </div>

        <!-- Stacked Cards (when not showing all) -->
        @if (!node.showAllEntries && node.remainingCount > 0) {
            <div class="stacked-cards" (click)="toggleShowAllEntries(node, $event)">
                <div class="stacked-card"></div>
                <div class="stacked-card"></div>
                <div class="show-more-label">Show more {{ node.remainingCount }}</div>
            </div>
        }
    </div>
}
```

---

## Style Examples

### Navigation Node Styles

```scss
.node-navigation {
    .navigation-content {
        padding: 16px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 2px solid #0ea5e9;
        border-radius: 12px;
        min-width: 180px;

        .nav-icon {
            font-size: 24px;
            color: #0ea5e9;
            margin-right: 8px;
        }

        .node-title {
            font-size: 16px;
            font-weight: 600;
            color: #0c4a6e;
        }

        .node-child-count {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
        }
    }
}
```

### Search and Sort Controls

```scss
.search-sort-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .search-input-wrapper {
        flex: 1;
        position: relative;

        i {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
        }

        input {
            width: 100%;
            padding: 8px 12px 8px 32px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 13px;
        }
    }

    .sort-btn {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #f8fafc;
        cursor: pointer;

        &.active {
            border-color: var(--primary-color);
            color: var(--primary-color);
        }
    }
}
```

---

## Connection Lines

```typescript
interface ConnectionLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    path: string;
}

calculateConnectionLines(): void {
    this.connectionLines = [];
    this.calculateConnectionsRecursive(this.rootNode);
}

calculateConnectionsRecursive(node: ConfigNode): void {
    if (!node.children?.length || !node.expanded) return;

    node.children.forEach(child => {
        const x1 = node.x + this.NODE_WIDTH;
        const y1 = node.y + this.NODE_HEIGHT / 2;
        const x2 = child.x;
        const y2 = child.y + this.NODE_HEIGHT / 2;

        const midX = (x1 + x2) / 2;
        const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

        this.connectionLines.push({x1, y1, x2, y2, path});
        this.calculateConnectionsRecursive(child);
    });
}
```

### SVG Template

```html
<svg class="connections-svg">
    @for (line of connectionLines; track $index) {
        <path [attr.d]="line.path"
              fill="none"
              stroke="#94a3b8"
              stroke-width="2"
              stroke-dasharray="5,5"/>
    }
</svg>
```

---

## Node Interactions

```typescript
toggleExpand(node: ConfigNode, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
    this.calculateNodePositions();
    this.calculateConnectionLines();
}

selectNode(node: ConfigNode): void {
    this.selectedNode = node;
    if (node.entityId && node.entityType !== 'root') {
        const entry = MvsObjectNavigationEntry.createNavigationEntry(
            node.entityType,
            node.entityId,
            'object',
            '',
            '',
            '',
            MvsObjectNavigationActionEnum.edit,
            'side'
        );
        this.navigationService.navigateTo(entry, 'right');
    }
}

addChild(node: ConfigNode, event: Event): void {
    event.stopPropagation();
    const childEntityType = node.childEntityType || node.entityType;
    const entry = MvsObjectNavigationEntry.createNavigationEntry(
        childEntityType,
        null,
        'object',
        '',
        '',
        '',
        MvsObjectNavigationActionEnum.edit,
        'side'
    );
    this.navigationService.navigateTo(entry, 'right');
}

toggleShowAllEntries(node: ConfigNode, event: Event): void {
    event.stopPropagation();
    node.showAllEntries = !node.showAllEntries;
    if (!node.showAllEntries) {
        node.searchTerm = '';
        delete node.sortOrder;
    }
}

onSearchChange(node: ConfigNode, event: Event): void {
    const input = event.target as HTMLInputElement;
    node.searchTerm = input.value;
}

toggleSort(node: ConfigNode, event: Event): void {
    event.stopPropagation();
    if (!node.sortOrder) {
        node.sortOrder = 'newest';
    } else if (node.sortOrder === 'newest') {
        node.sortOrder = 'oldest';
    } else {
        delete node.sortOrder;
    }
}
```

---

## Canvas Controls

```typescript
zoom: number = 100;
panX: number = 0;
panY: number = 0;
isPanning: boolean = false;

zoomIn(): void {
    if (this.zoom < 200) this.zoom += 10;
}

zoomOut(): void {
    if (this.zoom > 50) this.zoom -= 10;
}

resetZoom(): void {
    this.zoom = 100;
    this.panX = 0;
    this.panY = 0;
}

onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
        this.isPanning = true;
        this.lastPanX = event.clientX;
        this.lastPanY = event.clientY;
    }
}

@HostListener('document:mousemove', ['$event'])
onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
        this.panX += event.clientX - this.lastPanX;
        this.panY += event.clientY - this.lastPanY;
        this.lastPanX = event.clientX;
        this.lastPanY = event.clientY;
    }
}

@HostListener('document:mouseup')
onMouseUp(): void {
    this.isPanning = false;
}

@HostListener('wheel', ['$event'])
onWheel(event: WheelEvent): void {
    if (event.ctrlKey) {
        event.preventDefault();
        event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
    }
}
```

---

## Conversion Checklist

- [ ] **Analyze page structure**
  - [ ] Check for left navigation sidebar
  - [ ] Identify navigation items and icons
  - [ ] Identify tabs under each navigation
  - [ ] Identify entity types for each tab

- [ ] **Determine hierarchy**
  - [ ] Left navigation → Navigation Structure
  - [ ] Only tabs → Simple Structure

- [ ] **Create data model**
  - [ ] ConfigNodeTypeEnum with all types
  - [ ] ConfigNode interface
  - [ ] HierarchicalListEntry interface

- [ ] **Build node tree**
  - [ ] Root node
  - [ ] Navigation nodes (if applicable)
  - [ ] Branch nodes for tabs
  - [ ] Child/Terminal nodes for entries

- [ ] **Implement layout**
  - [ ] calculateNodePositions()
  - [ ] calculateConnectionLines()

- [ ] **Add interactions**
  - [ ] Expand/collapse
  - [ ] Collapsed list (>5 children)
  - [ ] Search/sort for expanded lists
  - [ ] Node selection → sidebar edit

- [ ] **Add canvas controls**
  - [ ] Zoom in/out/reset
  - [ ] Pan with mouse drag

---

## Performance Guidelines

| Node Count | Recommendation |
|------------|----------------|
| < 100 | Full implementation |
| 100-500 | Lazy load on expand |
| 500+ | Virtual scrolling |
