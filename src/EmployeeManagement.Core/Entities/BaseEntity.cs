using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.Entities;

/// <summary>
/// Base entity with full audit support
///
/// WHY THIS MATTERS (Interview Topics):
/// 1. Audit Fields - Track WHO changed WHAT and WHEN (compliance, debugging)
/// 2. Soft Delete - Never lose data, can recover, legal requirements
/// 3. RowVersion - Optimistic concurrency control (prevent lost updates)
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }

    // ==================== AUDIT FIELDS ====================
    // WHO created/modified the record and WHEN

    /// <summary>
    /// When the record was created (set automatically)
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User ID who created the record
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// When the record was last modified
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// User ID who last modified the record
    /// </summary>
    public string? UpdatedBy { get; set; }

    // ==================== SOFT DELETE ====================
    // Never hard delete - mark as deleted instead

    /// <summary>
    /// Is this record soft-deleted?
    /// Global Query Filter automatically excludes deleted records
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// When the record was deleted
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// User ID who deleted the record
    /// </summary>
    public string? DeletedBy { get; set; }

    // ==================== CONCURRENCY ====================
    // Prevent lost updates when two users edit same record

    /// <summary>
    /// Row version for optimistic concurrency control
    /// EF Core automatically checks this on updates
    /// If mismatch = someone else modified the record = throw exception
    /// </summary>
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
}
