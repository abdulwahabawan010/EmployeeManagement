# Routing Skill Acceptance Criteria

## Purpose

This document defines the acceptance criteria for validating that route files comply with the frontend routing architecture.

---

## Acceptance Criteria

### AC-1: Route Path Module Prefix

**Rule:** ALL route paths MUST be prefixed with the 2-letter module code.

**Valid Examples:**
```typescript
{path: 'bd/config', component: BdConfigPage}
{path: 'cr/customer/:id', component: CrCustomerPage}
{path: 'tm/ticket/:id', component: TmTicketPage}
```

**Invalid Examples:**
```typescript
{path: 'config', component: BdConfigPage}           // Missing prefix
{path: 'customer/:id', component: CrCustomerPage}   // Missing prefix
{path: '/bd/config', component: BdConfigPage}       // Leading slash
```

**Validation:**
- Extract module alias from filename (e.g., `bd.route.ts` → `bd`)
- Check that ALL route paths start with `<module-alias>/`
- Flag any route that doesn't match

---

### AC-2: Page Components Only

**Rule:** Only Page components can be routed. Components MUST NOT be routed.

**Valid Examples:**
```typescript
{path: 'bd/config', component: BdConfigPage}
{path: 'bd/dunning-dashboard', component: BdDunningDashboardPage}
```

**Invalid Examples:**
```typescript
{path: 'bd/config', component: BdConfigComponent}        // Ends with "Component"
{path: 'bd/list', component: BdListTableComponent}       // Ends with "Component"
```

**Validation:**
- Check that all `component:` values end with `Page`
- Flag any component that ends with `Component`

---

### AC-3: SubRoutes Function Naming

**Rule:** The export function MUST be named `<ModuleAlias>SubRoutes`.

**Valid Examples:**
```typescript
export function BdSubRoutes(): Routes { ... }
export function CrSubRoutes(): Routes { ... }
export function TmSubRoutes(): Routes { ... }
```

**Invalid Examples:**
```typescript
export function bdSubRoutes(): Routes { ... }    // Lowercase
export function BdRoutes(): Routes { ... }       // Missing "Sub"
export function getRoutes(): Routes { ... }      // Wrong format
```

**Validation:**
- Extract module alias from filename
- Convert to PascalCase and append `SubRoutes`
- Check that the export function matches this pattern

---

### AC-4: Route File Location

**Rule:** Route files MUST be located in the module root directory.

**Valid Location:**
```
features/feature-bm/bd/bd.route.ts
features/feature-crm/cr/cr.route.ts
```

**Invalid Location:**
```
features/feature-bm/bd/routes/bd.route.ts        // Wrong subdirectory
features/feature-bm/bd/config/bd.route.ts        // Wrong subdirectory
```

**Validation:**
- Check that route file is directly in the module directory
- Check filename matches pattern `<module-alias>.route.ts`

---

### AC-4b: Route Registration in Feature Routing Module

**Rule:** After creating a module route file, it MUST be registered in the feature routing module.

**Location:** `features/feature-<feature-name>/feature-<feature-name>.routing.module.ts`

**Valid Example (in feature-bm.routing.module.ts):**
```typescript
import {BmSubRoutes} from "./bm/bm.route";
import {BdSubRoutes} from "./bd/bd.route";

export function getCrmRouters(): { name: string; routeMethod: () => Routes }[] {
    return [
        {name: "bm", routeMethod: BmSubRoutes},
        {name: "bd", routeMethod: BdSubRoutes},
    ];
}
```

**Invalid Examples:**
```typescript
// Missing import
export function getCrmRouters(): { name: string; routeMethod: () => Routes }[] {
    return [
        {name: "bm", routeMethod: BmSubRoutes},
        // bd is missing - routes won't work!
    ];
}
```

**Validation:**
- Check that SubRoutes function is imported
- Check that entry exists in the router collection function
- Check that `name` matches module alias

---

### AC-5: Consistent Module Prefix in Routes

**Rule:** The route path prefix MUST match the module alias of the file.

**Valid Example (in bd.route.ts):**
```typescript
{path: 'bd/config', component: BdConfigPage}       // ✓ 'bd' matches file
{path: 'bd/dashboard', component: BdDashboardPage} // ✓ 'bd' matches file
```

**Invalid Example (in bd.route.ts):**
```typescript
{path: 'bm/config', component: BdConfigPage}       // ✗ 'bm' doesn't match 'bd'
{path: 'cr/list', component: BdListPage}           // ✗ 'cr' doesn't match 'bd'
```

**Validation:**
- Extract module alias from filename
- Check that all route paths start with that alias

---

### AC-6: Page Component Naming Consistency

**Rule:** The Page component name should be consistent with the route path.

**Valid Examples:**
```typescript
{path: 'bd/config', component: BdConfigPage}                    // ✓ Bd prefix matches bd/
{path: 'bd/dunning-dashboard', component: BdDunningDashboardPage} // ✓ Bd prefix matches bd/
```

**Invalid Examples:**
```typescript
{path: 'bd/config', component: CrConfigPage}     // ✗ Cr prefix doesn't match bd/
{path: 'bd/list', component: TmListPage}         // ✗ Tm prefix doesn't match bd/
```

**Validation:**
- Extract module prefix from route path
- Check that component name starts with the same prefix (PascalCase)

---

## Validation Script Output

The validation script should output JSON in this format:

```json
{
  "status": "PASSED | FAILED",
  "file": "path/to/route.ts",
  "moduleAlias": "bd",
  "violations": [
    {
      "ruleId": "ROUTE-001",
      "line": 26,
      "description": "Route path 'config' missing module prefix 'bd/'",
      "suggestion": "Change to 'bd/config'"
    },
    {
      "ruleId": "ROUTE-002",
      "line": 27,
      "description": "Component 'BdConfigComponent' is not a Page",
      "suggestion": "Rename to 'BdConfigPage'"
    }
  ]
}
```

---

## Rule IDs

| ID | Description |
|----|-------------|
| ROUTE-001 | Route path missing module prefix |
| ROUTE-002 | Component is not a Page (ends with Component) |
| ROUTE-003 | SubRoutes function incorrectly named |
| ROUTE-004 | Route file in wrong location |
| ROUTE-005 | Route prefix doesn't match file's module |
| ROUTE-006 | Page component prefix doesn't match route prefix |
| ROUTE-007 | Route path has leading slash |

---

## Test Cases

### Test Case 1: Valid Route File

**Input:** `bd.route.ts`
```typescript
import {Routes} from "@angular/router";
import {BdConfigPage} from "./page/bd-config/bd-config.page";

export function BdSubRoutes(): Routes {
    const routes = [
        {path: 'bd/config', component: BdConfigPage},
    ];
    return routes;
}
```

**Expected Output:**
```json
{
  "status": "PASSED",
  "file": "bd.route.ts",
  "moduleAlias": "bd",
  "violations": []
}
```

### Test Case 2: Missing Module Prefix

**Input:** `bd.route.ts`
```typescript
const routes = [
    {path: 'config', component: BdConfigPage},
];
```

**Expected Output:**
```json
{
  "status": "FAILED",
  "violations": [
    {
      "ruleId": "ROUTE-001",
      "description": "Route path 'config' missing module prefix 'bd/'"
    }
  ]
}
```

### Test Case 3: Component Instead of Page

**Input:** `bd.route.ts`
```typescript
const routes = [
    {path: 'bd/config', component: BdConfigComponent},
];
```

**Expected Output:**
```json
{
  "status": "FAILED",
  "violations": [
    {
      "ruleId": "ROUTE-002",
      "description": "Component 'BdConfigComponent' is not a Page"
    }
  ]
}
```

### Test Case 4: Multiple Violations

**Input:** `bd.route.ts`
```typescript
export function bdRoutes(): Routes {
    const routes = [
        {path: 'config', component: BdConfigComponent},
        {path: 'bm/dashboard', component: BdDashboardPage},
    ];
    return routes;
}
```

**Expected Output:**
```json
{
  "status": "FAILED",
  "violations": [
    {"ruleId": "ROUTE-003", "description": "Function should be named 'BdSubRoutes'"},
    {"ruleId": "ROUTE-001", "description": "Route path 'config' missing module prefix 'bd/'"},
    {"ruleId": "ROUTE-002", "description": "Component 'BdConfigComponent' is not a Page"},
    {"ruleId": "ROUTE-005", "description": "Route prefix 'bm' doesn't match module 'bd'"}
  ]
}
```