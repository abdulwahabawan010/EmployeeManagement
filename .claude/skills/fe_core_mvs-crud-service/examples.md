# MvsCrudService Examples

## Creating a New Entity Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MvsCrudService } from '@features/core/shared/service/crud/mvs-crud.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerService extends MvsCrudService {

    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/cr/customers');
    }
}
```

## Basic List Operation

```typescript
loadCustomers() {
    const request = ObjectRequestList.createBasic(true, [], []);

    this.customerService.list(request).subscribe({
        next: (result: DtoList<CustomerDto>) => {
            this.customers = result.entries;
        }
    });
}
```

## List with Filters

```typescript
loadActiveCustomers() {
    const request = ObjectRequestList.createBasic(
        true,
        [
            FilterCriteria.create('enabled', FilterCriteria.cOperatorEqual, true),
            FilterCriteria.create('country.code', FilterCriteria.cOperatorEqual, 'DE')
        ],
        []
    );

    this.customerService.list(request).subscribe({
        next: (result: DtoList<CustomerDto>) => {
            this.customers = result.entries;
        }
    });
}
```

## List with Sorting

```typescript
loadCustomersSorted() {
    const request = ObjectRequestList.createBasic(
        true,
        [],
        [
            new Sorting('country.name', false),
            new Sorting('name', false)
        ]
    );

    this.customerService.list(request).subscribe({
        next: (result: DtoList<CustomerDto>) => {
            this.customers = result.entries;
        }
    });
}
```

## List with Pagination

```typescript
loadCustomersPaginated(page: number = 0, size: number = 25) {
    const request = ObjectRequestList.createBasic(true, [], []);
    request.paging = PagingDto.create(page, size);

    this.customerService.list(request).subscribe({
        next: (result: DtoList<CustomerDto>) => {
            this.customers = result.entries;
            this.totalCount = result.pagingResponse?.totalCount;
        }
    });
}
```

## Get with Form Metadata

```typescript
loadCustomerForEdit(customerId: number) {
    this.customerService.get(
        customerId,
        null,
        true
    ).subscribe({
        next: (customer: CustomerDto) => {
            this.customer = customer;
            this.form = customer.form;
        }
    });
}
```

## Create Entity

```typescript
createCustomer() {
    const newCustomer = new CustomerDto();
    newCustomer.name = 'ACME Corp';
    newCustomer.enabled = true;

    this.customerService.create(newCustomer).subscribe({
        next: (createdCustomer: CustomerDto) => {
            console.log('Created with ID:', createdCustomer.id);
        },
        error: (error) => {
            console.error('Creation failed:', error);
        }
    });
}
```

## Update Entity

```typescript
updateCustomer(customer: CustomerDto) {
    customer.name = 'Updated Name';

    this.customerService.update(customer).subscribe({
        next: (updatedCustomer: CustomerDto) => {
            this.customer = updatedCustomer;
        },
        error: (error) => {
            console.error('Update failed:', error);
        }
    });
}
```

## Delete Entity

```typescript
deleteCustomer(customerId: number) {
    if (confirm('Are you sure?')) {
        this.customerService.delete(customerId).subscribe({
            next: () => {
                this.loadCustomers();
            },
            error: (error) => {
                console.error('Delete failed:', error);
            }
        });
    }
}
```

## Service Configuration

```typescript
export class CustomerService extends MvsCrudService {

    getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
        if (mode === MvsCrudModeEnum.create) {
            return CrCreateObjectCustomerComponent;
        }
        return CrCustomerComponent;
    }

    getObjectIcon(): string {
        return 'pi pi-user';
    }

    getObjectLabels(): string[] {
        return ['personDtoName', 'alias', 'name'];
    }
}
```

## Custom Endpoint

```typescript
export class CustomerService extends MvsCrudService {

    getPhotoUrl(customerId: number): Observable<string> {
        const url = `${this.apiUrl}/${customerId}/photo`;
        return this.http.get(url, {responseType: 'blob'}).pipe(
            map(blob => URL.createObjectURL(blob))
        );
    }
}
```

## Unsubscribe Pattern

```typescript
export class CustomerListComponent implements OnDestroy {
    private destroy$ = new Subject<void>();

    loadCustomers() {
        this.customerService.list(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result: DtoList<CustomerDto>) => {
                    this.customers = result.entries;
                }
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```
