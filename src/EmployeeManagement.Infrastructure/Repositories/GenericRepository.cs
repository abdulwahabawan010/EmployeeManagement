using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.Core.Interfaces.Repositories;
using EmployeeManagement.Infrastructure.Data;

namespace EmployeeManagement.Infrastructure.Repositories;

/// <summary>
/// Generic Repository - handles database operations for any entity
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

    // ==================== READ OPERATIONS ====================

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    // ==================== READ WITH INCLUDE ====================

    public async Task<T?> GetByIdWithIncludeAsync(int id, params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        // Assuming entity has Id property (we'll use reflection or find by key)
        return await query.FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<IEnumerable<T>> GetAllWithIncludeAsync(params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindWithIncludeAsync(
        Expression<Func<T, bool>> predicate,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.Where(predicate).ToListAsync();
    }

    // ==================== CREATE (No SaveChanges!) ====================

    public void Add(T entity)
    {
        _dbSet.Add(entity);
        // NO SaveChangesAsync here! UnitOfWork will call it.
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
        // NO SaveChangesAsync here! UnitOfWork will call it.
    }

    // ==================== UPDATE (No SaveChanges!) ====================

    public void Update(T entity)
    {
        _dbSet.Update(entity);
        // NO SaveChangesAsync here! UnitOfWork will call it.
    }

    // ==================== DELETE (No SaveChanges!) ====================

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
        // NO SaveChangesAsync here! UnitOfWork will call it.
    }

    // ==================== EXISTENCE CHECKS ====================

    public async Task<bool> ExistsAsync(int id)
    {
        return await _dbSet.AnyAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }
}
