# Acceptance Checklist: Core Architecture

Use this checklist to verify compliance with core architecture standards.

---

## DTO Separation Rule (CRITICAL)

- [ ] Services do NOT accept DTO classes as parameters (no `*Dto` suffix in method signatures)
- [ ] Services do NOT return DTO classes (no `*Dto` suffix in return types)
- [ ] Services work with internal objects (records, domain objects, entities)
- [ ] DTO conversion happens in Controller or dedicated DtoService
- [ ] Internal records/data classes do NOT have `Dto` suffix
- [ ] DTOs are only used at the API boundary (controllers)

**Detection Pattern:**
```
# Service methods should NOT have Dto in signatures
@Service class *Service {
    public *Dto method()     // ❌ WRONG - returns DTO
    public void method(*Dto) // ❌ WRONG - accepts DTO
}
```

---

## Endpoint Security Rule (CRITICAL)

- [ ] **ALL** external IDs (path variables, query params, request body) have access checks
- [ ] Access check uses `genericObjectService.getObjectAccess(id, EntityAccess.class)`
- [ ] `checkAccess(AuthObjectAccessEnum.read/write/full)` is called after getting access
- [ ] Multiple IDs are checked in a loop before processing
- [ ] Access level matches operation type (read for GET, write for POST/PUT, full for DELETE)

**Required Pattern:**
```java
// Single ID
MyEntityAccess access = genericObjectService.getObjectAccess(id, MyEntityAccess.class);
access.checkAccess(AuthObjectAccessEnum.read);

// Multiple IDs
for (Long id : ids) {
    MyEntityAccess access = genericObjectService.getObjectAccess(id, MyEntityAccess.class);
    access.checkAccess(AuthObjectAccessEnum.read);
}
```

---

## Controller Layer

- [ ] Entity access uses `genericObjectService.getObjectAccess(id, EntityAccess.class)`
- [ ] Authorization check is performed via `access.checkAccess(AuthObjectAccessEnum.read/write/full)`
- [ ] Custom endpoints are added to the entity's `ObjectCrudController` (not in separate controllers)
- [ ] `genericDataService.find()` is NOT used in controllers
- [ ] `genericDataService.findById()` is NOT used in controllers
- [ ] Entities are NOT returned directly - DTOs are used
- [ ] All @PathVariable IDs have access checks
- [ ] All @RequestParam IDs have access checks
- [ ] All IDs in @RequestBody have access checks

---

## Service Layer

- [ ] New entities use `entityManager.persist()`
- [ ] Existing entities use `entityManager.merge()`
- [ ] `genericDataService.save()` is NOT used (doesn't exist)
- [ ] Sorting uses `addSorting(field, boolean)`, NOT `addOrderAsc()`
- [ ] Service methods do NOT accept DTOs
- [ ] Service methods do NOT return DTOs
- [ ] Internal data transfer uses records (not DTOs)

---

## GenericObjectService Usage

- [ ] Controllers use `GenericObjectService` for entity access
- [ ] Access classes are used for authorization
- [ ] Entity is retrieved via `access.getEntity()`

---

## Access Class Creation (CRITICAL)

- [ ] Access class extends `ObjectAccess<EntityClass>`
- [ ] Access class is in the `access` package of the module
- [ ] Access class follows naming convention `{EntityName}Access`
- [ ] **NO** `getText()` method override exists (FORBIDDEN)
- [ ] If entity needs custom display name, entity implements `EntityNameGet` interface

**Detection Pattern:**
```java
// ❌ FORBIDDEN - Access class must NOT override getText()
public class MyEntityAccess extends ObjectAccess<MyEntity> {
    @Override
    public String getText() { ... } // ❌ VIOLATION
}
```

**Correct Pattern:**
```java
// ✅ CORRECT - Empty Access class, entity implements EntityNameGet
public class MyEntityAccess extends ObjectAccess<MyEntity> {
    // No getText() override - base class handles via EntityNameGet
}

// Entity with custom display name
public class MyEntity extends ConfigurableEntity implements EntityNameGet {
    private String name;

    @Override
    public String getName() { return this.name; }
}
```

**Quick Check:**
```bash
# Find Access classes with getText() override (violation)
grep -rn "@Override" --include="*Access.java" -A 2 | grep "getText()"
```

---

## GenericDataService Usage

- [ ] Query builder pattern is used for complex queries
- [ ] `getEntityQueryBuilder()` method is used
- [ ] Metamodel attributes are used for filtering

---

## OnObjectChange Event Handlers

### Same-Transaction Methods
- [ ] `onBeforeCreateObject` - Used for pre-create validation (failure rolls back)
- [ ] `onCreateObject` - Used for same-transaction post-create logic
- [ ] `onBeforeUpdateObject` - Used for pre-update validation (failure rolls back)
- [ ] `onUpdateObject` - Used for same-transaction post-update logic
- [ ] `onBeforeDeleteObject` - Used for pre-delete validation (failure rolls back)
- [ ] `onDeleteObject` - Used for same-transaction post-delete logic

### Post-Commit Methods (NEW)
- [ ] `onAfterCreateCommitted` - Used for workflows, notifications, external integrations (failure does NOT rollback)
- [ ] `onAfterUpdateCommitted` - Used for workflows, notifications, external integrations (failure does NOT rollback)
- [ ] `onAfterDeleteCommitted` - Used for cleanup, notifications, external integrations (failure does NOT rollback)

### Placement Rules
- [ ] OnObjectChange handlers are in `{module}/model/event/` package
- [ ] Handler follows naming convention `{EntityName}OnChange.java`
- [ ] Handler is NOT in `access/`, `access/form/`, or `service/` packages

### When to Use Post-Commit vs Same-Transaction

| Use Case | Method Type |
|----------|-------------|
| Validation that should prevent save | Same-Transaction (`onBefore*`) |
| Data consistency operations | Same-Transaction |
| Workflows, notifications | Post-Commit (`onAfter*Committed`) |
| External API calls | Post-Commit (`onAfter*Committed`) |
| Non-critical audit logging | Post-Commit (`onAfter*Committed`) |

---

## Two-Layer CRUD Service Architecture (NEW)

### Layer Separation
- [ ] `ObjectCrudService` is used for entity-layer CRUD (works with `ObjectAccess` only)
- [ ] `ObjectCrudDtoService` is used for DTO-layer CRUD (handles DTO conversion)
- [ ] Controllers delegate to `ObjectCrudDtoService` for DTO operations
- [ ] Services use `ObjectCrudService` for service-to-service calls with `ObjectAccess`

### ObjectCrudService Usage
- [ ] Create: `objectCrudService.create(objectAccess, importObjectContext)`
- [ ] Update: `objectCrudService.update(objectAccess, entityChanges, importObjectContext)`
- [ ] Delete: `objectCrudService.delete(id, entityClass, importObjectContext)`
- [ ] Get: `objectCrudService.get(id, accessClass, AuthObjectAccessEnum.read)`

### ObjectCrudDtoService Usage (for Controllers)
- [ ] Create: `objectCrudDtoService.create(dto, importObjectContext, entityClass)`
- [ ] Update: `objectCrudDtoService.update(id, dto, importObjectContext, entityClass)`
- [ ] Delete: `objectCrudDtoService.delete(id, entityClass, importObjectContext)`
- [ ] Get: `objectCrudDtoService.get(id, entityClass, objectRequest)`

### Result Handling
- [ ] `GenericObjectCrudResult` is used for entity-layer results
- [ ] `GenericObjectCrudDtoResult` is used for DTO-layer results
- [ ] Check `result.hasErrors()` before processing
- [ ] Check `result.isNoChange()` for update operations

---

## Anti-Patterns (MUST NOT HAVE)

- [ ] ❌ NO services with `*Dto` return types
- [ ] ❌ NO services with `*Dto` parameters
- [ ] ❌ NO controller endpoints with unchecked external IDs
- [ ] ❌ NO authorization bypass
- [ ] ❌ NO entities exposed directly from controllers
- [ ] ❌ NO deprecated or non-existent methods
- [ ] ❌ NO `getText()` override in Access classes

---

## Quick Validation

Run these checks on your code:

1. **Search for DTO in Services:**
   ```bash
   # Find services returning DTOs (violation)
   grep -rn "@Service" --include="*.java" -A 50 | grep -E "public.*Dto.*\("
   ```

2. **Search for unchecked IDs:**
   ```bash
   # Find endpoints with ID parameters
   grep -rn "@PathVariable\|@RequestParam.*id\|@RequestParam.*Id" --include="*Controller.java"
   # Verify each has checkAccess() nearby
   ```

3. **Run automated validator:**
   ```bash
   node scripts/check-documentation.js backend/src/main/java/
   ```

---

## Example: Compliant Implementation

```java
// ✅ COMPLIANT Controller
@RestController
@RequestMapping("/mvsa/bm/billingRuns")
public class BillingRunController extends ObjectCrudController<BillingRunDtoDetail, Long> {

    @Autowired GenericObjectService genericObjectService;
    @Autowired BmBillingKpiService billingKpiService;

    @GetMapping("/kpis")
    @Transactional(readOnly = true)
    public ResponseEntity<BillingKpiResponseDto> getBillingRunKpis(
            @RequestParam(required = false) List<Long> billingAreaIds) {

        // ✓ Access check for external IDs
        if (billingAreaIds != null) {
            for (Long id : billingAreaIds) {
                BillingAreaAccess access = genericObjectService.getObjectAccess(id, BillingAreaAccess.class);
                access.checkAccess(AuthObjectAccessEnum.read);
            }
        }

        // ✓ Service returns internal objects
        List<BillingRunKpiData> kpiData = billingKpiService.getBillingKpis(billingAreaIds);

        // ✓ DTO conversion in controller
        BillingKpiResponseDto response = convertToDto(kpiData);
        return ResponseEntity.ok(response);
    }

    private BillingKpiResponseDto convertToDto(List<BillingRunKpiData> data) {
        // Conversion logic here
    }
}

// ✅ COMPLIANT Service
@Service
public class BmBillingKpiService {

    // ✓ Returns internal record, NOT DTO
    public List<BillingRunKpiData> getBillingKpis(List<Long> billingAreaIds) {
        return namedParameterJdbcTemplate.query(SQL, params,
            (rs, rowNum) -> BillingRunKpiData.rowMapper(rs));
    }
}

// ✅ COMPLIANT Internal Record (NOT a DTO)
public record BillingRunKpiData(
    Long billingAreaId,
    String billingAreaName,
    Long plannedPaymentCount,
    BigDecimal plannedPaymentAmount
) {
    public static BillingRunKpiData rowMapper(ResultSet rs) throws SQLException {
        return new BillingRunKpiData(
            rs.getLong("billing_area_id"),
            rs.getString("billing_area_name"),
            rs.getLong("planned_payment_count"),
            rs.getBigDecimal("planned_payment_amount")
        );
    }
}
```

---

## Example: Non-Compliant Implementation (REJECT)

```java
// ❌ NON-COMPLIANT - Multiple violations
@RestController
public class BillingRunController {

    @Autowired BmBillingKpiService billingKpiService;

    @GetMapping("/kpis")
    public ResponseEntity<BillingKpiResponseDto> getBillingRunKpis(
            @RequestParam(required = false) List<Long> billingAreaIds) {

        // ❌ NO access check for external billingAreaIds!
        // ❌ Service returns DTO directly
        BillingKpiResponseDto response = billingKpiService.getBillingKpis(billingAreaIds);
        return ResponseEntity.ok(response);
    }
}

// ❌ NON-COMPLIANT Service
@Service
public class BmBillingKpiService {

    // ❌ Returns DTO - violates DTO Separation Rule
    public BillingKpiResponseDto getBillingKpis(List<Long> billingAreaIds) {
        // ...
        return new BillingKpiResponseDto(); // ❌ Service returning DTO
    }
}
```
