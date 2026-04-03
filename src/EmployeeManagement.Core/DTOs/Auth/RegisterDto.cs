namespace EmployeeManagement.Core.DTOs.Auth;

/// <summary>
/// DTO for user registration
/// Validation is handled by FluentValidation (RegisterDtoValidator)
/// </summary>
public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
