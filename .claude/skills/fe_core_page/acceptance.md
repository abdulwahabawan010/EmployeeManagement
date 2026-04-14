# Page Skill Acceptance Criteria

## Purpose

This document defines the acceptance criteria and rule IDs for validating page implementations.

---

## ⚠️ COMPLEX CONFIGURATION ENTITY RULE

**Violations are ARCHITECTURAL ERRORS.**

> **Canonical Reference:** See [SKILL.md](SKILL.md) for complete rule definition, decision matrix, and TicketType example.

**Quick Summary:**
- **2+ child entities** → MUST use ObjectComponent + Object Page navigation
- **FORBIDDEN:** Flat tabs for children, inline master-detail, missing ObjectComponent

---

## Acceptance Criteria

### AC-PAGE-1: Page Type Selection

**Rule:** The correct page type MUST be selected based on the use case.

| Use Case | Required Page Type |
|----------|-------------------|
| Module-wide KPIs and statistics | Overview Page |
| Browse entity collection | Dashboard Page |
| View/edit single entity | Object Page |
| Configure module/system behavior | Config Page |

**Validation:**
- Check that page extends the correct base class
- Verify page purpose matches page type

---

### AC-PAGE-2: Complex Configuration Entity Check (ARCHITECTURAL ERROR IF VIOLATED)

**Rule:** Before creating a config page, you MUST check if the entity is a Complex Configuration Entity.

**Mandatory Check:** `grep "<EntityName>#" entity-registry.md` → Count child entities

| Child Count | Implementation | Violations |
|-------------|----------------|------------|
| 0-1 | Simple ConfigPage with tabs allowed | N/A |
| 2+ | Simple table → Object Page → ObjectComponent | Flat tabs = **ARCHITECTURAL ERROR** |

> **Visual Example:** See [SKILL.md](SKILL.md) for TicketType example or [hierarchical-config-pattern.md](hierarchical-config-pattern.md) for DunningType example.

---

### AC-PAGE-3: ObjectComponent MANDATORY for Complex Entities (ARCHITECTURAL ERROR IF MISSING)

**Rule:** Complex configuration entities (2+ child types) MUST have an ObjectComponent.

**MANDATORY Requirements:**
- ObjectComponent extends `ObjectBaseComponent`
- ObjectComponent has `navigationItems` for left nav
- ObjectComponent implements `onObjectChanged()` with filtered child widgets
- ObjectComponent registered via `getObjectComponent()`

> **Code Example:** See [hierarchical-config-pattern.md](hierarchical-config-pattern.md) for complete DunningTypeObjectComponent implementation.

---

### AC-PAGE-4: Child Widgets Must Be Filtered

**Rule:** All child entity widgets MUST be filtered by parent FK.

**Valid:**
```typescript
FilterCriteria.create('e.dunningTypeId', FilterCriteria.cOperatorEqual, parentId)
```

**Invalid:**
```typescript
// WRONG - Missing parent filter
WidgetFactory.createWidgetTableEntityQl(..., [], ...)
```

**Validation:**
- Each child widget has FilterCriteria for parent FK
- FK field follows naming convention (`e.<parentEntity>Id`)

---

### AC-PAGE-5: Config Page Layout Pattern

**Rule:** Complex entities MUST use simple table widget with navigation to Object Page.

| Pattern | When to Use | Validation |
|---------|-------------|------------|
| Simple Table | ObjectComponent IS registered (REQUIRED for 2+ children) | No `(onObjectSelect)` handler, no inline detail |
| Master-Detail | **DEPRECATED** for complex entities | Only for simple entities without ObjectComponent |

> **Implementation:** See [hierarchical-config-pattern.md](hierarchical-config-pattern.md) for Config Page code examples.

---

### AC-PAGE-6: Context Preservation

**Rule:** Navigating between child entities MUST preserve parent context.

**Requirements:**
- Switching tabs does NOT change selected parent
- Creating child entity auto-sets parent FK
- Editing child shows parent reference

**Validation:**
- Tab changes don't reset `selectedParent`
- Child create forms pre-populate parent FK
- Parent reference displayed in child views

---

### AC-PAGE-7: NavigationItem Icon Required (MANDATORY)

**Rule:** Every NavigationItem MUST have an `icon` property.

**Valid:**
```typescript
navigationItems: NavigationItem[] = [
    {label: 'Dunning Types', action: 'dunning-types', tooltip: 'Dunning Types', icon: 'fa fa-gavel', toggleable: false, default: true},
    {label: 'AI Agents', action: 'artificial-agents', tooltip: 'AI Agents', icon: 'fa fa-robot', toggleable: false, default: false}
];
```

**Invalid:**
```typescript
// WRONG - Missing icons
navigationItems: NavigationItem[] = [
    {label: 'Dunning Types', action: 'dunning-types', default: true},  // No icon!
    {label: 'AI Agents', action: 'artificial-agents'}  // No icon!
];
```

---

### AC-PAGE-8: Tabs Only for Multiple Widgets

**Rule:** Tabs (`p-tabs`) should ONLY be used when a navigation section has MULTIPLE widgets.

| Widgets per Section | Use Tabs? |
|---------------------|-----------|
| 1 widget | NO - use `ng-container` with `activeNavigationItem?.action` |
| 2+ widgets | YES - use `p-tabs` for sub-grouping |

**Invalid - Tabs with one widget per section:**
```html
<p-tabs [(value)]="activeSection">
    <p-tablist>
        <p-tab value="dunning-types">Dunning Types</p-tab>
        <p-tab value="ai-agents">AI Agents</p-tab>
    </p-tablist>
    ...
</p-tabs>
```

**Valid - Navigation handles section switching:**
```html
<ng-container *ngIf="activeNavigationItem?.action == 'dunning-types'">
    <mvs-widget [widgetData]="widgets['dunningTypeWidget'].widgetData"></mvs-widget>
</ng-container>

<ng-container *ngIf="activeNavigationItem?.action == 'ai-agents'">
    <mvs-widget [widgetData]="widgets['aiAgentWidget'].widgetData"></mvs-widget>
</ng-container>
```

---

### AC-PAGE-9: No Direct API Calls from Components (CRITICAL)

**Rule:** Page components MUST NEVER make HTTP API calls directly. All API communication MUST go through a service.

**Why:**
1. **Separation of Concerns:** Components handle UI logic, services handle data access
2. **Reusability:** API calls in services can be reused across components
3. **Testability:** Services are easier to mock and test
4. **Consistency:** Controller endpoints have corresponding service methods
5. **Error Handling:** Centralized error handling in services

**FORBIDDEN Patterns:**

```typescript
// WRONG - Direct fetch() in component
export class MyDashboardPage {
    createTestCase(): void {
        fetch(`${this.coreService.getApiUrl()}/bd/dunnings/test-case`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.coreService.getAuthToken()}` }
        }).then(response => response.json());
    }
}

// WRONG - Direct HttpClient in component
export class MyDashboardPage {
    constructor(private http: HttpClient) {}

    loadData(): void {
        this.http.get('/api/data').subscribe(...);
    }
}

// WRONG - XMLHttpRequest in component
export class MyDashboardPage {
    fetchData(): void {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/data');
        xhr.send();
    }
}
```

**CORRECT Pattern:**

```typescript
// Service handles all API calls
@Injectable({ providedIn: 'root' })
export class MyDashboardService extends MvsCrudService {
    createTestCase(request: TestCaseRequest): Observable<TestCaseResult> {
        return this.http.post<TestCaseResult>(
            `${this.apiUrl}/test-case`,
            request
        );
    }
}

// Component uses service
export class MyDashboardPage {
    constructor(private dashboardService: MyDashboardService) {}

    createTestCase(): void {
        this.dashboardService.createTestCase(request).subscribe({
            next: (result) => this.handleSuccess(result),
            error: (err) => this.handleError(err)
        });
    }
}
```

**Backend Controller to Service Mapping Rule:**

Every backend controller endpoint MUST have a corresponding service method:

| Backend Endpoint | Frontend Service Method |
|------------------|------------------------|
| `POST /bd/dunnings/test-case` | `BdDunningService.createTestCase()` |
| `GET /bd/dunnings/{id}` | `BdDunningService.get(id)` |
| `POST /bd/dunnings/dashboard/process/start` | `BdDunningDashboardService.startForAccounts()` |

**Validation:**
- Search for `fetch(`, `http.get(`, `http.post(`, `XMLHttpRequest` in component files
- Any match in a component file is a violation
- Components may only call service methods

---

### AC-PAGE-10: Service Method Correspondence (MANDATORY)

**Rule:** When a backend controller exposes an endpoint, the corresponding frontend service MUST implement a method for it.

**Controller → Service Mapping:**
1. Identify the controller (e.g., `DunningController.java`)
2. List all public endpoints
3. Ensure corresponding service has methods for each endpoint

**Example:**
```java
// Backend: DunningController.java
@PostMapping("/bd/dunnings/dashboard/process/start-for-accounts")
public ResponseEntity<DunningProcessResultDto> startForAccounts(@RequestBody DunningProcessAccountsRequestDto request)

@PostMapping("/bd/dunnings/dashboard/process/stop-for-ids")
public ResponseEntity<DunningProcessResultDto> stopForIds(@RequestBody DunningProcessDunningsRequestDto request, @RequestParam String resolveStatus)
```

```typescript
// Frontend: bd-dunning-dashboard.service.ts MUST have:
startForAccounts(request: DunningProcessAccountsRequest): Observable<DunningProcessResult>
stopForIds(request: DunningProcessDunningsRequest, resolveStatus: string): Observable<DunningProcessResult>
```

**Validation:**
- Compare controller endpoint count with service method count
- Each endpoint must have a service method

---

## Rule IDs

| ID | Description | Severity | Classification |
|----|-------------|----------|----------------|
| PAGE-001 | Wrong page type for use case | error | Design Error |
| PAGE-002 | Config page without entity registry check | error | **ARCHITECTURAL ERROR** |
| PAGE-003 | Complex entity without ObjectComponent | error | **ARCHITECTURAL ERROR** |
| PAGE-004 | Child widget without parent filter | error | **ARCHITECTURAL ERROR** |
| PAGE-005 | Flat tabs for complex entity children | error | **ARCHITECTURAL ERROR** |
| PAGE-006 | Inline master-detail for complex entity | error | **ARCHITECTURAL ERROR** |
| PAGE-007 | ObjectComponent without left navigation | error | **ARCHITECTURAL ERROR** |
| PAGE-008 | Context lost on navigation | warning | UX Error |
| PAGE-009 | Missing super.ngOnInit() call | error | Implementation Error |
| PAGE-010 | Config page with route params | error | Implementation Error |
| PAGE-011 | NavigationItem missing icon | error | Implementation Error |
| PAGE-012 | Unnecessary tabs for single-widget sections | warning | UX Warning |
| PAGE-013 | Direct API call from component | error | Architecture Error |
| PAGE-014 | Missing service method for controller endpoint | error | Architecture Error |

### Complex Configuration Entity Rule Violations (ALL ARE ARCHITECTURAL ERRORS)

| Rule ID | Violation | Required Action |
|---------|-----------|-----------------|
| PAGE-002 | Entity registry not checked before creating config page | REJECT - Check entity registry first |
| PAGE-003 | Complex entity (2+ children) has no ObjectComponent | REJECT - Create ObjectComponent |
| PAGE-004 | Child widgets not filtered by parent FK | REJECT - Add FilterCriteria |
| PAGE-005 | Flat tabs used for complex entity children in Config Page | REJECT - Use simple table + Object Page |
| PAGE-006 | Inline master-detail used for complex entity | REJECT - Use simple table + Object Page |
| PAGE-007 | ObjectComponent missing left navigation | REJECT - Add navigationItems |

**Any violation of PAGE-002 through PAGE-007 = Automatic Code Review REJECTION**

---

## Test Cases

### Test Case 1: Simple Config Page (Valid)

**Input:** Config page for `SystemSetting` entity with 0 child entities.

**Expected:** Simple ConfigPage with widget tabs is acceptable.

**Result:** PASS

---

### Test Case 2: Hierarchical Config Page (Invalid)

**Input:** Config page for `DunningType` entity with 8 child entities using flat tabs.

**Expected Violations:**
```json
[
    {"ruleId": "PAGE-002", "description": "Entity registry not checked"},
    {"ruleId": "PAGE-003", "description": "Missing ObjectComponent for DunningType"},
    {"ruleId": "PAGE-004", "description": "Child widgets not filtered by dunningTypeId"},
    {"ruleId": "PAGE-005", "description": "Flat tabs used for hierarchical data"}
]
```

**Result:** FAIL

---

### Test Case 3: Hierarchical Config Page with ObjectComponent (Valid)

**Input:** Config page for `DunningType` with:
- `DunningTypeObjectComponent` registered in `DunningTypeService.getObjectComponent()`
- Simple table widget for `bd.DunningType` entity
- ObjectComponent displays filtered child widgets

**Expected:** All checks pass.
- Navigation automatically opens `DunningTypeObjectComponent` when row clicked
- Config page uses declarative widget configuration

**Result:** PASS

---

### Test Case 4: Master-Detail (Valid - SIMPLE ENTITY ONLY)

**Input:** Config page for SIMPLE entity (0-1 child entities) WITHOUT registered ObjectComponent.

**Expected:** Master-detail layout is acceptable ONLY for simple entities.
- Master widget uses `createWidgetSelectableEntityQl`
- Detail renders ObjectComponent inline
- Entity has 0-1 child entities (NOT a complex entity)

**Result:** PASS

**CRITICAL:** This test case is **INVALID for complex configuration entities** (2+ child entities).
For complex entities:
- ObjectComponent MUST be created and registered
- Master-detail is **FORBIDDEN**
- Simple table + Object Page navigation is **MANDATORY**

---

## Validation Script Output

The validation script should output JSON in this format:

```json
{
    "status": "PASSED | FAILED",
    "file": "path/to/page.ts",
    "pageType": "config",
    "violations": [
        {
            "ruleId": "PAGE-005",
            "line": 45,
            "description": "Flat tabs used for hierarchical entity 'DunningType' with 8 child types",
            "suggestion": "Use master-detail pattern with ObjectComponent"
        }
    ]
}
```

---

## Quick Reference

> **Canonical Reference:** See [SKILL.md](SKILL.md) for complete decision flowchart and TicketType example.

**Decision Summary:**
1. Check entity registry: `grep "<EntityName>#" entity-registry.md`
2. Count child entities
3. **0-1 children** → Simple ConfigPage allowed
4. **2+ children** → Complex Configuration Entity Rule applies (MANDATORY)

**Entity Registry Location:** `.claude/skills/fe_core_entity_registry/data/entity-registry.md`

---

## Final Compliance Statement

**The Complex Configuration Entity Rule is NON-NEGOTIABLE. There are NO exceptions.**

Violations are ARCHITECTURAL ERRORS and MUST be rejected in code review.