---
name: fe_core_general-documentation
description: "Frontend: Angular project structure and general development guidelines. Enforces strict patterns for components, naming conventions, project organization, routing, and architectural decisions."
---

# Alpha Frontend - General Documentation

This skill defines MANDATORY rules for Angular development in this codebase. These rules are NON-NEGOTIABLE and OVERRIDE any inferred patterns or general Angular conventions.

## When This Skill Applies

This skill applies when:

- Creating new Angular components, pages, or services
- Organizing files and folders in the project structure
- Naming files, classes, selectors, or interfaces
- Setting up module routing
- Implementing component templates and inheritance patterns
- Working with the widget system
- Creating or modifying DTOs and entity services
- Registering modules in parent feature modules

## When This Skill Does NOT Apply

- Third-party library code
- Generated code from external tools
- Legacy code explicitly marked for deprecation

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [General Guidelines](#general-guidelines)
- [Naming Conventions](#naming-conventions)
- [Project Structure](#project-structure)
- [Feature and Module Structure](#feature-and-module-structure)
- [Component Templates](#component-templates)
- [Base Classes and Inheritance](#base-classes-and-inheritance)
- [Service Patterns](#service-patterns)
- [Entity Provider Pattern](#entity-provider-pattern)
- [Routing](#routing)
- [Widget System](#widget-system)
- [Testing Infrastructure](#testing-infrastructure)

---

## Technology Stack

- **Angular 20**
- **PrimeNG 20** - UI component library
- **PrimeFlex** - CSS utility library
- **FontAwesome** - Icon library

---

## General Guidelines

### Rules

1. **CSS Usage**
   - MUST only create custom CSS if absolutely necessary
   - MUST use PrimeNG components as much as possible
   - CSS class names MUST start with the 2-letter module code followed by a hyphen (e.g., `bm-custom-class`)
   - MUST use PrimeFlex utility classes for layout and spacing

2. **Code Style**
   - MUST prefer `for...of` loops over traditional `for` loops
   - Types MUST be qualified as precisely as possible
   - MUST create sub-methods to reduce complexity
   - MUST move common business logic to the `/logic` directory using helper classes

3. **Error Handling**
   - Error handling MUST always be defined
   - MUST use appropriate error handling patterns for API calls

4. **Component Development**
    - **No Standalone Components**: Components MUST NOT be standalone
        - MUST always use `standalone: false` in the `@Component` decorator
        - Components MUST be declared in their respective NgModule (`declarations` array)
        - This project uses NgModule-based architecture, not standalone components
    - **Component File Structure**: Components MUST have separate files:
        - TypeScript file (`.component.ts`) - Component class and logic only
        - HTML file (`.component.html`) - Template referenced via `templateUrl`
        - SCSS file (`.component.scss`) - Styles referenced via `styleUrls`
    - **Folder Organization**: ALL components, pages, services, and other code artifacts MUST be organized in separate folders
        - Each component MUST be in its own dedicated folder (e.g., `my-component/my-component.component.ts`)
        - Each page MUST be in its own dedicated folder (e.g., `my-page/my-page.page.ts`)
        - Each service, interface, DTO, and other artifacts MUST be in their own dedicated folders
        - MUST NEVER place multiple components, pages, or services directly in a parent directory without individual folders
        - This applies to ALL file types: components, pages, services, DTOs, interfaces, enums, etc.
    - MUST NEVER use inline templates (`template:`) or inline styles (`styles:`) in components
    - MUST NEVER combine template, styles, and logic in a single `.ts` file
    - Proper component initialization MUST be followed
    - Busy states MUST be implemented for async operations
    - MUST use inheritance for components and pages to follow design guidelines

5. **Icons**
   - FontAwesome icons are used throughout the application

### Architecture Philosophy

The Angular application is created in a **modolithic** way (similar to the back-end). Functionalities are combined within modules, and modules are combined within features. Components are reused in a generic way to reduce implementation time for new features.

---

## Naming Conventions

### File Naming

File names MUST follow this convention:

```
<name-of-object-separated-with-hyphen-and-lowercase>.<type>.<file-extension>
```

### Available Types

| Type | Description | Example |
|------|-------------|---------|
| `dto` | Data Transfer Object | `customer.dto.ts` |
| `service` | Service Implementation | `customer.service.ts` |
| `component` | Component Implementation | `customer-details.component.ts` |
| `enum` | Enumeration | `customer-status.enum.ts` |
| `page` | Page Component | `customer-overview.page.ts` |
| `interface` | Interface Definition | `customer-filter.interface.ts` |
| `module` | Angular Module | `cr.module.ts` |
| `route` | Route Definition | `cr.route.ts` |
| `entity-provider` | Entity Provider | `cr.entity-provider.ts` |

### Entity Type Format

Entity types MUST follow the pattern: `[alias].[EntityName]`
- Examples: `pc.Call`, `cr.Customer`, `bm.Invoice`
- MUST use PascalCase for entity names
- MUST use lowercase for the module alias

### CSS Selector Convention

- MUST prefix with `mvs-` followed by kebab-case: `mvs-pc-call`, `mvs-example-component`
- Some components use module prefix: `pc-qm-dashboard`

### Interface Guidelines

Interfaces MUST follow these strict rules:

1. **Separate File per Interface**: Each interface MUST be in its own file
   - File naming: `[name].interface.ts`
   - Example: `bm-camt-data.interface.ts`, `job-stat-menu.interface.ts`

2. **Dedicated Interface Folder**: Interfaces MUST be placed in a dedicated `interface/` folder
   - Location: `<module-alias>/interface/`
   - Example: `bm/interface/`, `jb/interface/`

3. **Full Path Structure**:
   ```
   features/feature-<feature-name>/<module-alias>/interface/<name>.interface.ts
   ```

   **Examples**:
   - `features/feature-bm/bm/interface/bm-camt-data.interface.ts`
   - `features/feature-tech/jb/interface/job-stat-menu.interface.ts`

4. **MUST NEVER**:
   - Combine multiple interfaces in a single file
   - Place interfaces directly in component folders
   - Create interfaces inline within other files

---

## Project Structure

### Root Directories

```
/
├── features/                    # All modules grouped into features
└── projects/                    # Shell applications
    ├── shell-alpha/             # Key user application (power users)
    │   └── src/app/
    │       ├── templates/       # Component templates for developers
    │       ├── test/            # Testing utilities and test pages
    │       └── providers/       # Angular providers for configuration
    └── shell-consultant/        # Consultant application (limited access)
```

### Shell Applications

| Shell | Purpose | Target Users |
|-------|---------|--------------|
| `shell-alpha` | Full access to all features and functionalities | Power users, key users |
| `shell-consultant` | Limited access with adjusted UX | Regular (non-key) users, consultants |

---

## Feature and Module Structure

### Features Directory (`/features`)

The feature folder contains all modules grouped into features. Each module has a **two-character code** (e.g., `tm` = Ticket Management, `dm` = Document Management, `cm` = Contract Management).

**Special Features:**
- `feature-auth` - Authentication and authorization (cross-feature)
- `feature-core` - Core components to run the application (cross-feature)

These two features don't follow the standard feature/module structure as they are used across all features.

**Feature Directory Naming:**
```
feature-<feature-name>/
```

The feature name MUST be a short abbreviation.

### Feature Module Files

Each feature MUST define two modules:

| File | Purpose |
|------|---------|
| `feature-<feature-name>.module.ts` | @NgModule definition |
| `feature-<feature-name>.routing.module.ts` | Routing within the feature |

The routing module contains the `get<FeatureName>Routers` function which exports routes for all modules within the feature.

### Module Registration in Parent Feature Module

**CRITICAL:** When creating a new module within ANY feature, the module MUST be registered in its parent feature module file (`feature-<feature-name>.module.ts`).

**Required Steps:**

1. **Import the module** at the top of the parent feature module file
2. **Add to `imports` array** in the @NgModule decorator
3. **Add to `exports` array** in the @NgModule decorator

**Template:**

```typescript
// feature-<feature-name>.module.ts

// 1. Import at top of file
import { <ModuleAlias>Module } from "./<module-alias>/<module-alias>.module";

@NgModule({
    exports: [
        // ... existing modules
        <ModuleAlias>Module,  // 2. Add to exports
    ],
    imports: [
        // ... existing modules
        <ModuleAlias>Module,  // 3. Add to imports
        Feature<FeatureName>RoutingModule
    ]
})
export class Feature<FeatureName>Module { }
```

**Why both imports AND exports?**
- **imports**: Makes the module's components, directives, and pipes available within this feature
- **exports**: Re-exports the module so other features/shells can access its public components

**Rules:**
- MUST ALWAYS add new modules to BOTH `imports` AND `exports` arrays
- MUST ALWAYS add the import statement at the top of the file
- MUST NEVER create a module without registering it in its parent feature module
- This applies to ALL features: `feature-core`, `feature-bm`, `feature-tech`, etc.

### Module Structure

Each module is identified by a **two-letter code** and MUST have its own sub-directory below the feature directory.

```
<module-alias>/
├── component/                    # All non-page components
│   ├── object-components/        # Entity-related components
│   ├── private-components/       # Module-only components (NEVER use outside)
│   ├── protected-components/     # Feature-shared components
│   └── public-components/        # Cross-feature shared components
├── interface/                    # TypeScript interfaces (one interface per file)
├── model/                        # Interfaces and classes
│   ├── dto/                      # Data Transfer Objects
│   │   ├── entity/               # Entity DTOs
│   │   ├── api/                  # Non-entity API DTOs
│   │   └── enum/                 # DTO-related enums
│   ├── private-domain/           # Module-only models
│   │   └── enum/
│   ├── protected-domain/         # Feature-shared models
│   │   └── enum/
│   └── public-domain/            # Cross-feature models
│       └── enum/
├── logic/                        # Reusable business logic
├── page/                         # Page components
│   ├── dashboards/               # Dashboard pages
│   ├── overview/                 # Overview pages (obsolete, migrating to dashboards)
│   ├── config/                   # Configuration pages
│   └── object-pages/             # Object detail pages (obsolete)
├── service/
│   ├── api/                      # CRUD and API services
│   └── domain/                   # Domain-specific services (or /ui)
├── test/                         # Test definitions
├── activity/                     # Activity-specific components (optional)
├── <alias>.module.ts             # @NgModule definition
├── <alias>.route.ts              # Route definitions
└── <alias>.entity-provider.ts    # Entity service registry
```

### Component Visibility Rules

| Directory | Can Use Within | Can Export |
|-----------|----------------|------------|
| `/private-components` | Same module only | Never |
| `/protected-components` | Same module + same feature modules | Yes |
| `/public-components` | Any module | Yes |

**Import Rules:**
1. A component import is only allowed if:
   - The component is within the same module
   - The component is within the same feature AND is in `/protected-components` or `/public-components`
   - The component is in another feature AND is in `/public-components`

2. A component can only be exported if it is in `/protected-components` or `/public-components`

**Violating these rules is an access violation! Claude MUST STOP and report any such violations.**

### Object Components Structure

Object components display entities and support multiple view modes:

```
object-components/
└── <entity>-object-component/
    ├── view/
    │   ├── <entity>-base.component.ts    # Shared logic
    │   ├── <entity>-full/                # Full-width view
    │   └── <entity>-side/                # Side-panel view
    └── shared/
        ├── <entity>-basic-details/       # Sub-components
        └── <entity>-transactions/
```

### DTO Classes

Entity DTOs MUST inherit from base classes:

| Base Class | Usage |
|------------|-------|
| `DtoDetail` | Standard entity DTOs |
| `DtoDetailConfigurable` | Configurable entity DTOs |

API DTOs can be either classes or interfaces depending on the use case.

---

## Component Templates

Templates are located at: `/projects/shell-alpha/src/app/templates`

### Available Templates

#### 1. Basic Component (`example-component`)

Template for simple, stateless components.

**Inherits:** Direct Angular Component (no special base class)
**Implements:** `OnInit`, `OnChanges`, `OnDestroy`

**Key Pattern:**
```typescript
export class ExampleComponent implements OnInit, OnChanges, OnDestroy {
  busy: boolean = false;
  initialized: boolean = false;

  ngOnInit(): void {
    this.initComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    this.refreshComponent();
  }

  initComponent(): void {
    // Initialization logic
    this.initialized = true;
  }

  refreshComponent(): void {
    // Refresh logic when inputs change
  }
}
```

#### 2. Object Component (`example-object-component`)

Template for components displaying a single entity/object.

**Inherits:** `ObjectBaseComponent`
**Implements:** `OnInit`, `OnChanges`, `OnDestroy`

**Key Features:**
- Uses `ObjectIdentifier` to identify which object to load
- Auto-fetches object from CRUD service
- Emits events for object load success/error
- Dirty state tracking via `isDirty` flag

**Key Method:** Override `onObjectChanged()` to handle object changes

#### 3. Object Component with View Modes (`example-new-object-component`)

Template for object components with different display modes (full/side).

**Class Hierarchy:**
```
ExampleNewObjectComponent extends ObjectBaseComponent
    └── ExampleComponentBase extends ObjectBaseModeComponent
        ├── ExampleComponentFull extends ExampleComponentBase
        └── ExampleComponentSide extends ExampleComponentBase
```

**Usage:** Used for responsive UI that changes layout based on view mode.

#### 4. Overview Page (`example-overview-page`)

Template for overview/list pages.

**Inherits:** `PageComponent`
**Implements:** `OnInit`, `OnChanges`, `OnDestroy`

**Key Features:**
- `defaultLabel` property for page title
- Integrates with page context service
- Handles navigation and parameter subscription

#### 5. Object Page (`example-object-page`)

Template for displaying a single object detail.

**Inherits:** `ObjectPageComponent`
**Implements:** `OnInit`, `OnDestroy`, `OnChanges`

**Required Implementation:**
```typescript
getObjectType(): string {
  return 'pc.Call'; // Entity type
}
```

**Key Features:**
- Auto-handles routing and object loading
- Dynamically loads object component based on entity type

#### 6. Dashboard Page (`example-dashboard-page`)

Template for dashboard pages with navigation.

**Inherits:** `MvsDashboardPage`
**Implements:** `OnInit`, `OnChanges`, `OnDestroy`

**Key Features:**
- Main/sub selections management
- Option groups and filters
- Widget data management
- Complex lifecycle with async data loading

#### 7. Configuration Page (`example-overview-config-page`)

Template for configuration/settings pages.

**Inherits:** `PageComponent`

**Key Features:**
- Uses `objectBrowserRequest` for nested object browser
- `ObjectRequestList` for defining object hierarchy

#### 8. Cross-Cutting Component (`example-cross-component`)

Template for components that work across multiple modules.

**Structure:**
```
example-cross-component/
├── example-cross.component.ts       # Main component
├── example-cross-model.interface.ts # Model interface
├── example-cross-test.component.ts  # Test component
└── example-cross.spec.ts            # Unit tests
```

---

## Base Classes and Inheritance

### Class Hierarchy

```
Angular Component
├── PageComponent                     # Base for all pages
│   ├── ObjectPageComponent           # Object detail pages
│   │   └── [Specific Object Pages]
│   └── [Specific Overview Pages]
│
├── MvsDashboardPage                  # Base for dashboards
│   └── [Specific Dashboard Pages]
│
└── ObjectBaseComponent               # Base for object display
    ├── ObjectBaseModeComponent       # Adds view mode support
    │   └── [View Mode Components]
    └── [Specific Object Components]
```

### ObjectBaseComponent

**Location:** `/features/core/shared/object/mvs-object-base/object-base.component.ts`

**Key Inputs:**
- `ObjectIdentifier` - Identifies the object to load
- `UiMode` - UI display mode
- `viewType` - View type (full/side)

**Key Outputs:**
- `onObjectLoadSuccessful` - Emitted when object loads successfully
- `onObjectLoadError` - Emitted on load error
- `onChangedObject` - Emitted when object changes
- `onComponentDirty` - Emitted when component becomes dirty

### PageComponent

**Location:** `/features/core/shared/mvs-page/page.component.ts`

**Key Features:**
- Manages page lifecycle
- Integrates with page context service
- Handles navigation items and breadcrumbs
- Logs page visits

### MvsDashboardPage

**Location:** `/features/core/shared/dashboard/page/dashboard-page/mvs-dashboard.page.ts`

**Key Features:**
- Main/sub/filter selections
- Option groups management
- Widget data management
- Complex async loading lifecycle

---

## Service Patterns

### CRUD Service

**Base Class:** `MvsCrudService` (extends `MvsHttpGeneric`)
**Location:** `/features/core/shared/service/crud/mvs-crud.service.ts`

**Standard Methods:**

| Method | Description |
|--------|-------------|
| `get(id: number)` | Fetch single entity |
| `getLight(id: number)` | Fetch without form/resolved entities |
| `list(request: ObjectRequestList)` | List with filtering/sorting |
| `listByAttribute(attribute, value, sorting)` | List by specific attribute |
| `getByAttribute(attribute, value)` | Get single by attribute |
| `search(value)` | Search by name pattern |
| `create(dto)` | Create new entity |
| `update(dto)` | Update entity |
| `delete(id)` | Delete entity |
| `history(request)` | Get entity history |

**Example Service:**

```typescript
@Injectable({
  providedIn: 'root'
})
export class CallService extends MvsCrudService {
  constructor(protected http: HttpClient) {
    super(http, MvsCrudService.baseUrl + '/pc/calls');
  }

  getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
    if (mode !== MvsCrudModeEnum.create) {
      return PcCallComponent;
    }
    return null;
  }
}
```

### UI/Domain Services

For non-API business logic, create services in the `/service/domain` (or `/service/ui`) directory:

```typescript
@Injectable({
  providedIn: 'root'
})
export class CallUIService {
  // UI-specific business logic
}
```

---

## Entity Provider Pattern

**Purpose:** Registry pattern for mapping entity types to CRUD services and components.

**Location:** `<module-alias>.entity-provider.ts`

**Structure:**

```typescript
export const PC_ENTITY_PROVIDER = [
  {
    provide: ENTITY_SERVICE_REGISTRY,
    useValue: [
      ['pc.CallType', { route: 'about:blank', service: CallTypeService }],
      ['pc.Call', { route: 'about:blank', service: CallService }],
      ['pc.CallRecording', { route: 'about:blank', service: CallRecordingService }],
      // ... more entries
    ],
    multi: true
  }
];
```

**Key Points:**
- String tuple format: `[entityType, { route, service }]`
- Service MUST extend `MvsCrudService`
- Routes can be actual routes or `'about:blank'` for dynamic loading
- MUST import the provider in the module's `providers` array

---

## Routing

### Complete Routing Setup Process

When creating a new module, routing MUST be set up in **THREE locations** in the following order:

1. **Create Module Route File** (`<module-alias>.route.ts`)
2. **Register Routes in Feature Routing Module** (`feature-<feature-name>.routing.module.ts`)
3. **Verify Feature Module Registration** (`feature-<feature-name>.module.ts`)

**Claude MUST verify all three steps are complete before considering routing setup done.**

---

### 1. Module Route File Pattern

**Location:** `features/feature-<feature-name>/<module-alias>/<module-alias>.route.ts`

**File Structure:**
```typescript
import {Routes} from "@angular/router";
// Import all page components that will be routed
import {PcConfigPage} from "./page/config/pc-config/pc-config.page";
import {PcOverviewPage} from "./page/overview/pc-overview/pc-overview.page";
import {PcCallPage} from "./page/object-pages/pc-call/pc-call.page";

export function PcSubRoutes() : Routes {

    /**
     *
     * path:
     * Prefix of the module will always be added to the path name
     *
     *      Example
     *      path: "config" => route path "pc/config" !
     * ------------------------------------------------------------------
     *
     * canActivate:
     * The authentication guard MsalGuard will be added automatically!
     * ------------------------------------------------------------------
     *
     * component:
     * Added components need to be from type "Page"!
     * ------------------------------------------------------------------
     *
     */
    const routes = [
        // Configuration routes
        {path: 'pc/config', component: PcConfigPage},

        // Overview/list routes
        {path: 'pc/overview', component: PcOverviewPage},

        // Object detail routes with parameters
        {path: 'pc/call/:id', component: PcCallPage},

        // Nested routes with multiple parameters
        {path: 'pc/projects/:projectId/sprints/:sprintId', component: SprintDetailPage},
    ];

    return routes;

}
```

**Function Naming Convention:**
- Function name MUST be: `<ModuleAlias>SubRoutes` (PascalCase)
- Examples: `TmSubRoutes`, `SpSubRoutes`, `CrSubRoutes`
- MUST NEVER use lowercase or different naming patterns

**Route Path Rules:**
1. Path MUST include the full module prefix (e.g., `'pc/config'` not just `'config'`)
2. Route pattern: `'<2-letter-module-code>/<path>'`
3. **ONLY page components can be linked to routes**
4. MUST NEVER route to non-page components (components, services, etc.)
5. MUST use lowercase with hyphens for multi-word paths (e.g., `'sp/sprint-detail'`)
6. MUST use route parameters with colon prefix (e.g., `':id'`, `':projectId'`)
7. MUST group related routes with comments for clarity
8. MUST always include the standard JSDoc comment block explaining the pattern

---

### 2. Feature Routing Module Registration

**CRITICAL:** After creating the module route file, you MUST register it in the feature routing module.

**Location:** `features/feature-<feature-name>/feature-<feature-name>.routing.module.ts`

**Step 1: Import the SubRoutes Function**

Add the import at the top of the file (maintain alphabetical order):

```typescript
import {NgModule} from "@angular/core";
import {Route, RouterModule, Routes} from "@angular/router";
import {AmSubRoutes} from "./am/am.route";
import {DmSubRoutes} from "./dm/dm.route";
// ... other imports in alphabetical order
import {PcSubRoutes} from "./pc/pc.route";  // ← ADD THIS
import {SpSubRoutes} from "./sp/sp.route";
// ... remaining imports
```

**Step 2: Register in getCrmRouters() Function**

Add an entry to the `getCrmRouters()` array (maintain alphabetical order by module code):

```typescript
export function getCrmRouters(): { name: string; routeMethod: () => Routes }[] {
    return [
        {name : "am", routeMethod: AmSubRoutes },
        {name : "dm", routeMethod: DmSubRoutes },
        // ... other entries in alphabetical order
        {name : "pc", routeMethod: PcSubRoutes },  // ← ADD THIS
        {name : "sp", routeMethod: SpSubRoutes },
        // ... remaining entries
    ];
}
```

**Important:**
- The `name` property MUST match the module alias (2-letter code) in lowercase
- The `routeMethod` property MUST reference the SubRoutes function
- MUST maintain strict alphabetical order by module code
- Each entry MUST end with a comma

**Complete Feature Routing Module Structure:**

```typescript
import {NgModule} from "@angular/core";
import {Route, RouterModule, Routes} from "@angular/router";
import {AmSubRoutes} from "./am/am.route";
import {PcSubRoutes} from "./pc/pc.route";
import {SpSubRoutes} from "./sp/sp.route";
// ... all other imports

export function getCrmRouters(): { name: string; routeMethod: () => Routes }[] {
    return [
        {name : "am", routeMethod: AmSubRoutes },
        {name : "pc", routeMethod: PcSubRoutes },
        {name : "sp", routeMethod: SpSubRoutes },
        // ... all other entries
    ];
}

function collectCrmSubRoutes(): Route[] {
    const routes: Route[] = [];
    const crmRouters = getCrmRouters();
    for (const router of crmRouters) {
        const subRoutes = router.routeMethod();
        if (subRoutes) {
            routes.push(...subRoutes);
        }
    }
    return routes;
}

const routes: Routes = [
    {
        path: '',
        children: collectCrmSubRoutes(),
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class FeatureCoreRoutingModule {}
```

---

### 3. Feature Module Verification

**Location:** `features/feature-<feature-name>/feature-<feature-name>.module.ts`

Verify that the module is imported and exported in the feature module:

```typescript
import {NgModule} from '@angular/core';
import {PcModule} from "./pc/pc.module";
import {FeatureCoreRoutingModule} from "./feature-core.routing.module";
// ... other imports

@NgModule({
    exports: [
        PcModule,
        // ... other modules
    ],
    imports: [
        PcModule,
        // ... other modules
        FeatureCoreRoutingModule  // ← MUST be imported LAST
    ]
})
export class FeatureCoreModule {}
```

**Critical:** `FeatureCoreRoutingModule` MUST be imported AFTER all other module imports.

---

### Routing Setup Checklist

When creating a new module, Claude MUST verify all routing steps:

- [ ] Created `<module-alias>.route.ts` file in module directory
- [ ] Named export function as `<ModuleAlias>SubRoutes(): Routes`
- [ ] Included standard JSDoc comment block in route file
- [ ] All route paths prefixed with module code (e.g., `'pc/config'`)
- [ ] Only page components are routed (no regular components)
- [ ] Added import statement to feature routing module (alphabetical order)
- [ ] Added entry to `getCrmRouters()` array (alphabetical order)
- [ ] Verified module is imported in feature module
- [ ] Verified `FeatureCoreRoutingModule` is imported last

**Claude MUST NOT consider routing complete until ALL items are checked.**

---

### Common Routing Patterns

**Simple List/Overview Page:**
```typescript
{path: 'pc/overview', component: PcOverviewPage}
```

**Detail Page with ID Parameter:**
```typescript
{path: 'pc/call/:id', component: PcCallPage}
```

**Configuration Page:**
```typescript
{path: 'pc/config', component: PcConfigPage}
```

**Nested Routes (Parent-Child Relationships):**
```typescript
{path: 'sp/projects/:projectId', component: ProjectDetailPage},
{path: 'sp/projects/:projectId/sprints', component: SprintListPage},
{path: 'sp/projects/:projectId/sprints/:sprintId', component: SprintDetailPage},
```

**Multiple Views of Same Entity:**
```typescript
{path: 'sp/sprints/:sprintId/kanban', component: SprintKanbanPage},
{path: 'sp/sprints/:sprintId/leaderboard', component: SprintLeaderboardPage},
{path: 'sp/sprints/:sprintId/tickets', component: SprintTicketsTablePage},
```

---

## Widget System

The widget system provides declarative data display components.

### Widget Creation

```typescript
widgetObject = WidgetFactory.createWidgetEntityData(
  'unique.widget.id',
  'Display Label',
  'entity.Type',
  entityId,
  WidgetDataParam.create('size', 'S')
);
```

### Key Components

**Location:** `/features/core/shared/widget/`

- Widget Factory - Creates widget configurations
- Widget Configuration Service - Manages widget settings
- Widget Data - Data container for widgets

### Display Types

Widgets support multiple display types:
- List
- Table
- Card
- Custom

---

## Testing Infrastructure

### Test Module Location

`/projects/shell-alpha/src/app/test/`

### Test Definition Registry

```typescript
const pcModuleEntry: TestModuleDefinition = {
  key: 'pc',
  label: 'Call (pc)',
  components: [
    {
      key: 'PcCallComponent',
      component: PcCallComponent,
      selector: 'mvs-pc-call',
      type: 'ObjectBaseComponent',
      label: 'PC call',
    },
    // ... more components
  ]
};

export const PC_TEST_PROVIDERS: Provider[] = [
  { provide: TEST_MODULE_REGISTRY, useValue: pcModuleEntry, multi: true },
];
```

### Component Test Types

| Type | Description |
|------|-------------|
| `ObjectBaseComponent` | Components displaying objects |
| `Component` | Regular components |
| `PageComponent` | Page components |
| `MvsDashboardPage` | Dashboard pages |

### Test Component Pattern

Test components are co-located with main components:

```
component/
└── my-component/
    ├── my-component.component.ts
    └── my-component-test.component.ts
```

---

## Module Definition

### Standard Module Structure

```typescript
@NgModule({
  declarations: [
    // All components/pages from this module
  ],
  exports: [
    // Only protected/public components
  ],
  imports: [
    CoreModule,    // Always import
    UiModule,      // As needed
    // Other feature modules as needed
  ],
  providers: [
    PC_ENTITY_PROVIDER,    // Entity service registry
    PC_TEST_PROVIDERS      // Test definitions
  ]
})
export class PcModule implements DynamicModule {

  alias = 'pc';  // Short form for entity types

  constructor(private moduleRegistry: ModuleRegistryService) {
    this.moduleRegistry.registerModule(this);
  }

  getKpiComponent() {
    return PcKpiComponent;  // Optional
  }

  getStatisticsComponent() {
    return PcStatisticsComponent;  // Optional
  }
}
```

### DynamicModule Interface

- Allows runtime module registration
- Supports KPI and Statistics components for dashboards
- Modules self-register when instantiated

---

## Key Architectural Patterns

### 1. CRUD-Centric Design

Every entity MUST have a CRUD service extending `MvsCrudService`. Services handle data fetching and caching while components remain thin consumers.

### 2. Object-Centric Pages

- Pages display single objects (`ObjectPageComponent`)
- Components display objects with formatting (`ObjectBaseComponent`)
- MUST support multiple view modes (full/side/inline)

### 3. Provider Registry System

- Multi-provider pattern for entity service registration
- Dynamic module loading based on entity type
- Lazy loading of components via service registry

### 4. Observable-Based Data Flow

- All async operations MUST return Observables
- Component lifecycle management through subscriptions
- MUST unsubscribe in `ngOnDestroy` (handled by base classes)

### 5. Initialization Guards

```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (!this.initialized) return;
  // Safe to process changes
}
```

### 6. Dirty State Tracking

- `isDirty` flag for change detection
- Emits `onComponentDirty` event
- Used for form/unsaved changes warnings

### 7. Context Propagation

`DtoImportObjectContext` passes object references down the component tree, preventing repeated API calls for parent objects.

### 8. Event Emission Pattern

Components MUST emit events instead of using return values, decoupling component communication:

```typescript
@Output() onObjectLoadSuccessful = new EventEmitter<any>();
@Output() onChangedObject = new EventEmitter<any>();
```

---

## Rule Priority

This section defines the priority of these rules relative to other sources:

1. **This skill's rules OVERRIDE any inferred patterns.** Even if external examples use different patterns, code in this project MUST follow these rules.

2. **This skill OVERRIDES general Angular habits.** Common Angular patterns that conflict with these rules are NOT permitted in this codebase.

3. **This skill OVERRIDES AI inference.** Claude MUST NOT infer that alternative patterns are acceptable based on:
   - External documentation
   - Common Angular practices
   - User requests that conflict with these rules

4. **Conflict resolution:** If any conflict exists between these rules and another source (external code, user request, other skills), Claude MUST:
   - STOP
   - ASK the user for clarification
   - NEVER guess or default to patterns that violate these rules

---

## Summary Reference Table

| Aspect | Pattern | Location |
|--------|---------|----------|
| Base Component Class | `ObjectBaseComponent` | `/core/shared/object/mvs-object-base/` |
| Base Page Class | `PageComponent` | `/core/shared/mvs-page/` |
| Dashboard Base | `MvsDashboardPage` | `/core/shared/dashboard/page/` |
| CRUD Service Base | `MvsCrudService` | `/core/shared/service/crud/` |
| Component Templates | Various examples | `/projects/shell-alpha/src/app/templates/` |
| Entity Registry | `ENTITY_SERVICE_REGISTRY` | `/core/shared/dto/dto-service/` |
| Test Registry | `TEST_MODULE_REGISTRY` | `/core/shared/test/` |
| Widget System | `WidgetData`/`WidgetFactory` | `/core/shared/widget/` |
| Module Interface | `DynamicModule` | `/core/shared/interface/` |
