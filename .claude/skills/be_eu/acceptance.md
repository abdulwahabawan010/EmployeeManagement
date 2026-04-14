# Acceptance Checklist: End User (EU)

Use this checklist to verify compliance with EU module standards.

## Service Usage

- [ ] OTP operations use `EuOtpLoginService` (login) or `EuOtpCodeService` (generation)
- [ ] Registration operations create `EuRegistration` and use `EuUserService.createUser()`
- [ ] User lookup uses `EuUserService.getUser()` or `hasUser()`
- [ ] Profile aggregation uses `EuUserService.getProfile()`
- [ ] Notifications use `EuNotificationService` (not direct NS calls)
- [ ] Device tracking is implemented for multi-device scenarios

## Authentication Security

- [ ] OTP rate limiting is respected (100 req/15min, 5 attempts, 3-min expiry)
- [ ] Pass token validity is 15 minutes (via IG module)
- [ ] Pessimistic locking used for OTP verification
- [ ] Phone number matching supports international formats
- [ ] Password fields are excluded from DTO export

## Customer Web App Integration

- [ ] Customer-facing endpoints use EX module controllers (NOT EU admin controllers)
- [ ] API paths use `/mvseu/` or `/mvseureg/` (NEVER `/mvsa/`)
- [ ] `ExAuthenticationService` is used to get current user context in EX controllers
- [ ] Internal entity IDs are NOT exposed to end users
- [ ] Error messages are user-friendly (no stack traces)

## Data Security

- [ ] User data access is scoped to the authenticated user only
- [ ] Registration endpoints validate with the registration object (OTP verification)
- [ ] Tokens (JWT, refresh, email verification) have proper expiration
- [ ] Device registration is required for refresh token issuance
- [ ] Audit trail is maintained (`@Audited` on entities)

## Cross-Module Integration

- [ ] Customer linking uses `CustomerUser` entity (CR module)
- [ ] Notifications route through `EuNotificationService` -> NS module
- [ ] Contact resolution uses CD cross-module providers
- [ ] Documents use DM module services
- [ ] Token management uses IG module (`IgTokenService`)

## Best Practices

- [ ] End-user registration follows the OTP verification pattern
- [ ] All endpoints handling end-user data validate the authenticated user
- [ ] UI configuration entities (FrontEndText, ThemeColor, StaticNotification) are admin-only write
- [ ] EuUser implements `EntityUser` interface correctly
