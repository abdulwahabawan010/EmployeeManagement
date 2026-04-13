using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.Core.Entities;

namespace EmployeeManagement.Infrastructure.Data;

/// <summary>
/// Application Database Context with Enterprise Features
///
/// KEY FEATURES (Interview Topics):
/// 1. Global Query Filters - Automatic soft delete filtering
/// 2. RowVersion - Optimistic concurrency control
/// 3. Audit fields - Handled by Interceptor (not here anymore)
///
/// Interview Q: "How do you implement soft delete across all entities?"
/// Answer: "Global Query Filter. Define once in OnModelCreating,
///         automatically applies to every query. Use IgnoreQueryFilters()
///         when you need to include deleted records."
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSets - Each represents a table in the database
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== GLOBAL QUERY FILTERS ====================
        // Automatically exclude soft-deleted records from ALL queries
        // This is applied to every entity that inherits BaseEntity
        //
        // Interview Q: "What's the benefit of Global Query Filters?"
        // Answer: "Write filter once, applied everywhere automatically.
        //         No risk of forgetting !IsDeleted in queries."
        ApplyGlobalQueryFilters(modelBuilder);

        // ==================== ROW VERSION (Concurrency) ====================
        // Configure RowVersion for all BaseEntity types
        ApplyRowVersionConfiguration(modelBuilder);

        // ==================== DEPARTMENT CONFIG ====================
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(d => d.Description)
                .HasMaxLength(500);

            entity.HasIndex(d => d.Name).IsUnique();
        });

        // ==================== EMPLOYEE CONFIG ====================
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Phone)
                .HasMaxLength(20);

            entity.Property(e => e.Salary)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.DepartmentId);
        });

        // ==================== USER CONFIG ====================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Username)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasOne(u => u.Employee)
                .WithMany()
                .HasForeignKey(u => u.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // ==================== REFRESH TOKEN CONFIG ====================
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Token)
                .IsRequired()
                .HasMaxLength(500);

            // Relationship: RefreshToken belongs to User
            entity.HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => r.Token).IsUnique();
        });
    }

    // ==================== HELPER METHODS ====================

    /// <summary>
    /// Apply Global Query Filter for soft delete to all BaseEntity types
    ///
    /// HOW IT WORKS:
    /// - Uses reflection to find all entities inheriting BaseEntity
    /// - Creates filter expression: e => !e.IsDeleted
    /// - Applies to each entity type
    ///
    /// RESULT:
    /// - _context.Employees.ToList() → Only non-deleted
    /// - _context.Employees.IgnoreQueryFilters().ToList() → All including deleted
    /// </summary>
    private void ApplyGlobalQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Only apply to entities that inherit from BaseEntity
            if (!typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            // Skip if it's BaseEntity itself (abstract)
            if (entityType.ClrType == typeof(BaseEntity))
                continue;

            // Build expression: entity => !entity.IsDeleted
            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var isDeletedProperty = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
            var falseConstant = Expression.Constant(false);
            var filterExpression = Expression.Equal(isDeletedProperty, falseConstant);
            var lambda = Expression.Lambda(filterExpression, parameter);

            // Apply the filter
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
        }
    }

    /// <summary>
    /// Configure RowVersion for optimistic concurrency on all BaseEntity types
    ///
    /// HOW IT WORKS:
    /// - EF Core tracks RowVersion value
    /// - On UPDATE, includes RowVersion in WHERE clause
    /// - If no rows updated = someone else changed the record = DbUpdateConcurrencyException
    ///
    /// Interview Q: "What is optimistic vs pessimistic concurrency?"
    /// Answer:
    /// - Optimistic: Assume no conflicts, check at save time (RowVersion)
    /// - Pessimistic: Lock record while editing (SELECT FOR UPDATE)
    /// - Optimistic is preferred for web apps (stateless, high concurrency)
    /// </summary>
    private void ApplyRowVersionConfiguration(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            if (entityType.ClrType == typeof(BaseEntity))
                continue;

            // Configure RowVersion as concurrency token
            modelBuilder.Entity(entityType.ClrType)
                .Property(nameof(BaseEntity.RowVersion))
                .IsRowVersion()
                .IsConcurrencyToken();
        }
    }

    // NOTE: SaveChangesAsync override REMOVED
    // Audit field population is now handled by AuditableEntityInterceptor
    // This is cleaner because:
    // 1. Single Responsibility - DbContext just manages DB connection
    // 2. Interceptor can be tested independently
    // 3. Can add multiple interceptors for different concerns
}
