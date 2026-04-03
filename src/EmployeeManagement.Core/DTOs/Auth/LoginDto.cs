namespace EmployeeManagement.Core.DTOs.Auth;

/// <summary>
/// DTO for user login
/// Validation is handled by FluentValidation (LoginDtoValidator)
/// </summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
