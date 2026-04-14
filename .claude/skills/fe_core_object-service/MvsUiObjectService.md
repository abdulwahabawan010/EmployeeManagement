# MvsUiObjectService - API Reference

> **Complete API documentation for MvsUiObjectService - Dialog Management and UI Operations**

---

## Overview

**Location:** `features/core/shared/object/service/mvs-ui-object.service.ts`

**Purpose:** Extends MvsObjectService with dialog management capabilities for entity CRUD operations

**Extends:** `MvsObjectService`

**Key Responsibilities:**
- Opening entities in dialogs (create/edit/view)
- Managing dialog lifecycle
- Repository/list selection dialogs
- Object browser dialogs
- Widget-based dialogs

---

## Table of Contents

1. [Class Properties](#class-properties)
2. [Primary Dialog Methods](#primary-dialog-methods)
3. [Repository & Browser Methods](#repository--browser-methods)
4. [Widget Dialog Methods](#widget-dialog-methods)
5. [Dialog Registration (Internal)](#dialog-registration-internal)
6. [Complete Usage Examples](#complete-usage-examples)
7. [Common Patterns](#common-patterns)
8. [Best Practices](#best-practices)

---

## Class Properties

### `dialogComponent: MvsCrudObjectDialogComponent`

Reference to the registered dialog component.

**Type:** `MvsCrudObjectDialogComponent`

**Purpose:** Internal reference to the dialog component that handles entity dialogs

**Note:** Automatically registered by `MvsCrudObjectDialogComponent.ngOnInit()`

---

## Primary Dialog Methods

### `openObjectViaDialog()` - Main Dialog Method

Opens entity in a modal dialog for create/edit/view operations.

**This is the most commonly used method for entity dialogs.**

#### Full Signature

```typescript
public openObjectViaDialog(
  importObjectContextDto: DtoImportObjectContext,  // Import context (usually null)
  objectType: string,                              // 'sp.Project', 'cr.Customer'
  objectId: number,                                // 0 for create, ID for edit/view
  defaultCreateDto: DtoDetail,                     // Pre-filled DTO for create
  readonly: boolean,                               // Make form read-only
  disabled: boolean,                               // Disable all form controls
  onChangeFunction: Function,                      // Callback after save/create
  mode: MvsCrudModeEnum,                          // create, update, read
  widgetChangeOption?: string,                     // 'Object' or 'Form'
  formControlOverwrite?: MvsFormControlOverwrite,  // Override form controls
  closeDialogOnChange?: boolean                    // Auto-close after save
): void
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `importObjectContextDto` | `DtoImportObjectContext` | Yes | `null` | Import context (rarely used, pass `null`) |
| `objectType` | `string` | Yes | - | Entity type (e.g., `'sp.Project'`, `'cr.Customer'`) |
| `objectId` | `number` | Yes | - | Entity ID (`0` for create, ID for edit/view) |
| `defaultCreateDto` | `DtoDetail` | Yes | `null` | Pre-filled DTO for create mode |
| `readonly` | `boolean` | Yes | `false` | Make form read-only |
| `disabled` | `boolean` | Yes | `false` | Disable all form controls |
| `onChangeFunction` | `Function` | Yes | `null` | Callback when entity saved/created |
| `mode` | `MvsCrudModeEnum` | Yes | - | Mode: `create`, `update`, `read` |
| `widgetChangeOption` | `string` | No | `undefined` | `'Object'` or `'Form'` |
| `formControlOverwrite` | `MvsFormControlOverwrite` | No | `undefined` | Override form field visibility/behavior |
| `closeDialogOnChange` | `boolean` | No | `false` | Auto-close dialog after save |

#### Returns

`void` - Opens dialog asynchronously

---

### Usage Pattern 1: Create New Entity

```typescript
import { Component } from '@angular/core';
import { MvsUiObjectService } from '@core/shared/object/service/mvs-ui-object.service';
import { MvsCrudModeEnum } from '@core/shared/service/crud/mvs-crud-mode.enum';
import { ProjectDto } from './model/dto/entity/project.dto';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent {
  projects: ProjectDto[] = [];

  constructor(private objectService: MvsUiObjectService) {}

  createProject() {
    this.objectService.openObjectViaDialog(
      null,                      // importObjectContext (always null for basic usage)
      'sp.Project',              // objectType
      0,                         // objectId = 0 for create
      new ProjectDto(),          // defaultCreateDto (empty DTO)
      false,                     // readonly = false
      false,                     // disabled = false
      (result) => {              // onChangeFunction - called after success
        console.log('Project created:', result.after);
        this.loadProjects();     // Refresh list
      },
      MvsCrudModeEnum.create     // mode = create
    );
  }

  loadProjects() {
    // Reload project list
  }
}
```

---

### Usage Pattern 2: Edit Existing Entity

```typescript
editProject(projectId: number) {
  this.objectService.openObjectViaDialog(
    null,                      // importObjectContext
    'sp.Project',              // objectType
    projectId,                 // objectId = existing entity ID
    null,                      // defaultCreateDto = null (will load from API)
    false,                     // readonly = false
    false,                     // disabled = false
    (result) => {              // onChangeFunction
      console.log('Project updated:', result.after);
      this.loadProjects();     // Refresh list
    },
    MvsCrudModeEnum.update     // mode = update
  );
}
```

---

### Usage Pattern 3: View Entity (Read-Only)

```typescript
viewProject(projectId: number) {
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    projectId,
    null,
    true,                      // readonly = true (no save button)
    false,
    null,                      // onChangeFunction = null (no callback needed)
    MvsCrudModeEnum.read       // mode = read
  );
}
```

---

### Usage Pattern 4: Create with Pre-filled Data

```typescript
createProjectForSprint(sprintId: number, sprintName: string) {
  // Create DTO with pre-filled values
  const defaultDto = new ProjectDto();
  defaultDto.sprintDtoId = sprintId;
  defaultDto.sprintName = sprintName;
  defaultDto.status = 1;  // Default to 'Active'

  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    0,
    defaultDto,                // ← Pre-filled DTO
    false,
    false,
    (result) => {
      console.log('Project created for sprint:', result.after);
      this.loadProjects();
    },
    MvsCrudModeEnum.create
  );
}
```

---

### Usage Pattern 5: Disabled Form (View Only)

```typescript
viewProjectDisabled(projectId: number) {
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    projectId,
    null,
    false,
    true,                      // disabled = true (all fields disabled)
    null,
    MvsCrudModeEnum.update
  );
}
```

---

### Usage Pattern 6: Auto-Close After Save

```typescript
quickCreateProject() {
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    0,
    new ProjectDto(),
    false,
    false,
    (result) => {
      console.log('Project created, dialog will auto-close');
      this.loadProjects();
    },
    MvsCrudModeEnum.create,
    undefined,                 // widgetChangeOption
    undefined,                 // formControlOverwrite
    true                       // closeDialogOnChange = true (auto-close)
  );
}
```

---

### Usage Pattern 7: Override Form Fields

```typescript
quickEditProjectName(projectId: number) {
  // Create field overwrite to show only specific fields
  const fieldOverwrite = new MvsFormControlOverwrite();
  fieldOverwrite.visibleFields = ['name', 'status'];  // Only show these fields
  fieldOverwrite.requiredFields = ['name'];           // Mark as required

  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    projectId,
    null,
    false,
    false,
    (result) => {
      console.log('Quick edit completed');
      this.updateProjectInList(result.after);
    },
    MvsCrudModeEnum.update,
    undefined,
    fieldOverwrite             // ← Override fields
  );
}

updateProjectInList(project: ProjectDto) {
  const index = this.projects.findIndex(p => p.id === project.id);
  if (index !== -1) {
    this.projects[index] = project;
  }
}
```

---

### Usage Pattern 8: Chained Dialogs

```typescript
createProjectAndSprint() {
  // First create project
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    0,
    new ProjectDto(),
    false,
    false,
    (projectResult) => {
      const project = projectResult.after as ProjectDto;
      console.log('Project created:', project);

      // Then create sprint for that project
      const sprintDto = new SprintDto();
      sprintDto.projectDtoId = project.id;
      sprintDto.projectName = project.name;

      this.objectService.openObjectViaDialog(
        null,
        'sp.Sprint',
        0,
        sprintDto,
        false,
        false,
        (sprintResult) => {
          console.log('Sprint created:', sprintResult.after);
          this.loadProjectsAndSprints();
        },
        MvsCrudModeEnum.create
      );
    },
    MvsCrudModeEnum.create
  );
}
```

---

### Callback Function Structure

The `onChangeFunction` callback receives an `ObjectChangeInformation` object:

```typescript
interface ObjectChangeInformation {
  objectType: string;       // e.g., 'sp.Project'
  action: string;          // 'created', 'updated'
  before?: DtoDetail;      // Previous state (for updates)
  after?: DtoDetail;       // New state
  changedFields?: string[]; // Changed field names
}

// Example callback:
(result: ObjectChangeInformation) => {
  console.log('Action:', result.action);
  console.log('Entity:', result.after);

  if (result.action === 'created') {
    this.projects.unshift(result.after as ProjectDto);
  } else if (result.action === 'updated') {
    const index = this.projects.findIndex(p => p.id === result.after.id);
    if (index !== -1) {
      this.projects[index] = result.after as ProjectDto;
    }
  }
}
```

---

## Repository & Browser Methods

### `openObjectRepo()` - Repository/List Selection

Opens a dialog showing a list of entities for selection (repository pattern).

#### Signature

```typescript
public openObjectRepo(
  importObjectContextDto: DtoImportObjectContext,
  objectType: string,        // Entity type to select from
  objectId: number,          // Pre-selected ID (optional)
  onSelectFunction: Function // Callback when entity selected
): void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `importObjectContextDto` | `DtoImportObjectContext` | Yes | Import context (usually `null`) |
| `objectType` | `string` | Yes | Entity type (e.g., `'sp.Project'`) |
| `objectId` | `number` | Yes | Currently selected ID (or `0`) |
| `onSelectFunction` | `Function` | Yes | Callback when user selects entity |

#### Example 1: Select Project from List

```typescript
export class SprintFormComponent {
  sprint: SprintDto = new SprintDto();

  constructor(private objectService: MvsUiObjectService) {}

  selectProject() {
    this.objectService.openObjectRepo(
      null,
      'sp.Project',                    // Show list of projects
      this.sprint.projectDtoId,        // Currently selected (if any)
      (selectedProject: ProjectDto) => {
        // User selected a project
        console.log('Project selected:', selectedProject);

        this.sprint.projectDtoId = selectedProject.id;
        this.sprint.projectName = selectedProject.name;

        this.markFormAsDirty();
      }
    );
  }

  markFormAsDirty() {
    // Mark form as changed
  }
}
```

#### Example 2: Select Customer

```typescript
export class ContractFormComponent {
  contract: ContractDto = new ContractDto();

  constructor(private objectService: MvsUiObjectService) {}

  selectCustomer() {
    this.objectService.openObjectRepo(
      null,
      'cr.Customer',
      this.contract.customerDtoId,
      (selectedCustomer: CustomerDto) => {
        console.log('Customer selected:', selectedCustomer);

        this.contract.customerDtoId = selectedCustomer.id;
        this.contract.customerName = selectedCustomer.name;

        // Load customer-specific data
        this.loadCustomerContracts(selectedCustomer.id);
      }
    );
  }

  loadCustomerContracts(customerId: number) {
    // Load existing contracts for this customer
  }
}
```

#### Example 3: Select with Validation

```typescript
selectParentProject() {
  this.objectService.openObjectRepo(
    null,
    'sp.Project',
    this.currentProject.parentProjectDtoId,
    (selectedProject: ProjectDto) => {
      // Validate selection
      if (selectedProject.id === this.currentProject.id) {
        this.messageService.showError(
          'A project cannot be its own parent',
          'Invalid Selection'
        );
        return;
      }

      // Check for circular reference
      if (this.wouldCreateCircularReference(selectedProject.id)) {
        this.messageService.showError(
          'This would create a circular reference',
          'Invalid Selection'
        );
        return;
      }

      // Valid selection
      this.currentProject.parentProjectDtoId = selectedProject.id;
      this.currentProject.parentProjectName = selectedProject.name;
    }
  );
}

wouldCreateCircularReference(parentId: number): boolean {
  // Check if setting this parent would create a circular reference
  return false; // Implementation
}
```

---

### `openObjectBrowserViaDialog()` - Object Structure Browser

Opens hierarchical object structure browser (OS - Object Structure).

#### Signature

```typescript
public openObjectBrowserViaDialog(
  objectBrowserRequest: ObjectBrowserRequestDto,  // Browser configuration
  onChangeFunction: Function                      // Callback after selection
): void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `objectBrowserRequest` | `ObjectBrowserRequestDto` | Yes | Browser configuration |
| `onChangeFunction` | `Function` | Yes | Callback after selection |

#### ObjectBrowserRequestDto Structure

```typescript
interface ObjectBrowserRequestDto {
  path: string;                      // Object path (e.g., 'cr.Customer/123/sp.Project')
  createMode: boolean;               // Allow creating new objects
  dtoImportObjectContext: DtoImportObjectContext;
  entries?: ObjectBrowserEntry[];    // Pre-loaded entries
}
```

#### Example 1: Browse Project Structure

```typescript
export class ProjectExplorerComponent {
  constructor(private objectService: MvsUiObjectService) {}

  browseProjectStructure(projectId: number) {
    const request = new ObjectBrowserRequestDto();
    request.path = `sp.Project/${projectId}/sp.Sprint`;  // Navigate to sprints
    request.createMode = true;                            // Allow creating new sprints
    request.dtoImportObjectContext = null;

    this.objectService.openObjectBrowserViaDialog(
      request,
      (result) => {
        console.log('Selected from browser:', result);

        if (result.objectType && result.objectId) {
          this.navigateToObject(result.objectType, result.objectId);
        }
      }
    );
  }

  navigateToObject(objectType: string, objectId: number) {
    // Navigate to selected object
  }
}
```

#### Example 2: Browse Customer Hierarchy

```typescript
browseCustomerStructure(customerId: number) {
  const request = new ObjectBrowserRequestDto();
  request.path = `cr.Customer/${customerId}`;  // Start at customer
  request.createMode = false;                   // View only, no creation

  this.objectService.openObjectBrowserViaDialog(
    request,
    (selectedObject) => {
      console.log('Selected:', selectedObject);

      // Open selected object in dialog
      this.objectService.openObjectViaDialog(
        null,
        selectedObject.objectType,
        selectedObject.objectId,
        null,
        false,
        false,
        null,
        MvsCrudModeEnum.read
      );
    }
  );
}
```

#### Example 3: Create via Browser

```typescript
createInHierarchy(parentPath: string) {
  const request = new ObjectBrowserRequestDto();
  request.path = parentPath;        // e.g., 'sp.Project/123'
  request.createMode = true;        // ← Enable creation

  this.objectService.openObjectBrowserViaDialog(
    request,
    (result) => {
      if (result.action === 'created') {
        console.log('Created new object:', result.after);
        this.refreshHierarchy();
      } else if (result.action === 'selected') {
        console.log('Selected existing object:', result.after);
        this.loadObject(result.after);
      }
    }
  );
}

refreshHierarchy() {
  // Reload hierarchy view
}

loadObject(dto: DtoDetail) {
  // Load selected object
}
```

---

## Widget Dialog Methods

### `openObjectWidgetViaDialog()` - Widget-Based Dialog

Opens entity in widget dialog (compact view with widget features).

#### Signature

```typescript
public openObjectWidgetViaDialog(
  importObjectContextDto: DtoImportObjectContext,
  objectType: string,
  objectId: number,
  alias: string,                      // Widget alias/identifier
  name: string,                       // Display name
  defaultCreateDto: DtoDetail,
  onChangeFunction: Function,
  mode: MvsCrudModeEnum,
  formControlOverwrite?: MvsFormControlOverwrite
): void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alias` | `string` | Yes | Widget identifier/alias |
| `name` | `string` | Yes | Display name for dialog title |
| Other parameters | - | - | Same as `openObjectViaDialog()` |

#### Example 1: Quick Edit from Table

```typescript
export class ProjectTableComponent {
  projects: ProjectDto[] = [];

  constructor(private objectService: MvsUiObjectService) {}

  quickEditRow(project: ProjectDto) {
    this.objectService.openObjectWidgetViaDialog(
      null,
      'sp.Project',
      project.id,
      'project-quick-edit',      // Widget alias
      `Edit: ${project.name}`,   // Dialog title
      null,
      (result) => {
        // Update row with new data
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.projects[index] = result.after as ProjectDto;
        }
      },
      MvsCrudModeEnum.update,
      this.getQuickEditFields()  // Show only specific fields
    );
  }

  getQuickEditFields(): MvsFormControlOverwrite {
    const overwrite = new MvsFormControlOverwrite();
    overwrite.visibleFields = ['name', 'status', 'description'];
    return overwrite;
  }
}
```

#### Example 2: Inline Widget Create

```typescript
quickCreateFromWidget() {
  this.objectService.openObjectWidgetViaDialog(
    null,
    'sp.Project',
    0,
    'widget-quick-create',
    'Quick Create Project',
    new ProjectDto(),
    (result) => {
      console.log('Created:', result.after);
      this.addToWidgetList(result.after);
    },
    MvsCrudModeEnum.create
  );
}

addToWidgetList(project: ProjectDto) {
  // Add to widget's internal list
  this.widgetProjects.unshift(project);
}
```

#### Example 3: Custom Widget View

```typescript
viewInWidget(projectId: number, projectName: string) {
  this.objectService.openObjectWidgetViaDialog(
    null,
    'sp.Project',
    projectId,
    'widget-project-view',
    projectName,
    null,
    null,  // No callback for read-only
    MvsCrudModeEnum.read
  );
}
```

---

## Dialog Registration (Internal)

### Internal Registration Methods

**These are called automatically by dialog components. Do not call manually.**

#### `registerComponent(component: MvsCrudObjectDialogComponent): void`

Registers the main dialog component.

**Called by:** `MvsCrudObjectDialogComponent.ngOnInit()`

**Example (Internal):**
```typescript
// In MvsCrudObjectDialogComponent
ngOnInit(): void {
  this.objectService.registerComponent(this);  // Auto-registration
}
```

#### `unregisterComponent(component: MvsCrudObjectDialogComponent): void`

Unregisters the main dialog component.

**Called by:** `MvsCrudObjectDialogComponent.ngOnDestroy()`

**Example (Internal):**
```typescript
// In MvsCrudObjectDialogComponent
ngOnDestroy(): void {
  this.objectService.unregisterComponent(this);  // Auto-cleanup
}
```

#### `registerWidgetObjectComponent(component: MvsWidgetObjectDialogInterface): void`

Registers widget dialog component.

#### `unregisterWidgetObjectComponent(component: MvsWidgetObjectDialogInterface): void`

Unregisters widget dialog component.

---

## Complete Usage Examples

### Example 1: Full CRUD Page

```typescript
@Component({
  selector: 'app-project-management-page',
  templateUrl: './project-management.page.html'
})
export class ProjectManagementPage implements OnInit {
  projects: ProjectDto[] = [];
  loading = false;

  constructor(
    private projectService: ProjectService,
    private objectService: MvsUiObjectService,
    private messageService: MvsMessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    const request = new ObjectRequestList(true, [], []);

    this.projectService.list(request).subscribe({
      next: (response) => {
        this.projects = response.entries || [];
        this.loading = false;
      },
      error: (err) => {
        this.messageService.showError('Failed to load projects', 'Error');
        this.loading = false;
      }
    });
  }

  createProject() {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      0,
      new ProjectDto(),
      false,
      false,
      (result) => {
        this.messageService.showSuccess(
          `Project "${result.after.name}" created`,
          'Success'
        );
        this.loadProjects();
      },
      MvsCrudModeEnum.create
    );
  }

  editProject(project: ProjectDto) {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      project.id,
      null,
      false,
      false,
      (result) => {
        this.messageService.showSuccess('Project updated', 'Success');
        this.loadProjects();
      },
      MvsCrudModeEnum.update
    );
  }

  viewProject(project: ProjectDto) {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      project.id,
      null,
      true,  // Read-only
      false,
      null,
      MvsCrudModeEnum.read
    );
  }

  deleteProject(project: ProjectDto) {
    this.confirmationService.confirm({
      message: `Delete project "${project.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.projectService.delete(project.id).toPromise();
          this.messageService.showSuccess('Project deleted', 'Success');
          this.loadProjects();
        } catch (error) {
          this.messageService.showError('Failed to delete project', 'Error');
        }
      }
    });
  }

  duplicateProject(project: ProjectDto) {
    // Create copy of project
    const copyDto = { ...project };
    delete copyDto.id;
    copyDto.name = `${project.name} (Copy)`;

    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      0,
      copyDto,  // Pre-filled with copied data
      false,
      false,
      (result) => {
        this.messageService.showSuccess('Project duplicated', 'Success');
        this.loadProjects();
      },
      MvsCrudModeEnum.create
    );
  }
}
```

### Example 2: Master-Detail View

```typescript
@Component({
  selector: 'app-project-detail-page',
  templateUrl: './project-detail.page.html'
})
export class ProjectDetailPage implements OnInit, OnDestroy {
  projectId: number;
  project: ProjectDto;
  sprints: SprintDto[] = [];
  private changeSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private objectService: MvsUiObjectService
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id');
    this.loadProject();
    this.loadSprints();
    this.subscribeToChanges();
  }

  loadProject() {
    this.projectService.get(this.projectId).subscribe(data => {
      this.project = data;
    });
  }

  loadSprints() {
    const request = new ObjectRequestList(
      true,
      [FilterCriteria.create('project', FilterCriteria.cOperatorEqual, this.projectId)],
      []
    );

    this.sprintService.list(request).subscribe(response => {
      this.sprints = response.entries || [];
    });
  }

  subscribeToChanges() {
    // Auto-refresh when project or sprints change
    this.changeSubscription = this.objectService.objectChangeEvent.subscribe(change => {
      if (change.objectType === 'sp.Project' && change.after?.id === this.projectId) {
        this.loadProject();
      }

      if (change.objectType === 'sp.Sprint') {
        const sprint = change.after || change.before;
        if (sprint?.projectDtoId === this.projectId) {
          this.loadSprints();
        }
      }
    });
  }

  editProject() {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      this.projectId,
      null,
      false,
      false,
      (result) => {
        // Project auto-refreshes via subscription
        console.log('Project updated');
      },
      MvsCrudModeEnum.update
    );
  }

  createSprint() {
    const defaultDto = new SprintDto();
    defaultDto.projectDtoId = this.projectId;
    defaultDto.projectName = this.project.name;

    this.objectService.openObjectViaDialog(
      null,
      'sp.Sprint',
      0,
      defaultDto,
      false,
      false,
      (result) => {
        // Sprints auto-refresh via subscription
        console.log('Sprint created');
      },
      MvsCrudModeEnum.create
    );
  }

  editSprint(sprint: SprintDto) {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Sprint',
      sprint.id,
      null,
      false,
      false,
      null,
      MvsCrudModeEnum.update
    );
  }

  ngOnDestroy() {
    this.changeSubscription?.unsubscribe();
  }
}
```

### Example 3: Conditional Dialog Based on Context

```typescript
@Component({
  selector: 'app-context-aware-component',
  templateUrl: './context-aware.component.html'
})
export class ContextAwareComponent {
  constructor(
    private objectService: MvsUiObjectService,
    private authService: AuthService
  ) {}

  openProject(project: ProjectDto, context: 'view' | 'edit' | 'quick-edit') {
    const canEdit = this.authService.hasPermission('project.edit');

    switch (context) {
      case 'view':
        // Always allow view
        this.viewProject(project);
        break;

      case 'edit':
        // Full edit dialog
        if (canEdit) {
          this.editProject(project);
        } else {
          this.viewProject(project);  // Fallback to view
        }
        break;

      case 'quick-edit':
        // Quick edit with limited fields
        if (canEdit) {
          this.quickEditProject(project);
        } else {
          this.viewProject(project);
        }
        break;
    }
  }

  viewProject(project: ProjectDto) {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      project.id,
      null,
      true,   // Read-only
      false,
      null,
      MvsCrudModeEnum.read
    );
  }

  editProject(project: ProjectDto) {
    this.objectService.openObjectViaDialog(
      null,
      'sp.Project',
      project.id,
      null,
      false,
      false,
      (result) => { this.onProjectUpdated(result); },
      MvsCrudModeEnum.update
    );
  }

  quickEditProject(project: ProjectDto) {
    const fieldOverwrite = new MvsFormControlOverwrite();
    fieldOverwrite.visibleFields = ['name', 'status'];

    this.objectService.openObjectWidgetViaDialog(
      null,
      'sp.Project',
      project.id,
      'quick-edit',
      `Quick Edit: ${project.name}`,
      null,
      (result) => { this.onProjectUpdated(result); },
      MvsCrudModeEnum.update,
      fieldOverwrite
    );
  }

  onProjectUpdated(result: ObjectChangeInformation) {
    console.log('Project updated:', result.after);
    // Handle update
  }
}
```

---

## Common Patterns

### Pattern 1: Optimistic List Update

```typescript
createProject() {
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    0,
    new ProjectDto(),
    false,
    false,
    (result) => {
      // Optimistically add to list (don't reload from server)
      const newProject = result.after as ProjectDto;
      this.projects.unshift(newProject);

      this.messageService.showSuccess('Project created', 'Success');
    },
    MvsCrudModeEnum.create
  );
}
```

### Pattern 2: Validation Before Dialog

```typescript
editProject(project: ProjectDto) {
  // Validate before opening dialog
  if (!this.canEditProject(project)) {
    this.messageService.showError(
      'You do not have permission to edit this project',
      'Permission Denied'
    );
    return;
  }

  if (project.status === ProjectStatus.Archived) {
    this.confirmationService.confirm({
      message: 'This project is archived. Edit anyway?',
      header: 'Confirm Edit',
      accept: () => {
        this.openEditDialog(project);
      }
    });
  } else {
    this.openEditDialog(project);
  }
}

openEditDialog(project: ProjectDto) {
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    project.id,
    null,
    false,
    false,
    (result) => { this.loadProjects(); },
    MvsCrudModeEnum.update
  );
}

canEditProject(project: ProjectDto): boolean {
  return this.authService.hasPermission('project.edit');
}
```

### Pattern 3: Sequential Operations

```typescript
createProjectWithTasks() {
  // Step 1: Create project
  this.objectService.openObjectViaDialog(
    null,
    'sp.Project',
    0,
    new ProjectDto(),
    false,
    false,
    (projectResult) => {
      const project = projectResult.after as ProjectDto;

      // Step 2: Create default tasks for project
      this.createDefaultTasks(project.id);

      // Step 3: Reload list
      this.loadProjects();
    },
    MvsCrudModeEnum.create
  );
}

async createDefaultTasks(projectId: number) {
  const defaultTasks = ['Setup', 'Development', 'Testing', 'Deployment'];

  for (const taskName of defaultTasks) {
    const taskDto = new TaskDto();
    taskDto.name = taskName;
    taskDto.projectDtoId = projectId;

    await this.taskService.create(taskDto).toPromise();
  }

  console.log('Default tasks created');
}
```

---

## Best Practices

### 1. Always Provide Callback for Create/Edit

```typescript
// ✅ GOOD - Callback refreshes list
this.objectService.openObjectViaDialog(
  null, 'sp.Project', 0, new ProjectDto(),
  false, false,
  (result) => { this.loadProjects(); },  // ← Callback
  MvsCrudModeEnum.create
);

// ❌ BAD - No callback, list not refreshed
this.objectService.openObjectViaDialog(
  null, 'sp.Project', 0, new ProjectDto(),
  false, false,
  null,  // ← No callback
  MvsCrudModeEnum.create
);
```

### 2. Use Read Mode for View-Only

```typescript
// ✅ GOOD - Use read mode
viewProject(id: number) {
  this.objectService.openObjectViaDialog(
    null, 'sp.Project', id, null,
    true, false, null,
    MvsCrudModeEnum.read  // ← Read mode
  );
}

// ❌ BAD - Using update mode for view
viewProject(id: number) {
  this.objectService.openObjectViaDialog(
    null, 'sp.Project', id, null,
    true, false, null,
    MvsCrudModeEnum.update  // ← Wrong mode
  );
}
```

### 3. Pre-fill Related Entities

```typescript
// ✅ GOOD - Pre-fill relationships
createSprintForProject(project: ProjectDto) {
  const defaultDto = new SprintDto();
  defaultDto.projectDtoId = project.id;  // ← Pre-fill
  defaultDto.projectName = project.name;

  this.objectService.openObjectViaDialog(
    null, 'sp.Sprint', 0, defaultDto,
    false, false,
    (result) => { this.loadSprints(); },
    MvsCrudModeEnum.create
  );
}

// ❌ BAD - User must manually select project
createSprint() {
  this.objectService.openObjectViaDialog(
    null, 'sp.Sprint', 0, new SprintDto(),  // ← Empty
    false, false,
    (result) => { this.loadSprints(); },
    MvsCrudModeEnum.create
  );
}
```

### 4. Handle Errors in Callbacks

```typescript
// ✅ GOOD - Handle errors
this.objectService.openObjectViaDialog(
  null, 'sp.Project', 0, new ProjectDto(),
  false, false,
  (result) => {
    try {
      this.loadProjects();
      this.messageService.showSuccess('Project created', 'Success');
    } catch (error) {
      console.error('Failed to refresh:', error);
      this.messageService.showError('Failed to refresh list', 'Error');
    }
  },
  MvsCrudModeEnum.create
);
```

### 5. Use Field Overwrite for Quick Edits

```typescript
// ✅ GOOD - Show only relevant fields
quickEditStatus(project: ProjectDto) {
  const overwrite = new MvsFormControlOverwrite();
  overwrite.visibleFields = ['status'];  // Only status field

  this.objectService.openObjectViaDialog(
    null, 'sp.Project', project.id, null,
    false, false,
    (result) => { this.updateProjectInList(result.after); },
    MvsCrudModeEnum.update,
    undefined,
    overwrite  // ← Field overwrite
  );
}

// ❌ BAD - Show all fields for quick edit
quickEditStatus(project: ProjectDto) {
  this.objectService.openObjectViaDialog(
    null, 'sp.Project', project.id, null,
    false, false,
    (result) => { this.updateProjectInList(result.after); },
    MvsCrudModeEnum.update
    // No field overwrite - shows all fields
  );
}
```

---

## Related Documentation

- [MvsObjectService API Reference](MvsObjectService.md)
- [Object Service Complete Guide](./skill.md)
- [MvsCrudService API](/features/core/shared/service/crud/mvs-crud.service.md)

---

**Last Updated:** 2026-01-07
**Version:** 1.0
