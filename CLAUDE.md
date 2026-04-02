# Employee Management System - Project Context

## Project Overview
Full-stack Employee Management System built for learning .NET Core + Angular with enterprise-level patterns.

**GitHub:** https://github.com/abdulwahabawan010/EmployeeManagement

## Tech Stack
- **Backend:** .NET 8, Entity Framework Core, SQL Server
- **Frontend:** Angular 20, TypeScript, SCSS
- **Database:** SQL Server via Docker (Azure SQL Edge)
- **Architecture:** Clean Architecture (3-layer) + Repository + Unit of Work

## Current Progress: Days 1-4 ✅ COMPLETE

### ✅ Day 1: Project Setup + Database
- Environment setup (Docker, SQL Server, EF Tools)
- Clean Architecture project structure
- Entity models: Employee, Department, User, RefreshToken, BaseEntity
- Enums: Role, EmployeeStatus
- DTOs: Employee + Department (Create, Update, Response)
- DbContext with Fluent API configuration
- Migrations + Database seeding

### ✅ Day 2: JWT Authentication
- BCrypt password hashing
- JWT token generation with claims
- Refresh token implementation
- Auth DTOs (Register, Login, RefreshToken, AuthResponse)
- AuthService with token management
- AuthController endpoints
- Role-based authorization [Authorize(Roles = "Admin")]

### ✅ Day 3: Repository + Unit of Work Pattern
- IGenericRepository interface (CRUD + Include methods)
- GenericRepository implementation
- IUnitOfWork interface (manages repositories + transactions)
- UnitOfWork implementation
- Services refactored to use UnitOfWork
- DepartmentService & EmployeeService

### ✅ Day 4: Angular Frontend
- Enterprise folder structure (core/features/shared/layouts)
- Path aliases (@core/*, @features/*, @shared/*, @layouts/*)
- Core services: ApiService, AuthService
- HTTP Interceptors: JwtInterceptor (auto-attach token, refresh on 401), ErrorInterceptor
- Route Guards: authGuard, guestGuard, roleGuard
- Layouts: AuthLayout, MainLayout (with sidebar)
- Features:
  - Auth: Login, Register (reactive forms with validation)
  - Dashboard: Statistics overview
  - Departments: List, Create, Edit, Delete
  - Employees: List with filtering, Create, Edit, Delete
- Lazy loading for all feature modules
- CORS configured on backend

## Project Structure
```
EmployeeManagement/
├── EmployeeManagement.sln
├── CLAUDE.md
├── .gitignore
├── src/
│   ├── EmployeeManagement.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── DepartmentController.cs
│   │   │   └── EmployeeController.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── EmployeeManagement.Core/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   ├── DTOs/
│   │   └── Interfaces/
│   │       ├── IUnitOfWork.cs
│   │       ├── Repositories/
│   │       └── Services/
│   └── EmployeeManagement.Infrastructure/
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   ├── DbSeeder.cs
│       │   └── Migrations/
│       ├── Repositories/
│       ├── Services/
│       └── UnitOfWork.cs
└── client/                          # Angular Frontend
    ├── src/app/
    │   ├── core/
    │   │   ├── guards/
    │   │   ├── interceptors/
    │   │   ├── models/
    │   │   └── services/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── dashboard/
    │   │   ├── departments/
    │   │   └── employees/
    │   ├── layouts/
    │   │   ├── auth-layout/
    │   │   └── main-layout/
    │   └── shared/
    ├── src/environments/
    └── angular.json
```

## API Endpoints
```
POST   /api/auth/login           # Login (returns JWT + refresh token)
POST   /api/auth/register        # Register new user
POST   /api/auth/refresh-token   # Refresh JWT token

GET    /api/department           # Get all departments
GET    /api/department/{id}      # Get department by ID
POST   /api/department           # Create department (Admin only)
PUT    /api/department/{id}      # Update department (Admin only)
DELETE /api/department/{id}      # Delete department (Admin only)

GET    /api/employee             # Get all employees
GET    /api/employee/{id}        # Get employee by ID
GET    /api/employee/department/{id}  # Get employees by department
POST   /api/employee             # Create employee (Admin/Manager)
PUT    /api/employee/{id}        # Update employee (Admin/Manager)
DELETE /api/employee/{id}        # Delete employee (Admin only)
```

## Database Connection
```
Server:   localhost,1433
Username: sa
Password: Employee@123
Database: EmployeeManagementDb
```

## Default Credentials
```
Email:    admin@company.com
Password: Admin@123
Role:     Admin
```

## Commands Reference
```bash
# Start SQL Server (if stopped)
docker start sqlserver

# Start Backend (Terminal 1)
cd /Users/wahabmalikawan/Documents/EmployeeManagement/src/EmployeeManagement.API
dotnet run
# Runs on: http://localhost:5136

# Start Frontend (Terminal 2)
cd /Users/wahabmalikawan/Documents/EmployeeManagement/client
ng serve
# Runs on: http://localhost:4200

# Build Angular for production
ng build

# Create migration
cd src/EmployeeManagement.API
dotnet ef migrations add <MigrationName> --project ../EmployeeManagement.Infrastructure --output-dir Data/Migrations

# Apply migration
dotnet ef database update --project ../EmployeeManagement.Infrastructure

# Git commands
git add -A
git commit -m "message"
git push origin main
```

## 7-Day Learning Plan
- Day 1: Project Setup + Database ✅
- Day 2: JWT Authentication + Refresh Tokens ✅
- Day 3: Repository + Unit of Work Pattern ✅
- Day 4: Angular Enterprise Frontend ✅
- Day 5: FluentValidation + Global Error Handling ← NEXT
- Day 6: Unit Testing (xUnit + Moq)
- Day 7: Advanced (Pagination, File Upload, Caching, Docker)

## Resume Instructions
Tell Claude: "Let's start Day 5 - FluentValidation and Global Error Handling"

## Key Patterns Learned
1. **Clean Architecture** - Separation of concerns (API, Core, Infrastructure)
2. **Repository Pattern** - Abstract database operations
3. **Unit of Work** - Manage transactions across repositories
4. **JWT + Refresh Tokens** - Secure authentication with token refresh
5. **Lazy Loading** - Angular feature modules load on demand
6. **Guards & Interceptors** - Route protection + HTTP request/response handling
7. **Reactive Forms** - Form validation with FormBuilder
8. **Signals** - Modern Angular state management
