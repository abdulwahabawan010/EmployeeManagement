using FluentValidation;
using EmployeeManagement.Core.DTOs.Employee;
using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.Validators;

/// <summary>
/// FluentValidation validator for UpdateEmployeeDto
/// All fields are optional - only validates when provided
/// </summary>
public class UpdateEmployeeDtoValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .Length(2, 50).WithMessage("First name must be between 2 and 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$").WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes")
            .When(x => !string.IsNullOrEmpty(x.FirstName));

        RuleFor(x => x.LastName)
            .Length(2, 50).WithMessage("Last name must be between 2 and 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$").WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes")
            .When(x => !string.IsNullOrEmpty(x.LastName));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^\+?[\d\s\-\(\)]{10,20}$")
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Invalid phone number format");

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.Today.AddYears(-18)).WithMessage("Employee must be at least 18 years old")
            .GreaterThan(DateTime.Today.AddYears(-100)).WithMessage("Invalid date of birth")
            .When(x => x.DateOfBirth.HasValue);

        RuleFor(x => x.HireDate)
            .LessThanOrEqualTo(DateTime.Today.AddDays(30)).WithMessage("Hire date cannot be more than 30 days in the future")
            .GreaterThan(DateTime.Today.AddYears(-50)).WithMessage("Invalid hire date")
            .When(x => x.HireDate.HasValue);

        RuleFor(x => x.Salary)
            .GreaterThanOrEqualTo(0).WithMessage("Salary must be a positive value")
            .LessThanOrEqualTo(10000000).WithMessage("Salary cannot exceed 10,000,000")
            .When(x => x.Salary.HasValue);

        RuleFor(x => x.DepartmentId)
            .GreaterThan(0).WithMessage("Valid department is required")
            .When(x => x.DepartmentId.HasValue);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid employee status")
            .When(x => x.Status.HasValue);
    }
}
