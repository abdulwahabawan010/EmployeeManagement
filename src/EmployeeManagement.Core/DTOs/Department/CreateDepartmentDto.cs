using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.DTOs.Department;

public class CreateDepartmentDto
{
    [Required(ErrorMessage = "Department name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Department name must be 2-100 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}
