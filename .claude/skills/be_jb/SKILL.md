---
name: be_jb
description: "Backend: Expert guidance on Job/Batch Processing (JB) module for scheduled jobs, CRON expressions, batch processing, and job monitoring. Use when working with scheduled jobs, CRON expressions, batch processing, or job monitoring."
---

# JB (Job/Batch) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/jb/documentation.md`

## When to Use This Skill

Use when:
- Working with scheduled jobs
- Using CRON expressions
- Implementing batch processing
- Monitoring job execution

## Core Entities

- **JbJobType** - Job configuration
- **JbJobRun** - Execution record
- **JbJobRunLogEntry** - Step-level log

## Job Status Values

- `running`
- `completed`
- `error`
- `skipped`

## Key Services

### JbJobProviderService
```java
JbJobRunner getJobRunner(String module, String alias)
List<String> getModules()
List<JbJobDefinition> getJobDefinitions(String module)
```

### JbJobAdhocService
```java
void runJobAsync(JbJobType jobType)
JbJobRun runJob(JbJobType jobType)
```

## Implementation Pattern

```java
// Create Job Provider
@Service
public class MyJobProvider implements JbJobProvider {
    @Override
    public String getModule() { return "myModule"; }

    @Override
    public List<JbJobDefinition> getJobDefinitions() {
        return List.of(new JbJobDefinition("my_job", "My Custom Job"));
    }

    @Override
    public JbJobRunner getJobRunner(String alias) {
        if ("my_job".equals(alias)) return new MyJobRunner();
        return null;
    }
}

// Implement Job Runner
public class MyJobRunner implements JbJobRunner {
    @Override
    public void execute(JbJobRun jobRun, JbJobLogWriter logWriter) {
        logWriter.createLogEntry(JbJobLogEntryStatus.success, "Processed");
    }
}
```

## Best Practices

### DO:
- Use JbJobProviderService for job registration
- Log each significant step via JbJobLogWriter
- Use noParallelRun for non-overlapping jobs

### DON'T:
- Don't modify job status directly
- Don't skip error logging
- Don't run long jobs synchronously

## Primary Entry Point
`JbJobProviderService` for registration, `JbJobAdhocService` for execution

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)