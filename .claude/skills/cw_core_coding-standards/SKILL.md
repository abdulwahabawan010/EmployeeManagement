---
name: cw_core_coding-standards
description: "Customer Web: Angular coding standards, API integration patterns, auth interceptor, error handling, naming conventions, and security considerations for the customer-facing web application."
---

# Customer Web App - Coding Standards

Architectural, structural, and formatting rule enforcement for the customer-facing web application (`mvs.webapp`).

## When This Skill Applies

This skill applies when:

- Writing or modifying code in `customer_web_app/`
- Creating new components, services, or modules for the customer web app
- Implementing API integration with backend endpoints
- Handling authentication, authorization, or security concerns
- Reviewing customer web app code for compliance

## When This Skill Does NOT Apply

- Admin frontend code in `frontend/` (use `fe_core_coding-standards` instead)
- Backend code in `backend/`
- Third-party library code

---

## CRITICAL CONSTRAINTS - ABSOLUTE RULES

These rules are NON-NEGOTIABLE. Violation is a blocking issue.

### 1. NO Query Language (QL) - EVER
```typescript
// FORBIDDEN - NEVER use QL in customer web app
this.qlService.query(...)           // NEVER
QlQueryBuilder.create(...)          // NEVER
ObjectRequestList.create(...)       // NEVER
this.http.post('/mvsa/core/ql', ...); // NEVER
```
All data retrieval MUST use dedicated REST endpoints via the EX module.

### 2. NO Widgets - EVER
```typescript
// FORBIDDEN - NEVER use widget system in customer web app
WidgetFactory.create(...)           // NEVER
dataProvider: { ... }              // NEVER (admin widget pattern)
@Input() widgetConfig              // NEVER
```
All UI is tailor-made. No metadata-driven generic components.

### 3. NO Admin API Paths - EVER
```typescript
// FORBIDDEN - NEVER call admin endpoints
this.http.get('/mvsa/...')          // NEVER
this.http.post('/mvsa/...')         // NEVER
```
Only `/mvseu/` and `/mvseureg/` paths are allowed.

### 4. Endpoint Security - MANDATORY
Every backend endpoint called by this app MUST validate that the authenticated user can only access their OWN data. This is verified at the EX module level via `ExAuthenticationService`.

### 5. SP Module Separation Awareness
The SP module will be extracted to a separate backend. Do NOT tightly couple with SP internals. Use clean REST API boundaries.

---

## General Principles

1. **Customer-Facing First** - All code must prioritize user experience, accessibility, and security
2. **Minimal Exposure** - Never expose internal system details (entity IDs, module codes, admin paths)
3. **Defensive Coding** - Validate all inputs, handle all error states gracefully
4. **Performance** - Minimize bundle size and API calls; customers may be on slow connections
5. **Tailor-Made** - Every component is purpose-built; no generic/metadata-driven UI

---

## API Integration Patterns

### Core API Service Base

All API services extend `CoreApiService` which wraps `HttpClient`:

```typescript
// CoreApiService provides: get(), post(), update(), delete(), upload(),
// getDocumentBinary(), getDocumentBase64()
// Base URL from environment.API_URL

export class TicketsApiService extends CoreApiService {
  private endpoint = 'mvseu/eu/tickets';

  list(): Observable<any[]> {
    return this.get(this.endpoint + '/list');
  }

  getTicket(id: number): Observable<any> {
    return this.get(this.endpoint + '/' + id);
  }
}
```

### API Path Rules

| Rule | Example |
|------|---------|
| Authenticated endpoints MUST use `/mvseu/` prefix | `/mvseu/eu/contracts` |
| Registration/public endpoints MUST use `/mvseureg/` prefix | `/mvseureg/eu/otp/request` |
| MUST NEVER call admin API paths (`/mvsa/*`) | Violation: `/mvsa/tm/tickets` |
| MUST NEVER use QL endpoints | Violation: `/mvsa/core/ql` |
| API paths MUST be defined as constants, not inline strings | `const API_PATHS = { ... }` |

### Error Handling for API Calls

```typescript
// CORRECT - User-friendly error handling
this.apiService.get('/eu/contracts').pipe(
  catchError(error => {
    this.notificationService.showError('Unable to load contracts. Please try again.');
    return EMPTY;
  })
).subscribe(data => { ... });

// WRONG - Exposing internal errors
this.apiService.get('/eu/contracts').subscribe({
  error: (err) => alert(err.message)  // NEVER expose raw error messages
});
```

---

## Authentication Patterns

### Auth Interceptor (Actual Implementation)

The interceptor adds `ExAuthorization` header (NOT standard `Authorization: Bearer`):

```typescript
// Actual header format used:
req.clone({
  setHeaders: { ExAuthorization: `${tokenType}${accessToken}` }
});

// Fallback for IG tokens:
req.clone({
  setHeaders: { IgAuthorization: `Bearer ig ${igToken}` }
});
```

### Token Storage

| Key | Storage | Purpose |
|-----|---------|---------|
| `authToken` | localStorage | JWT access token |
| `authTokenType` | localStorage | Token type prefix |
| `refreshToken` | localStorage | Refresh token |

### Auth Guard

Functional guard pattern:
```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
```

### Logout Triggers

- HTTP 401 response -> automatic logout
- HTTP 406 response -> automatic logout
- Token expiration detected -> attempt refresh first (1-second limit)

---

## Naming Conventions

### File Naming

```
<name-kebab-case>.<type>.<extension>
```

| Type | Description | Example |
|------|-------------|---------|
| `component` | Component class | `contract-list.component.ts` |
| `service` | Service class | `contract.service.ts` |
| `guard` | Route guard | `auth.guard.ts` |
| `interceptor` | HTTP interceptor | `auth.interceptor.ts` |
| `pipe` | Angular pipe | `date-format.pipe.ts` |
| `directive` | Angular directive | `auto-focus.directive.ts` |
| `model` | Data model/interface | `contract.model.ts` |
| `enum` | Enumeration | `contract-status.enum.ts` |
| `module` | Angular module | `contracts.module.ts` |

### Class Naming

- Components: `ContractListComponent`
- Services: `ContractService`
- Guards: `AuthGuard`
- Interceptors: `AuthInterceptor`
- Pipes: `DateFormatPipe`
- Models/Interfaces: `Contract`, `ContractListResponse`

### Component Selectors

```
app-<component-name>
```

Example: `app-contract-list`, `app-login-form`

---

## Component Patterns

### Component File Structure

Each component MUST have separate files:

```
contract-list/
├── contract-list.component.ts
├── contract-list.component.html
├── contract-list.component.scss
└── contract-list.component.spec.ts  (optional)
```

### Component Rules

1. MUST NEVER use inline templates or inline styles
2. MUST implement proper lifecycle hooks (`OnInit`, `OnDestroy`)
3. MUST unsubscribe from observables in `ngOnDestroy`
4. MUST handle loading states for async operations
5. MUST handle empty states (no data available)
6. MUST handle error states (API failure)
7. MUST NEVER use QL or widget patterns

### Loading State Pattern

```typescript
export class ContractListComponent implements OnInit, OnDestroy {
  loading = false;
  error = false;
  contracts: Contract[] = [];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContracts(): void {
    this.loading = true;
    this.error = false;

    this.contractService.getContracts().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data) => this.contracts = data,
      error: () => this.error = true
    });
  }
}
```

---

## Security Standards

### Input Sanitization

1. MUST sanitize all user inputs before display (Angular handles this by default with template binding)
2. MUST NEVER use `innerHTML` with user-provided content without sanitization
3. MUST NEVER bypass Angular's built-in XSS protection (`bypassSecurityTrustHtml`, etc.) unless absolutely necessary and reviewed

### Data Exposure Prevention

1. MUST NEVER log sensitive data (tokens, passwords, personal info) to console in production
2. MUST NEVER include internal entity IDs in URLs visible to customers (use slugs or public identifiers)
3. MUST NEVER expose backend module codes (e.g., `tm.Ticket`) in the UI
4. Error messages MUST be user-friendly; NEVER show stack traces or technical details

### Endpoint Security Verification

For EVERY new backend endpoint integration:
1. Verify the EX controller calls `ExAuthenticationService.getAuthenticatedUser()`
2. Verify data is scoped to the authenticated user's customer only
3. Verify registration endpoints validate with the registration object
4. Document which EX endpoint is being called and confirm security review

### Content Security

1. MUST set appropriate CSP headers via backend/deployment configuration
2. MUST NEVER load scripts from untrusted external sources
3. MUST use HTTPS for all external resource loading

---

## Error Handling Strategy

### Error Levels

| Level | Display | Example |
|-------|---------|---------|
| **User Error** | Inline form validation | "Email address is required" |
| **API Error** | Toast notification | "Unable to load data. Please try again." |
| **Auth Error** | Redirect to login | Token expired, 401 response |
| **System Error** | Generic error page | Server unreachable, 500 response |

### Global Error Handler

```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Log to monitoring service (not console in production)
    this.loggingService.logError(error);

    // Show user-friendly message
    this.notificationService.showError(
      'Something went wrong. Please try again or contact support.'
    );
  }
}
```

---

## Environment Configuration

### Environment Files

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  API_URL: 'http://localhost:8080',
  tenant: null,
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  API_URL: 'https://alpha-prod-gateway.../ex',
  tenant: null,
};
```

### Environment Rules

1. MUST NEVER hardcode API URLs in services or components
2. MUST use environment files for all configuration
3. MUST NEVER commit secrets or API keys to the repository
4. Production environment MUST use the gateway URL

---

## Device Info

All API requests include device identification:

```typescript
// CoreApiService device info
{
  deviceType: "DEVICE_BROWSER",
  deviceId: "NDF",
  notificationToken: "NDF"
}
```
