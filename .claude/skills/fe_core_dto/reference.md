# DTO Reference

## What is a DTO?

A **Data Transfer Object (DTO)** is a TypeScript class or interface that defines the shape of data transferred between the frontend and backend. DTOs serve as the contract between the Angular application and the REST API.

## Two Types of DTOs

| Aspect | Entity DTO | API DTO |
|--------|------------|---------|
| Type | `class` | `interface` |
| Base Class | Extends `DtoDetail` | None |
| Has ID | Yes | Usually no |
| Location | `model/dto/entity/` | `model/dto/api/` |
| Purpose | Database entities | API payloads |
| Relationships | Yes | Rare |
| Form Support | Yes (via `DtoDetail`) | No |

## DtoDetail Base Class

**Location:** `features/core/shared/dto/dto.detail.ts`

**Provided Properties:**

```typescript
export class DtoDetail {
  id: number;
  name: string;
  createdBy?: string;
  createdDate?: Date;
  lastModifiedBy?: string;
  lastModifiedDate?: Date;
  private _form?: MvsFormDto;
  public importObjectContext?: DtoImportObjectContext;
}
```

## Three-Field Pattern for Relationships

For every ManyToOne relationship, use **three properties**:

| Field | Purpose | Type |
|-------|---------|------|
| `customerDtoId` | Foreign key ID (always returned) | `number?` |
| `customerDtoName` | Display name (quick display) | `string?` |
| `customerDto` | Full object (loaded on demand) | `CustomerDto?` |

## Type Mappings

| Backend (Java) | Frontend (TypeScript) |
|----------------|----------------------|
| `Long`, `Integer` | `number` |
| `String` | `string` |
| `Boolean` | `boolean` |
| `LocalDate`, `LocalDateTime` | `string` or `Date` |
| `BigDecimal` | `number` |
| `List<T>`, `Set<T>` | `T[]` |
| `Enum` | `string` or TypeScript enum |

## Folder Structure

```
<module-alias>/
└── model/
    └── dto/
        ├── entity/     # Entity DTOs (extend DtoDetail)
        ├── api/        # API DTOs (interfaces)
        └── enum/       # DTO-related enums
```

## Property Categories

1. **Base Properties** (from DtoDetail): `id`, `name`, audit fields
2. **Core Entity Properties**: Required and optional business fields
3. **Relationship Properties**: Three-field pattern for ManyToOne, arrays for OneToMany
4. **Computed/UI Properties**: Calculated fields for display

## Data Flow

**API Response to Component:**
```
Backend API -> HTTP Response -> Service -> DTO -> Component -> Template
```

**Form Submission to API:**
```
Form -> DTO -> Service -> HTTP Request -> Backend API
```
