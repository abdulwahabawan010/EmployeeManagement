# Acceptance Checklist: Test Implementation

Use this checklist to verify compliance with test implementation standards.

---

## Test Type Selection

### Choose the Correct Base Class
- [ ] **Unit tests:** Extend `AbstractTestBaseUnit` or use `@UnitTest`
- [ ] **Integration tests:** Extend `AbstractTestBaseIntegration`
- [ ] **External tests:** Extend `AbstractTestBaseExternal`
- [ ] **Multi-tenant tests:** Extend `AbstractTestBaseIntegrationMultiTenant`

### Test Type Annotations
- [ ] Test class extends appropriate base class (preferred)
- [ ] Or uses correct annotation (`@UnitTest`, `@IntegrationTest`, `@ExternalTest`)
- [ ] `@SlowTest` added for long-running tests

---

## Authentication

### Automatic Authentication (Default)
- [ ] `@IntegrationTest` and `@ExternalTest` provide authentication automatically
- [ ] No manual authentication setup needed for default admin user

### Custom Authentication (When Needed)
- [ ] `@WithMockAuthenticatedUser` used at method level for custom scenarios
- [ ] Custom roles specified correctly (e.g., `roles = {"agent"}`)
- [ ] `userType = EU_USER` used when testing end-user scenarios
- [ ] `adminRuntime = false` set when testing non-admin scenarios

### Obsolete Patterns (MUST NOT USE)
- [ ] **NO** `AuthenticatedUnitTest.setupAuthenticatedUser()` calls
- [ ] **NO** manual `@BeforeEach` authentication setup
- [ ] **NO** direct `SecurityContextHolder` manipulation for authentication

---

## Database and Schema

### Testcontainers PostgreSQL
- [ ] Tests use Testcontainers PostgreSQL (automatic via base class)
- [ ] **NO** H2-specific SQL in test code
- [ ] JPQL preferred over raw SQL

### Schema Generation
- [ ] When entities change, `SchemaGenerationTest` is run
- [ ] Migration file exists: `backend/src/test/resources/db/postgre/V1__.sql`
- [ ] If migration missing, SchemaGenerationTest output was checked for errors

---

## Test Structure

### Unit Tests
- [ ] Use `AbstractTestBaseUnit` or `@UnitTest`
- [ ] **NO** Spring context (`@SpringBootTest`)
- [ ] Dependencies mocked with Mockito
- [ ] Fast execution (no I/O, no database)

### Integration Tests
- [ ] Use `AbstractTestBaseIntegration`
- [ ] Spring context available (automatic)
- [ ] Authentication provided (automatic)
- [ ] TestService pattern used for data creation

### External Tests
- [ ] Use `AbstractTestBaseExternal`
- [ ] External services/credentials documented
- [ ] Consider adding `@SlowTest` if long-running

---

## Multi-Tenancy

- [ ] Multi-tenant tests extend `AbstractTestBaseIntegrationMultiTenant`
- [ ] Tenant context set: `TenantContextHolder.setCurrentTenantAlias("tenantA")`
- [ ] Tenant isolation verified in tests

---

## TestService Pattern

- [ ] TestService classes used for test data creation
- [ ] Correct TestService injected (e.g., `CrTestService`, `PmTestService`)
- [ ] No hardcoded entity creation in tests

---

## Coverage Requirements

- [ ] All public service methods have test coverage
- [ ] Normal operation tests included
- [ ] Edge case tests included
- [ ] Error condition tests included

---

## Gradle Commands

- [ ] Understand `./gradlew unitTest` - runs unit tests
- [ ] Understand `./gradlew integrationTest` - runs integration tests
- [ ] Understand `./gradlew externalTest` - runs external tests
- [ ] Understand `./gradlew fastTest` - excludes slow and external
- [ ] Understand tag filtering: `-PincludeTags`, `-PexcludeTags`

---

## Example Compliant Tests

### Unit Test
```java
class CalculationServiceTest extends AbstractTestBaseUnit {

    private CalculationService service;

    @BeforeEach
    void setUp() {
        service = new CalculationService();
    }

    @Test
    void shouldCalculate() {
        assertEquals(5, service.add(2, 3));
    }
}
```

### Integration Test
```java
class CustomerServiceTest extends AbstractTestBaseIntegration {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CrTestService crTestService;

    @Test
    void shouldCreateCustomer() {
        Customer customer = crTestService.createCustomer("John", "Doe", PersonGender.male);
        assertNotNull(customer.getId());
    }

    @Test
    @WithMockAuthenticatedUser(roles = {"agent"}, adminRuntime = false)
    void shouldCreateAsAgent() {
        // Test with agent permissions
    }
}
```

### Multi-Tenant Integration Test
```java
class CustomerMultiTenantTest extends AbstractTestBaseIntegrationMultiTenant {

    @Autowired
    private CrTestService crTestService;

    @Test
    void shouldIsolateTenants() {
        TenantContextHolder.setCurrentTenantAlias("tenantA");
        Customer customerA = crTestService.createCustomer();

        TenantContextHolder.setCurrentTenantAlias("tenantB");
        // Verify customerA not visible in tenantB
    }
}
```

---

## Quick Reference

| Need | Solution |
|------|----------|
| Unit test | Extend `AbstractTestBaseUnit` |
| Integration test | Extend `AbstractTestBaseIntegration` |
| External test | Extend `AbstractTestBaseExternal` |
| Multi-tenant test | Extend `AbstractTestBaseIntegrationMultiTenant` |
| Custom auth | `@WithMockAuthenticatedUser(...)` at method level |
| End-user auth | `@WithMockAuthenticatedUser(userType = EU_USER)` |
| Agent auth | `@WithMockAuthenticatedUser(roles = {"agent"}, adminRuntime = false)` |
| Run unit tests | `./gradlew unitTest` |
| Run integration tests | `./gradlew integrationTest` |
| Run fast tests | `./gradlew fastTest` |
