using System.ComponentModel.DataAnnotations;
using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.DTOs.Employee;

/// <summary>
/// DTO for updating an existing employee
/// All fields are OPTIONAL (nullable) - only update what's provided
/// </summary>
public class UpdateEmployeeDto
{
    [StringLength(50, MinimumLength = 2, ErrorMessage = "First name must be 2-50 characters")]
    public string? FirstName { get; set; }

    [StringLength(50, MinimumLength = 2, ErrorMessage = "Last name must be 2-50 characters")]
    public string? LastName { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string? Email { get; set; }

    [Phone(ErrorMessage = "Invalid phone number")]
    public string? Phone { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public DateTime? HireDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Salary must be positive")]
    public decimal? Salary { get; set; }

    public int? DepartmentId { get; set; }

    public EmployeeStatus? Status { get; set; }
}
