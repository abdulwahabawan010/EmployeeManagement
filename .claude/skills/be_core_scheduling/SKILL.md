---
name: be_core_scheduling
description: "Backend: Expert guidance on implementing scheduled tasks in a multi-tenant environment including module configuration, tenant iteration, and transaction management. Use when creating scheduled tasks, implementing @Scheduled methods, or configuring module-level settings."
---

# Core Scheduling Documentation

## When to Use This Skill

Use when:
- Creating scheduled tasks with `@Scheduled`
- Implementing multi-tenant scheduled operations
- Creating module configuration classes
- Managing transactions in scheduled tasks
- Enabling/disabling scheduled features via configuration

## Critical Rules

### Configuration
- **ALWAYS** create a `{Module}Config` class for configurable modules
- **ALWAYS** use `@ConfigurationProperties(prefix = "modules.{module}")`
- **ALWAYS** provide sensible defaults for all properties
- **ALWAYS** include an `active` flag to enable/disable the module

### Multi-Tenant Scheduling
- **ALWAYS** iterate over all tenants for scheduled tasks
- **ALWAYS** set tenant context before executing tenant-specific logic
- **ALWAYS** catch exceptions per tenant to prevent cascading failures
- **ALWAYS** log errors with tenant alias for debugging

### Transactions
- **NEVER** use `@Transactional` on the scheduled method when iterating tenants
- **ALWAYS** use `TransactionTemplate` for transactional operations within tenant loop
- **NEVER** call `@Transactional` methods via self-invocation (Spring proxy limitation)

---

## Module Configuration Pattern

Create a configuration class for your module:

```java
package com.mvs.backend.{module}.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "modules.{module}")
public class {Module}Config {

    /**
     * Enable or disable the module.
     * Default: true
     */
    private boolean active = true;

    /**
     * Enable the scheduled task.
     * Default: true
     */
    private boolean enableScheduledTask = true;

    /**
     * Rate at which the scheduled task runs, in milliseconds.
     * Default: 300000 (5 minutes)
     */
    private long scheduledTaskRateMs = 300_000L;

    /**
     * Other module-specific configuration...
     */
    private int someConfigValue = 30;
}
```

### Application Configuration (application.yml)

```yaml
modules:
  cb:
    active: true
    enable-session-expiration: true
    session-expiration-rate-ms: 300000
    session-timeout-minutes: 30
  jb:
    active: true
    enable-fixed-scheduler: true
```

---

## Multi-Tenant Scheduled Task Pattern

### Required Dependencies

```java
import com.mvs.backend.core.multitenant.Tenant;
import com.mvs.backend.core.multitenant.TenantService;
import org.springframework.transaction.support.TransactionTemplate;
```

### Complete Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MyScheduledService {

    private final MyRepository repository;
    private final MyConfig config;
    private final TenantService tenantService;
    private final TransactionTemplate transactionTemplate;

    /**
     * Scheduled task that runs across all tenants.
     * Rate is configurable via modules.my.scheduled-task-rate-ms property.
     */
    @Scheduled(fixedRateString = "${modules.my.scheduled-task-rate-ms:300000}")
    public void runScheduledTask() {
        // Step 1: Check if task should execute
        if (!shouldExecute()) {
            return;
        }

        // Step 2: Iterate over all tenants
        for (Tenant tenant : tenantService.getTenants()) {
            // Step 3: Set tenant context
            tenantService.setCurrentTenant(tenant);

            try {
                // Step 4: Execute tenant-specific logic
                executeForCurrentTenant();
            } catch (Exception e) {
                // Step 5: Log error but continue with other tenants
                log.error("Scheduled task failed for tenant {}: {}",
                    tenant.getAlias(), e.getMessage(), e);
            }
        }
    }

    /**
     * Checks if the scheduled task should execute based on configuration.
     */
    private boolean shouldExecute() {
        if (!config.isActive()) {
            log.trace("Module is not active, skipping scheduled task");
            return false;
        }
        if (!config.isEnableScheduledTask()) {
            log.trace("Scheduled task is disabled, skipping");
            return false;
        }
        return true;
    }

    /**
     * Executes the scheduled task for the current tenant context.
     * Uses TransactionTemplate for proper transaction management.
     */
    private void executeForCurrentTenant() {
        transactionTemplate.executeWithoutResult(status -> {
            // Your tenant-specific logic here
            List<MyEntity> items = repository.findItemsToProcess();

            for (MyEntity item : items) {
                processItem(item);
                repository.save(item);
                log.info("Processed item: {}", item.getId());
            }
        });
    }

    private void processItem(MyEntity item) {
        // Processing logic
    }
}
```

---

## Why TransactionTemplate?

Spring's `@Transactional` uses proxy-based AOP. When a method within a class calls another method in the same class, the proxy is bypassed and the transaction is not applied.

### Problem: Self-Invocation Bypasses @Transactional

```java
// BAD: @Transactional is ignored due to self-invocation
@Scheduled(fixedRate = 300000)
public void scheduledTask() {
    for (Tenant tenant : tenantService.getTenants()) {
        tenantService.setCurrentTenant(tenant);
        processForTenant();  // This call bypasses the proxy!
    }
}

@Transactional  // This annotation has NO effect when called from above!
public void processForTenant() {
    // Database operations without transaction!
}
```

### Solution: Use TransactionTemplate

```java
// GOOD: TransactionTemplate provides programmatic transaction management
@Scheduled(fixedRate = 300000)
public void scheduledTask() {
    for (Tenant tenant : tenantService.getTenants()) {
        tenantService.setCurrentTenant(tenant);
        transactionTemplate.executeWithoutResult(status -> {
            // This runs within a transaction
            processForTenant();
        });
    }
}
```

---

## Reference Implementations

### CB Module (Session Expiration)

**Config:** `com.mvs.backend.cb.config.CbConfig`
**Service:** `com.mvs.backend.cb.services.CbConversationService.expireOldSessions()`

Key features:
- Configurable rate via `session-expiration-rate-ms`
- Configurable timeout via `session-timeout-minutes`
- Enable/disable via `enable-session-expiration`

### JB Module (Job Refresh)

**Config:** `com.mvs.backend.jb.config.JbConfig`
**Service:** `com.mvs.backend.jb.service.JbJobRefreshService.refreshJobs()`

Key features:
- Configurable via `active` and `enable-fixed-scheduler`
- Iterates all tenants on application startup
- Catches exceptions per tenant

---

## @Scheduled Annotation Options

### Fixed Rate (Configurable)

```java
@Scheduled(fixedRateString = "${modules.my.rate-ms:300000}")
public void task() { }
```

### Fixed Delay

```java
@Scheduled(fixedDelayString = "${modules.my.delay-ms:60000}")
public void task() { }
```

### CRON Expression

```java
@Scheduled(cron = "0 */5 * * * *")  // Every 5 minutes
public void task() { }

@Scheduled(cron = "0 0 * * * *")    // Every hour at minute 0
public void task() { }

@Scheduled(cron = "0 0 2 * * *")    // Daily at 2:00 AM
public void task() { }
```

---

## Checklist for Scheduled Tasks

- [ ] Created `{Module}Config` class with `@ConfigurationProperties`
- [ ] Added `active` flag to enable/disable module
- [ ] Added flag to enable/disable the specific scheduled task
- [ ] Added configurable rate/delay property with sensible default
- [ ] Injected `TenantService` for multi-tenant iteration
- [ ] Injected `TransactionTemplate` for transaction management
- [ ] Implemented `shouldExecute()` check at start of scheduled method
- [ ] Iterate over `tenantService.getTenants()`
- [ ] Set tenant context with `tenantService.setCurrentTenant(tenant)`
- [ ] Wrapped tenant logic in try-catch
- [ ] Used `transactionTemplate.executeWithoutResult()` for DB operations
- [ ] Logged errors with tenant alias
- [ ] Documented the scheduled task in module documentation
