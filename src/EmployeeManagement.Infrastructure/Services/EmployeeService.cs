using EmployeeManagement.Core.DTOs.Employee;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Employee Service - Business logic layer
/// Uses IUnitOfWork (not DbContext directly!)
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _unitOfWork;

    public EmployeeService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<EmployeeResponseDto>> GetAllAsync()
    {
        var employees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => !e.IsDeleted,
                e => e.Department
            );

        return employees.Select(MapToDto);
    }

    public async Task<EmployeeResponseDto?> GetByIdAsync(int id)
    {
        var employees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.Id == id && !e.IsDeleted,
                e => e.Department
            );

        var employee = employees.FirstOrDefault();
        return employee == null ? null : MapToDto(employee);
    }

    public async Task<IEnumerable<EmployeeResponseDto>> GetByDepartmentAsync(int departmentId)
    {
        var employees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.DepartmentId == departmentId && !e.IsDeleted,
                e => e.Department
            );

        return employees.Select(MapToDto);
    }

    public async Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto)
    {
        // Business validation: Check if department exists
        var departmentExists = await _unitOfWork.Departments
            .AnyAsync(d => d.Id == dto.DepartmentId && !d.IsDeleted);

        if (!departmentExists)
            throw new Exception($"Department with ID {dto.DepartmentId} not found");

        // Business validation: Check if email already exists
        if (await EmailExistsAsync(dto.Email))
            throw new Exception($"Email {dto.Email} is already in use");

        // Map DTO → Entity
        var employee = new Employee
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            DateOfBirth = dto.DateOfBirth,
            HireDate = dto.HireDate,
            Salary = dto.Salary,
            DepartmentId = dto.DepartmentId
        };

        // Add through repository
        _unitOfWork.Employees.Add(employee);

        // Save through UnitOfWork
        await _unitOfWork.SaveChangesAsync();

        // Load department for response
        var savedEmployees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.Id == employee.Id,
                e => e.Department
            );

        return MapToDto(savedEmployees.First());
    }

    public async Task<EmployeeResponseDto?> UpdateAsync(int id, UpdateEmployeeDto dto)
    {
        var employees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.Id == id && !e.IsDeleted,
                e => e.Department
            );

        var employee = employees.FirstOrDefault();

        if (employee == null)
            return null;

        // Business validation: Check email uniqueness if updating email
        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != employee.Email)
        {
            if (await EmailExistsAsync(dto.Email, id))
                throw new Exception($"Email {dto.Email} is already in use");
        }

        // Business validation: Check department exists if updating
        if (dto.DepartmentId.HasValue)
        {
            var departmentExists = await _unitOfWork.Departments
                .AnyAsync(d => d.Id == dto.DepartmentId && !d.IsDeleted);

            if (!departmentExists)
                throw new Exception($"Department with ID {dto.DepartmentId} not found");
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(dto.FirstName))
            employee.FirstName = dto.FirstName;

        if (!string.IsNullOrEmpty(dto.LastName))
            employee.LastName = dto.LastName;

        if (!string.IsNullOrEmpty(dto.Email))
            employee.Email = dto.Email;

        if (dto.Phone != null)
            employee.Phone = dto.Phone;

        if (dto.DateOfBirth.HasValue)
            employee.DateOfBirth = dto.DateOfBirth.Value;

        if (dto.HireDate.HasValue)
            employee.HireDate = dto.HireDate.Value;

        if (dto.Salary.HasValue)
            employee.Salary = dto.Salary.Value;

        if (dto.DepartmentId.HasValue)
            employee.DepartmentId = dto.DepartmentId.Value;

        if (dto.Status.HasValue)
            employee.Status = dto.Status.Value;

        // Update through repository
        _unitOfWork.Employees.Update(employee);

        // Save through UnitOfWork
        await _unitOfWork.SaveChangesAsync();

        // Reload with department
        var updatedEmployees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.Id == id,
                e => e.Department
            );

        return MapToDto(updatedEmployees.First());
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(id);

        if (employee == null || employee.IsDeleted)
            return false;

        // Soft delete
        employee.IsDeleted = true;

        _unitOfWork.Employees.Update(employee);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _unitOfWork.Employees
            .AnyAsync(e => e.Id == id && !e.IsDeleted);
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeId = null)
    {
        if (excludeId.HasValue)
        {
            return await _unitOfWork.Employees
                .AnyAsync(e => e.Email == email && !e.IsDeleted && e.Id != excludeId.Value);
        }

        return await _unitOfWork.Employees
            .AnyAsync(e => e.Email == email && !e.IsDeleted);
    }

    // ==================== MAPPING ====================

    private static EmployeeResponseDto MapToDto(Employee employee)
    {
        return new EmployeeResponseDto
        {
            Id = employee.Id,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            FullName = employee.FullName,
            Email = employee.Email,
            Phone = employee.Phone,
            DateOfBirth = employee.DateOfBirth,
            HireDate = employee.HireDate,
            Salary = employee.Salary,
            Status = employee.Status,
            ProfilePictureUrl = employee.ProfilePictureUrl,
            DepartmentId = employee.DepartmentId,
            DepartmentName = employee.Department?.Name ?? string.Empty,
            CreatedAt = employee.CreatedAt,
            UpdatedAt = employee.UpdatedAt
        };
    }
}
