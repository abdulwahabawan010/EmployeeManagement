# MvsCoreService Examples

## Injecting MvsCoreService

```typescript
import { MvsCoreService } from '@features/core/shared/service/mvs-core.service';

@Component({
    selector: 'app-my-component',
    template: `...`
})
export class MyComponent implements OnInit {
    constructor(private mvsCoreService: MvsCoreService) {}
}
```

## Get Service with Type Safety

```typescript
import { CustomerService } from '@features/feature-crm/cr/service/api/customer.service';

loadCustomers() {
    const customerService = this.mvsCoreService.getCrudService<CustomerService>('cr.Customer');

    if (customerService) {
        const request = ObjectRequestList.createBasic(true, [], []);
        customerService.list(request).subscribe(result => {
            console.log('Customers:', result.entries);
        });
    } else {
        console.error('CustomerService not found');
    }
}
```

## Dynamic Entity Type Resolution

```typescript
@Component({
    selector: 'app-generic-list',
    template: `<div *ngFor="let entity of entities">{{ entity.name }}</div>`
})
export class GenericListComponent implements OnInit {
    @Input() entityType: string;
    entities: any[] = [];

    constructor(private mvsCoreService: MvsCoreService) {}

    ngOnInit() {
        this.loadEntities();
    }

    loadEntities() {
        const service = this.mvsCoreService.getCrudService(this.entityType);

        if (service) {
            const request = ObjectRequestList.createBasic(true, [], []);
            service.list(request).subscribe(result => {
                this.entities = result.entries;
            });
        }
    }
}
```

## Get Component for Edit Mode

```typescript
import { MvsCrudModeEnum } from '@features/core/shared/service/crud/mvs-crud-mode.enum';

openCustomerForEdit(customerId: number) {
    const component = this.mvsCoreService.getObjectComponent(
        'cr.Customer',
        MvsCrudModeEnum.update
    );

    if (component) {
        this.navigationService.openObjectSideRight(
            'cr.Customer',
            customerId,
            component
        );
    }
}
```

## Get Component for Create Mode

```typescript
openCreateCustomer() {
    const component = this.mvsCoreService.getObjectComponent(
        'cr.Customer',
        MvsCrudModeEnum.create
    );

    if (component) {
        this.navigationService.openObjectSideRight(
            'cr.Customer',
            null,
            component
        );
    }
}
```

## Get Entity Metadata

```typescript
// Get icon
const icon = this.mvsCoreService.getObjectIcon('cr.Customer');
// Returns: 'pi pi-user'

// Get labels
const labels = this.mvsCoreService.getObjectLabels('cr.Customer');
// Returns: ['personDtoName', 'alias', 'name']
```

## Register New Entity Service

```typescript
// dto.service.map.ts
import { NewEntityService } from './path/to/new-entity.service';

export const dtoServiceMap = new Map<string, DtoServiceInfo>([
    // Existing entries...
    ['your.NewEntity', {
        service: NewEntityService,
        entityName: 'NewEntity'
    }]
]);
```
