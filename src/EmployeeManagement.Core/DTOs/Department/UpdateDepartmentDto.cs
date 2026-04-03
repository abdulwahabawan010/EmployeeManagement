namespace EmployeeManagement.Core.DTOs.Department;

/// <summary>
/// DTO for updating an existing department
/// All fields are OPTIONAL - only update what's provided
/// Validation is handled by FluentValidation (UpdateDepartmentDtoValidator)
/// </summary>
public class UpdateDepartmentDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
