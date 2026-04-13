using System.Linq.Expressions;

namespace EmployeeManagement.Core.Interfaces.Repositories;

/// <summary>
/// Generic repository interface - defines CRUD operations for any entity
///
/// NEW: AsNoTracking Support (trackChanges parameter)
///
/// WHY AsNoTracking MATTERS (Interview Topic):
/// ─────────────────────────────────────────────────────────────
/// Problem: EF Core tracks every entity by default (change detection)
/// Cost: Memory + CPU overhead for tracking
///
/// Solution: Use AsNoTracking() for READ-ONLY operations
/// Result: 30-50% faster queries, less memory usage
///
/// Interview Q: "When should you use AsNoTracking?"
/// Answer: "For read-only operations where you won't modify the data.
///         Examples: GET endpoints, reports, dashboards.
///         Don't use for operations that will Update/Delete."
/// ─────────────────────────────────────────────────────────────
///
/// NOTE: These methods do NOT call SaveChanges - that's UnitOfWork's job!
/// </summary>
public interface IGenericRepository<T> where T : class
{
    // ==================== READ OPERATIONS ====================
    // trackChanges: true = EF tracks entity (for updates)
    //               false = AsNoTracking (faster reads)

    Task<T?> GetByIdAsync(int id, bool trackChanges = true);
    Task<IEnumerable<T>> GetAllAsync(bool trackChanges = true);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, bool trackChanges = true);

    // ==================== READ WITH INCLUDE ====================
    Task<T?> GetByIdWithIncludeAsync(
        int id,
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes);

    Task<IEnumerable<T>> GetAllWithIncludeAsync(
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes);

    Task<IEnumerable<T>> FindWithIncludeAsync(
        Expression<Func<T, bool>> predicate,
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes);

    // ==================== READ INCLUDING DELETED ====================
    // Use when admin needs to see/restore deleted records
    Task<T?> GetByIdIncludingDeletedAsync(int id);
    Task<IEnumerable<T>> GetAllIncludingDeletedAsync();

    // ==================== CREATE (No SaveChanges!) ====================
    void Add(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);

    // ==================== UPDATE (No SaveChanges!) ====================
    void Update(T entity);

    // ==================== DELETE (No SaveChanges!) ====================
    // Note: With our interceptor, this becomes soft delete automatically
    void Delete(T entity);

    // ==================== EXISTENCE CHECKS ====================
    Task<bool> ExistsAsync(int id);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
}
