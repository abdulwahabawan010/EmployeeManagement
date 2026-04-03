using FluentValidation;
using EmployeeManagement.Core.DTOs.Employee;

namespace EmployeeManagement.Core.Validators;

/// <summary>
/// FluentValidation validator for CreateEmployeeDto
/// Provides comprehensive validation rules for employee creation
/// </summary>
public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .Length(2, 50).WithMessage("First name must be between 2 and 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$").WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .Length(2, 50).WithMessage("Last name must be between 2 and 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$").WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^\+?[\d\s\-\(\)]{10,20}$")
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Invalid phone number format");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required")
            .LessThan(DateTime.Today.AddYears(-18)).WithMessage("Employee must be at least 18 years old")
            .GreaterThan(DateTime.Today.AddYears(-100)).WithMessage("Invalid date of birth");

        RuleFor(x => x.HireDate)
            .NotEmpty().WithMessage("Hire date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(30)).WithMessage("Hire date cannot be more than 30 days in the future")
            .GreaterThan(DateTime.Today.AddYears(-50)).WithMessage("Invalid hire date");

        RuleFor(x => x.Salary)
            .GreaterThanOrEqualTo(0).WithMessage("Salary must be a positive value")
            .LessThanOrEqualTo(10000000).WithMessage("Salary cannot exceed 10,000,000");

        RuleFor(x => x.DepartmentId)
            .GreaterThan(0).WithMessage("Valid department is required");
    }
}
