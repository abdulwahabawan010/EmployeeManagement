# Acceptance Checklist: Report Framework (RP)

Use this checklist to verify compliance with RP module standards.

## Service Usage

- [ ] SQL-based reports use `ReportRunService`
- [ ] ORM-based reports use `ReportService` (legacy)

## Report Repository Implementation

- [ ] Repository extends `ReportAbstractRepository`
- [ ] Enums are used for categories and reports
- [ ] `@PostConstruct` initializes categories and reports
- [ ] `getModuleName()` returns correct name
- [ ] `getModuleCode()` returns correct code

## Report Provider Implementation

- [ ] Each report has a `ReportProvider` implementation
- [ ] SQL queries are in provider, not hardcoded in services

## Authorization

- [ ] Reports include authorization checks
- [ ] Unauthorized access is prevented

## Best Practices

- [ ] SQL-based (recommended) and ORM-based paths are not mixed
- [ ] SQL strings are not hardcoded in services
- [ ] `ReportAbstractRepository` is extended for module repositories
