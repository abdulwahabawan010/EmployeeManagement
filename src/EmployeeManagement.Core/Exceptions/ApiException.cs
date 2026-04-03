using System.Net;

namespace EmployeeManagement.Core.Exceptions;

/// <summary>
/// Base exception class for all API exceptions
/// Provides HTTP status code and error details
/// </summary>
public class ApiException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string ErrorCode { get; }
    public object? Details { get; }

    public ApiException(
        string message,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError,
        string errorCode = "INTERNAL_ERROR",
        object? details = null) : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Details = details;
    }
}

/// <summary>
/// Exception for resource not found (404)
/// </summary>
public class NotFoundException : ApiException
{
    public NotFoundException(string message)
        : base(message, HttpStatusCode.NotFound, "NOT_FOUND")
    {
    }

    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} with identifier '{key}' was not found",
               HttpStatusCode.NotFound, "NOT_FOUND")
    {
    }
}

/// <summary>
/// Exception for bad request (400)
/// </summary>
public class BadRequestException : ApiException
{
    public BadRequestException(string message)
        : base(message, HttpStatusCode.BadRequest, "BAD_REQUEST")
    {
    }

    public BadRequestException(string message, object? details)
        : base(message, HttpStatusCode.BadRequest, "BAD_REQUEST", details)
    {
    }
}

/// <summary>
/// Exception for validation errors (422)
/// </summary>
public class ValidationException : ApiException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred",
               HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", errors)
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : this(new Dictionary<string, string[]> { { field, new[] { message } } })
    {
    }
}

/// <summary>
/// Exception for conflict errors (409) - e.g., duplicate entry
/// </summary>
public class ConflictException : ApiException
{
    public ConflictException(string message)
        : base(message, HttpStatusCode.Conflict, "CONFLICT")
    {
    }

    public ConflictException(string resourceName, string conflictField, object value)
        : base($"{resourceName} with {conflictField} '{value}' already exists",
               HttpStatusCode.Conflict, "CONFLICT")
    {
    }
}

/// <summary>
/// Exception for unauthorized access (401)
/// </summary>
public class UnauthorizedException : ApiException
{
    public UnauthorizedException(string message = "You are not authenticated")
        : base(message, HttpStatusCode.Unauthorized, "UNAUTHORIZED")
    {
    }
}

/// <summary>
/// Exception for forbidden access (403)
/// </summary>
public class ForbiddenException : ApiException
{
    public ForbiddenException(string message = "You do not have permission to perform this action")
        : base(message, HttpStatusCode.Forbidden, "FORBIDDEN")
    {
    }
}
