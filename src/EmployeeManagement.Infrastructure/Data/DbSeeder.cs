using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Only seed if database is empty
        if (await context.Departments.AnyAsync())
            return;

        // ==================== SEED DEPARTMENTS ====================
        var departments = new List<Department>
        {
            new Department { Name = "Engineering", Description = "Software Development Team", IsActive = true },
            new Department { Name = "Human Resources", Description = "HR and Recruitment", IsActive = true },
            new Department { Name = "Marketing", Description = "Marketing and Sales", IsActive = true },
            new Department { Name = "Finance", Description = "Accounting and Finance", IsActive = true },
            new Department { Name = "Operations", Description = "Business Operations", IsActive = true }
        };

        await context.Departments.AddRangeAsync(departments);
        await context.SaveChangesAsync();

        // ==================== SEED EMPLOYEES ====================
        var engineering = departments[0];
        var hr = departments[1];
        var marketing = departments[2];

        var employees = new List<Employee>
        {
            new Employee
            {
                FirstName = "Ahmed",
                LastName = "Khan",
                Email = "ahmed.khan@company.com",
                Phone = "+92-300-1234567",
                DateOfBirth = new DateTime(1990, 5, 15),
                HireDate = new DateTime(2020, 1, 10),
                Salary = 150000,
                Status = EmployeeStatus.Active,
                DepartmentId = engineering.Id
            },
            new Employee
            {
                FirstName = "Fatima",
                LastName = "Ali",
                Email = "fatima.ali@company.com",
                Phone = "+92-321-9876543",
                DateOfBirth = new DateTime(1988, 8, 22),
                HireDate = new DateTime(2019, 6, 1),
                Salary = 180000,
                Status = EmployeeStatus.Active,
                DepartmentId = engineering.Id
            },
            new Employee
            {
                FirstName = "Usman",
                LastName = "Malik",
                Email = "usman.malik@company.com",
                Phone = "+92-333-5555555",
                DateOfBirth = new DateTime(1992, 3, 10),
                HireDate = new DateTime(2021, 3, 15),
                Salary = 120000,
                Status = EmployeeStatus.Active,
                DepartmentId = hr.Id
            },
            new Employee
            {
                FirstName = "Sara",
                LastName = "Ahmed",
                Email = "sara.ahmed@company.com",
                Phone = "+92-345-1111111",
                DateOfBirth = new DateTime(1995, 11, 5),
                HireDate = new DateTime(2022, 7, 1),
                Salary = 100000,
                Status = EmployeeStatus.Active,
                DepartmentId = marketing.Id
            }
        };

        await context.Employees.AddRangeAsync(employees);
        await context.SaveChangesAsync();

        // ==================== SEED ADMIN USER ====================
        var adminUser = new User
        {
            Username = "admin",
            Email = "admin@company.com",
            // Password: Admin@123 (hashed with BCrypt)
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = Role.Admin,
            IsActive = true
        };

        await context.Users.AddAsync(adminUser);
        await context.SaveChangesAsync();
    }
}
