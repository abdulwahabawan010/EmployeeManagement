# Boundaries Guidelines

Rules governing import restrictions, private component isolation, circular dependency prevention, and public API enforcement.

---

## BOUND-001: Protected Components Never Exported

**Level:** AUTO-CHECKABLE

Components in `protected-components/` must never be imported outside their owning module.

### DO

```typescript
// cr.module.ts - Only declare protected components, do not export
@NgModule({
    declarations: [
        CustomerInternalComponent,  // From protected-components/
    ],
    exports: [
        CustomerCardComponent,      // From public-components/
    ]
})
export class CrModule {}
```

### DO NOT

```typescript
// other-module.ts
// DO NOT import from protected-components
import { CustomerInternalComponent } from 'features/feature-crm/cr/component/protected-components/customer-internal-component/customer-internal.component';
```

---

## BOUND-002: No Circular Module Dependencies

**Level:** AUTO-CHECKABLE

Module A must not import from Module B if Module B imports from Module A.

### DO

```
feature-crm/cr → features/core/shared ✓
features/core/shared → @angular/core ✓
```

### DO NOT

```
feature-crm/cr → feature-billing/bm
feature-billing/bm → feature-crm/cr  // Circular!
```

---

## BOUND-003: No Circular File Dependencies

**Level:** AUTO-CHECKABLE

File A must not import from File B if File B imports from File A.

### DO

```typescript
// customer.service.ts
import { CustomerDto } from '../model/dto/customer-dto';

// customer-dto.ts - No import of customer.service.ts
export class CustomerDto {
    id: number;
}
```

### DO NOT

```typescript
// customer.service.ts
import { CustomerDto } from '../model/dto/customer-dto';

// customer-dto.ts
import { CustomerService } from '../service/customer.service';  // Circular!

export class CustomerDto {
    service = inject(CustomerService);  // Creates circular dependency
}
```

---

## BOUND-004: Public API via Index Files

**Level:** AUTO-CHECKABLE

External consumers must import from module's index.ts, not deep paths.

### DO

```typescript
// External consumer
import { CustomerService, CustomerDto } from 'features/feature-crm/cr';
```

```typescript
// features/feature-crm/cr/index.ts
export { CustomerService } from './service/customer.service';
export { CustomerDto } from './model/dto/customer-dto';
// Protected components NOT exported
```

### DO NOT

```typescript
// External consumer - DO NOT use deep paths
import { CustomerService } from 'features/feature-crm/cr/service/customer.service';
import { CustomerDto } from 'features/feature-crm/cr/model/dto/customer-dto';
```

---

## BOUND-005: No Importing from node_modules Internals

**Level:** AUTO-CHECKABLE

Import from package root, not internal paths of node_modules.

### DO

```typescript
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
```

### DO NOT

```typescript
// DO NOT import from internal package paths
import { Component } from '@angular/core/src/component';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
```

---

## BOUND-006: Feature-to-Feature Communication via Services

**Level:** MANUAL-ONLY

Features must communicate via shared services or events, not direct imports.

### DO

```typescript
// features/core/shared/service/cross-feature-event.service.ts
@Injectable({ providedIn: 'root' })
export class CrossFeatureEventService {
    private customerSelected$ = new Subject<number>();

    emitCustomerSelected(customerId: number) {
        this.customerSelected$.next(customerId);
    }

    onCustomerSelected(): Observable<number> {
        return this.customerSelected$.asObservable();
    }
}

// feature-crm - emits event
this.eventService.emitCustomerSelected(customerId);

// feature-billing - listens to event
this.eventService.onCustomerSelected().subscribe(id => {
    this.loadInvoicesForCustomer(id);
});
```

### DO NOT

```typescript
// feature-billing directly imports feature-crm component
import { CustomerSelectorComponent } from 'features/feature-crm/cr/component/customer-selector/customer-selector.component';
```

---

## BOUND-007: Layer Boundary Enforcement

**Level:** AUTO-CHECKABLE

Respect layer boundaries: Component → Service → Repository/API.

### DO

```typescript
// Component layer
@Component({...})
export class CustomerListComponent {
    constructor(private customerService: CustomerService) {}
}

// Service layer
@Injectable()
export class CustomerService {
    constructor(private customerApi: CustomerApiService) {}
}

// API layer
@Injectable()
export class CustomerApiService {
    constructor(private http: HttpClient) {}
}
```

### DO NOT

```typescript
// Component directly accessing API layer
@Component({...})
export class CustomerListComponent {
    constructor(private customerApi: CustomerApiService) {}  // Skip service layer
}
```

---

## BOUND-008: No Relative Imports Across Module Boundaries

**Level:** AUTO-CHECKABLE

Use absolute paths when importing across module boundaries.

### DO

```typescript
// In feature-crm/cr/component/customer.component.ts
// Importing from core - use absolute path
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';
```

### DO NOT

```typescript
// In feature-crm/cr/component/customer.component.ts
// DO NOT use relative paths across module boundaries
import { ObjectIdentifier } from '../../../../core/shared/basic/object-identifier';
```

---

## BOUND-009: Relative Imports Within Module

**Level:** AUTO-CHECKABLE

Use relative paths when importing within the same module.

### DO

```typescript
// In feature-crm/cr/service/customer.service.ts
// Same module - use relative import
import { CustomerDto } from '../model/dto/customer-dto';
import { CustomerStatusEnum } from '../model/enum/customer-status.enum';
```

### DO NOT

```typescript
// In feature-crm/cr/service/customer.service.ts
// DO NOT use absolute path for same module
import { CustomerDto } from 'features/feature-crm/cr/model/dto/customer-dto';
```

---

## BOUND-010: Shared Module Dependency Direction

**Level:** AUTO-CHECKABLE

Shared modules must not depend on feature modules.

### DO

```
features/core/shared/ → @angular/core ✓
features/core/shared/ → rxjs ✓
features/core/shared/ → primeng ✓
```

### DO NOT

```
features/core/shared/ → features/feature-crm/cr  // Shared depending on feature
```

---

## BOUND-011: Test Files Cannot Import Test Files

**Level:** AUTO-CHECKABLE

Production code must not import from `.spec.ts` files. Test utilities must be in separate files.

### DO

```typescript
// test/helpers/customer-test-helper.ts
export function createMockCustomer(): Customer {
    return { id: 1, name: 'Test' };
}

// customer.service.spec.ts
import { createMockCustomer } from '../test/helpers/customer-test-helper';
```

### DO NOT

```typescript
// customer.service.ts
// DO NOT import from spec files
import { mockCustomer } from './customer.service.spec';
```

---

## BOUND-012: Environment-Specific Imports

**Level:** AUTO-CHECKABLE

Environment files must only be imported in designated configuration files.

### DO

```typescript
// app.module.ts or main.ts - allowed to import environment
import { environment } from '../environments/environment';

if (environment.production) {
    enableProdMode();
}
```

### DO NOT

```typescript
// customer.service.ts - DO NOT import environment in regular services
import { environment } from '../../../environments/environment';

getApiUrl() {
    return environment.apiUrl + '/customers';  // Use config service instead
}
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| BOUND-001 | Protected Components Never Exported | AUTO-CHECKABLE |
| BOUND-002 | No Circular Module Dependencies | AUTO-CHECKABLE |
| BOUND-003 | No Circular File Dependencies | AUTO-CHECKABLE |
| BOUND-004 | Public API via Index Files | AUTO-CHECKABLE |
| BOUND-005 | No Importing from node_modules Internals | AUTO-CHECKABLE |
| BOUND-006 | Feature-to-Feature Communication via Services | MANUAL-ONLY |
| BOUND-007 | Layer Boundary Enforcement | AUTO-CHECKABLE |
| BOUND-008 | No Relative Imports Across Module Boundaries | AUTO-CHECKABLE |
| BOUND-009 | Relative Imports Within Module | AUTO-CHECKABLE |
| BOUND-010 | Shared Module Dependency Direction | AUTO-CHECKABLE |
| BOUND-011 | Test Files Cannot Import Test Files | AUTO-CHECKABLE |
| BOUND-012 | Environment-Specific Imports | AUTO-CHECKABLE |
