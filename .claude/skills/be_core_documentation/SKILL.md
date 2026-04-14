---
name: be_core_documentation
description: "Backend: Core architecture documentation covering services, GenericDataService, GenericObjectService, OnObjectChange event handlers, Spring Batch jobs, scheduling, data processing, and overall system architecture. Use when creating/modifying services, using GenericDataService, GenericObjectService, creating OnObjectChange handlers, or understanding system architecture."
---

# Core Documentation

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/core/documentation.md`

## When to Use This Skill

Use when:
- Creating/modifying services
- Using GenericDataService
- Using GenericObjectService
- Working with Spring Batch jobs
- Implementing scheduling
- Understanding data processing
- Learning system architecture
- Creating OnObjectChange event handlers

## Critical Rules

### Controllers
- **ALWAYS** use `genericObjectService.getObjectAccess(id, EntityAccess.class)`
- **ALWAYS** call `access.checkAccess(AuthObjectAccessEnum.read/write/full)`
- **ALWAYS** add custom endpoints to the entity's `ObjectCrudController` (e.g., `DunningController`)
- **ALWAYS** validate external IDs before processing (see Endpoint Security below)
- **NEVER** create separate controllers for entity operations (e.g., don't create `BdDunningController` when `DunningController` exists)
- **NEVER** use `genericDataService.find()` or `genericDataService.findById()` in controllers
- **NEVER** return entities directly - always use DTOs

### Services
- **ALWAYS** use `entityManager.persist()` for new entities
- **ALWAYS** use `entityManager.merge()` for existing entities
- **ALWAYS** work with internal objects (records, domain objects), NOT DTOs
- **NEVER** use `genericDataService.save()` - it doesn't exist
- **NEVER** accept or return DTO classes (classes/records with `Dto` suffix) in service methods
- **ALWAYS** use `addSorting(field, boolean)` - not `addOrderAsc()`

---

## DTO Separation Rule (CRITICAL)

**DTOs must NEVER be processed in regular services!**

DTOs are Data Transfer Objects meant only for external API communication. They must be converted to internal objects (records, domain objects) before being processed by services. This ensures:
1. Data is never overexposed
2. Internal processing remains decoupled from API contracts
3. Service logic is reusable across different API versions

### DTO Conversion Responsibility

The following are responsible for DTO conversion:
- **Controller**: Converts DTOs to internal objects before calling services, and converts service results back to DTOs
- **Dedicated DtoService**: A module-specific service (e.g., `BmDtoService`) that handles all DTO conversions

### Correct Pattern (Controller handles conversion)

```java
@RestController
@RequestMapping("/mvsa/bm/billingRuns")
public class BillingRunController extends ObjectCrudController<BillingRunDtoDetail, Long> {

    @Autowired BmBillingKpiService billingKpiService;

    @GetMapping("/kpis")
    @Transactional(readOnly = true)
    public ResponseEntity<BillingKpiResponseDto> getBillingRunKpis(
            @RequestParam(required = false) List<Long> billingAreaIds) {

        // STEP 1: Validate access for each external ID
        if (billingAreaIds != null) {
            for (Long id : billingAreaIds) {
                BillingAreaAccess access = genericObjectService.getObjectAccess(id, BillingAreaAccess.class);
                access.checkAccess(AuthObjectAccessEnum.read);
            }
        }

        // STEP 2: Call service with internal objects (not DTOs)
        List<BillingRunKpiData> kpiData = billingKpiService.getBillingKpis(billingAreaIds);

        // STEP 3: Convert internal objects to DTO in controller
        BillingKpiResponseDto response = convertToDto(kpiData);

        return ResponseEntity.ok(response);
    }
}
```

### Correct Pattern (Service returns internal objects)

```java
@Service
public class BmBillingKpiService {

    // Service method returns INTERNAL record, not DTO
    public List<BillingRunKpiData> getBillingKpis(List<Long> billingAreaIds) {
        // Internal processing with records/domain objects
        return namedParameterJdbcTemplate.query(SQL, params,
            (rs, rowNum) -> BillingRunKpiData.rowMapper(rs));
    }
}

// Internal record - NOT a DTO
public record BillingRunKpiData(
    Long billingAreaId,
    String billingAreaName,
    // ... fields
) {
    public static BillingRunKpiData rowMapper(ResultSet rs) throws SQLException { ... }
}
```

### WRONG Pattern (Service returns/accepts DTOs)

```java
// ❌ WRONG - Service should NOT return DTOs
@Service
public class BmBillingKpiService {
    public BillingKpiResponseDto getBillingKpis(List<Long> billingAreaIds) {
        // ...
        return new BillingKpiResponseDto(); // ❌ Service returning DTO
    }
}
```

---

## Endpoint Security Rule (CRITICAL)

**When IDs are passed from outside, we MUST verify the user has access to the referenced objects!**

Every ID parameter received from external sources (path variables, query parameters, request body) must be validated for access before processing.

### Security Check Pattern

```java
// For single ID
@GetMapping("/{id}/details")
public ResponseEntity<MyDto> getDetails(@PathVariable Long id) {
    // MANDATORY: Check access before any processing
    MyEntityAccess access = genericObjectService.getObjectAccess(id, MyEntityAccess.class);
    access.checkAccess(AuthObjectAccessEnum.read);

    // Now safe to process
    MyEntity entity = access.getEntity();
    return ResponseEntity.ok(convertToDto(entity));
}

// For multiple IDs
@GetMapping("/by-areas")
public ResponseEntity<MyResponseDto> getByAreas(
        @RequestParam List<Long> billingAreaIds) {

    // MANDATORY: Check access for EACH external ID
    for (Long areaId : billingAreaIds) {
        BillingAreaAccess access = genericObjectService.getObjectAccess(areaId, BillingAreaAccess.class);
        access.checkAccess(AuthObjectAccessEnum.read);
    }

    // Now safe to process
    // ...
}
```

### Access Check Levels

| Level | Enum Value | Use Case |
|-------|------------|----------|
| Read | `AuthObjectAccessEnum.read` | Viewing data, GET requests |
| Write | `AuthObjectAccessEnum.write` | Modifying data, POST/PUT/PATCH requests |
| Full | `AuthObjectAccessEnum.full` | Delete operations, admin actions |

### When Security Check is NOT Required

- System-generated IDs within a transaction (not from external input)
- IDs from already-authorized parent objects
- Public endpoints explicitly marked as unsecured

### Controller Pattern

```java
@GetMapping("/{id}")
public MyEntityDto getById(@PathVariable Long id) {
    MyEntityAccess access = genericObjectService.getObjectAccess(
        id, MyEntityAccess.class
    );
    access.checkAccess(AuthObjectAccessEnum.read);
    return access.getEntity().toDto();
}
```

### Service Pattern

```java
@Transactional
public MyEntity create(CreateRequest request) {
    MyEntity entity = new MyEntity();
    // Set properties
    entityManager.persist(entity);
    return entity;
}

@Transactional
public MyEntity update(MyEntity entity) {
    return entityManager.merge(entity);
}
```

## Access Class Creation (CRITICAL)

When creating Access classes for entities:

### Rules

- **ALWAYS** extend `ObjectAccess<E>` where E is the entity class
- **NEVER** override `getText()` - the base implementation handles all cases via `EntityNameGet` interface
- **ALWAYS** create Access class in the `access` package of the module
- **ALWAYS** follow naming convention: `{EntityName}Access`

### Correct Pattern

```java
package com.mvs.backend.bd.access;

import com.mvs.backend.bd.model.DunningType;
import com.mvs.backend.core.access.ObjectAccess;

public class DunningTypeAccess extends ObjectAccess<DunningType> {
    // Empty class is valid - base class handles everything
    // If entity needs custom display name, implement EntityNameGet on the entity
}
```

### Why getText() Override is FORBIDDEN

The base `ObjectAccess.getText()` already handles:
1. Entities implementing `EntityNameGet` → returns `getName()`
2. Entities implementing `GenericTemplateTypeInstanceFormatName` → returns `getFormatName()`
3. All other entities → returns `id.toString()`

If you need a custom display name:
- **DO**: Implement `EntityNameGet` interface on the entity class
- **DON'T**: Override `getText()` in the Access class

### Wrong Pattern (FORBIDDEN)

```java
// ❌ FORBIDDEN - Never override getText()
public class DunningTypeStopAccess extends ObjectAccess<DunningTypeStop> {

    @Override
    public String getText() {
        return this.getEntity().getName(); // ❌ WRONG - use EntityNameGet interface instead
    }
}
```

### Correct Alternative

```java
// ✅ CORRECT - Entity implements EntityNameGet
@Entity(name = "bdDunningTypeStop")
public class DunningTypeStop extends ConfigurableEntity implements EntityNameGet {

    private String name;

    @Override
    public String getName() {
        return this.name;
    }
}

// Access class is empty - base class uses EntityNameGet automatically
public class DunningTypeStopAccess extends ObjectAccess<DunningTypeStop> {
}
```

---

## OnObjectChange Event Handlers (CRITICAL)

Event handlers that react to entity lifecycle events (create, update, delete).

### Placement Rules

- **ALWAYS** place in `{module}/model/event/` package
- **ALWAYS** name as `{EntityName}OnChange.java`
- **NEVER** place in `access/`, `access/form/`, `service/`, or other locations

### Directory Structure

```
backend/src/main/java/com/mvs/backend/{module}/
├── access/
│   └── {EntityName}Access.java          # Access classes go here
├── model/
│   ├── {EntityName}.java                # Entity classes
│   └── event/
│       └── {EntityName}OnChange.java    # ✅ OnObjectChange handlers go here
└── service/
    └── {Module}Service.java             # Service classes
```

### Example Paths

| Module | OnChange Handler Path |
|--------|----------------------|
| BD | `bd/model/event/DunningArtificialAgentOnChange.java` |
| BM | `bm/model/event/BillingRunOnChange.java` |
| TM | `tm/model/event/TicketOnChange.java` |
| CR | `cr/model/event/CustomerOnChange.java` |
| CM | `cm/model/event/ContractOnChange.java` |

### OnObjectChange Interface Methods

The `OnObjectChange` interface provides two categories of methods:

#### Same-Transaction Methods (Traditional)
These methods run **within the same transaction** as the entity save. If they fail, the entire transaction rolls back.

| Method | When Called | Use Case |
|--------|-------------|----------|
| `onBeforeCreateObject` | Before entity is persisted | Pre-create validation, setting defaults |
| `onCreateObject` | After entity is persisted (same transaction) | Same-transaction post-create logic |
| `onBeforeUpdateObject` | Before entity is updated | Pre-update validation |
| `onUpdateObject` | After entity is updated (same transaction) | Same-transaction post-update logic |
| `onBeforeDeleteObject` | Before entity is deleted | Pre-delete validation |
| `onDeleteObject` | After entity is deleted (same transaction) | Same-transaction post-delete logic |

#### Post-Commit Methods (NEW)
These methods run **AFTER the transaction commits**. Failures do NOT affect the entity save. Use for operations that should not roll back the entity save.

| Method | When Called | Use Case |
|--------|-------------|----------|
| `onAfterCreateCommitted` | After transaction commits (new transaction) | Workflows, notifications, external integrations |
| `onAfterUpdateCommitted` | After transaction commits (new transaction) | Workflows, notifications, external integrations |
| `onAfterDeleteCommitted` | After transaction commits (new transaction) | Cleanup, notifications, external integrations |

### Post-Commit Processing Architecture

```
Entity CRUD Operation
    │
    ▼
ObjectCrudService [@Transactional]
    │  ├── onBefore* hooks (can fail → rollback)
    │  ├── entityManager.persist/merge/remove
    │  ├── on* hooks (can fail → rollback)
    │  └── Publish ObjectCreatedEvent/ObjectUpdatedEvent/ObjectDeletedEvent
    │
    ▼ [TRANSACTION COMMITS - Entity is SAVED]
    │
    ▼
PostCommitEventListener [@TransactionalEventListener(AFTER_COMMIT)]
    │  ├── ActionOnObjectChangeService (workflows)
    │  └── onAfter*Committed hooks
    │
    ▼ (Failures here do NOT affect entity save)
```

### When to Use Post-Commit Methods

Use post-commit methods for:
- **Workflows**: Triggering workflow processes after entity save
- **Notifications**: Sending emails, SMS, or push notifications
- **External Integrations**: Calling external APIs/systems
- **Audit Logging**: Non-critical audit trail entries
- **Cache Invalidation**: External cache updates

Do NOT use post-commit methods for:
- Operations that MUST succeed for the entity save to be valid
- Data consistency operations
- Validation that should prevent saves

### Correct Pattern

```java
package com.mvs.backend.bd.model.event;  // ✅ model/event package

import com.mvs.backend.bd.access.DunningArtificialAgentAccess;
import com.mvs.backend.core.bridge.ObjectClassConnection;
import com.mvs.backend.core.check.logic.CheckErrors;
import com.mvs.backend.core.context.ImportObjectContext;
import com.mvs.backend.core.entity.ExtendedEntityChanges;
import com.mvs.backend.core.jpa.OnObjectChange;
import com.mvs.backend.core.jpa.exception.OnObjectChangeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class DunningArtificialAgentOnChange implements OnObjectChange<DunningArtificialAgentAccess> {

    private final GenericDataService genericDataService;
    private final EntityManager entityManager;
    private final NotificationService notificationService;

    // === Same-Transaction Methods ===

    @Override
    public void onBeforeCreateObject(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ExtendedEntityChanges entityChanges,
            CheckErrors checkErrors,
            ImportObjectContext importObjectContext) throws OnObjectChangeException {
        // Pre-create validation/logic - failure rolls back entity save
    }

    @Override
    public void onCreateObject(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ImportObjectContext importObjectContext) throws OnObjectChangeException {
        // Post-create logic (same transaction) - failure rolls back entity save
    }

    @Override
    public void onBeforeUpdateObject(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ExtendedEntityChanges entityChanges,
            CheckErrors checkErrors,
            ImportObjectContext importObjectContext) throws OnObjectChangeException {
        // Pre-update validation/logic - failure rolls back entity save
    }

    @Override
    public void onUpdateObject(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ExtendedEntityChanges entityChanges,
            ImportObjectContext importObjectContext) throws OnObjectChangeException {
        // Post-update logic (same transaction) - failure rolls back entity save
    }

    @Override
    public void onDeleteObject(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            Object entityId,
            CheckErrors checkErrors) throws OnObjectChangeException {
        // Delete logic (same transaction) - failure rolls back entity delete
    }

    // === Post-Commit Methods (NEW) ===

    @Override
    public void onAfterCreateCommitted(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ImportObjectContext importObjectContext) {
        // Runs AFTER transaction commits - failure does NOT rollback entity save
        // Use for: workflows, notifications, external integrations
        notificationService.sendNotification(objectAccess.getEntity());
    }

    @Override
    public void onAfterUpdateCommitted(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            ExtendedEntityChanges entityChanges,
            ImportObjectContext importObjectContext) {
        // Runs AFTER transaction commits - failure does NOT rollback entity save
        // entityChanges contains what was modified
        if (entityChanges.hasAttributeChanged(DunningArtificialAgent_.STATUS)) {
            notificationService.notifyStatusChange(objectAccess.getEntity());
        }
    }

    @Override
    public void onAfterDeleteCommitted(
            ObjectClassConnection mapping,
            DunningArtificialAgentAccess objectAccess,
            Object entityId) {
        // Runs AFTER transaction commits - failure does NOT rollback entity delete
        // Use for: cleanup, notifications, external integrations
        notificationService.notifyDeletion(entityId);
    }
}
```

### Wrong Pattern (FORBIDDEN)

```java
// ❌ FORBIDDEN - Wrong package location
package com.mvs.backend.bd.access.form;  // ❌ WRONG - must be model/event

@Component
public class DunningArtificialAgentOnChange implements OnObjectChange<DunningArtificialAgentAccess> {
    // ...
}
```

### Key Annotations

| Annotation | Purpose |
|------------|---------|
| `@Component` | Registers bean with Spring for auto-discovery |
| `@RequiredArgsConstructor` | Lombok - constructor injection for final fields |

### Checking for Attribute Changes

Use the metamodel constants to check if specific attributes changed:

```java
// Check if a specific attribute was modified
if (entityChanges.hasAttributeChanged(DunningArtificialAgent_.DUNNING_TAG_DESCRIPTION)) {
    // Handle the change
}
```

---

## Two-Layer CRUD Service Architecture (NEW)

The system uses a two-layer service architecture for CRUD operations:

### Architecture Diagram

```
HTTP Request (DTO)
    │
    ▼
ObjectCrudController (Thin - HTTP concerns only)
    │  ├── Parse request (DTO)
    │  ├── Input validation (@Valid)
    │  └── Format response (DTO)
    │
    ▼ [DTO]
ObjectCrudDtoService (DTO ↔ ObjectAccess conversion)
    │  ├── DTO → ObjectAccess (via DtoService)
    │  ├── Delegate to ObjectCrudService
    │  └── ObjectAccess → DTO (via DtoService)
    │
    ▼ [ObjectAccess]
ObjectCrudService [@Transactional]
    │  ├── Authorization checks
    │  ├── Business validation (CheckService)
    │  ├── onBefore* hooks
    │  ├── entityManager.persist/merge/remove
    │  ├── on* hooks (same transaction)
    │  └── Publish domain events
    │
    ▼ [TRANSACTION COMMITS]
    │
    ▼
PostCommitEventListener [@TransactionalEventListener(AFTER_COMMIT)]
    │  └── onAfter*Committed hooks
```

### ObjectCrudService (Entity Layer)

Works ONLY with `ObjectAccess` - NO DTOs allowed. Owns `@Transactional` boundaries.

```java
@Autowired
private ObjectCrudService objectCrudService;

// Create
GenericObjectCrudResult<MyEntityAccess> result = objectCrudService.create(
    objectAccess,
    ImportObjectContext.createEmpty()
);

// Update
GenericObjectCrudResult<MyEntityAccess> result = objectCrudService.update(
    objectAccess,
    entityChanges,
    ImportObjectContext.createEmpty()
);

// Delete
GenericObjectCrudResult<MyEntityAccess> result = objectCrudService.delete(
    entityId,
    MyEntity.class,
    ImportObjectContext.createEmpty()
);

// Get with authorization
MyEntityAccess access = objectCrudService.get(
    entityId,
    MyEntityAccess.class,
    AuthObjectAccessEnum.read
);
```

### ObjectCrudDtoService (DTO Layer)

Handles DTO ↔ ObjectAccess conversion. Use when working with DTOs (e.g., in controllers).

```java
@Autowired
private ObjectCrudDtoService objectCrudDtoService;

// Create from DTO
GenericObjectCrudDtoResult<MyEntityDtoDetail> result = objectCrudDtoService.create(
    dto,
    ImportObjectContext.createEmpty(),
    MyEntity.class
);

// Update from DTO
GenericObjectCrudDtoResult<MyEntityDtoDetail> result = objectCrudDtoService.update(
    entityId,
    dto,
    ImportObjectContext.createEmpty(),
    MyEntity.class
);

// Delete
GenericObjectCrudDtoResult<Void> result = objectCrudDtoService.delete(
    entityId,
    MyEntity.class,
    ImportObjectContext.createEmpty()
);

// Get as DTO
MyEntityDtoDetail dto = objectCrudDtoService.get(
    entityId,
    MyEntity.class,
    objectRequest
);
```

### When to Use Which Service

| Use Case | Service |
|----------|---------|
| Controller handling DTOs | `ObjectCrudDtoService` |
| Service-to-service calls with ObjectAccess | `ObjectCrudService` |
| Batch processing | `ObjectCrudService` |
| Import operations | `ObjectCrudService` |
| Testing CRUD operations | `ObjectCrudService` (via `CoreCrudTestService`) |

---

## Key Services

### ObjectCrudService (NEW - Entity Layer CRUD)
For CRUD operations with ObjectAccess. Owns transactional boundaries.
```java
@Autowired
private ObjectCrudService objectCrudService;

// Create
GenericObjectCrudResult<MyEntityAccess> result = objectCrudService.create(
    objectAccess, ImportObjectContext.createEmpty()
);

// Update
GenericObjectCrudResult<MyEntityAccess> result = objectCrudService.update(
    objectAccess, entityChanges, ImportObjectContext.createEmpty()
);

// Delete
GenericObjectCrudResult<?> result = objectCrudService.delete(
    id, MyEntity.class, ImportObjectContext.createEmpty()
);

// Get with authorization
MyEntityAccess access = objectCrudService.get(id, MyEntityAccess.class, AuthObjectAccessEnum.read);
```

### ObjectCrudDtoService (NEW - DTO Layer CRUD)
For CRUD operations with DTOs. Use in controllers.
```java
@Autowired
private ObjectCrudDtoService objectCrudDtoService;

// Create from DTO
GenericObjectCrudDtoResult<MyEntityDtoDetail> result = objectCrudDtoService.create(
    dto, ImportObjectContext.createEmpty(), MyEntity.class
);

// Update from DTO
GenericObjectCrudDtoResult<MyEntityDtoDetail> result = objectCrudDtoService.update(
    id, dto, ImportObjectContext.createEmpty(), MyEntity.class
);

// Delete
GenericObjectCrudDtoResult<Void> result = objectCrudDtoService.delete(
    id, MyEntity.class, ImportObjectContext.createEmpty()
);

// Get as DTO
MyEntityDtoDetail dto = objectCrudDtoService.get(id, MyEntity.class, objectRequest);
```

### GenericObjectService
For object access with authorization (read operations, used internally by ObjectCrudService):
```java
MyEntityAccess access = genericObjectService.getObjectAccess(id, MyEntityAccess.class);
access.checkAccess(AuthObjectAccessEnum.read);
MyEntity entity = access.getEntity();
```

### GenericDataService
For query building:
```java
List<MyEntity> results = genericDataService
    .getEntityQueryBuilder(MyEntity.class)
    .addViaEntity(MyEntity_.TYPE, type)
    .addSorting("createdDate", false)
    .build()
    .execute();
```

## Best Practices

### DO:
- Use GenericObjectService for all entity access in controllers
- Use EntityManager for persistence operations
- Use GenericDataService for complex queries

### DON'T:
- Don't bypass authorization checks
- Don't return entities directly from controllers
- Don't use deprecated or non-existent methods

## Automated Checks

The following checks are automated via `scripts/check-documentation.js`:

| Rule ID | Name | Description | Auto-fixable |
|---------|------|-------------|--------------|
| DOC-001 | No genericDataService.find() in Controllers | Use genericObjectService.getObjectAccess() instead | No |
| DOC-002 | No genericDataService.findById() in Controllers | Use genericObjectService.getObjectAccess() instead | No |
| DOC-003 | checkAccess() Required After getObjectAccess() | Authorization check must follow access retrieval | No |
| DOC-004 | No genericDataService.save() | Method doesn't exist - use entityManager | No |
| DOC-005 | No addOrderAsc() | Use addSorting(field, true) instead | Yes |
| DOC-006 | No addOrderDesc() | Use addSorting(field, false) instead | Yes |
| DOC-007 | Use entityManager.persist() for New Entities | Prefer entityManager over repository.save() | No |
| DOC-008 | Controller Returns DTO | Controllers should return DTOs, not entities | No |
| DOC-009 | GenericObjectService for Entity Access | Use getObjectAccess() with authorization | No |
| DOC-010 | Service Should Not Return DTOs | Services must return internal objects, not DTOs | No |
| DOC-011 | Service Should Not Accept DTOs | Services must accept internal objects, not DTOs | No |
| DOC-012 | External IDs Must Have Access Check | All @RequestParam/@PathVariable IDs need access check | No |
| DOC-013 | Internal Records Should Not Have Dto Suffix | Records in services/records should not be named *Dto | No |
| DOC-014 | No getText() Override in Access Classes | Access classes must NOT override getText() | No |

### Usage

```bash
# Check a directory
node scripts/check-documentation.js backend/src/main/java/

# Check specific category
node scripts/check-documentation.js --category controller backend/src/

# Output as JSON
node scripts/check-documentation.js --json backend/ > report.json

# List all rules
node scripts/check-documentation.js --list-rules
```

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)