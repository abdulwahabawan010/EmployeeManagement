using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.Entities;

public class Employee : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }

    public string? Address { get; set; }

    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public string? ProfilePictureUrl { get; set; }

    // Foreign Key - Employee belongs to Department
    public int DepartmentId { get; set; }

    // Navigation property
    public Department Department { get; set; } = null!;

    // Computed property (not stored in DB)
    public string FullName => $"{FirstName} {LastName}";
}
