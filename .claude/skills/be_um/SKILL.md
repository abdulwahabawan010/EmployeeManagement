---
name: be_um
description: "Backend: Expert guidance on User Management (UM) module including user authentication, roles, authorization, RBAC, and access control. Use when working with users, roles, authorization, RBAC, or access control."
---

# UM (User Management) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/um/documentation.md`

## When to Use This Skill

Use when:
- Working with users
- Managing roles
- Implementing authorization
- Handling RBAC
- Managing access control

## Core Entities

- **User** (`umUser`) - System user
- **Role** (`umRole`) - Role definition
- **UserRole** (`umUserRole`) - User-role assignment
- **RoleAuthModule** (`umRoleAuthModule`) - Module-level auth
- **RoleAuthObjectType** (`umRoleAuthObjectType`) - Object-type auth

## Authorization Enums

```java
AuthModuleAccessEnum: none, read, write, full, deny, root_grant
AuthObjectAccessEnum: none, read, write, full, deny, root_grant
AuthFeatureAccessEnum: none, allow, deny, root_grant
```

## Key Services

### UserAuthorityService
```java
User getAuthenticatedUser()
boolean hasModuleAccess(String module, AuthModuleAccessEnum required)
boolean hasObjectAccess(Entity entity, AuthObjectAccessEnum required)
```

### UmUserService
```java
Optional<User> findByUsername(String username)
User getAuthenticatedUser()
Set<Role> getUserRoles(User user)
```

## Implementation Pattern

```java
@Autowired UserAuthorityService authorityService;

// Check module access
if (authorityService.hasModuleAccess("contracts", AuthModuleAccessEnum.write)) {
    // Has write access
}

// Check object access
if (authorityService.hasObjectAccess(contract, AuthObjectAccessEnum.read)) {
    // Can read this contract
}
```

## Authorization Rules

- Multiple roles combine permissions additively
- Higher access levels win
- `deny` explicitly blocks access
- `root_grant` overrides all restrictions

## Best Practices

### DO:
- Use UserAuthorityService for all access checks
- Define granular role permissions
- Use temporal validity for role assignments

### DON'T:
- Don't bypass authorization checks
- Don't hardcode user/role IDs
- Don't skip object-level access checks

## Primary Entry Point
`UserAuthorityService` for authorization, `UmUserService` for user management

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)