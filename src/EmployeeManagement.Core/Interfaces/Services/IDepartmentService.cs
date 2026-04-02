using EmployeeManagement.Core.DTOs.Department;

namespace EmployeeManagement.Core.Interfaces.Services;

public interface IDepartmentService
{
    Task<IEnumerable<DepartmentResponseDto>> GetAllAsync();
    Task<DepartmentResponseDto?> GetByIdAsync(int id);
    Task<DepartmentResponseDto> CreateAsync(CreateDepartmentDto dto);
    Task<DepartmentResponseDto?> UpdateAsync(int id, UpdateDepartmentDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
