using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.DTOs.Employee;

/// <summary>
/// DTO for updating an existing employee
/// All fields are OPTIONAL (nullable) - only update what's provided
/// Validation is handled by FluentValidation (UpdateEmployeeDtoValidator)
/// </summary>
public class UpdateEmployeeDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? HireDate { get; set; }
    public decimal? Salary { get; set; }
    public int? DepartmentId { get; set; }
    public EmployeeStatus? Status { get; set; }
}
