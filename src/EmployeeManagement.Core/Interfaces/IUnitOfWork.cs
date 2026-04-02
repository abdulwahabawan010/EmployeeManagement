using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Interfaces.Repositories;

namespace EmployeeManagement.Core.Interfaces;

/// <summary>
/// Unit of Work pattern - manages repositories and database transactions
///
/// Benefits:
/// 1. Single SaveChanges for multiple operations (transaction)
/// 2. All repositories share same DbContext instance
/// 3. Easy to test with mocking
/// </summary>
public interface IUnitOfWork : IDisposable
{
    // Repositories for each entity
    IGenericRepository<Department> Departments { get; }
    IGenericRepository<Employee> Employees { get; }
    IGenericRepository<User> Users { get; }
    IGenericRepository<RefreshToken> RefreshTokens { get; }

    // Save all changes in a single transaction
    Task<int> SaveChangesAsync();

    // Begin explicit transaction (for complex operations)
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
