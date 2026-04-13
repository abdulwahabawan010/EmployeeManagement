namespace EmployeeManagement.Core.Interfaces.Services;

/// <summary>
/// Service to access current authenticated user information
///
/// WHY THIS MATTERS:
/// - Interceptors need to know WHO is making changes
/// - Used for audit fields (CreatedBy, UpdatedBy, DeletedBy)
/// - Abstracts HttpContext access from business logic
///
/// Interview Q: "How do you get current user info in a service?"
/// Answer: "Inject ICurrentUserService, which wraps HttpContext.User.
///         This keeps services testable and decoupled from HTTP."
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Current user's ID (from JWT claims)
    /// Returns null if not authenticated
    /// </summary>
    string? UserId { get; }

    /// <summary>
    /// Current user's username/email
    /// </summary>
    string? UserName { get; }

    /// <summary>
    /// Is the current request authenticated?
    /// </summary>
    bool IsAuthenticated { get; }
}
