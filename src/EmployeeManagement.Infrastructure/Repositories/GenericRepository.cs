using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.Core.Interfaces.Repositories;
using EmployeeManagement.Infrastructure.Data;

namespace EmployeeManagement.Infrastructure.Repositories;

/// <summary>
/// Generic Repository - handles database operations for any entity
///
/// KEY FEATURES:
/// 1. AsNoTracking support for performance optimization
/// 2. IgnoreQueryFilters for accessing soft-deleted records
/// 3. Consistent query building pattern
///
/// NOTE: Does NOT call SaveChanges - UnitOfWork handles that!
/// </summary>
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    // ==================== PRIVATE HELPER ====================

    /// <summary>
    /// Creates base query with optional tracking
    ///
    /// Interview Q: "What's the difference between tracked and untracked queries?"
    /// Answer: "Tracked entities are monitored for changes by EF's ChangeTracker.
    ///         When you call SaveChanges, it compares current vs original values.
    ///         Untracked (AsNoTracking) skip this - faster but can't auto-update."
    /// </summary>
    private IQueryable<T> GetQuery(bool trackChanges)
    {
        return trackChanges ? _dbSet : _dbSet.AsNoTracking();
    }

    // ==================== READ OPERATIONS ====================

    public async Task<T?> GetByIdAsync(int id, bool trackChanges = true)
    {
        if (trackChanges)
        {
            // FindAsync uses primary key and tracking by default
            return await _dbSet.FindAsync(id);
        }

        // For no-tracking, we need to query explicitly
        return await _dbSet.AsNoTracking()
            .FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<IEnumerable<T>> GetAllAsync(bool trackChanges = true)
    {
        return await GetQuery(trackChanges).ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        bool trackChanges = true)
    {
        return await GetQuery(trackChanges)
            .Where(predicate)
            .ToListAsync();
    }

    // ==================== READ WITH INCLUDE ====================

    public async Task<T?> GetByIdWithIncludeAsync(
        int id,
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = GetQuery(trackChanges);

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<IEnumerable<T>> GetAllWithIncludeAsync(
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = GetQuery(trackChanges);

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindWithIncludeAsync(
        Expression<Func<T, bool>> predicate,
        bool trackChanges = true,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = GetQuery(trackChanges);

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.Where(predicate).ToListAsync();
    }

    // ==================== READ INCLUDING DELETED ====================
    // Bypasses Global Query Filter - use for admin features

    /// <summary>
    /// Get by ID including soft-deleted records
    ///
    /// USE CASE: Admin needs to view or restore deleted employee
    ///
    /// Interview Q: "How do you query soft-deleted records?"
    /// Answer: "Use IgnoreQueryFilters() to bypass Global Query Filter.
    ///         This returns ALL records including IsDeleted = true."
    /// </summary>
    public async Task<T?> GetByIdIncludingDeletedAsync(int id)
    {
        return await _dbSet
            .IgnoreQueryFilters()  // Bypass soft delete filter
            .AsNoTracking()         // Usually just for viewing
            .FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<IEnumerable<T>> GetAllIncludingDeletedAsync()
    {
        return await _dbSet
            .IgnoreQueryFilters()
            .AsNoTracking()
            .ToListAsync();
    }

    // ==================== CREATE (No SaveChanges!) ====================

    public void Add(T entity)
    {
        _dbSet.Add(entity);
        // NOTE: SaveChanges is called by UnitOfWork
        // Interceptor will set CreatedAt, CreatedBy automatically
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
    }

    // ==================== UPDATE (No SaveChanges!) ====================

    public void Update(T entity)
    {
        _dbSet.Update(entity);
        // NOTE: Interceptor will set UpdatedAt, UpdatedBy automatically
    }

    // ==================== DELETE (No SaveChanges!) ====================

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
        // NOTE: Interceptor converts this to SOFT DELETE automatically
        // Sets IsDeleted=true, DeletedAt, DeletedBy
    }

    // ==================== EXISTENCE CHECKS ====================

    public async Task<bool> ExistsAsync(int id)
    {
        // Global Query Filter automatically excludes deleted records
        return await _dbSet.AnyAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }
}
