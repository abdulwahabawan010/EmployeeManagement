# Scheduling Implementation Acceptance Checklist

Use this checklist to verify that a scheduled task implementation follows the multi-tenant scheduling patterns.

## Configuration Class

| # | Check | Required |
|---|-------|----------|
| 1 | Config class exists at `{module}/config/{Module}Config.java` | Yes |
| 2 | Class annotated with `@Configuration` | Yes |
| 3 | Class annotated with `@ConfigurationProperties(prefix = "modules.{module}")` | Yes |
| 4 | Class annotated with `@Data` (Lombok) | Yes |
| 5 | Has `active` boolean field with default `true` | Yes |
| 6 | Has enable flag for the scheduled task (e.g., `enableSessionExpiration`) | Yes |
| 7 | Has configurable rate/delay in milliseconds | Yes |
| 8 | All properties have sensible defaults | Yes |

## Scheduled Service

| # | Check | Required |
|---|-------|----------|
| 1 | Service injects the module config class | Yes |
| 2 | Service injects `TenantService` | Yes |
| 3 | Service injects `TransactionTemplate` | Yes |
| 4 | Scheduled method uses `@Scheduled` annotation | Yes |
| 5 | Rate/delay uses property placeholder (e.g., `fixedRateString = "${...}"`) | Yes |
| 6 | Scheduled method does NOT have `@Transactional` | Yes |
| 7 | First action is `shouldExecute()` check | Yes |

## Multi-Tenant Implementation

| # | Check | Required |
|---|-------|----------|
| 1 | Iterates over `tenantService.getTenants()` | Yes |
| 2 | Sets context with `tenantService.setCurrentTenant(tenant)` | Yes |
| 3 | Tenant logic wrapped in try-catch | Yes |
| 4 | Exception logged with tenant alias | Yes |
| 5 | One tenant's failure doesn't stop others | Yes |

## Transaction Management

| # | Check | Required |
|---|-------|----------|
| 1 | Uses `transactionTemplate.executeWithoutResult()` for DB operations | Yes |
| 2 | No self-invocation of `@Transactional` methods | Yes |
| 3 | Transaction scope is per-tenant, not per-task | Yes |

## shouldExecute() Implementation

| # | Check | Required |
|---|-------|----------|
| 1 | Checks `config.isActive()` | Yes |
| 2 | Checks task-specific enable flag | Yes |
| 3 | Returns `false` early if disabled | Yes |
| 4 | Uses `log.trace()` when skipping | Recommended |

## Example Passing Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MyScheduledService {

    private final MyRepository repository;
    private final MyConfig config;                    // [1] Config injected
    private final TenantService tenantService;        // [2] TenantService injected
    private final TransactionTemplate transactionTemplate; // [3] TransactionTemplate injected

    @Scheduled(fixedRateString = "${modules.my.rate-ms:300000}") // [4,5] @Scheduled with property
    public void runTask() {                           // [6] No @Transactional
        if (!shouldExecute()) {                       // [7] shouldExecute check
            return;
        }

        for (Tenant tenant : tenantService.getTenants()) {  // [MT-1] Iterate tenants
            tenantService.setCurrentTenant(tenant);          // [MT-2] Set context

            try {                                            // [MT-3] Try-catch
                executeForCurrentTenant();
            } catch (Exception e) {
                log.error("Failed for tenant {}: {}",        // [MT-4] Log with alias
                    tenant.getAlias(), e.getMessage(), e);
            }                                                // [MT-5] Continues to next
        }
    }

    private boolean shouldExecute() {
        if (!config.isActive()) {                     // [SE-1] Check active
            log.trace("Module not active");           // [SE-4] Trace log
            return false;                             // [SE-3] Early return
        }
        if (!config.isEnableTask()) {                 // [SE-2] Check task flag
            log.trace("Task disabled");
            return false;
        }
        return true;
    }

    private void executeForCurrentTenant() {
        transactionTemplate.executeWithoutResult(status -> { // [TX-1] TransactionTemplate
            // DB operations here                              [TX-2] No self-invocation
        });                                                   // [TX-3] Per-tenant scope
    }
}
```
