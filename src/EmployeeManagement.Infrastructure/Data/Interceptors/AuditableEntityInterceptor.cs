using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Data.Interceptors;

/// <summary>
/// EF Core Interceptor for automatic audit field population
///
/// WHY INTERCEPTORS (Interview Topic):
/// ───────────────────────────────────────────────────────────────
/// Problem: How to automatically set CreatedBy, UpdatedBy, DeletedBy
///          for EVERY entity without repeating code?
///
/// Solution: SaveChanges Interceptor
/// - Intercepts SaveChanges() BEFORE it hits the database
/// - Automatically populates audit fields based on entity state
/// - Single place for all audit logic = DRY principle
///
/// Interview Q: "How do you implement automatic auditing in EF Core?"
/// Answer: "I use a SaveChangesInterceptor that hooks into SavingChangesAsync.
///         It iterates ChangeTracker entries, checks entity state (Added/Modified/Deleted),
///         and sets audit fields. For soft delete, I convert Delete to Modified."
/// ───────────────────────────────────────────────────────────────
/// </summary>
public class AuditableEntityInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;

    public AuditableEntityInterceptor(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Called BEFORE SaveChanges executes
    /// This is where we intercept and modify entities
    /// </summary>
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context == null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var now = DateTime.UtcNow;
        var userId = _currentUserService.UserId ?? "System";

        // Iterate all tracked entities that inherit from BaseEntity
        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                // ==================== NEW RECORD ====================
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    entry.Entity.IsDeleted = false;
                    break;

                // ==================== UPDATED RECORD ====================
                case EntityState.Modified:
                    // Don't overwrite CreatedAt/CreatedBy on update
                    entry.Property(nameof(BaseEntity.CreatedAt)).IsModified = false;
                    entry.Property(nameof(BaseEntity.CreatedBy)).IsModified = false;

                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;

                // ==================== SOFT DELETE ====================
                // Convert hard delete to soft delete automatically
                case EntityState.Deleted:
                    // Change state from Deleted to Modified
                    entry.State = EntityState.Modified;

                    // Set soft delete fields
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedBy = userId;

                    // Also set UpdatedAt/UpdatedBy for consistency
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>
    /// Sync version for non-async SaveChanges calls
    /// </summary>
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        // Reuse async logic by calling it synchronously
        return SavingChangesAsync(eventData, result).GetAwaiter().GetResult();
    }
}
