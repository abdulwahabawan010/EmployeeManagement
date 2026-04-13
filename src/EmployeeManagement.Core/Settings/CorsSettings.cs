namespace EmployeeManagement.Core.Settings;

/// <summary>
/// CORS (Cross-Origin Resource Sharing) settings
/// Defines which origins can access the API
/// </summary>
public class CorsSettings
{
    public const string SectionName = "Cors";

    /// <summary>
    /// Allowed origins (frontend URLs)
    /// Example: ["http://localhost:4200", "https://myapp.com"]
    /// </summary>
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Whether to allow credentials (cookies, auth headers)
    /// </summary>
    public bool AllowCredentials { get; set; } = true;
}
