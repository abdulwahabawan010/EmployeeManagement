---
name: fe_core_routing
description: "Frontend: Expert guidance on Angular routing patterns including module routes, path prefixes, page components, and route registration. Use when creating routes, working with route files, or implementing navigation. Covers SubRoutes functions, route path conventions, and feature routing modules."
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Frontend Routing

## Overview

This application uses a **module-based routing architecture** where each module defines its own routes in a dedicated route file. Routes are then collected and registered in the feature routing module.

**Routing is not done freely — it follows strict architectural rules.**

---

## Critical Rules (MANDATORY)

### 1. Route Path Prefix Rule (CRITICAL)

**ALL route paths MUST be prefixed with the 2-letter module code.**

```typescript
// ❌ FORBIDDEN - Missing module prefix
{path: 'config', component: BdConfigPage}
{path: 'overview', component: CrOverviewPage}
{path: 'ticket/:id', component: TmTicketPage}

// ✅ CORRECT - Module prefix included
{path: 'bd/config', component: BdConfigPage}
{path: 'cr/overview', component: CrOverviewPage}
{path: 'tm/ticket/:id', component: TmTicketPage}
```

**Why this matters:**
- Prevents route collisions between modules
- Makes URLs self-documenting (you know which module handles the route)
- Enables proper route organization and debugging
- Required by the feature routing module architecture

---

### 2. Page Components Only Rule (CRITICAL)

**ONLY Page components can be routed. Regular components MUST NEVER be routed.**

```typescript
// ❌ FORBIDDEN - Routing to a Component
{path: 'bd/config', component: BdConfigComponent}  // Wrong: ends with "Component"

// ✅ CORRECT - Routing to a Page
{path: 'bd/config', component: BdConfigPage}  // Correct: ends with "Page"
```

**Naming convention:**
- Page classes MUST end with `Page` (e.g., `BdConfigPage`, `CrOverviewPage`)
- Page files MUST end with `.page.ts` (e.g., `bd-config.page.ts`)
- Pages MUST be located in the `page/` directory

---

### 3. Route File Structure Rule

**Each module MUST have a route file following this pattern:**

**Location:** `features/feature-<feature-name>/<module-alias>/<module-alias>.route.ts`

```typescript
import {Routes} from "@angular/router";
import {BdConfigPage} from "./page/bd-config/bd-config.page";
import {BdDunningDashboardPage} from "./page/bd-dunning-dashboard/bd-dunning-dashboard.page";

export function BdSubRoutes(): Routes {

    /**
     *
     * path:
     * Route paths MUST be prefixed with the module code.
     *
     *      Example
     *      path: "bd/addresses" => route path "/bd/addresses"
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
        {path: 'bd/config', component: BdConfigPage},
        {path: 'bd/dunning-dashboard', component: BdDunningDashboardPage},
    ];

    return routes;

}
```

**Function naming:**
- Function name MUST be: `<ModuleAlias>SubRoutes` (PascalCase)
- Examples: `TmSubRoutes`, `SpSubRoutes`, `CrSubRoutes`, `BdSubRoutes`

---

### 4. Route Registration Rule (CRITICAL)

**After creating a module route file, you MUST register it in the feature routing module.**

**Location:** `features/feature-<feature-name>/feature-<feature-name>.routing.module.ts`

**Example:** For the `feature-bm` feature, the file is:
`frontend/features/feature-bm/feature-bm.routing.module.ts`

**Step 1: Import the SubRoutes Function**

```typescript
import {BmSubRoutes} from "./bm/bm.route";
import {BdSubRoutes} from "./bd/bd.route";
```

**Step 2: Register in the Router Collection Function**

Each feature has a function that collects all module routes. Add your SubRoutes function here:

```typescript
export function getCrmRouters(): { name: string; routeMethod: () => Routes }[] {
    return [
        {name: "bm", routeMethod: BmSubRoutes},
        {name: "bd", routeMethod: BdSubRoutes},
        // ... other modules in alphabetical order
    ];
}
```

**How it works:**
The feature routing module collects all SubRoutes and registers them as child routes:

```typescript
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
```

**Rules:**
- The `name` property MUST match the module alias (e.g., `"bd"` for `BdSubRoutes`)
- The `routeMethod` property MUST reference the SubRoutes function
- Entries SHOULD be in alphabetical order by module code
- **If you forget this step, your routes will NOT be accessible!**

---

## Route Path Patterns

### Overview/List Pages (Static Routes)

```typescript
{path: 'cr/overview', component: CrOverviewPage}
{path: 'tm/tickets', component: TmTicketListPage}
```

### Object Detail Pages (Parameterized Routes)

```typescript
{path: 'cr/customer/:id', component: CrCustomerPage}
{path: 'tm/ticket/:id', component: TmTicketPage}
```

### Configuration Pages (Static Routes)

```typescript
{path: 'bd/config', component: BdConfigPage}
{path: 'tm/config', component: TmConfigPage}
```

### Dashboard Pages (Static Routes)

```typescript
{path: 'bd/dunning-dashboard', component: BdDunningDashboardPage}
{path: 'bm/billing-dashboard', component: BmBillingDashboardPage}
```

### Nested Routes (Parent-Child Relationships)

```typescript
{path: 'sp/projects/:projectId', component: SpProjectDetailPage},
{path: 'sp/projects/:projectId/sprints', component: SpSprintListPage},
{path: 'sp/projects/:projectId/sprints/:sprintId', component: SpSprintDetailPage},
```

### Specialized Views

```typescript
{path: 'sp/sprints/:sprintId/kanban', component: SpSprintKanbanPage},
{path: 'sp/sprints/:sprintId/leaderboard', component: SpSprintLeaderboardPage},
```

---

## Common Mistakes

### Mistake 1: Missing Module Prefix

```typescript
// ❌ WRONG
{path: 'config', component: BdConfigPage}

// ✅ CORRECT
{path: 'bd/config', component: BdConfigPage}
```

### Mistake 2: Routing to Components Instead of Pages

```typescript
// ❌ WRONG - Component instead of Page
{path: 'bd/config', component: BdConfigComponent}

// ✅ CORRECT - Page component
{path: 'bd/config', component: BdConfigPage}
```

### Mistake 3: Inconsistent Module Prefix

```typescript
// ❌ WRONG - Module prefix doesn't match module
{path: 'bm/config', component: BdConfigPage}  // Route says 'bm', component is 'Bd'

// ✅ CORRECT - Consistent prefix
{path: 'bd/config', component: BdConfigPage}
```

### Mistake 4: Using Absolute Paths

```typescript
// ❌ WRONG - Leading slash
{path: '/bd/config', component: BdConfigPage}

// ✅ CORRECT - No leading slash
{path: 'bd/config', component: BdConfigPage}
```

---

## Validation Script

**Location:** `.claude/skills/fe_core_routing/scripts/check-routes.js`

**What it validates:**
- Route paths are prefixed with module code
- Only Page components are routed (not regular components)
- Route file follows naming convention
- SubRoutes function is properly named
- Component names match route prefix

**Usage:**

```bash
node .claude/skills/fe_core_routing/scripts/check-routes.js <path-to-route-file>
```

**Example:**

```bash
node .claude/skills/fe_core_routing/scripts/check-routes.js ./frontend/features/feature-bm/bd/bd.route.ts
```

---

## Checklist for New Routes

When creating or modifying routes, verify:

- [ ] Route file is named `<module-alias>.route.ts`
- [ ] Route file is in the module root directory (e.g., `bd/bd.route.ts`)
- [ ] SubRoutes function is named `<ModuleAlias>SubRoutes`
- [ ] ALL route paths start with the module prefix (e.g., `'bd/'`)
- [ ] ALL routed components end with `Page` (not `Component`)
- [ ] Page components are in the `page/` directory
- [ ] **SubRoutes function is imported in the feature routing module**
- [ ] **SubRoutes is registered in the router collection function (e.g., `getCrmRouters()`)**
- [ ] Entry name matches module alias (e.g., `{name: "bd", routeMethod: BdSubRoutes}`)
- [ ] Entries are in alphabetical order by module code

---

## STOP-AND-ASK Rule

If you are unsure:
- Which module prefix to use
- Whether a component should be a Page
- How to structure nested routes
- Where to register the route

**STOP.**
1. Review this documentation
2. Check existing route files for patterns
3. Ask before implementing

---

## Summary

Frontend routing follows strict conventions:

- ✅ All route paths prefixed with module code
- ✅ Only Page components can be routed
- ✅ Routes registered in feature routing module
- ✅ Consistent naming conventions

**Following this skill guarantees:**
- No route collisions
- Self-documenting URLs
- Consistent navigation patterns
- Proper separation of pages and components