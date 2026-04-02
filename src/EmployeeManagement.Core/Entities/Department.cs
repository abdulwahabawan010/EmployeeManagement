namespace EmployeeManagement.Core.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation property - One Department has Many Employees
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
