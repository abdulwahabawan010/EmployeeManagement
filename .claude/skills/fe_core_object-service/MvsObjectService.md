# MvsObjectService - API Reference

> **Complete API documentation for MvsObjectService - Event Broadcasting and State Management**

---

## Overview

**Location:** `features/core/shared/service/object/mvs-object.service.ts`

**Purpose:** Base service for object-related operations, event broadcasting, and cross-component communication

**Extends:** None (Base class)

**Extended By:** `MvsUiObjectService`

---

## Table of Contents

1. [Class Properties](#class-properties)
2. [Core Methods](#core-methods)
3. [Event Broadcasting](#event-broadcasting)
4. [Widget Integration](#widget-integration)
5. [Navigation Integration](#navigation-integration)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)

---

## Class Properties

### `objectChangeEvent: Subject<ObjectChangeInformation>`

Observable stream for entity change notifications.

**Type:** `Subject<ObjectChangeInformation>`

**Purpose:** Broadcasts entity lifecycle events (created, updated, deleted, loaded) to all subscribers

**When to Use:**
- Auto-refresh lists when entities change
- Update related data when dependencies change
- Synchronize multiple views of same entity
- Trigger side effects on entity changes

**Example:**
```typescript
export class ProjectListComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Subscribe to entity changes
    this.subscription = this.objectService.objectChangeEvent.subscribe(change => {
      console.log('Entity changed:', change);
      // {
      //   objectType: 'sp.Project',
      //   action: 'created',
      //   after: ProjectDto { id: 123, name: 'New Project' }
      // }

      if (change.objectType === 'sp.Project') {
        this.handleProjectChange(change);
      }
    });
  }

  handleProjectChange(change: ObjectChangeInformation) {
    switch (change.action) {
      case 'created':
        this.addProjectToList(change.after);
        break;
      case 'updated':
        this.updateProjectInList(change.after);
        break;
      case 'deleted':
        this.removeProjectFromList(change.before);
        break;
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### `widgetSelectData: Subject<DtoDetail>`

Observable stream for widget drag/drop and selection events.

**Type:** `Subject<DtoDetail>`

**Purpose:** Broadcasts widget interactions for drag-and-drop functionality

**When to Use:**
- Implementing drag-and-drop between widgets
- Widget-to-widget communication
- Custom widget interactions

**Example:**
```typescript
export class WidgetDashboardComponent implements OnInit {
  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Listen for widget selections
    this.objectService.widgetSelectData.subscribe(dto => {
      console.log('Widget data selected:', dto);
      this.handleWidgetSelection(dto);
    });
  }

  handleWidgetSelection(dto: DtoDetail) {
    // React to widget selection/drag
    this.selectedEntity = dto;
    this.highlightWidget(dto);
  }
}
```

---

## Core Methods

### `broadcastObjectAction(event: ObjectChangeInformation): void`

Broadcasts entity changes to all subscribers across the application.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `ObjectChangeInformation` | Change information object |

**Returns:** `void`

**ObjectChangeInformation Interface:**

```typescript
interface ObjectChangeInformation {
  objectType: string;       // e.g., 'sp.Project', 'cr.Customer'
  action: string;          // 'created', 'updated', 'deleted', 'loaded'
  before?: DtoDetail;      // Entity state before change
  after?: DtoDetail;       // Entity state after change
  changedFields?: string[]; // List of changed field names
}
```

**When to Use:**
- After creating an entity
- After updating an entity
- After deleting an entity
- When entity state changes that other components need to know about

**Note:** Usually called automatically by `MvsCrudService`. Manual calls needed for custom scenarios.

#### Example 1: Manual Broadcast After Create

```typescript
export class ProjectCreatorComponent {
  constructor(
    private projectService: ProjectService,
    private objectService: MvsObjectService
  ) {}

  async createProject(projectDto: ProjectDto) {
    try {
      // Create entity
      const result = await this.projectService.create(projectDto).toPromise();

      // Manually broadcast (if service doesn't do it automatically)
      this.objectService.broadcastObjectAction({
        objectType: 'sp.Project',
        action: 'created',
        after: result
      });

      console.log('Project created and broadcasted');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }
}
```

#### Example 2: Broadcast with Before/After States

```typescript
export class ProjectEditorComponent {
  originalProject: ProjectDto;
  currentProject: ProjectDto;

  constructor(
    private projectService: ProjectService,
    private objectService: MvsObjectService
  ) {}

  async updateProject() {
    try {
      // Save original state
      this.originalProject = { ...this.currentProject };

      // Update entity
      const result = await this.projectService.update(this.currentProject).toPromise();

      // Broadcast with before/after comparison
      this.objectService.broadcastObjectAction({
        objectType: 'sp.Project',
        action: 'updated',
        before: this.originalProject,  // ← Previous state
        after: result,                 // ← New state
        changedFields: this.getChangedFields(this.originalProject, result)
      });

      console.log('Project updated and broadcasted');
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  }

  getChangedFields(before: ProjectDto, after: ProjectDto): string[] {
    const changed: string[] = [];
    for (const key in after) {
      if (before[key] !== after[key]) {
        changed.push(key);
      }
    }
    return changed;
  }
}
```

#### Example 3: Broadcast Delete Action

```typescript
export class ProjectListComponent {
  constructor(
    private projectService: ProjectService,
    private objectService: MvsObjectService,
    private confirmationService: ConfirmationService
  ) {}

  deleteProject(project: ProjectDto) {
    this.confirmationService.confirm({
      message: `Delete project "${project.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          // Delete entity
          await this.projectService.delete(project.id).toPromise();

          // Broadcast deletion
          this.objectService.broadcastObjectAction({
            objectType: 'sp.Project',
            action: 'deleted',
            before: project  // ← Include deleted entity info
          });

          console.log('Project deleted and broadcasted');
        } catch (error) {
          console.error('Failed to delete project:', error);
        }
      }
    });
  }
}
```

---

## Event Broadcasting

### Subscribing to Changes

#### Basic Subscription

```typescript
export class ProjectListComponent implements OnInit, OnDestroy {
  private changeSubscription: Subscription;
  projects: ProjectDto[] = [];

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Subscribe to all entity changes
    this.changeSubscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Filter for relevant entity types
      if (change.objectType === 'sp.Project') {
        this.handleChange(change);
      }
    });
  }

  handleChange(change: ObjectChangeInformation) {
    switch (change.action) {
      case 'created':
        // Add new project to list
        this.projects.unshift(change.after as ProjectDto);
        break;

      case 'updated':
        // Update existing project in list
        const index = this.projects.findIndex(p => p.id === change.after.id);
        if (index !== -1) {
          this.projects[index] = change.after as ProjectDto;
        }
        break;

      case 'deleted':
        // Remove project from list
        this.projects = this.projects.filter(p => p.id !== change.before?.id);
        break;

      case 'loaded':
        // Optional: handle entity load events
        console.log('Project loaded:', change.after);
        break;
    }
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

#### Multi-Entity Subscription

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private changeSubscription: Subscription;

  // Track multiple entity types
  relevantEntityTypes = ['sp.Project', 'sp.Sprint', 'tm.Ticket', 'cr.Customer'];

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    this.changeSubscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Check if entity type is relevant
      if (this.relevantEntityTypes.includes(change.objectType)) {
        this.handleEntityChange(change);
      }
    });
  }

  handleEntityChange(change: ObjectChangeInformation) {
    console.log(`${change.objectType} ${change.action}`);

    // Refresh dashboard stats
    this.refreshDashboardStats();

    // Show notification
    if (change.action === 'created') {
      this.showNotification(`New ${change.objectType} created`);
    }
  }

  refreshDashboardStats() {
    // Reload dashboard data
  }

  showNotification(message: string) {
    // Show toast notification
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

#### Filtered Subscription with RxJS Operators

```typescript
import { filter } from 'rxjs/operators';

export class ProjectDashboardComponent implements OnInit, OnDestroy {
  private changeSubscription: Subscription;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Use RxJS operators for filtering
    this.changeSubscription = this.objectService.objectChangeEvent.pipe(
      // Only care about projects
      filter(change => change.objectType === 'sp.Project'),
      // Only care about creates and updates
      filter(change => ['created', 'updated'].includes(change.action))
    ).subscribe(change => {
      console.log('Project created or updated:', change.after);
      this.refreshProjectDashboard();
    });
  }

  refreshProjectDashboard() {
    // Reload project statistics
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

#### Debounced Refresh

```typescript
import { debounceTime } from 'rxjs/operators';

export class ProjectListComponent implements OnInit, OnDestroy {
  private changeSubscription: Subscription;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Debounce refresh to avoid multiple refreshes in quick succession
    this.changeSubscription = this.objectService.objectChangeEvent.pipe(
      filter(change => change.objectType === 'sp.Project'),
      debounceTime(300)  // Wait 300ms before refreshing
    ).subscribe(change => {
      console.log('Refreshing after debounce');
      this.loadProjects();
    });
  }

  loadProjects() {
    // Reload project list
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

#### Conditional Refresh Based on Context

```typescript
export class ProjectWidgetComponent implements OnInit, OnDestroy {
  private changeSubscription: Subscription;
  currentProjectId: number;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    this.changeSubscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Only refresh if the changed entity is the current project
      if (change.objectType === 'sp.Project' && change.after?.id === this.currentProjectId) {
        console.log('Current project changed, refreshing');
        this.refreshProject();
      }

      // Also refresh if related entities change
      if (change.objectType === 'sp.Sprint' && change.after?.projectDtoId === this.currentProjectId) {
        console.log('Related sprint changed, refreshing');
        this.refreshProject();
      }
    });
  }

  refreshProject() {
    // Reload current project
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

---

## Widget Integration

### `widgetDragAction(event: DtoDetail): void`

Broadcasts widget drag/drop events.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `DtoDetail` | Entity being dragged/dropped |

**Returns:** `void`

**When to Use:**
- Implementing drag-and-drop functionality
- Custom widget interactions
- Cross-widget communication

#### Example 1: Drag Entity from Widget

```typescript
export class EntityTableWidgetComponent {
  constructor(private objectService: MvsObjectService) {}

  onDragStart(entity: DtoDetail, event: DragEvent) {
    // Store entity data
    event.dataTransfer!.setData('entity', JSON.stringify(entity));
    event.dataTransfer!.effectAllowed = 'copy';

    // Broadcast drag action
    this.objectService.widgetDragAction(entity);

    console.log('Started dragging:', entity);
  }
}

// Template:
// <tr *ngFor="let project of projects"
//     draggable="true"
//     (dragstart)="onDragStart(project, $event)">
//   <td>{{ project.name }}</td>
// </tr>
```

#### Example 2: Drop Entity on Widget

```typescript
export class DropZoneWidgetComponent implements OnInit {
  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Listen for widget drag actions
    this.objectService.widgetSelectData.subscribe(dto => {
      console.log('Entity dragged:', dto);
      this.highlightDropZone();
    });
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    // Get dropped entity
    const entityJson = event.dataTransfer!.getData('entity');
    const entity = JSON.parse(entityJson);

    console.log('Entity dropped:', entity);
    this.handleDroppedEntity(entity);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  handleDroppedEntity(entity: DtoDetail) {
    // Process dropped entity
    console.log('Processing dropped entity:', entity);
  }

  highlightDropZone() {
    // Visual feedback
  }
}

// Template:
// <div class="drop-zone"
//      (drop)="onDrop($event)"
//      (dragover)="onDragOver($event)">
//   Drop here
// </div>
```

#### Example 3: Widget-to-Widget Communication

```typescript
// Source Widget
export class SourceWidgetComponent {
  constructor(private objectService: MvsObjectService) {}

  selectEntity(entity: DtoDetail) {
    // Broadcast selection to other widgets
    this.objectService.widgetDragAction(entity);
    console.log('Entity selected:', entity);
  }
}

// Target Widget
export class TargetWidgetComponent implements OnInit {
  selectedEntity: DtoDetail | null = null;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    // Listen for entity selections
    this.objectService.widgetSelectData.subscribe(dto => {
      console.log('Entity selected in another widget:', dto);
      this.selectedEntity = dto;
      this.loadRelatedData(dto);
    });
  }

  loadRelatedData(entity: DtoDetail) {
    // Load data related to selected entity
    console.log('Loading related data for:', entity);
  }
}
```

---

## Navigation Integration

### `navigateToObject(navigationRequest: MvsObjectNavigationRequest): void`

Triggers navigation to an object (used internally).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `navigationRequest` | `MvsObjectNavigationRequest` | Navigation request object |

**Returns:** `void`

**Note:** In most cases, use `MvsObjectNavigationService.handleObjectNavigation()` instead.

**When to Use:**
- Internal navigation handling
- Custom navigation scenarios
- Advanced use cases

**Prefer Using:** `MvsObjectNavigationService` for standard navigation

#### Example: Manual Navigation (Advanced)

```typescript
export class CustomNavigationComponent {
  constructor(private objectService: MvsObjectService) {}

  navigateToProject(projectId: number) {
    const navigationRequest = new MvsObjectNavigationRequest();
    navigationRequest.objectIdentifier = new ObjectIdentifier('sp.Project', projectId);
    navigationRequest.location = 'main';  // 'main', 'right', 'dialog', etc.

    // Trigger navigation
    this.objectService.navigateToObject(navigationRequest);
  }
}
```

**Better Approach:** Use `MvsObjectNavigationService`

```typescript
export class StandardNavigationComponent {
  constructor(private navigationService: MvsObjectNavigationService) {}

  navigateToProject(projectId: number, event: MouseEvent) {
    const identifier = new ObjectIdentifier('sp.Project', projectId);

    // Let navigation service handle it
    this.navigationService.handleObjectNavigation(identifier, event);
    // Automatically opens in main, sidebar, or dialog based on context
  }
}
```

---

## Implementation Examples

### Example 1: Real-Time Dashboard

```typescript
@Component({
  selector: 'app-real-time-dashboard',
  templateUrl: './real-time-dashboard.component.html'
})
export class RealTimeDashboardComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  projectCount = 0;
  ticketCount = 0;
  customerCount = 0;

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    this.loadInitialCounts();
    this.subscribeToChanges();
  }

  loadInitialCounts() {
    // Load initial counts from API
  }

  subscribeToChanges() {
    this.subscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Update counts in real-time
      switch (change.objectType) {
        case 'sp.Project':
          this.updateProjectCount(change);
          break;
        case 'tm.Ticket':
          this.updateTicketCount(change);
          break;
        case 'cr.Customer':
          this.updateCustomerCount(change);
          break;
      }
    });
  }

  updateProjectCount(change: ObjectChangeInformation) {
    if (change.action === 'created') {
      this.projectCount++;
    } else if (change.action === 'deleted') {
      this.projectCount--;
    }
  }

  updateTicketCount(change: ObjectChangeInformation) {
    if (change.action === 'created') {
      this.ticketCount++;
    } else if (change.action === 'deleted') {
      this.ticketCount--;
    }
  }

  updateCustomerCount(change: ObjectChangeInformation) {
    if (change.action === 'created') {
      this.customerCount++;
    } else if (change.action === 'deleted') {
      this.customerCount--;
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### Example 2: Audit Log Component

```typescript
@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html'
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  auditLogs: AuditLog[] = [];

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    this.subscribeToChanges();
  }

  subscribeToChanges() {
    this.subscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Create audit log entry
      const logEntry: AuditLog = {
        timestamp: new Date(),
        entityType: change.objectType,
        action: change.action,
        entityId: change.after?.id || change.before?.id,
        entityName: change.after?.name || change.before?.name,
        changedFields: change.changedFields || [],
        before: change.before,
        after: change.after
      };

      // Add to log (newest first)
      this.auditLogs.unshift(logEntry);

      // Keep only last 100 entries
      if (this.auditLogs.length > 100) {
        this.auditLogs = this.auditLogs.slice(0, 100);
      }

      console.log('Audit log entry added:', logEntry);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}

interface AuditLog {
  timestamp: Date;
  entityType: string;
  action: string;
  entityId?: number;
  entityName?: string;
  changedFields: string[];
  before?: DtoDetail;
  after?: DtoDetail;
}
```

### Example 3: Related Entity Auto-Refresh

```typescript
@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html'
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  project: ProjectDto;
  sprints: SprintDto[] = [];

  constructor(private objectService: MvsObjectService) {}

  ngOnInit() {
    this.loadProject();
    this.subscribeToRelatedChanges();
  }

  loadProject() {
    // Load project data
  }

  subscribeToRelatedChanges() {
    this.subscription = this.objectService.objectChangeEvent.subscribe(change => {
      // Refresh if project itself changes
      if (change.objectType === 'sp.Project' && change.after?.id === this.project.id) {
        console.log('Project changed, refreshing');
        this.loadProject();
      }

      // Refresh if related sprint changes
      if (change.objectType === 'sp.Sprint') {
        const sprint = change.after || change.before;
        if (sprint?.projectDtoId === this.project.id) {
          console.log('Related sprint changed, refreshing sprints');
          this.loadSprints();
        }
      }
    });
  }

  loadSprints() {
    // Reload sprints for this project
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

---

## Best Practices

### 1. Always Unsubscribe

```typescript
// ✅ GOOD
export class MyComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = this.objectService.objectChangeEvent.subscribe(...);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();  // ← CRITICAL
  }
}

// ❌ BAD - Memory leak!
export class MyComponent implements OnInit {
  ngOnInit() {
    this.objectService.objectChangeEvent.subscribe(...);
    // Never unsubscribes!
  }
}
```

### 2. Filter for Relevant Entity Types

```typescript
// ✅ GOOD - Efficient filtering
this.objectService.objectChangeEvent.pipe(
  filter(change => change.objectType === 'sp.Project')
).subscribe(change => {
  this.handleProjectChange(change);
});

// ❌ BAD - Handles all entity types
this.objectService.objectChangeEvent.subscribe(change => {
  if (change.objectType === 'sp.Project') {  // Inefficient
    this.handleProjectChange(change);
  }
});
```

### 3. Use Debouncing for Expensive Operations

```typescript
// ✅ GOOD - Debounced refresh
this.objectService.objectChangeEvent.pipe(
  filter(change => change.objectType === 'sp.Project'),
  debounceTime(300)  // Wait 300ms
).subscribe(() => {
  this.loadProjects();  // Expensive operation
});

// ❌ BAD - Refreshes on every change
this.objectService.objectChangeEvent.subscribe(change => {
  if (change.objectType === 'sp.Project') {
    this.loadProjects();  // Called too often
  }
});
```

### 4. Emit Events After Successful Operations

```typescript
// ✅ GOOD - Emit after success
async saveProject() {
  try {
    const result = await this.projectService.update(this.dto).toPromise();

    // Emit after success
    this.objectService.broadcastObjectAction({
      objectType: 'sp.Project',
      action: 'updated',
      after: result
    });
  } catch (error) {
    console.error('Failed to save');
    // Don't emit on failure
  }
}

// ❌ BAD - Emits before confirmation
async saveProject() {
  // Emit before API call
  this.objectService.broadcastObjectAction({
    objectType: 'sp.Project',
    action: 'updated',
    after: this.dto
  });

  await this.projectService.update(this.dto).toPromise();
  // What if API call fails?
}
```

### 5. Include Relevant Context in Events

```typescript
// ✅ GOOD - Rich context
this.objectService.broadcastObjectAction({
  objectType: 'sp.Project',
  action: 'updated',
  before: this.originalProject,
  after: updatedProject,
  changedFields: ['name', 'status']
});

// ❌ BAD - Minimal context
this.objectService.broadcastObjectAction({
  objectType: 'sp.Project',
  action: 'updated',
  after: updatedProject
  // Missing before state and changedFields
});
```

### 6. Document Custom Event Actions

```typescript
// ✅ GOOD - Clear action names
this.objectService.broadcastObjectAction({
  objectType: 'sp.Project',
  action: 'status-changed',  // Custom action
  after: project
});

// Document custom actions:
// Actions: 'created', 'updated', 'deleted', 'loaded', 'status-changed'
```

---

## Related Documentation

- [MvsUiObjectService API Reference](MvsUiObjectService.md)
- [Object Service Complete Guide](./skill.md)
- [MvsObjectNavigationService Guide](/features/core/shared/navigation/navigation-service-guide.md)

---

**Last Updated:** 2026-01-07
**Version:** 1.0
