using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.DTOs.Department;

public class UpdateDepartmentDto
{
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Department name must be 2-100 characters")]
    public string? Name { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }

    public bool? IsActive { get; set; }
}
