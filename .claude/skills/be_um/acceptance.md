# Acceptance Checklist: User Management (UM)

Use this checklist to verify compliance with UM module standards.

## Service Usage

- [ ] Authorization checks use `UserAuthorityService`
- [ ] User management uses `UmUserService`

## Authorization Checks

- [ ] Module access uses `hasModuleAccess(module, AuthModuleAccessEnum)`
- [ ] Object access uses `hasObjectAccess(entity, AuthObjectAccessEnum)`
- [ ] Authorization checks are not bypassed

## Authorization Levels

- [ ] Access levels are understood: none, read, write, full, deny, root_grant
- [ ] Multiple roles combine permissions additively
- [ ] Higher access levels win
- [ ] `deny` explicitly blocks access
- [ ] `root_grant` overrides all restrictions

## Best Practices

- [ ] `UserAuthorityService` is the entry point for authorization
- [ ] User/role IDs are not hardcoded
- [ ] Object-level access checks are not skipped
- [ ] Temporal validity is used for role assignments
