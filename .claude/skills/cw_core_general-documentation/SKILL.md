---
name: cw_core_general-documentation
description: "Customer Web: Angular project structure, architecture, backend API integration, and general development guidelines for the customer-facing web application (mvs.webapp)."
---

# Customer Web App - General Documentation

This skill defines the architecture and integration guidelines for the customer-facing web application (`mvs.webapp`). These rules are MANDATORY for all development in the `customer_web_app/` directory.

## When This Skill Applies

This skill applies when:

- Working on any code within the `customer_web_app/` directory
- Creating new Angular components, pages, or services for the customer web app
- Integrating with backend API endpoints (EX/EU modules)
- Implementing authentication flows (JWT + OTP)
- Building customer-facing features

## When This Skill Does NOT Apply

- Backend code in `backend/`
- Admin frontend in `frontend/`
- Third-party library code

---

## CRITICAL CONSTRAINTS

These constraints are NON-NEGOTIABLE for the customer web app:

### 1. NO Query Language (QL)
The customer web app MUST NEVER use the Alpha Query Language (QL). All data retrieval MUST go through dedicated REST endpoints in the EX module. The QL system is for the admin frontend only.

### 2. NO Widgets
The customer web app MUST NEVER use the widget system (`WidgetFactory`, `dataProvider`, etc.). All UI components are tailor-made. The widget system is exclusive to the admin frontend.

### 3. Tailor-Made Implementation
Every page, component, and feature is custom-built for the specific customer-facing use case. There is NO generic/metadata-driven UI generation. Each screen is designed and implemented individually.

### 4. Endpoint Security
Every endpoint accessed by the customer web app MUST verify that the logged-on user only has access to their own data. This is enforced at the backend EX module level via `ExAuthenticationService`.

### 5. Future SP Module Separation
The SP (Sprint/Project) module in the backend will be moved to a separate backend service in the near future. Any integration with SP data must be designed with this separation in mind - use clean API boundaries, avoid tight coupling.

---

## Project Overview

The Customer Web App (`mvs.webapp`) is a customer-facing Angular 17 application that provides self-service portal functionality for end users. It communicates with the Alpha backend via the External API (EX) module.

**Repository:** `https://dev.azure.com/kvers/mvs.webapp/_git/mvs.webapp`
**Local Directory:** `customer_web_app/`
**Clone Script:** `clone-webapp.sh`
**Angular Version:** 17.2.0
**PrimeNG Version:** 17.7.0
**Dev Server Port:** 4201

### Key Differences from Admin Frontend

| Aspect | Admin Frontend (`frontend/`) | Customer Web App (`customer_web_app/`) |
|--------|------------------------------|----------------------------------------|
| Target Users | Internal key users, consultants | External customers / end users |
| Auth Method | MSAL (Azure AD) | JWT + OTP (via EX module) |
| API Base Path | `/mvsa/*` | `/mvseu/*`, `/mvseureg/*` |
| Feature Scope | Full CRUD, configuration | Self-service, read-heavy |
| Data Retrieval | QL (Query Language) | Dedicated REST endpoints ONLY |
| UI Generation | Widget system (metadata-driven) | Tailor-made components ONLY |
| Component Library | PrimeNG + custom MVS components | PrimeNG 17.7.0 + custom components |

---

## Architecture

### High-Level Architecture

```
Customer Web App (Angular 17)
        │
        ▼
   Backend API (EX Module gateway)
   ├── /mvseu/eu/*          ── Authenticated end-user endpoints
   ├── /mvseu/api/auth/*    ── Authentication (login, OTP, refresh)
   ├── /mvseureg/eu/*       ── Registration/public endpoints
   └── /mvseu/ex/*          ── External API endpoints (JWT-protected)
        │
        ▼
   Backend Modules (accessed through EX)
   ├── EU  ── End User management, OTP, preferences
   ├── CR  ── Customer data, addresses, contacts
   ├── CM  ── Contracts, contract types, partners
   ├── TM  ── Support tickets, comments
   ├── DM  ── Documents, uploads
   ├── AS  ── Appointments, scheduling
   ├── CS  ── Referrals, rewards, loyalty
   └── CI  ── Insurable objects, contract persons
```

### Technology Stack

- **Angular:** 17.2.0
- **TypeScript:** 5.3.2
- **RxJS:** 7.8.0
- **PrimeNG:** 17.7.0
- **Angular CDK:** 17.2.1
- **Signature Pad:** 4.1.7
- **QR Code:** angularx-qrcode 17.0.0
- **OTP Input:** ng-otp-input 1.9.3
- **Image Cropper:** ngx-image-cropper 7.2.1

---

## Backend API Integration

### API Base Paths

| Base Path | Purpose | Auth Required |
|-----------|---------|---------------|
| `/mvseureg/eu/*` | Registration, OTP request, public endpoints | No (or partial) |
| `/mvseu/eu/*` | Authenticated end-user operations | Yes (JWT) |
| `/mvseu/api/auth/*` | Authentication (login, OTP, refresh, password) | Partial |
| `/mvseu/ex/*` | External API endpoints | Yes (JWT) |

### Authentication Flow

```
1. User enters email/phone
        │
        ▼
2. POST /mvseu/api/auth/otpLoginInitiate  ── Request OTP
        │
        ▼
3. User receives OTP (email/SMS)
        │
        ▼
4. POST /mvseu/api/auth/otpLoginVerify    ── Verify OTP, receive JWT
        │
        ▼
5. All subsequent requests include ExAuthorization header
        │
        ▼
6. GET/POST /mvseu/eu/*                   ── Authenticated API calls
```

### Auth Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `ExAuthorization` | `{tokenType}{accessToken}` | Primary JWT auth |
| `IgAuthorization` | `Bearer ig {igToken}` | Fallback IG token |
| `x-alpha-tenant` | tenant ID | Multi-tenant support |

### Login Methods Available

1. **Standard Login:** `POST /mvseu/api/auth/login` (username + password)
2. **Pass Code Login:** `POST /mvseu/api/auth/loginPassCode`
3. **OTP Login (2-step):**
   - Initiate: `POST /mvseu/api/auth/otpLoginInitiate`
   - Verify: `POST /mvseu/api/auth/otpLoginVerify`
4. **Token Refresh:** `POST /mvseu/api/auth/refresh`

### Key Backend Modules

| Module | Description | Used For |
|--------|-------------|----------|
| **EX** (External API) | REST API gateway, JWT auth | All customer web app API calls |
| **EU** (End User) | User management, OTP, preferences | User data, notifications, themes |
| **CR** (Customer) | Customer records, addresses | Customer profile data |
| **CM** (Contract Management) | Contracts, contract types | Contract viewing |
| **TM** (Ticket Management) | Support tickets, comments | Customer support |
| **DM** (Document Management) | Document storage/retrieval | Document viewing/download |
| **AS** (Appointment Scheduling) | Appointments, free slots | Booking appointments |
| **CS** (Customer Service) | Referrals, rewards | Loyalty/referral programs |

---

## Project Structure (Confirmed)

```
customer_web_app/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services, guards, interceptors
│   │   │   ├── auth/                # auth.interceptor.ts, auth.guard.ts
│   │   │   ├── service/             # auth.service.ts, core-api.service.ts
│   │   │   ├── interfaces/          # core.types.ts (DTOs, enums)
│   │   │   ├── pages/               # Login, OTP, password reset pages
│   │   │   ├── components/          # Form, upload, PDF viewer, OTP input
│   │   │   └── core.module.ts
│   │   ├── cross/                   # Shared API services across features
│   │   │   ├── tickets/api/         # TicketsApiService
│   │   │   ├── contract/api/        # ContractApiService
│   │   │   ├── user/api/            # UserApiService
│   │   │   ├── user-document/api/   # UserDocumentApiService
│   │   │   ├── bookings/api/        # BookingsApiService
│   │   │   ├── notifications/api/   # NotificationsApiService
│   │   │   └── ... (more API services)
│   │   ├── ds/                      # Dashboard module (home, contracts, documents)
│   │   ├── ob/                      # Onboarding module
│   │   ├── rg/                      # Registration module (multi-step signup)
│   │   ├── us/                      # User Settings module (profile, password, email)
│   │   ├── ci/                      # Customer Interaction module
│   │   ├── cs/                      # Customer Service/Referrals module
│   │   ├── app.module.ts
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   ├── environments/                # dev, prod, local, clone configs
│   └── styles/
├── package.json
├── angular.json
└── tsconfig.json
```

### Module Responsibilities

| Module | Prefix | Purpose |
|--------|--------|---------|
| **Core** | - | Auth, login, interceptors, shared components |
| **Cross** | - | Reusable API services (tickets, contracts, user, etc.) |
| **DS** | ds | Dashboard screens (home, contracts, documents, insurances) |
| **OB** | ob | Onboarding (intro, upload, questionnaire) |
| **RG** | rg | Registration (signup, personal info, address, OTP) |
| **US** | us | User Settings (profile, password, email, phone, delete) |
| **CI** | ci | Customer Interactions (scheduling, workflows) |
| **CS** | cs | Customer Service (referrals, rewards, redemption) |

---

## Cross-Module API Services

All API services extend `CoreApiService` which provides base HTTP methods.

| Service | Endpoint Base | Key Operations |
|---------|--------------|----------------|
| **TicketsApiService** | `mvseu/eu/tickets` | list, get, postComment, createDocument |
| **ContractApiService** | `mvseu/eu/contracts` | list, getContract, getDocumentBinary/Base64 |
| **UserApiService** | `mvseu/eu/endUser` | getProfile, getBasicData, updatePhoto, deactivate, referFriend |
| **UserDocumentApiService** | `mvseu/eu/user/documents` | Document management |
| **UserChannelsApiService** | `mvseu/eu/endUser/channels` | Communication channels |
| **UserSignaturesApiService** | `mvseu/eu/endUser/signatures` | Digital signatures |
| **BookingsApiService** | `mvseu/eu/bookings` | Appointment scheduling |
| **NotificationsApiService** | `mvseu/eu/notifications` | User notifications |
| **PromotionsApiService** | `mvseu/eu/promotions` | Active promotions |
| **UserAddedInsuranceApiService** | `mvseu/eu/user/added-insurance` | User custom insurance |
| **InsurableObjectService** | `mvseu/eu/objects` | Insurable objects |

---

## Routing

Routes are collected dynamically from each module's `.route.ts` file:
- `core.route.ts` - Auth, login pages
- `ds.route.ts` - Dashboard
- `ob.route.ts` - Onboarding
- `rg.route.ts` - Registration
- `us.route.ts` - User Settings
- `ci.route.ts` - Customer Interactions
- `cs.route.ts` - Customer Service/Referrals

---

## Environment Configuration

| Environment | API URL | Purpose |
|-------------|---------|---------|
| `prod` | Azure Container Apps gateway `/ex` | Production |
| `dev` | Azure gateway `/dev_ex` | Development |
| `local` | `http://localhost:8080` | Local backend |
| `local-gateway` | `http://localhost:8082/dev_ex` | Local gateway |
| `clone` | Azure gateway `/clone_ex` | Clone environment |

---

## Security Considerations

### MANDATORY Requirements

1. **User Data Isolation** - Every EX endpoint MUST verify the logged-on user can only access their OWN data (via `ExAuthenticationService`)
2. **No Admin API Access** - MUST NEVER call `/mvsa/*` admin endpoints
3. **No Internal Data Exposure** - MUST NOT expose internal entity IDs, module codes, or backend structures
4. **JWT Token Security** - Tokens stored in localStorage (`authToken`, `authTokenType`, `refreshToken`)
5. **Auto-Logout** - 401/406 responses trigger automatic logout and redirect to `/login`
6. **Input Validation** - All user inputs validated client-side AND server-side
7. **User-Friendly Errors** - NEVER expose stack traces or internal error details

### Auth Interceptor Behavior

- Adds `ExAuthorization` header for authenticated endpoints
- Falls back to `IgAuthorization` for IG tokens
- Includes `x-alpha-tenant` header when configured
- Auto-refresh on token expiration (1-second check limit)
- 401/406 trigger logout; special handling for auth/registration endpoints

### Registration Security

- Registration endpoints use `/mvseureg/` path (no JWT required)
- OTP verification required before account activation
- Registration object provides the security context for registration endpoints

---

## Development Workflow

### Setup

```bash
# From the Alpha workspace root
./clone-webapp.sh

# Or manually
cd customer_web_app
npm install
```

### Running Locally

```bash
cd customer_web_app
npm start          # or ng serve (port 4201)
```

### Building

```bash
cd customer_web_app
npm run build      # Production build
```

---

## Key DTOs (core.types.ts)

### Auth DTOs
- `DtoLoginRequest`, `DtoLoginResponse`, `DtoLoginResponseFailed`
- `ExOtpLoginInitiateRequest`, `ExOtpLoginInitiateResponse`
- `ExOtpLoginVerifyRequest`, `ExOtpLoginVerifyResponse`
- `TokenRefreshRequestDto`
- `DtoChangePassword`, `DtoUpdateEmail`, `DtoUpdatePhone`

### Common DTOs
- `FormFieldDto`, `FormDto`, `ExFormFieldDto`, `ExFormDto`
- `ImageDto`, `FrontEndTextDto`, `ScheduleDto`, `CostDto`

### Enums
- `EuOtpCodeLoginType` (EMAIL, MOBILE_PHONE)
- `ScheduleTypeInternal` (whatsapp, call_me_back, call_us, bookings, none, vcard_qr)
- `FieldAccessEnum` (read, update, hidden)
