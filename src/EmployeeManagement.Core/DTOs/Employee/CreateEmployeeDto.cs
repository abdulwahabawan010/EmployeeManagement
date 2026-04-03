namespace EmployeeManagement.Core.DTOs.Employee;

/// <summary>
/// DTO for creating a new employee
/// Validation is handled by FluentValidation (CreateEmployeeDtoValidator)
/// </summary>
public class CreateEmployeeDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }
    public int DepartmentId { get; set; }
}
