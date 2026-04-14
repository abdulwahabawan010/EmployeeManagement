---
name: be_test
description: "Backend: Test implementation guide for unit tests and integration tests. Use when creating/modifying unit tests or integration tests, setting up TestService classes, or understanding test patterns."
---

# Backend Test Guide

## When to Use This Skill

Use when:
- Creating unit tests
- Creating integration tests
- Creating external tests
- Setting up TestService classes
- Understanding test patterns and base classes

---

## Test Architecture Overview

The test framework uses **Gradle** with **JUnit 5** and **Testcontainers** for database testing. Tests are categorized into three major types: **Unit**, **Integration**, and **External**.

### Key Principles

1. **Authentication is automatic** - `@IntegrationTest` and `@ExternalTest` include `@WithMockAuthenticatedUser` by default
2. **Database uses PostgreSQL via Testcontainers** - No H2, real PostgreSQL in Docker containers
3. **Single tenant by default** - Multi-tenant requires explicit profile activation
4. **Security disabled by default** - Real security chain requires explicit profile activation

---

## Test Configuration Location

```
backend/src/test/java/com/mvs/backend/test/configuration/
├── annotation/
│   ├── TestProfiles.java                 # Base meta-annotation importing all profiles
│   ├── UnitTest.java                     # @Tag("unit") - no Spring context
│   ├── IntegrationTest.java              # @Tag("integration") - Spring + auth
│   ├── ExternalTest.java                 # @Tag("external") - external services
│   ├── SlowTest.java                     # @Tag("slow") - long-running tests
│   └── mockAuth/
│       ├── WithMockAuthenticatedUser.java
│       └── MockAuthenticatedUserSecurityContextFactory.java
├── basic/
│   ├── AbstractTestBaseUnit.java                    # Base class for unit tests
│   ├── AbstractTestBaseIntegration.java             # Base class for integration tests
│   ├── AbstractTestBaseExternal.java                # Base class for external tests
│   └── AbstractTestBaseIntegrationMultiTenant.java  # Base class for multi-tenant tests
└── profiles/
    ├── ProfileNoSecurityConfiguration.java          # Security disabled (default)
    ├── ProfileTenantSingleConfiguration.java        # Single tenant (default)
    └── ProfileTenantMultiConfiguration.java         # Multi-tenant setup
```

---

## Three Test Categories

### 1. Unit Tests (`@UnitTest`)

Fast, isolated tests without Spring context.

```java
@UnitTest
class MyServiceUnitTest {
    // No Spring context
    // Mock dependencies with Mockito
    // Fast execution
}

// Or extend the base class
class MyServiceUnitTest extends AbstractTestBaseUnit {
    // Inherits @UnitTest annotation
}
```

**Characteristics:**
- No Spring context required
- Dependencies mocked with Mockito
- Tests single class/method in isolation
- Fast execution

**Run:** `./gradlew unitTest`

---

### 2. Integration Tests (`@IntegrationTest`)

Tests with Spring context, database, and automatic authentication.

```java
@IntegrationTest
class MyServiceIntegrationTest extends AbstractTestBaseIntegration {

    @Autowired
    private MyService myService;

    @Test
    void shouldDoSomething() {
        // Spring context available
        // PostgreSQL database via Testcontainers
        // Authenticated user with admin role (automatic)
    }
}
```

**What `@IntegrationTest` provides automatically:**
- `@SpringBootTest` - Spring context
- `@Tag("integration")` - Test categorization
- `@WithMockAuthenticatedUser` - Authenticated admin user
- `@TestProfiles` - Profile configurations imported
- Security disabled
- Single tenant mode

**Characteristics:**
- Full Spring context
- Testcontainers PostgreSQL database
- Authenticated user by default
- Security disabled by default

**Run:** `./gradlew integrationTest`

---

### 3. External Tests (`@ExternalTest`)

Tests that interact with real external services.

```java
@ExternalTest
class BiproServiceTest extends AbstractTestBaseExternal {

    @Test
    void shouldCallExternalService() {
        // Calls real external APIs
        // May require credentials
    }
}
```

**What `@ExternalTest` provides automatically:**
- `@SpringBootTest` - Spring context
- `@Tag("external")` - Test categorization
- `@WithMockAuthenticatedUser` - Authenticated admin user
- `@TestProfiles` - Profile configurations imported
- Security disabled
- Single tenant mode

**Characteristics:**
- Interacts with real external services
- Slower execution
- May require credentials
- Run selectively

**Run:** `./gradlew externalTest`

---

## Base Test Classes

| Base Class | Purpose | Inherits |
|------------|---------|----------|
| `AbstractTestBaseUnit` | Unit tests | `@UnitTest` |
| `AbstractTestBaseIntegration` | Integration tests (single tenant) | `@IntegrationTest`, `ProfileTenantSingleConfiguration` |
| `AbstractTestBaseExternal` | External service tests | `@ExternalTest`, `ProfileTenantSingleConfiguration` |
| `AbstractTestBaseIntegrationMultiTenant` | Multi-tenant integration tests | `@IntegrationTest`, `ProfileTenantMultiConfiguration` |

**Recommendation:** Always extend the appropriate base class for consistency.

---

## Authentication

### Automatic Authentication (Default)

`@IntegrationTest` and `@ExternalTest` automatically include `@WithMockAuthenticatedUser`:
- **Username:** `unit_test`
- **Roles:** `["admin"]`
- **Admin Runtime:** `true`

No manual setup required!

### Custom Authentication (Override)

Override at method level when needed:

```java
@IntegrationTest
class MyServiceTest extends AbstractTestBaseIntegration {

    @Test
    void testAsAdmin() {
        // Uses default admin authentication
    }

    @Test
    @WithMockAuthenticatedUser(username = "agent_user", roles = {"agent"}, adminRuntime = false)
    void testAsAgent() {
        // Uses agent authentication
    }

    @Test
    @WithMockAuthenticatedUser(userType = WithMockAuthenticatedUser.UserType.EU_USER)
    void testAsEndUser() {
        // Uses end-user authentication
    }
}
```

### @WithMockAuthenticatedUser Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `username` | `"unit_test"` | Username for authenticated user |
| `roles` | `{"admin"}` | Roles (without ROLE_ prefix) |
| `userType` | `USER` | `USER` or `EU_USER` |
| `adminRuntime` | `true` | Set up admin runtime roles |

---

## Database Configuration

### Testcontainers PostgreSQL

Tests use **Testcontainers PostgreSQL** (postgres:16-alpine) - no H2 database.

The profile configurations automatically set up:
- Single tenant: One PostgreSQL container (`tenantA` as master)
- Multi-tenant: Three PostgreSQL containers (`master`, `tenantA`, `tenantB`)

### Migration File

**Location:** `backend/src/test/resources/db/postgre/V1__.sql`

This file is auto-generated by `SchemaGenerationTest`.

### Schema Generation

When entity models change, regenerate the schema:

1. Delete `backend/src/test/resources/db/postgre/V1__.sql`
2. Run `SchemaGenerationTest.java`

**IMPORTANT:** `SchemaGenerationTest` will **only create the migration file** if all entities comply with project guidelines.

If the migration file is **not created**, you must:

1. **Check the test output** - Contains detailed information about entity problems
2. **Fix the identified issues** - Apply corrections as described in the output
3. **Re-run `SchemaGenerationTest.java`** - Verify issues are resolved
4. **Repeat until successful** - Continue until the migration file is created

**Related Skills:**
- `be_core_entity` - JPA entity architecture, sequence naming, annotations
- `be_core_form` - FormObject classes for form customization

---

## Multi-Tenant Testing

For multi-tenant tests, use `AbstractTestBaseIntegrationMultiTenant`:

```java
class MyMultiTenantTest extends AbstractTestBaseIntegrationMultiTenant {

    @Test
    void testTenantIsolation() {
        TenantContextHolder.setCurrentTenantAlias("tenantA");
        // ... create data in tenantA

        TenantContextHolder.setCurrentTenantAlias("tenantB");
        // ... verify data is isolated
    }
}
```

This provides three separate database containers for complete tenant isolation.

---

## Profile Configuration

### Defaults (No Configuration Needed)

| Aspect | Default Behavior |
|--------|------------------|
| **Security** | Disabled |
| **Tenants** | Single tenant (tenantA as master) |
| **Database** | Testcontainers PostgreSQL |
| **Authentication** | Mocked admin user |

### Available Profiles

| Profile | Description |
|---------|-------------|
| *(none)* | Security disabled, single tenant |
| `test-tenant-multi` | Multi-tenant (master, tenantA, tenantB) |
| `test-enable-security` | Enable real security chain |

### Activating Profiles

```java
@IntegrationTest
@ActiveProfiles("test-tenant-multi")
class MyMultiTenantTest extends ProfileTenantMultiConfiguration {
    // Multi-tenant mode
}

@IntegrationTest
@ActiveProfiles("test-enable-security")
class MySecurityTest {
    // Real security enabled
}
```

---

## Gradle Test Commands

### Convenience Tasks

| Command | Description |
|---------|-------------|
| `./gradlew unitTest` | Run unit tests only |
| `./gradlew integrationTest` | Run integration tests only |
| `./gradlew externalTest` | Run external tests only |
| `./gradlew fastTest` | Run all except slow & external |
| `./gradlew test` | Run all tests |

### Tag-Based Filtering

| Command | Description |
|---------|-------------|
| `./gradlew test -PincludeTags=unit` | Include by tag |
| `./gradlew test -PincludeTags=unit,integration` | Multiple tags |
| `./gradlew test -PexcludeTags=slow` | Exclude by tag |
| `./gradlew test -PincludeTags=integration -PexcludeTags=slow` | Combined |

### Test Configuration (build.gradle)

```groovy
test {
    useJUnitPlatform {
        if (project.hasProperty('includeTags')) {
            includeTags(*project.property('includeTags').split(','))
        }
        if (project.hasProperty('excludeTags')) {
            excludeTags(*project.property('excludeTags').split(','))
        }
    }
}
```

---

## TestService Pattern

Use TestService classes for test data creation:

```java
@IntegrationTest
class CustomerServiceTest extends AbstractTestBaseIntegration {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CrTestService crTestService;

    @Autowired
    private PmTestService pmTestService;

    @Test
    void shouldCreateCustomer() {
        // Use TestService for data creation
        Customer customer = crTestService.createCustomer("John", "Doe", PersonGender.male);

        // Test the service
        assertNotNull(customer.getId());
    }
}
```

**Available TestServices:**
- `CrTestService` - Customer/CR entities
- `PmTestService` - Person/PM entities
- `CmTestService` - Contract/CM entities
- `AmTestService` - Agent/AM entities
- `BmTestService` - Billing/BM entities
- `TmTestService` - Ticket/TM entities
- `CoreCrudTestService` - CRUD operations testing (ObjectCrudService/ObjectCrudDtoService)
- And many more per module...

---

## CRUD Service Testing with CoreCrudTestService

The `CoreCrudTestService` provides helpers for testing `ObjectCrudService` and `ObjectCrudDtoService`.

### Location

```
backend/src/test/java/com/mvs/backend/test/core/crud/CoreCrudTestService.java
```

### Available Methods

| Method | Description |
|--------|-------------|
| `createObjectAccess(entity, accessClass)` | Create ObjectAccess for any entity type |
| `createObjectAccessFromEntity(entity)` | Create ObjectAccess using mapping |
| `testCreate(objectAccess, context)` | Test create via ObjectCrudService |
| `testUpdate(objectAccess, changes, context)` | Test update via ObjectCrudService |
| `testDelete(id, entityClass, context)` | Test delete via ObjectCrudService |
| `testGet(id, accessClass, access)` | Test get via ObjectCrudService |
| `testCreateViaDto(dto, entityClass, context)` | Test create via ObjectCrudDtoService |
| `testUpdateViaDto(id, dto, entityClass, context)` | Test update via ObjectCrudDtoService |
| `testDeleteViaDto(id, entityClass, context)` | Test delete via ObjectCrudDtoService |
| `flushAndClear()` | Force fresh database reads |
| `entityExists(id, entityClass)` | Verify entity exists in database |
| `findEntity(id, entityClass)` | Find entity by ID |

### CRUD Testing Examples

#### Testing Create Operation

```java
@IntegrationTest
class MyEntityCrudTest extends AbstractTestBaseIntegration {

    @Autowired
    private CoreCrudTestService crudTestService;

    @Autowired
    private ObjectAccessService objectAccessService;

    @Test
    @Transactional
    void shouldCreateEntity() {
        // Given: Create entity and wrap in ObjectAccess
        MyEntity entity = new MyEntity();
        entity.setName("Test");
        entity.setStatus(MyStatus.active);

        MyEntityAccess access = crudTestService.createObjectAccess(entity, MyEntityAccess.class);

        // When: Create via ObjectCrudService
        GenericObjectCrudResult<MyEntityAccess> result = crudTestService.testCreate(
            access,
            ImportObjectContext.createEmpty()
        );

        // Then: Entity created successfully
        assertFalse(result.hasErrors(), "Should not have errors");
        assertNotNull(result.getObjectAccess().getId(), "Should have ID");
    }
}
```

#### Testing Update Operation

```java
@Test
@Transactional
void shouldUpdateEntity() {
    // Given: Existing entity
    MyEntity entity = createTestEntity(); // Use your TestService

    MyEntityAccess access = crudTestService.testGet(
        entity.getId(),
        MyEntityAccess.class,
        AuthObjectAccessEnum.write
    );

    // When: Update entity
    access.getEntity().setName("Updated Name");
    ExtendedEntityChanges changes = ExtendedEntityChanges.createGenericInstance(
        access, true, false, false
    );

    GenericObjectCrudResult<MyEntityAccess> result = crudTestService.testUpdate(
        access,
        changes,
        ImportObjectContext.createEmpty()
    );

    // Then: Changes persisted
    assertFalse(result.hasErrors());
    assertEquals("Updated Name", result.getObjectAccess().getEntity().getName());
}
```

#### Testing Delete Operation

```java
@Test
@Transactional
void shouldDeleteEntity() {
    // Given: Existing entity
    MyEntity entity = createTestEntity();
    Long entityId = entity.getId();

    // When: Delete via ObjectCrudService
    GenericObjectCrudResult<?> result = crudTestService.testDelete(
        entityId,
        MyEntity.class,
        ImportObjectContext.createEmpty()
    );

    // Then: Entity deleted
    assertFalse(result.hasErrors());
    assertFalse(crudTestService.entityExists(entityId, MyEntity.class));
}
```

#### Testing Validation Errors

```java
@Test
@Transactional
void shouldReturnErrorsOnValidationFailure() {
    // Given: Invalid entity (missing required fields)
    MyEntity entity = new MyEntity();
    // Leave required fields null

    MyEntityAccess access = crudTestService.createObjectAccess(entity, MyEntityAccess.class);

    // When: Create via ObjectCrudService
    GenericObjectCrudResult<MyEntityAccess> result = crudTestService.testCreate(
        access,
        ImportObjectContext.createEmpty()
    );

    // Then: Should have validation errors
    assertTrue(result.hasErrors(), "Should have validation errors");
    assertNotNull(result.getCheckErrors());
}
```

#### Testing No-Change Detection

```java
@Test
@Transactional
void shouldDetectNoChangesOnUpdate() {
    // Given: Existing entity
    MyEntity entity = createTestEntity();

    MyEntityAccess access = crudTestService.testGet(
        entity.getId(),
        MyEntityAccess.class,
        AuthObjectAccessEnum.write
    );

    // When: Update with no actual changes
    ExtendedEntityChanges noChanges = ExtendedEntityChanges.create(access);
    // No changes set

    GenericObjectCrudResult<MyEntityAccess> result = crudTestService.testUpdate(
        access,
        noChanges,
        ImportObjectContext.createEmpty()
    );

    // Then: Should indicate no change
    assertFalse(result.hasErrors());
    assertTrue(result.isNoChange());
}
```

### Testing XX Package Entities

The XX package contains test entities for framework testing:

| Entity | Purpose |
|--------|---------|
| `XxSimpleTestEntity` | Basic entity with simple fields |
| `XxAllType` | Entity with all data types (Integer, Long, Float, Double, BigDecimal, String, LocalDate, LocalDateTime, Instant, LocalTime, Boolean, Enum, Object reference) |
| `XxCarPilotBrand` | Entity for testing relationships |
| `XxCarPilotModel` | Entity with ManyToOne relationship |
| `XxGenericTestType` | Generic template type with parent-child hierarchy |
| `XxGenericTest` | Generic template instance |

### Testing with Generic Template Types

```java
@Test
@Transactional
void shouldCreateGenericTypeWithParent() {
    // Given: Parent type
    XxGenericTestType parentType = new XxGenericTestType();
    parentType.setTypeName("ParentType");
    parentType.setTypeDescription("Parent Description");

    XxGenericTestTypeAccess parentAccess = crudTestService.createObjectAccess(
        parentType, XxGenericTestTypeAccess.class
    );

    GenericObjectCrudResult<XxGenericTestTypeAccess> parentResult = crudTestService.testCreate(
        parentAccess, ImportObjectContext.createEmpty()
    );

    // Given: Child type with parent
    XxGenericTestType childType = new XxGenericTestType();
    childType.setTypeName("ChildType");
    childType.setTypeDescription("Child Description");
    childType.setParent(parentResult.getObjectAccess().getEntity());

    XxGenericTestTypeAccess childAccess = crudTestService.createObjectAccess(
        childType, XxGenericTestTypeAccess.class
    );

    // When: Create child type
    GenericObjectCrudResult<XxGenericTestTypeAccess> childResult = crudTestService.testCreate(
        childAccess, ImportObjectContext.createEmpty()
    );

    // Then: Both types created with relationship
    assertFalse(childResult.hasErrors());
    assertEquals(parentResult.getObjectAccess().getId(),
        childResult.getObjectAccess().getEntity().getParent().getId());
}
```

### Reference Test Files

For complete examples, see:
- `backend/src/test/java/com/mvs/backend/test/core/crud/ObjectCrudServiceIntegrationTest.java`
- `backend/src/test/java/com/mvs/backend/test/core/crud/ObjectCrudServiceXxEntitiesIntegrationTest.java`
- `backend/src/test/java/com/mvs/backend/test/core/crud/PostCommitEventListenerIntegrationTest.java`

---

## Best Practices

### DO:
- Extend appropriate base class (`AbstractTestBaseIntegration`, etc.)
- Use TestService pattern for test data creation
- Use method-level `@WithMockAuthenticatedUser` for custom auth scenarios
- Test public service methods with 100% coverage
- Use `./gradlew fastTest` for quick feedback

### DON'T:
- Don't use manual `AuthenticatedUnitTest.setupAuthenticatedUser()` (obsolete)
- Don't manually configure authentication in `@BeforeEach`
- Don't specify profiles unless you need non-default behavior
- Don't use H2-specific SQL (PostgreSQL only)

---

## Complete Test Examples

### Unit Test

```java
@UnitTest
class CalculationServiceUnitTest extends AbstractTestBaseUnit {

    private CalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new CalculationService();
    }

    @Test
    void shouldCalculateCorrectly() {
        int result = calculationService.add(2, 3);
        assertEquals(5, result);
    }
}
```

### Integration Test

```java
@IntegrationTest
class CustomerServiceIntegrationTest extends AbstractTestBaseIntegration {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CrTestService crTestService;

    @Test
    void shouldCreateCustomer() {
        // Given
        Customer customer = crTestService.createCustomer("John", "Doe", PersonGender.male);

        // Then
        assertNotNull(customer.getId());
        assertNotNull(customer.getCalculatedName());
    }

    @Test
    @WithMockAuthenticatedUser(roles = {"agent"}, adminRuntime = false)
    void shouldCreateCustomerAsAgent() {
        // Test with agent permissions
    }
}
```

### Multi-Tenant Integration Test

```java
class CustomerMultiTenantTest extends AbstractTestBaseIntegrationMultiTenant {

    @Autowired
    private CustomerService customerService;

    @Test
    void shouldIsolateDataBetweenTenants() {
        TenantContextHolder.setCurrentTenantAlias("tenantA");
        // Create data in tenantA

        TenantContextHolder.setCurrentTenantAlias("tenantB");
        // Verify isolation
    }
}
```

---

## Coverage Requirements

**MANDATORY:** All service classes MUST have 100% coverage of their **public methods**.

Every public method must have at least one test covering:
- Normal operation
- Edge cases
- Error conditions

---

## Acceptance Checklist

For compliance verification, see: [acceptance.md](acceptance.md)

---

## AI Guidance for Entity Validation

**CRITICAL: AI MUST follow these rules when working with entity validation:**

1. **Changes MUST only be made if explicitly requested by the user.** The AI MUST never decide on its own to:
   - Relax validation rules
   - Add exceptions to the exceptions file
   - Skip fixes for validation errors
   - Change the validation logic to be more lenient

2. **When validation errors are found, the AI MUST fix all entity files** to comply with the naming conventions. Do not suggest adding exceptions as a workaround.

3. **Index/UniqueConstraint Naming Convention:**
   - Pattern: `<entity name translated to table name>_<suffix>`
   - Index suffix: `p<n>` (p = performance), e.g., `ct_campaign_member_p1`
   - UniqueConstraint suffix: `u<n>` (u = unique), e.g., `ct_campaign_member_u1`
   - Other short suffixes are acceptable as long as the name is unique

4. **Index names must be unique across the entire codebase** to avoid SQL migration issues.

5. **When running `SchemaGenerationTest`:**
   - Check all validation errors in the test output
   - Fix ALL entity files that have naming violations
   - Re-run the test until all errors are resolved
   - Do NOT relax validation rules or add exceptions without explicit user approval