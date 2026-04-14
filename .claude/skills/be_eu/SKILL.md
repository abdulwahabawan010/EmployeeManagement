---
name: be_eu
description: "Backend: Expert guidance on End User (EU) module for end-user registration, OTP, user preferences, and mobile app users. Use when working with end-user registration, OTP, user preferences, or mobile app users."
---

# EU (End User) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/eu/documentation.md`

## When to Use This Skill

Use when:
- Working with end-user registration or onboarding
- Implementing OTP-based authentication (login/verification)
- Managing user preferences, profiles, or device tracking
- Handling mobile app or customer web app user flows
- Integrating with the customer web app backend (EX module)
- Working with EU notifications, frontend text, or theme configuration
- Implementing password reset or email verification flows

## Module Purpose

The EU module manages the complete **end-user lifecycle** for customer-facing applications. End users are external customers (NOT internal admin users). The EU module provides the data layer and business logic that the EX (External API) module exposes to the customer web app.

**Architecture:**
```
Customer Web App (Angular) --> EX Module (REST gateway) --> EU Module (business logic/data)
                                                      --> CR Module (customer data)
                                                      --> CM Module (contracts)
                                                      --> TM Module (tickets)
                                                      --> DM Module (documents)
```

**CRITICAL:** The customer web app MUST NEVER call `/mvsa/` admin endpoints. Only `/mvseu/` and `/mvseureg/` paths are allowed.

## Core Entities

### Authentication & User
| Entity | JPA Name | Purpose |
|--------|----------|---------|
| **EuUser** | `euUser` | Core end-user (email as NaturalId, password, phoneNumber, active, isEmailVerified) |
| **EuUserDevice** | `euUserDevice` | Multi-device registration (deviceType, deviceId, notificationToken, refreshToken) |
| **EuOtpCode** | `euOtpCode` | OTP records (targetType, targetId, otpCode, generatedInstant) |
| **EuOtpCodeLogin** | `euOtpCodeLogin` | OTP login attempts (type, referenceContact, otpCodeAttempts, ipAddress, igPassToken) |
| **EuRole** | `euRole` | Role definitions (ExRoleName as NaturalId) |
| **EuUserRole** | `euUserRole` | User-role assignments |

### Registration
| Entity | JPA Name | Purpose |
|--------|----------|---------|
| **EuRegistration** | `euRegistration` | Full registration (address, OTP, consent, phone, email, registrationGuid) |
| **EuRegistrationSignature** | `euRegistrationSignature` | Digital signatures during registration |

### Tokens
| Entity | Purpose |
|--------|---------|
| **EuRefreshToken** | Session refresh tokens (per device, with refreshCount + expiryDate) |
| **EuEmailVerificationToken** | Email verification (token + tokenStatus + expiryDate) |
| **EuPasswordResetToken** | Password recovery (token + active + claimed + expiryDate) |
| **EuJwtAuthenticationToken** | JWT wrapper (extends UsernamePasswordAuthenticationToken) |

### UI Configuration (Admin-managed, consumed by customer web app)
| Entity | Purpose |
|--------|---------|
| **EuFrontEndText** | Configurable frontend text entries (area + name + description) |
| **EuThemeColor** | UI theme colors (colorName + brightColor + darkColor) |
| **EuStaticNotification** | Location-based notifications (dashboard/contract/insurableObject) |
| **EuTmConfiguration** | Ticket management UI config for customer web app |
| **EuPromotion** | Promotional content |

### Customer-Linked Data
| Entity | Purpose |
|--------|---------|
| **EuUserAddedInsurance** | User-submitted insurance products |
| **EuUserAddedInsuranceDocument** | Documents for user-added insurance |
| **EuUserInsurableObjectImage** | Images for insurable objects |
| **EuUserRelatedPersonImage** | Related person images |
| **EuUserDocumentType** | Document type configuration |
| **EuUserObjectAccess** | Object access tracking |

## Key Services

### EuUserService (`eu/service/EuUserService.java`)
```java
// User lookup
Optional<EuUser> hasUser(String email)
EuUser getUser(String email)
EuUser getUser(Long id)

// User creation (from registration)
EuUser createUser(String email, String phoneNumber, ActivityContext context)

// Profile (aggregates EU + CR + PM data via native query)
EuUserProfile getProfile(Long id)

// Device tracking
Optional<EuUserDevice> getUserLastLoginDevice(EuUser user)
Optional<EuUser> getEuUserFromCustomer(Customer customer)
List<EuUser> getAllEuUsers()  // Active users only
```

### EuOtpLoginService (`eu/service/EuOtpLoginService.java`)
```java
// Initiate OTP login
Optional<EuOtpCodeLogin> initiateOtpLogin(EuOtpCodeLoginType loginType, String referenceContact)
Optional<EuOtpCodeLogin> initiateOtpLogin(EuOtpCodeLoginType loginType, String referenceContact, boolean withoutNotification)

// Verify OTP and get pass token
Optional<IgPassToken> verifyOtpLogin(EuOtpCodeLoginType loginType, String referenceContact, String enteredOtpCode)

// Rate limit management
void clearRateLimits()
```

### EuOtpCodeService (`eu/service/EuOtpCodeService.java`)
```java
EuOtpCode generateOtpCode(ExOtpTargetType targetType, String targetId, ExDeviceInfoDto deviceInfo, boolean createDummy)
String generateNewOtpCode()  // 6-digit random (or "123456" for testing)
```

### EuNotificationService (`eu/service/EuNotificationService.java`)
```java
boolean checkNotificationIsActive(EuNotificationTypeInternal type)
void sendRegistrationNotification(EuRegistration, EuNotificationTypeInternal, Object variable)
void sendUserNotification(EuUser, EuNotificationTypeInternal, List<CoChannelTypeEnum>, Object variable)
Optional<EuNotificationType> getNotificationType(EuNotificationTypeInternal)
List<EuNotificationType> getNotificationTypes()
List<EuNotificationType> getNotificationTypes(Class<? extends Entity> recipientEntityClass)
```

### EuUserDeviceService (`eu/service/EuUserDeviceService.java`)
```java
Optional<EuUserDevice> findLatestAppDevice(EuUser user)
Optional<EuUserDevice> findLatestDevice(EuUser user, List<ExDeviceType> deviceTypes)
```

### EuWelcomeService (`eu/service/EuWelcomeService.java`)
```java
WelcomePage getWelcomePage(EuUser user, boolean firstUse)
```

## Authentication & Security

### OTP Login Flow
```
1. initiateOtpLogin(EMAIL/MOBILE_PHONE, contact)
   - Rate limit check (IP + contact, ConcurrentHashMap-based)
   - Find EuUser (flexible phone matching: 01.., +49.., 0049..)
   - Generate 6-digit OTP
   - Create EuOtpCodeLogin record
   - Send OTP via NS module

2. verifyOtpLogin(type, contact, otpCode)
   - Rate limit check
   - Retrieve EuOtpCodeLogin (PESSIMISTIC_WRITE lock)
   - Check expiration (3 min) and attempts (max 5)
   - On success: call IgTokenService.createOtpLoginPassToken()
   - Return IgPassToken (valid 15 min) --> JWT via IG module
```

### Rate Limiting (In-Memory ConcurrentHashMap)
| Limit | Value |
|-------|-------|
| Per-IP requests | 100 / 15 minutes |
| Per-Contact requests | 100 / 15 minutes |
| OTP verification attempts | max 5 per code |
| OTP expiration | 3 minutes |
| Pass token validity | 15 minutes |

### Security Features
- Pessimistic locking on OTP verification (prevents race conditions)
- Flexible phone number matching (international formats: 01.., +49.., 0049..)
- Multi-device session management with per-device refresh tokens
- Full audit trail via Hibernate Envers (`@Audited`)
- Password fields excluded from DTO export (`isAttributeExportable()`)
- EuUser implements `EntityUser` interface (getUsername = email, isEnabled = active)

## Enums

| Enum | Values |
|------|--------|
| **EuOtpCodeLoginType** | `EMAIL`, `MOBILE_PHONE` |
| **EuNotificationTypeInternal** | `reg_otp_send`, `otp_send`, `email_verify`, `email_verified`, `password_changed`, `email_changed`, `phone_changed`, `login_otp_send` |
| **EuRegistrationStatusInternal** | `pending`, `in_processing`, `follow_up`, `completed_positive`, `completed_negative`, `error`, `duplicate` |
| **EuRegistrationCustomerStatusInternal** | `started`, `finished` |
| **EuStaticNotificationLocationEnum** | `dashboard`, `contract`, `insurableObject` |
| **EuUserAddedInsuranceStatusInternal** | `pending`, `in_processing`, `processed`, `not_relevant` |

## Cross-Module Integrations

| Module | Integration | Purpose |
|--------|-------------|---------|
| **EX** | ExDeviceType, ExOtpTargetType, ExTokenStatus | External API enums, REST gateway for CW app |
| **CR** | Customer, CustomerUser | Customer linking (EuUser <-> Customer) |
| **NS** | NsNotificationService, NsNotificationType | Notification sending (OTP, verification, alerts) |
| **DM** | DmDocument, DmDocumentService | User documents, profile photos |
| **IG** | IgTokenService, IgPassToken | OTP pass token generation for JWT flow |
| **PM** | PersonGender, PersonMaritalStatus | Personal data for profiles |
| **CD** | ContactProviderService | Contact address resolution for notifications |
| **CO** | CoChannelTypeEnum | SMS/Email/Push channel routing |
| **CC** | ObjectType, ActivityContext | Activity tracking |

## Controllers

### Admin Controllers (at `/mvsa/eu/`)
Standard CRUD controllers for admin users (NOT for customer web app):
- `EuUserController` (+custom `/photo/$`, `/profile/{id}`)
- `EuRegistrationController`
- `EuOtpCodeLoginController`
- 20+ additional entity CRUD controllers

### Customer-Facing Access
Customer web app accesses EU data through the **EX module** endpoints:
- `/mvseu/eu/*` - Authenticated end-user operations
- `/mvseureg/eu/*` - Registration/public endpoints

**NEVER expose admin controllers to the customer web app.**

## Implementation Patterns

### Registration Flow
```java
// 1. Generate OTP
EuOtpCode otp = otpService.generateOtpCode(ExOtpTargetType.phone, phoneNumber, deviceInfo, false);

// 2. Send OTP notification
notificationService.sendRegistrationNotification(registration, EuNotificationTypeInternal.reg_otp_send, null);

// 3. Verify OTP (after user input)
boolean valid = otpService.verifyOtp(phoneNumber, userInputCode);

// 4. Create user
EuUser user = userService.createUser(email, phoneNumber, activityContext);
```

### OTP Login
```java
// 1. Initiate
Optional<EuOtpCodeLogin> loginRequest = otpLoginService.initiateOtpLogin(EuOtpCodeLoginType.EMAIL, contact);

// 2. Verify and get pass token
Optional<IgPassToken> passToken = otpLoginService.verifyOtpLogin(EuOtpCodeLoginType.EMAIL, contact, userOtpCode);
```

### Get User Profile
```java
EuUserProfile profile = userService.getProfile(userId);
// Aggregates: user data + customer info + person data (via native SQL join)
```

## Best Practices

### DO:
- Use `EuOtpLoginService` for all OTP authentication
- Respect rate limits (100 req/15min, 5 attempts)
- Use `EuNotificationService` for user communications
- Track device info for security
- Use `EuUserService.getProfile()` for aggregated user data
- Link users to customers via `CustomerUser`
- Use `ExAuthenticationService` in EX controllers to get current user context

### DON'T:
- Don't bypass OTP verification
- Don't store plain-text passwords
- Don't ignore token expiration
- Don't skip device registration
- Don't call EU admin controllers from customer web app
- Don't expose internal entity IDs to end users
- Don't directly query EU entities from the customer web app frontend

## Package Structure
```
eu/
├── model/
│   ├── EuUser.java, EuRegistration.java, EuUserDevice.java
│   ├── EuOtpCode.java, EuOtpCodeLogin.java
│   ├── EuRole.java, EuUserRole.java
│   ├── EuNotificationType.java, EuStaticNotification.java
│   ├── EuFrontEndText.java, EuThemeColor.java, EuTmConfiguration.java
│   ├── EuUserAddedInsurance.java, EuPromotion.java, EuPartner.java
│   ├── token/ (EuRefreshToken, EuEmailVerificationToken, EuPasswordResetToken, EuJwtAuthenticationToken)
│   ├── desc/ (metamodel classes)
│   └── repo/ (JPA repositories)
├── service/
│   ├── EuUserService.java, EuUserDeviceService.java
│   ├── EuOtpCodeService.java, EuOtpLoginService.java
│   ├── EuNotificationService.java, EuDocumentService.java, EuWelcomeService.java
│   └── data/ (EuUserProfile, etc.)
├── controller/ (25+ CRUD controllers)
├── access/ (EuUserAccess + DTOs + Forms)
├── cross/
│   ├── ns/ (notification recipient providers)
│   ├── cd/ (contact providers)
│   ├── co/ (channel providers)
│   └── rp/ (reports: EuReportEnum, EuCustomerRegistrationReport)
├── logic/ (enums)
├── enums/ (EuOtpCodeLoginType)
└── exception/ (EuRuntimeException, EuNotActiveRuntimeException)
```

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)
