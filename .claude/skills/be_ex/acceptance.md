# Acceptance Checklist: External API (EX)

Use this checklist to verify compliance with EX module standards.

## CRITICAL: Endpoint Security (Must Pass ALL)

- [ ] **Every endpoint** calls `ExAuthenticationService.getAuthenticatedUser()` to get the current user
- [ ] **Data is scoped** to the authenticated user's customer only (NEVER return other users' data)
- [ ] **Registration endpoints** validate with the registration object (OTP verification)
- [ ] **No internal data exposure** (entity IDs, module codes, stack traces)
- [ ] **Error messages** are user-friendly
- [ ] **No admin endpoints** are accessible from customer web app (`/mvsa/*` paths FORBIDDEN)

## Service Usage

- [ ] Authentication uses `ExAuthenticationService` to get `ExRuntimeUser`
- [ ] User context obtained via `getEuUser()` and `getCustomer()` from `ExRuntimeUser`
- [ ] All endpoints properly secured with JWT (except registration endpoints)
- [ ] Registration endpoints use `/mvseureg/` path prefix
- [ ] Authenticated endpoints use `/mvseu/` path prefix

## Customer Web App Security Pattern

```java
// MANDATORY pattern for every EX controller method:
ExRuntimeUser runtimeUser = authService.getAuthenticatedUser();
EuUser euUser = runtimeUser.getEuUser();
Customer customer = runtimeUser.getCustomer();
// Then scope ALL data queries to this customer
```

- [ ] Pattern above applied to every authenticated endpoint
- [ ] Customer data isolation verified (user A cannot see user B's data)
- [ ] Document access scoped to the authenticated user's customer
- [ ] Contract access scoped to the authenticated user's customer
- [ ] Ticket access scoped to the authenticated user

## API Design

- [ ] REST API follows established patterns
- [ ] DTOs used for all API responses (no entity exposure)
- [ ] Proper HTTP status codes used
- [ ] No QL queries exposed to customer web app
- [ ] No widget-related endpoints

## Rate Limiting & Token Security

- [ ] OTP endpoints are rate-limited
- [ ] JWT token expiration properly configured
- [ ] Refresh token mechanism implemented
- [ ] Logout properly invalidates tokens

## Best Practices

- [ ] Events published for side effects (registration, logout, account changes)
- [ ] Exception handling via `ExExceptionHandler`
- [ ] Mobile endpoints properly designed (device info, push tokens)
- [ ] Customer portal features follow security guidelines
