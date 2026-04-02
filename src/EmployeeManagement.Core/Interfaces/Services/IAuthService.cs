using EmployeeManagement.Core.DTOs.Auth;

namespace EmployeeManagement.Core.Interfaces.Services;

/// <summary>
/// Interface for authentication operations
/// Defined in Core layer - implemented in Infrastructure layer
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Register a new user
    /// </summary>
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);

    /// <summary>
    /// Login with email and password
    /// </summary>
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);

    /// <summary>
    /// Validate if a token is still valid
    /// </summary>
    Task<bool> ValidateTokenAsync(string token);

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Revoke a refresh token (logout)
    /// </summary>
    Task RevokeRefreshTokenAsync(string refreshToken);
}
