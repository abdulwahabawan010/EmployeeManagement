using FluentValidation;
using EmployeeManagement.Core.DTOs.Auth;

namespace EmployeeManagement.Core.Validators;

/// <summary>
/// FluentValidation validator for LoginDto
/// </summary>
public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
