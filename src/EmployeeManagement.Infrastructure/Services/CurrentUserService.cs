using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Implementation of ICurrentUserService
/// Extracts user information from HttpContext (JWT claims)
///
/// WHY THIS PATTERN:
/// 1. Services don't depend on HttpContext directly (testable)
/// 2. Single place to extract user info
/// 3. Works with any authentication scheme (JWT, cookies, etc.)
///
/// Interview Q: "Why inject IHttpContextAccessor instead of HttpContext?"
/// Answer: "HttpContext is request-scoped. IHttpContextAccessor is a
///         singleton that provides access to the current request's context.
///         It's the correct way to access HttpContext in services."
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Gets user ID from JWT 'sub' or 'nameidentifier' claim
    /// </summary>
    public string? UserId =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

    /// <summary>
    /// Gets username from JWT 'name' or 'email' claim
    /// </summary>
    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    /// <summary>
    /// Checks if user is authenticated
    /// </summary>
    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
