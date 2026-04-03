using FluentValidation;
using EmployeeManagement.Core.DTOs.Department;

namespace EmployeeManagement.Core.Validators;

/// <summary>
/// FluentValidation validator for CreateDepartmentDto
/// </summary>
public class CreateDepartmentDtoValidator : AbstractValidator<CreateDepartmentDto>
{
    public CreateDepartmentDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required")
            .Length(2, 100).WithMessage("Department name must be between 2 and 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-&]+$").WithMessage("Department name can only contain letters, numbers, spaces, hyphens, and ampersands");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
