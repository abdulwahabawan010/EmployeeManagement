using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.Settings;

/// <summary>
/// Strongly-typed JWT configuration settings
///
/// WHY OPTIONS PATTERN (Interview Topic):
/// ─────────────────────────────────────────────────────────────
/// Problem: Accessing configuration with magic strings
///          var secret = Configuration["Jwt:SecretKey"]; // Error-prone!
///
/// Solution: Strongly-typed settings classes
///          var secret = _jwtSettings.SecretKey; // Compile-time checking!
///
/// Benefits:
/// 1. Compile-time safety (typos caught at build)
/// 2. IntelliSense support
/// 3. Validation at startup
/// 4. Easy to test (just create object)
/// 5. Separation of concerns
///
/// Interview Q: "What's the difference between IOptions, IOptionsSnapshot, IOptionsMonitor?"
/// Answer:
/// - IOptions<T>: Singleton, reads config once at startup
/// - IOptionsSnapshot<T>: Scoped, re-reads config per request (hot reload)
/// - IOptionsMonitor<T>: Singleton with change callbacks (real-time updates)
/// ─────────────────────────────────────────────────────────────
/// </summary>
public class JwtSettings
{
    /// <summary>
    /// Configuration section name in appsettings.json
    /// </summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// Secret key for signing JWT tokens
    /// Must be at least 32 characters for HS256
    /// </summary>
    [Required]
    [MinLength(32, ErrorMessage = "JWT Secret must be at least 32 characters")]
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Token issuer (usually your application name/URL)
    /// </summary>
    [Required]
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Token audience (who the token is intended for)
    /// </summary>
    [Required]
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Access token expiry in minutes
    /// Short-lived for security (15-60 minutes typical)
    /// </summary>
    [Range(1, 1440, ErrorMessage = "AccessTokenExpiryMinutes must be between 1 and 1440")]
    public int AccessTokenExpiryMinutes { get; set; } = 15;

    /// <summary>
    /// Refresh token expiry in days
    /// Longer-lived (7-30 days typical)
    /// </summary>
    [Range(1, 365, ErrorMessage = "RefreshTokenExpiryDays must be between 1 and 365")]
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
