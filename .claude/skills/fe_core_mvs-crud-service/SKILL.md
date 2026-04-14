---
name: fe_core_mvs-crud-service
description: "Frontend: Enforces patterns for entity services extending MvsCrudService. Applies when creating CRUD services, handling Observable subscriptions, or implementing list/get/create/update/delete operations."
---

# MvsCrudService Skill

## Scope

This skill applies when:
- Creating new entity services extending `MvsCrudService`
- Implementing CRUD operations (list, get, create, update, delete)
- Handling Observable subscriptions from CRUD methods
- Adding custom endpoints to entity services
- Configuring service metadata (icons, labels, components)
- Registering services in `dto.service.map.ts`

## Non-Scope

This skill does NOT apply to:
- Direct injection of MvsCrudService (it is abstract)
- Business logic implementation
- Non-entity services without CRUD requirements
- Third-party or external service implementations

---

## Rules

### Service Creation Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| SC1 | Entity services MUST extend `MvsCrudService` | Script |
| SC2 | MUST use `@Injectable({ providedIn: 'root' })` decorator | Script |
| SC3 | Constructor MUST call `super(http, apiUrl)` | Script |
| SC4 | API URL MUST use `MvsCrudService.baseUrl + '/module/entities'` | Script |
| SC5 | Services MUST be registered in `dto.service.map.ts` | Script |
| SC6 | Registration MUST include `service` class and `entityName` | Script |

### Injection Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| INJ1 | `MvsCrudService` MUST NOT be injected directly (abstract) | Script |
| INJ2 | Specific entity services MUST be injected for known entity types | Script |
| INJ3 | Use `MvsCoreService` for dynamic entity resolution (NON-MANDATORY) | Manual |

### Observable Subscription Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| OBS1 | Subscribe callbacks MUST have explicit typecasts | Script |
| OBS2 | `list()` callback MUST typecast to `DtoList<EntityDto>` | Script |
| OBS3 | `get()` callback MUST typecast to entity DTO type | Script |
| OBS4 | `create()` callback MUST typecast to entity DTO type | Script |
| OBS5 | `update()` callback MUST typecast to entity DTO type | Script |
| OBS6 | Long-running Observables use `takeUntil(destroy$)` (NON-MANDATORY) | Manual |

### List Operation Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| LIST1 | `list()` MUST receive `ObjectRequestList` parameter | Script |
| LIST2 | `createBasic()` MUST receive `includeForm`, `filters`, `sortings` | Script |
| LIST3 | Filters MUST use `FilterCriteria.create()` static method | Script |
| LIST4 | Sortings MUST use `new Sorting()` constructor | Script |
| LIST5 | Pagination MUST use `PagingDto.create(page, size)` | Script |

### Get Operation Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| GET1 | `get()` MUST receive entity ID as first parameter | Script |
| GET2 | Use `includeForm: true` for edit operations (NON-MANDATORY) | Manual |
| GET3 | Use `getLight()` for read-only displays (NON-MANDATORY) | Manual |
| GET4 | Use `resolveEntities: true` for relationship resolution (NON-MANDATORY) | Manual |

### Create/Update Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| CU1 | `create()` MUST receive a DTO instance | Script |
| CU2 | `update()` MUST receive a DTO with valid `id` property | Script |
| CU3 | DTO transformation is automatic (by MvsCrudService) | Manual |
| CU4 | Object service notification is automatic after create/update | Manual |

### Delete Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| DEL1 | `delete()` for permanent removal | Manual |
| DEL2 | `deleteSoft()` for deactivation without removal | Manual |
| DEL3 | Request confirmation before delete (NON-MANDATORY) | Manual |

### GroupBy Method Rules (DEPRECATED)

| ID | Rule | Enforcement |
|----|------|-------------|
| GRP1 | `groupBy()` is DEPRECATED for new implementations | Script |
| GRP2 | New aggregation code MUST use QL with `typeGroupBy` | Script |
| GRP3 | Existing `groupBy()` calls may remain but SHOULD NOT be extended | Manual |
| GRP4 | Modifications to existing `groupBy()` code SHOULD trigger migration to QL | Manual |

**⚠️ DEPRECATED: The `groupBy()` method on MvsCrudService is deprecated for new implementations.**

**Status:** Legacy - only allowed for existing/old implementations

**Why deprecated:**
1. QL provides superior query composition with joins
2. QL is the unified data-fetching approach across the project
3. QL aggregations via `typeGroupBy` are more flexible
4. Reduces cognitive load - one pattern for all data queries

**For new aggregation requirements, use QL:**
```typescript
// ✅ CORRECT - Use QL for new implementations
const qlQuery: QlQueryDto = {
  name: 'aggregation.query',
  type: 'aggregation',
  start: {
    name: 'bm.CustomerBillingAccountTransaction',
    as: 'e',
    type: 'entity',
    joins: [
      {
        type: 'entity',
        name: 'billingRun',
        as: 'br',
        joinType: 'left',
        typeGroupBy: true  // Enable grouping on this join
      }
    ]
  }
};
```

**Existing code may use:**
```typescript
// ⚠️ LEGACY - Only for existing implementations
const request = ObjectRequestListGroupBy.create(
  true,
  [FilterCriteria.create('status', FilterCriteria.cOperatorIn, [Status.ACTIVE])],
  [],
  ['billingAreaId'],
  [new ObjectRequestListAttribute('id', 'count', DtoListAttributeRequestAggregateEnum.count)]
);
this.entityService.groupBy(request).subscribe({...});
```

### Service Configuration Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| CFG1 | `getObjectComponent()` MUST return `Type<ObjectBaseComponent>` | Script |
| CFG2 | Return different components for create vs update (NON-MANDATORY) | Manual |
| CFG3 | `getObjectIcon()` MUST return PrimeNG icon class | Script |
| CFG4 | `getObjectLabels()` MUST return field name array | Script |
| CFG5 | Implement `getObjectPageComponent()` (NON-MANDATORY) | Manual |

### Error Handling Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| ERR1 | CRUD operations MUST have error callbacks | Script |
| ERR2 | Log errors to console (NON-MANDATORY) | Manual |
| ERR3 | Use `MvsMessageService` for user-facing errors (NON-MANDATORY) | Manual |

### API Call Ownership Rules (CRITICAL)

| ID | Rule | Enforcement |
|----|------|-------------|
| API1 | ALL HTTP API calls MUST be in services | Script |
| API2 | Components MUST NEVER call APIs directly | Script |
| API3 | Services MUST implement methods for ALL controller endpoints | Manual |
| API4 | Service methods MUST use HttpClient (not fetch/XMLHttpRequest) | Script |

**Why Services Own API Calls:**
1. **Separation of Concerns:** Components handle UI, services handle data
2. **Reusability:** API methods can be shared across components
3. **Testability:** Services are easier to mock
4. **Consistency:** One service method per controller endpoint
5. **Error Handling:** Centralized in services

**FORBIDDEN in Components:**
```typescript
// WRONG - fetch() in component
fetch(`${url}/api/endpoint`, {...});

// WRONG - HttpClient in component
this.http.get('/api/endpoint');

// WRONG - XMLHttpRequest in component
new XMLHttpRequest();
```

**REQUIRED in Services:**
```typescript
// CORRECT - Service method using HttpClient
@Injectable({ providedIn: 'root' })
export class MyService extends MvsCrudService {
    customEndpoint(request: RequestDto): Observable<ResponseDto> {
        return this.http.post<ResponseDto>(`${this.apiUrl}/custom-endpoint`, request);
    }
}
```

### Backend Controller Correspondence (MANDATORY)

| ID | Rule | Enforcement |
|----|------|-------------|
| BCC1 | Each controller endpoint MUST have a service method | Manual |
| BCC2 | Service method signature MUST match endpoint parameters | Manual |
| BCC3 | Service method return type MUST match endpoint response | Manual |

**Example Mapping:**
```java
// Backend: DunningController.java
@PostMapping("/bd/dunnings/test-case")
public ResponseEntity<TestCaseResultDto> createTestCase(
    @RequestParam Long accountId,
    @RequestParam String referenceDate,
    @RequestParam int missingMonthsFrom,
    @RequestParam int missingMonthsTo
)
```

```typescript
// Frontend: bd-dunning-dashboard.service.ts
export interface TestCaseRequest {
    accountId: number;
    referenceDate: string;
    missingMonthsFrom: number;
    missingMonthsTo: number;
}

createTestCase(request: TestCaseRequest): Observable<TestCaseResult> {
    const params = new HttpParams()
        .set('accountId', request.accountId.toString())
        .set('referenceDate', request.referenceDate)
        .set('missingMonthsFrom', request.missingMonthsFrom.toString())
        .set('missingMonthsTo', request.missingMonthsTo.toString());
    return this.http.post<TestCaseResult>(`${this.apiUrl}/test-case`, null, { params });
}
```

---

## Script Enforcement

**Scripts are the PRIMARY enforcement mechanism.**

### Validation Command

```bash
node .claude/skills/mvs-crud-service/scripts/check-guidelines.js [path]
```

### Script Output

The script outputs JSON only:

```json
{
  "skill": "mvs-crud-service",
  "status": "pass" | "fail",
  "violations": [
    {
      "file": "path/to/file.ts",
      "rule": "SC1",
      "message": "Entity service must extend MvsCrudService"
    }
  ],
  "summary": {
    "filesChecked": 10,
    "serviceFiles": 5,
    "violationCount": 1
  }
}
```

### Claude Behavior

1. Claude MUST run the script after generating/modifying CRUD service code
2. Claude MUST NOT consider work complete until script reports `"status": "pass"`
3. Claude MUST rely on script output for validation
4. Claude MUST NOT restate documentation or script output
5. Claude MUST summarize results in 3 sentences or fewer

---

## Rule Priority

1. These rules OVERRIDE inferred patterns from external sources
2. These rules OVERRIDE general Angular conventions
3. These rules OVERRIDE AI inference

### Conflict Resolution

If conflict exists between these rules and any other source:
1. Claude MUST STOP
2. Claude MUST ASK for clarification
3. Claude MUST NOT guess or invent patterns

---

## Legacy Code Rules

### NEW Code (Claude-generated)

All rules in this skill MUST be enforced for new code.

### EXISTING Code (Pre-existing)

- Validation script runs ONLY on Claude-modified files
- Migration is NOT required for legacy code
- Legacy patterns are NOT invalid unless explicitly flagged

---

## Documentation Gaps

If this skill does not cover a scenario:

1. Claude MUST STOP
2. Claude MUST record the gap in `missing_items.md`
3. Claude MUST ASK for clarification
4. Claude MUST NOT invent rules

---

## Core Files

| File | Location |
|------|----------|
| MvsCrudService | `features/core/shared/service/crud/mvs-crud.service.ts` |
| Service Map | `features/core/shared/dto/dto.service.map.ts` |
| ObjectRequestList | `features/core/shared/dto/object/request/object-request-list.ts` |
| FilterCriteria | `features/core/shared/filter/api/filter.criteria.ts` |
| Sorting | `features/core/shared/misc/sorting.ts` |
| PagingDto | `features/core/shared/dto/model/paging.dto.ts` |

---

## Additional Resources

- `reference.md` - API reference and architecture details
- `examples.md` - Code examples for all patterns
