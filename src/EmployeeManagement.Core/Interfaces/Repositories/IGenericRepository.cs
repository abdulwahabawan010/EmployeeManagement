using System.Linq.Expressions;

namespace EmployeeManagement.Core.Interfaces.Repositories;

/// <summary>
/// Generic repository interface - defines CRUD operations for any entity
/// NOTE: These methods do NOT call SaveChanges - that's UnitOfWork's job!
/// </summary>
public interface IGenericRepository<T> where T : class
{
    // READ operations
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    // READ with Include (for related data)
    Task<T?> GetByIdWithIncludeAsync(int id, params Expression<Func<T, object>>[] includes);
    Task<IEnumerable<T>> GetAllWithIncludeAsync(params Expression<Func<T, object>>[] includes);
    Task<IEnumerable<T>> FindWithIncludeAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);

    // CREATE - adds to context (doesn't save)
    void Add(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);

    // UPDATE - marks as modified (doesn't save)
    void Update(T entity);

    // DELETE - marks for deletion (doesn't save)
    void Delete(T entity);

    // Check existence
    Task<bool> ExistsAsync(int id);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
}
