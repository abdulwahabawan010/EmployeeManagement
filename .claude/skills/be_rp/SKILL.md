---
name: be_rp
description: "Backend: Expert guidance on Report Framework (RP) module including ReportProvider implementations, SQL-based queries, report exports, and module-specific reporting. Use when working with reports, ReportProvider, SQL-based queries, or report exports."
---

# RP (Report) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/rp/documentation.md`

## When to Use This Skill

Use when:
- Working with reports
- Implementing ReportProvider
- Building SQL-based queries
- Handling report exports

## Dual Execution Models

### SQL-Based (Recommended)
- Uses raw SQL via `JdbcTemplate`
- Code-driven via `ReportProvider` interface
- Executed via `ReportRunService.runReport()`

### ORM-Based (Legacy)
- Uses JPA/Hibernate Criteria API
- Configuration-driven via database entities
- Executed via `ReportService.executeReport()`

## Key Services

### ReportRunService
```java
Set<ReportModule> getModules()
List<ReportCategory> getCategoriesByModule(String moduleName)
List<ReportInfo> getReportsByModuleAndCategory(String moduleName, Long category)
DtoList runReport(String moduleName, Long reportId, ObjectRequestList request, Boolean isDownloading)
```

## Implementation Pattern

```java
@Component
public class MyReportRepository extends ReportAbstractRepository<MyReportCategoryEnum, MyReportEnum> {

    @PostConstruct
    public void postConstruct() {
        this._addReportCategory(MyReportCategoryEnum.MAIN, "main", "Main Reports");

        this._addReportInfo(
            MyReportEnum.MY_REPORT,
            MyReportCategoryEnum.MAIN,
            "My Report",
            "Description",
            List.of(),
            new MyReportProvider()
        );
    }

    @Override
    protected String getModuleName() { return "Module Name"; }

    @Override
    protected String getModuleCode() { return "xx"; }
}
```

## Best Practices

### DO:
- Extend `ReportAbstractRepository` for module repositories
- Use enums for categories and reports
- Implement `ReportProvider` for each report

### DON'T:
- Don't execute reports without authorization checks
- Don't hardcode SQL strings in services
- Don't mix ORM and SQL execution paths

## Primary Entry Point
`ReportRunService` for SQL-based, `ReportService` for ORM-based

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)