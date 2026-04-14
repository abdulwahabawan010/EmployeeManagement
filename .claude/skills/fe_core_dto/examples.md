# DTO Examples

## Entity DTO

```typescript
// File: features/feature-crm/cr/model/dto/entity/customer.dto.ts

import { DtoDetail } from "features/core/shared/dto/dto.detail";

export class CustomerDto extends DtoDetail {
  // Core properties
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: string;

  // Relationships - Three-Field Pattern
  companyDtoId?: number;
  companyDtoName?: string;
  companyDto?: CompanyDto;

  // One-to-Many
  addresses?: AddressDto[];

  // Computed
  fullName?: string;
  isActive?: boolean;
}
```

## API DTO

```typescript
// File: features/feature-crm/cr/model/dto/api/ticket-count.dto.ts

export interface TicketCountDto {
  totalCount: number;
  meCount: number;
  poolsCount: number;
}
```

## Enum

```typescript
// File: features/feature-crm/cr/model/dto/enum/customer-status.enum.ts

// CORRECT - ALL_CAPS
export enum CustomerStatusEnum {
  ACTIVE,
  INACTIVE,
  PENDING,
  SUSPENDED
}

// CORRECT - all_lowercase
export enum MvsCrudModeEnum {
  create,
  read,
  update,
  delete
}
```

## Entity with Relationships

```typescript
// File: features/feature-<feature>/<module>/model/dto/entity/customer-contract.dto.ts

import { DtoDetail } from "features/core/shared/dto/dto.detail";

export class CustomerContractDto extends DtoDetail {
  // Core properties
  contractNumber: string;
  startDate: string;
  endDate?: string;
  status?: string;

  // Relationships - Three-Field Pattern
  customerDtoId?: number;
  customerDtoName?: string;
  customerDto?: CustomerDto;

  contractTypeDtoId?: number;
  contractTypeDtoName?: string;
  contractTypeDto?: ContractTypeDto;
}
```

## API Search Request

```typescript
// File: features/feature-crm/cr/model/dto/api/customer-search-request.dto.ts

export interface CustomerSearchRequestDto {
  searchTerm?: string;
  status?: string;
  customerType?: string;
  companyId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
```

## Self-Reference Pattern

```typescript
// For hierarchical entities that reference themselves

// Manager (single self-reference) - uses three-field pattern
managerDtoId?: number;
managerDtoName?: string;
managerDto?: PersonDto;

// Team members (collection self-reference)
teamMembers?: PersonDto[];
```
