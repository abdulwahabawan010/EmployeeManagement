using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.DTOs.Employee;

/// <summary>
/// DTO for API response - what we return to frontend
/// Includes computed/joined data like DepartmentName
/// NEVER expose PasswordHash or sensitive data here
/// </summary>
public class EmployeeResponseDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;  // Computed: FirstName + LastName
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }
    public EmployeeStatus Status { get; set; }
    public string? ProfilePictureUrl { get; set; }

    // Instead of DepartmentId, we return readable info
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
