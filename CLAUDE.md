# Employee Management System - Project Context

## Project Overview
Full-stack Employee Management System for learning .NET Core + Angular.

## Tech Stack
- **Backend:** .NET 10, Entity Framework Core, SQL Server
- **Frontend:** Angular 17+ (Day 5-6)
- **Database:** SQL Server via Docker (Azure SQL Edge)
- **Architecture:** Clean Architecture (3-layer)

## Current Progress: Day 1 ✅ COMPLETE

### ✅ Day 1 Completed
1. Environment setup (Docker, SQL Server, EF Tools)
2. Project structure with Clean Architecture
3. Entity models: Employee, Department, User, BaseEntity
4. Enums: Role, EmployeeStatus
5. DTOs: Employee + Department (Create, Update, Response)
6. DbContext with Fluent API configuration
7. Initial migration + AddEmployeeAddress migration
8. Database seeding (Departments, Employees, Admin User)

### ⏳ Next: Day 2 - Authentication
1. Install BCrypt package
2. Create Auth DTOs (Register, Login, Token)
3. Create IAuthService interface
4. Create AuthService
5. Setup JWT configuration
6. Create AuthController
7. Test Register & Login APIs
8. Protect routes with [Authorize]
9. Role-based authorization

## Project Structure
```
EmployeeManagement/
├── EmployeeManagement.sln
└── src/
    ├── EmployeeManagement.API/
    │   ├── Controllers/
    │   ├── Program.cs
    │   └── appsettings.json
    ├── EmployeeManagement.Core/
    │   ├── Entities/ (Employee, Department, User, BaseEntity)
    │   ├── Enums/ (Role, EmployeeStatus)
    │   ├── DTOs/ (Employee/, Department/)
    │   └── Interfaces/
    └── EmployeeManagement.Infrastructure/
        └── Data/
            ├── AppDbContext.cs
            ├── DbSeeder.cs
            └── Migrations/
```

## Database Connection
```
Server:   localhost,1433
Username: sa
Password: Employee@123
Database: EmployeeManagementDb
```

## Commands Reference
```bash
# Start SQL Server (if stopped)
docker start sqlserver

# Check if SQL Server running
docker ps

# Build project
cd /Users/wahabmalikawan/Documents/EmployeeManagement
dotnet build EmployeeManagement.sln

# Run API
cd src/EmployeeManagement.API
dotnet run

# Create migration
cd src/EmployeeManagement.API
dotnet ef migrations add <MigrationName> --project ../EmployeeManagement.Infrastructure --output-dir Data/Migrations

# Apply migration
dotnet ef database update --project ../EmployeeManagement.Infrastructure
```

## 7-Day Plan
- Day 1: Project Setup + Database ✅ COMPLETE
- Day 2: Authentication (JWT) ← NEXT
- Day 3: Core APIs (CRUD)
- Day 4: Advanced Backend
- Day 5: Angular Setup
- Day 6: Angular CRUD + UI
- Day 7: Integration + Polish

## Before Day 2
- Install Postman or Thunder Client (VS Code extension) to test APIs

## Resume Instructions
Tell Claude: "Let's start Day 2 - Authentication with JWT"
