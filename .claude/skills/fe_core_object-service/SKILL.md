---
name: fe_core_object-service
description: "Frontend: Implement Object Service pattern for Angular entities. Use when creating CRUD services, entity components, create dialogs, or working with MvsCrudService, MvsUiObjectService, openObjectViaDialog, or entity management."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Object Service - Implementation Guide

Comprehensive guide for implementing the Object Service pattern in Alpha Frontend.

## 🚨 SCRIPT-FIRST ARCHITECTURE

### PRIMARY SOURCE OF TRUTH

**Scripts are authoritative. Claude MUST NOT duplicate their work.**

1. **Validation Script** (`scripts/check-guidelines.js`)
   - Validates ALL requirements from this documentation
   - Returns structured results (pass/fail/warnings)
   - **Claude**: Run script → Read JSON output → Summarize in ≤ 3 sentences

2. **Auto-Fix Script** (`scripts/fix-object-service-rules.js`)
   - Fixes ALL deterministic violations automatically
   - Returns JSON: `{ fixedFiles[], skippedFiles[], errors[] }`
   - **Claude**: Run script → Report results → NEVER manually replicate fixes

### CLAUDE INTERACTION RULES

**MUST NOT:**
- ❌ Reprint full object-service files
- ❌ Reprint full script output (summarize only)
- ❌ Explain rules already documented in this file
- ❌ Manually apply fixes that scripts can handle
- ❌ Describe violations in detail (scripts already do this)

**MUST:**
- ✅ Rely on script JSON output
- ✅ Summarize results in ≤ 3 sentences
- ✅ Direct users to scripts for validation/fixes
- ✅ Focus on orchestration, not reimplementation

### VALIDATION VS. FIXING

**Validation** (`check-guidelines.js`):
- Purpose: Verify compliance, report violations
- When: After generating code, before committing
- Output: Colorized console report with pass/fail/warnings

**Fixing** (`fix-object-service-rules.js`):
- Purpose: Automatically correct deterministic violations
- When: Only after user explicitly requests fixes
- Output: JSON with fixedFiles[], skippedFiles[], errors[]
- **REQUIRES USER APPROVAL** before running (except --dry-run)

### MODULE SCOPING

Both scripts support module-scoped processing:

**Single File Mode:**
```bash
node scripts/check-guidelines.js ./project.service.ts
node scripts/fix-object-service-rules.js ./project.service.ts --dry-run
```

**Directory Mode (Module-Filtered):**
```bash
# Only processes files matching: sp-*, cr-*, tm-*, mvs-*, [module]-*.ts
node scripts/check-guidelines.js ./src/app/sp/services
node scripts/fix-object-service-rules.js ./src/app/sp --dry-run
```

**Supported Module Prefixes:**
- `sp-*` (Service Provisioning)
- `cr-*` (CRM)
- `tm-*` (Time Management)
- `mvs-*` (MVS Core)
- Any `[2-4 letter prefix]-*.ts` pattern

### AUTO-FIX CAPABILITIES

The auto-fix script handles these deterministic violations:

**Services:**
- Missing `@Injectable()` decorator
- Missing `getObjectComponent(mode)` method
- Missing `MvsCrudModeEnum.create` handling
- Missing `getObjectLabels()` / `getObjectIcon()` methods

**Create Components:**
- Missing `@Output() onChangedObject`
- Missing `@Output() onCancelObject`
- Missing `this.onChangedObject.emit()` calls
- Missing `this.initialized = true`
- Missing `isDirty` tracking

**View Components:**
- Missing `super.ngOnInit()` calls
- Missing `super.ngOnChanges()` calls
- Missing `super.ngOnDestroy()` calls
- Missing `this.initialized = true`

**Limitations:**
- Cannot infer custom business logic
- Cannot add component imports (manual step)
- Cannot register in entity-provider (manual step)
- Cannot declare in module (manual step)

### SCRIPT INVOCATION WORKFLOW

1. **After Claude generates code:**
   ```bash
   node scripts/check-guidelines.js ./generated-file.ts
   ```

2. **If violations found:**
   ```bash
   # Preview fixes
   node scripts/fix-object-service-rules.js ./generated-file.ts --dry-run

   # Apply fixes (requires user approval)
   node scripts/fix-object-service-rules.js ./generated-file.ts
   ```

3. **Re-validate:**
   ```bash
   node scripts/check-guidelines.js ./generated-file.ts
   ```

4. **Claude reports results** (≤ 3 sentences):
   - "Validation passed with 15/15 checks."
   - "Auto-fix applied 3 corrections: added getObjectComponent(), added onChangedObject emit, added initialized flag."
   - "Manual steps: Add component import and register in entity-provider."

## Quick Start

### What is Object Service?

The Object Service is the core architectural pattern that manages all entity-related operations: CRUD, navigation, dialogs, and state management.

### Core Components

| Component | Purpose |
|-----------|---------|
| `MvsCrudService` | Base service class for entity operations |
| `MvsObjectService` | Event broadcasting and change notifications |
| `MvsUiObjectService` | Dialog management and UI operations |
| `MvsCoreService` | Service registry and dependency injection |
| `ObjectBaseComponent` | Base component for displaying entities |

## Critical Requirements

**ALL of these MUST be implemented. No exceptions.**

### 1. Service MUST Implement `getObjectComponent(mode)`

```typescript
@Injectable({ providedIn: 'root' })
export class ProjectService extends MvsCrudService {
  constructor(protected http: HttpClient) {
    super(http, MvsCrudService.baseUrl + '/sp/projects');
  }

  // MANDATORY - Without this, dialogs show empty
  getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
    if (mode === MvsCrudModeEnum.create) {
      return SpCreateObjectProjectComponent;
    }
    return SpProjectComponent;
  }
}
```

### 2. Create Component MUST Exist

Naming: `[Module]CreateObject[Entity]Component`

Examples:
- `CrCreateObjectCustomerComponent`
- `SpCreateObjectProjectComponent`
- `TmCreateObjectTicketComponent`

### 3. Entity MUST Be Registered

```typescript
export const SP_ENTITY_PROVIDER = [
  {
    provide: ENTITY_SERVICE_REGISTRY,
    useValue: [
      ['sp.Project', { route: 'sp/projects', service: ProjectService }],
    ] as EntityServiceEntry[],
    multi: true
  }
];
```

### 4. NEVER Use Custom Dialog HTML

```typescript
// WRONG - Custom dialog
<div class="dialog" *ngIf="showDialog">...</div>

// CORRECT - Use Object Service
this.objectService.openObjectViaDialog(
  null, 'sp.Project', 0, new ProjectDto(),
  false, false,
  (result) => { this.loadProjects(); },
  MvsCrudModeEnum.create
);
```

## Implementation Checklist

### Step 1: Create DTO Class

```typescript
export class ProjectDto extends DtoDetail {
  id?: number;
  name: string;
  description?: string;
  status?: number;

  constructor() {
    super();
    this.name = '';
  }
}
```

### Step 2: Create CRUD Service

```typescript
@Injectable({ providedIn: 'root' })
export class ProjectService extends MvsCrudService {
  constructor(protected http: HttpClient) {
    super(http, MvsCrudService.baseUrl + '/sp/projects');
  }

  getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
    if (mode === MvsCrudModeEnum.create) {
      return SpCreateObjectProjectComponent;
    }
    return SpProjectComponent;
  }

  getObjectLabels(): string[] {
    return ['Project', 'Projects'];
  }

  getObjectIcon(): string {
    return 'fa-solid fa-folder-open';
  }
}
```

### Step 3: Create Create Component

```typescript
@Component({
  selector: 'sp-create-object-project',
  templateUrl: './sp-create-object-project.component.html',
  standalone: false
})
export class SpCreateObjectProjectComponent extends ObjectBaseComponent implements OnInit {
  dto: ProjectDto = new ProjectDto();
  busy = false;

  constructor(
    protected coreService: MvsCoreService,
    protected messageService: MvsMessageService,
    protected confirmationService: ConfirmationService,
    protected observerService: ObserverService,
    protected projectService: ProjectService
  ) {
    super(coreService, messageService, confirmationService, observerService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.defaultCreateDto) {
      this.dto = this.defaultCreateDto as ProjectDto;
    }
    this.initialized = true;
  }

  async saveProject() {
    if (!this.dto.name?.trim()) {
      this.messageService.showError('Name is required', 'Validation Error');
      return;
    }

    this.busy = true;
    try {
      const result = await this.projectService.create(this.dto).toPromise();
      this.messageService.showSuccess('Project created', 'Success');

      // CRITICAL: Must emit this event
      this.onChangedObject.emit({
        objectType: 'sp.Project',
        action: 'created',
        after: result
      });

      this.isDirty = false;
    } catch (error) {
      this.messageService.showError('Failed to create project', 'Error');
    } finally {
      this.busy = false;
    }
  }

  onFieldChange() {
    this.isDirty = true;
    this.onComponentDirty.emit(true);
  }
}
```

### Step 4: Register in Entity Provider

```typescript
export const SP_ENTITY_PROVIDER = [
  {
    provide: ENTITY_SERVICE_REGISTRY,
    useValue: [
      ['sp.Project', { route: 'sp/projects', service: ProjectService }],
    ] as EntityServiceEntry[],
    multi: true
  }
];
```

### Step 5: Declare in Module

```typescript
@NgModule({
  declarations: [
    SpCreateObjectProjectComponent,
    SpProjectComponent,
  ],
  imports: [CoreModule, UiModule],
  providers: [SP_ENTITY_PROVIDER],
})
export class SpModule { }
```

### Step 6: Use in Pages

```typescript
createProject(): void {
  this.objectService.openObjectViaDialog(
    null,                      // importObjectContext
    'sp.Project',              // objectType
    0,                         // objectId (0 = create)
    new ProjectDto(),          // defaultCreateDto
    false,                     // readonly
    false,                     // disabled
    (result) => {              // onChangeFunction
      this.loadProjects();
    },
    MvsCrudModeEnum.create     // mode
  );
}
```

## Common Patterns

### Pre-filled Create Dialog

```typescript
const defaultDto = new ProjectDto();
defaultDto.sprintDtoId = sprintId;

this.objectService.openObjectViaDialog(
  null, 'sp.Project', 0, defaultDto,
  false, false,
  (result) => { this.loadProjects(); },
  MvsCrudModeEnum.create
);
```

### Read-Only View

```typescript
this.objectService.openObjectViaDialog(
  null, 'sp.Project', projectId, null,
  true,   // readonly
  false,
  null,
  MvsCrudModeEnum.read
);
```

### Listen to Changes

```typescript
this.objectService.objectChangeEvent.subscribe(change => {
  if (change.objectType === 'sp.Project') {
    this.loadProjects();
  }
});
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Dialog opens but empty | Missing `getObjectComponent()` | Implement method in service |
| Service not found | Not registered | Add to entity provider |
| List doesn't refresh | No callback | Add callback to openObjectViaDialog |
| onChangedObject not called | Missing emit | Add `this.onChangedObject.emit()` after save |

## API Reference

For detailed API documentation:

- [MvsObjectService API](MvsObjectService.md) - Event broadcasting, change notifications
- [MvsUiObjectService API](MvsUiObjectService.md) - Dialog management, repository selection

## Validation & Auto-Fix

### Validation

**Purpose:** Verify compliance with all Object Service guidelines.

```bash
# Validate single file
node scripts/check-guidelines.js ./project.service.ts

# Validate entire module directory (module-filtered)
node scripts/check-guidelines.js ./src/app/sp/services
```

**Output:** Colorized console report with:
- ✓ Passed checks
- ✗ Failed checks (with hints)
- ⚠ Warnings
- ○ Skipped checks

**Claude Response Pattern:**
- Read script output
- Summarize in ≤ 3 sentences
- Do NOT reprint full output

### Auto-Fix

**Purpose:** Automatically correct deterministic violations.

**⚠️ REQUIRES USER APPROVAL** before running (except `--dry-run`).

```bash
# Preview fixes without writing
node scripts/fix-object-service-rules.js ./project.service.ts --dry-run

# Apply fixes (user must approve)
node scripts/fix-object-service-rules.js ./project.service.ts

# Fix entire module directory
node scripts/fix-object-service-rules.js ./src/app/sp --dry-run
```

**Output:** JSON with:
```json
{
  "fixedFiles": [
    {
      "path": "path/to/file.ts",
      "fixes": ["Added getObjectComponent() method", "..."]
    }
  ],
  "skippedFiles": [...],
  "errors": [...]
}
```

**What Gets Fixed:**
- Services: Missing `getObjectComponent()`, `@Injectable()`, create mode handling
- Create Components: Missing `@Output()` events, `emit()` calls, initialization
- View Components: Missing `super` calls, initialization flags

**What Requires Manual Intervention:**
- Component imports in service files
- Entity provider registration
- Module declarations
- Custom business logic

**Claude Response Pattern:**
- Parse JSON output
- Report: "Fixed N files with M corrections"
- List files affected (not all fixes)
- Specify manual steps remaining
- Total response: ≤ 3 sentences
