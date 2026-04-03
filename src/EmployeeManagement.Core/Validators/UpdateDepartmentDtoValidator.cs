using FluentValidation;
using EmployeeManagement.Core.DTOs.Department;

namespace EmployeeManagement.Core.Validators;

/// <summary>
/// FluentValidation validator for UpdateDepartmentDto
/// All fields are optional - only validates when provided
/// </summary>
public class UpdateDepartmentDtoValidator : AbstractValidator<UpdateDepartmentDto>
{
    public UpdateDepartmentDtoValidator()
    {
        RuleFor(x => x.Name)
            .Length(2, 100).WithMessage("Department name must be between 2 and 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-&]+$").WithMessage("Department name can only contain letters, numbers, spaces, hyphens, and ampersands")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
