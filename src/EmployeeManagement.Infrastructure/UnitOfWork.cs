using Microsoft.EntityFrameworkCore.Storage;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Repositories;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Repositories;

namespace EmployeeManagement.Infrastructure;

/// <summary>
/// Unit of Work - manages all repositories and database transactions
///
/// Key Benefits:
/// 1. Single SaveChanges for multiple operations
/// 2. All repositories share the same DbContext
/// 3. Transaction support for complex operations
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    // Lazy-loaded repositories (created only when needed)
    private IGenericRepository<Department>? _departments;
    private IGenericRepository<Employee>? _employees;
    private IGenericRepository<User>? _users;
    private IGenericRepository<RefreshToken>? _refreshTokens;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    // ==================== REPOSITORIES ====================
    // Using lazy initialization - repository created only when first accessed

    public IGenericRepository<Department> Departments =>
        _departments ??= new GenericRepository<Department>(_context);

    public IGenericRepository<Employee> Employees =>
        _employees ??= new GenericRepository<Employee>(_context);

    public IGenericRepository<User> Users =>
        _users ??= new GenericRepository<User>(_context);

    public IGenericRepository<RefreshToken> RefreshTokens =>
        _refreshTokens ??= new GenericRepository<RefreshToken>(_context);

    // ==================== SAVE CHANGES ====================

    /// <summary>
    /// Saves all changes made through all repositories in a single transaction
    /// </summary>
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    // ==================== TRANSACTION MANAGEMENT ====================

    /// <summary>
    /// Begin explicit transaction for complex operations
    /// Use when you need to ensure multiple operations succeed or fail together
    /// </summary>
    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    /// <summary>
    /// Commit the current transaction
    /// </summary>
    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <summary>
    /// Rollback the current transaction
    /// </summary>
    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    // ==================== DISPOSE ====================

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
