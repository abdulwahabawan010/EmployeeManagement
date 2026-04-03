using Microsoft.AspNetCore.Mvc;
using EmployeeManagement.Core.DTOs.Auth;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.API.Controllers;

/// <summary>
/// Authentication Controller - Login, Register, Token Management
///
/// Note: No try-catch needed - GlobalExceptionMiddleware handles all errors
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new user
    /// POST: api/auth/register
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        var result = await _authService.RegisterAsync(registerDto);
        return Ok(result);
    }

    /// <summary>
    /// Login with email and password
    /// POST: api/auth/login
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);
        return Ok(result);
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// POST: api/auth/refresh
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        var result = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);
        return Ok(result);
    }

    /// <summary>
    /// Revoke refresh token (logout)
    /// POST: api/auth/revoke
    /// </summary>
    [HttpPost("revoke")]
    public async Task<ActionResult> RevokeToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        await _authService.RevokeRefreshTokenAsync(refreshTokenDto.RefreshToken);
        return Ok(new { message = "Token revoked successfully" });
    }
}
