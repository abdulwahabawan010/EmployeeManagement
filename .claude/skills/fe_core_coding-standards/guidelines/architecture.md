# Architecture Guidelines

Rules governing module layering, dependency direction, and feature isolation.

---

## ARCH-001: Feature Module Isolation

**Level:** AUTO-CHECKABLE

Features must be self-contained within their feature directory.

### DO

```
features/
├── feature-crm/
│   ├── cr/
│   │   ├── component/
│   │   ├── service/
│   │   └── model/
│   └── cr.module.ts
├── feature-billing/
│   ├── bm/
│   │   ├── component/
│   │   ├── service/
│   │   └── model/
│   └── bm.module.ts
```

### DO NOT

```typescript
// In feature-crm/cr/component/customer.component.ts
// DO NOT import directly from another feature's internal path
import { Invoice } from '../../../feature-billing/bm/model/invoice';
```

---

## ARCH-002: Core Module as Shared Foundation

**Level:** AUTO-CHECKABLE

Core modules (`features/core/`) provide shared functionality. Feature modules may import from core, but core must not import from features.

### DO

```typescript
// In features/feature-crm/cr/service/customer.service.ts
import { ObjectRequestList } from 'features/core/shared/dto/object-request-list';
```

### DO NOT

```typescript
// In features/core/shared/service/base.service.ts
// DO NOT import from feature modules
import { CustomerDto } from 'features/feature-crm/cr/model/dto/customer-dto';
```

---

## ARCH-003: Dependency Direction

**Level:** AUTO-CHECKABLE

Dependencies flow inward: Features → Core → Shared. Never the reverse.

```
┌─────────────────────────────────────┐
│           Feature Modules           │
│  (feature-crm, feature-billing)     │
└───────────────┬─────────────────────┘
                │ imports
                ▼
┌─────────────────────────────────────┐
│            Core Module              │
│        (features/core/*)            │
└───────────────┬─────────────────────┘
                │ imports
                ▼
┌─────────────────────────────────────┐
│          Angular/Libs               │
│    (@angular/*, primeng/*, rxjs)    │
└─────────────────────────────────────┘
```

### DO

```typescript
// feature-crm imports from core
import { MvsFormGroup } from 'features/core/shared/basic/mvs-form-group';
```

### DO NOT

```typescript
// core imports from feature
import { CrModule } from 'features/feature-crm/cr/cr.module';
```

---

## ARCH-004: Layer Separation

**Level:** AUTO-CHECKABLE

Components must not directly access HTTP services. Use dedicated service layer.

### DO

```typescript
// component.ts
@Component({...})
export class CustomerComponent {
    constructor(private customerService: CustomerService) {}

    loadData() {
        this.customerService.getCustomer(id).subscribe(...);
    }
}

// customer.service.ts
@Injectable()
export class CustomerService {
    constructor(private http: HttpClient) {}

    getCustomer(id: number) {
        return this.http.get<CustomerDto>(`/api/customers/${id}`);
    }
}
```

### DO NOT

```typescript
// component.ts - DO NOT inject HttpClient directly in components
@Component({...})
export class CustomerComponent {
    constructor(private http: HttpClient) {}

    loadData() {
        this.http.get('/api/customers/123').subscribe(...);
    }
}
```

---

## ARCH-005: Module Self-Registration

**Level:** MANUAL-ONLY

Each feature module must declare and export its own components, services, and routes.

### DO

```typescript
// cr.module.ts
@NgModule({
    declarations: [
        CustomerListComponent,
        CustomerDetailComponent
    ],
    imports: [
        CommonModule,
        CrRoutingModule
    ],
    exports: [
        CustomerListComponent
    ]
})
export class CrModule {}
```

### DO NOT

```typescript
// app.module.ts - DO NOT declare feature components in root module
@NgModule({
    declarations: [
        CustomerListComponent, // Should be in CrModule
    ]
})
export class AppModule {}
```

---

## ARCH-006: No Cross-Feature Direct Imports

**Level:** AUTO-CHECKABLE

Feature modules must not import directly from other feature modules' internal paths.

### DO

```typescript
// Use shared interfaces or core services
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';
```

### DO NOT

```typescript
// In feature-crm
// DO NOT import from feature-billing internal paths
import { InvoiceService } from 'features/feature-billing/bm/service/invoice.service';
```

---

## Summary

| Rule ID | Name | Level |
|---------|------|-------|
| ARCH-001 | Feature Module Isolation | AUTO-CHECKABLE |
| ARCH-002 | Core Module as Shared Foundation | AUTO-CHECKABLE |
| ARCH-003 | Dependency Direction | AUTO-CHECKABLE |
| ARCH-004 | Layer Separation | AUTO-CHECKABLE |
| ARCH-005 | Module Self-Registration | MANUAL-ONLY |
| ARCH-006 | No Cross-Feature Direct Imports | AUTO-CHECKABLE |
