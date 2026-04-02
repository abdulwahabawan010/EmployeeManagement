using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.DTOs.Employee;

/// <summary>
/// DTO for creating a new employee
/// Only includes fields that user should provide
/// </summary>
public class CreateEmployeeDto
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "First name must be 2-50 characters")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Last name must be 2-50 characters")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Invalid phone number")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime DateOfBirth { get; set; }

    [Required(ErrorMessage = "Hire date is required")]
    public DateTime HireDate { get; set; }

    [Required(ErrorMessage = "Salary is required")]
    [Range(0, double.MaxValue, ErrorMessage = "Salary must be positive")]
    public decimal Salary { get; set; }

    [Required(ErrorMessage = "Department is required")]
    public int DepartmentId { get; set; }
}
