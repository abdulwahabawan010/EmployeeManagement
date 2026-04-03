namespace EmployeeManagement.Core.DTOs.Department;

/// <summary>
/// DTO for creating a new department
/// Validation is handled by FluentValidation (CreateDepartmentDtoValidator)
/// </summary>
public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
