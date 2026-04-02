using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Role Role { get; set; } = Role.Employee;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    // Optional: Link user to employee profile
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    // User can have multiple refresh tokens (different devices)
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
