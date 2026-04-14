# Acceptance Checklist: Job/Batch Processing (JB)

Use this checklist to verify compliance with JB module standards.

## Service Usage

- [ ] Job registration uses `JbJobProviderService`
- [ ] Job execution uses `JbJobAdhocService`

## Job Provider Implementation

- [ ] Job provider implements `JbJobProvider`
- [ ] `getModule()` returns correct module name
- [ ] `getJobDefinitions()` returns job list
- [ ] `getJobRunner()` returns appropriate runner

## Job Runner Implementation

- [ ] Job runner implements `JbJobRunner`
- [ ] `execute()` method is implemented
- [ ] Logging uses `JbJobLogWriter`

## Logging

- [ ] Each significant step is logged via `JbJobLogWriter`
- [ ] Error logging is not skipped

## Best Practices

- [ ] Job status is not modified directly
- [ ] Long jobs use async execution
- [ ] `noParallelRun` is used for non-overlapping jobs
