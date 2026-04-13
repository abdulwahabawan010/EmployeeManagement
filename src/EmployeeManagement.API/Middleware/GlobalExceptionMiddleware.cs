using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.Core.Exceptions;
using FluentValidation;

namespace EmployeeManagement.API.Middleware;

/// <summary>
/// Global Exception Handling Middleware
/// Catches all unhandled exceptions and converts them to consistent API responses
///
/// Enterprise patterns:
/// - Consistent error response format
/// - Proper HTTP status codes
/// - Logging with correlation IDs
/// - Production-safe error messages
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;

        // Log the exception
        _logger.LogError(exception, "An error occurred. TraceId: {TraceId}", traceId);

        // Build error response based on exception type
        var errorResponse = CreateErrorResponse(context, exception, traceId);

        // Set response
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = errorResponse.StatusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, jsonOptions));
    }

    private ErrorResponse CreateErrorResponse(HttpContext context, Exception exception, string traceId)
    {
        var response = new ErrorResponse
        {
            Path = context.Request.Path,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            // Our custom API exceptions
            case ApiException apiException:
                response.StatusCode = (int)apiException.StatusCode;
                response.ErrorCode = apiException.ErrorCode;
                response.Message = apiException.Message;
                response.Details = apiException.Details;
                break;

            // FluentValidation exceptions (thrown by automatic validation)
            case FluentValidation.ValidationException validationException:
                response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                response.ErrorCode = "VALIDATION_ERROR";
                response.Message = "One or more validation errors occurred";
                response.Details = validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => ToCamelCase(g.Key),
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                break;

            // Handle argument exceptions
            case ArgumentNullException:
            case ArgumentException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.ErrorCode = "BAD_REQUEST";
                response.Message = exception.Message;
                break;

            // Handle unauthorized exceptions
            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.ErrorCode = "UNAUTHORIZED";
                response.Message = "You are not authenticated";
                break;

            // ==================== CONCURRENCY EXCEPTION ====================
            // Thrown when RowVersion doesn't match (someone else modified the record)
            //
            // Interview Q: "How do you handle optimistic concurrency conflicts?"
            // Answer: "Catch DbUpdateConcurrencyException, return 409 Conflict
            //         with details about the conflict. Client can retry with fresh data."
            case DbUpdateConcurrencyException concurrencyException:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                response.ErrorCode = "CONCURRENCY_CONFLICT";
                response.Message = "The record was modified by another user. Please refresh and try again.";
                response.Details = _environment.IsDevelopment()
                    ? new {
                        hint = "This occurs when RowVersion doesn't match. Another user or process modified this record.",
                        affectedEntities = concurrencyException.Entries.Select(e => e.Entity.GetType().Name).ToArray()
                    }
                    : null;
                break;

            // Handle all other exceptions
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.ErrorCode = "INTERNAL_ERROR";

                // In development, show the actual error message
                // In production, show a generic message for security
                response.Message = _environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred. Please try again later.";

                // In development, include stack trace
                if (_environment.IsDevelopment())
                {
                    response.Details = new
                    {
                        exceptionType = exception.GetType().Name,
                        stackTrace = exception.StackTrace
                    };
                }
                break;
        }

        return response;
    }

    /// <summary>
    /// Convert property name to camelCase for consistent JSON output
    /// </summary>
    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str))
            return str;

        return char.ToLowerInvariant(str[0]) + str.Substring(1);
    }
}

/// <summary>
/// Extension method for middleware registration
/// </summary>
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
