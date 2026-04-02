using EmployeeManagement.Core.DTOs.Employee;

namespace EmployeeManagement.Core.Interfaces.Services;

public interface IEmployeeService
{
    Task<IEnumerable<EmployeeResponseDto>> GetAllAsync();
    Task<EmployeeResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<EmployeeResponseDto>> GetByDepartmentAsync(int departmentId);
    Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto);
    Task<EmployeeResponseDto?> UpdateAsync(int id, UpdateEmployeeDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> EmailExistsAsync(string email, int? excludeId = null);
}
