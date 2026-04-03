namespace EmployeeManagement.Core.Exceptions;

/// <summary>
/// Standardized error response format for all API errors
/// Provides consistent structure for frontend error handling
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// HTTP status code
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// Machine-readable error code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
    /// </summary>
    public string ErrorCode { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detailed information about the error (optional)
    /// For validation errors, contains field-specific errors
    /// </summary>
    public object? Details { get; set; }

    /// <summary>
    /// Request path that caused the error
    /// </summary>
    public string? Path { get; set; }

    /// <summary>
    /// Timestamp when the error occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Unique trace ID for debugging (correlates with logs)
    /// </summary>
    public string? TraceId { get; set; }
}

/// <summary>
/// Validation error details structure
/// </summary>
public class ValidationErrorDetails
{
    /// <summary>
    /// Field-specific validation errors
    /// Key: field name, Value: array of error messages
    /// </summary>
    public IDictionary<string, string[]> Errors { get; set; } = new Dictionary<string, string[]>();
}
