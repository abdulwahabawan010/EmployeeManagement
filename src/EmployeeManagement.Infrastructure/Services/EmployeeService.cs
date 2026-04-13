using Microsoft.Extensions.Logging;
using EmployeeManagement.Core.DTOs.Employee;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Employee Service - Business logic layer
///
/// DAY 1 IMPROVEMENTS:
/// 1. Uses AsNoTracking for read-only queries (performance)
/// 2. No manual IsDeleted checks (Global Query Filter handles it)
/// 3. Uses Delete() method (Interceptor converts to soft delete)
/// 4. Structured logging with Serilog
///
/// Interview Q: "How do you structure your service layer?"
/// Answer: "Services contain business logic, use repositories via UnitOfWork,
///         throw custom exceptions for error handling, and delegate
///         cross-cutting concerns (audit, logging) to interceptors/middleware."
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(IUnitOfWork unitOfWork, ILogger<EmployeeService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Get all employees (non-deleted due to Global Query Filter)
    /// Uses AsNoTracking for performance (read-only operation)
    /// </summary>
    public async Task<IEnumerable<EmployeeResponseDto>> GetAllAsync()
    {
        _logger.LogInformation("Fetching all employees");

        // trackChanges: false = AsNoTracking (faster for read-only)
        // No need for !e.IsDeleted - Global Query Filter handles it!
        var employees = await _unitOfWork.Employees
            .GetAllWithIncludeAsync(
                trackChanges: false,  // Read-only = AsNoTracking
                e => e.Department
            );

        _logger.LogInformation("Retrieved {Count} employees", employees.Count());
        return employees.Select(MapToDto);
    }

    /// <summary>
    /// Get employee by ID
    /// Uses AsNoTracking for read-only operation
    /// </summary>
    public async Task<EmployeeResponseDto?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Fetching employee with ID {EmployeeId}", id);

        var employee = await _unitOfWork.Employees
            .GetByIdWithIncludeAsync(
                id,
                trackChanges: false,
                e => e.Department
            );

        if (employee == null)
        {
            _logger.LogWarning("Employee with ID {EmployeeId} not found", id);
            return null;
        }

        return MapToDto(employee);
    }

    /// <summary>
    /// Get employees by department
    /// </summary>
    public async Task<IEnumerable<EmployeeResponseDto>> GetByDepartmentAsync(int departmentId)
    {
        _logger.LogInformation(
            "Fetching employees for department {DepartmentId}",
            departmentId);

        // Verify department exists (Global Query Filter excludes deleted)
        var departmentExists = await _unitOfWork.Departments.ExistsAsync(departmentId);

        if (!departmentExists)
        {
            _logger.LogWarning("Department {DepartmentId} not found", departmentId);
            throw new NotFoundException("Department", departmentId);
        }

        var employees = await _unitOfWork.Employees
            .FindWithIncludeAsync(
                e => e.DepartmentId == departmentId,
                trackChanges: false,
                e => e.Department
            );

        return employees.Select(MapToDto);
    }

    /// <summary>
    /// Create new employee
    /// Interceptor automatically sets CreatedAt, CreatedBy
    /// </summary>
    public async Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto)
    {
        _logger.LogInformation(
            "Creating employee {FirstName} {LastName} in department {DepartmentId}",
            dto.FirstName, dto.LastName, dto.DepartmentId);

        // Validate department exists
        var departmentExists = await _unitOfWork.Departments.ExistsAsync(dto.DepartmentId);
        if (!departmentExists)
        {
            _logger.LogWarning("Cannot create employee: Department {DepartmentId} not found", dto.DepartmentId);
            throw new NotFoundException("Department", dto.DepartmentId);
        }

        // Check email uniqueness
        if (await EmailExistsAsync(dto.Email))
        {
            _logger.LogWarning("Cannot create employee: Email {Email} already exists", dto.Email);
            throw new ConflictException("Employee", "email", dto.Email);
        }

        // Map DTO to Entity
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
            // NOTE: CreatedAt, CreatedBy set automatically by Interceptor
        };

        _unitOfWork.Employees.Add(employee);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
            "Employee created successfully with ID {EmployeeId}",
            employee.Id);

        // Load with department for response
        var savedEmployee = await _unitOfWork.Employees
            .GetByIdWithIncludeAsync(
                employee.Id,
                trackChanges: false,
                e => e.Department
            );

        return MapToDto(savedEmployee!);
    }

    /// <summary>
    /// Update employee
    /// Interceptor automatically sets UpdatedAt, UpdatedBy
    /// </summary>
    public async Task<EmployeeResponseDto?> UpdateAsync(int id, UpdateEmployeeDto dto)
    {
        _logger.LogInformation("Updating employee {EmployeeId}", id);

        // trackChanges: true - we need EF to track this for update
        var employee = await _unitOfWork.Employees
            .GetByIdWithIncludeAsync(
                id,
                trackChanges: true,  // Need tracking for update
                e => e.Department
            );

        if (employee == null)
        {
            _logger.LogWarning("Employee {EmployeeId} not found for update", id);
            return null;
        }

        // Validate email uniqueness if changing
        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != employee.Email)
        {
            if (await EmailExistsAsync(dto.Email, id))
            {
                _logger.LogWarning("Cannot update: Email {Email} already exists", dto.Email);
                throw new ConflictException("Employee", "email", dto.Email);
            }
        }

        // Validate department if changing
        if (dto.DepartmentId.HasValue && dto.DepartmentId != employee.DepartmentId)
        {
            var departmentExists = await _unitOfWork.Departments.ExistsAsync(dto.DepartmentId.Value);
            if (!departmentExists)
            {
                throw new NotFoundException("Department", dto.DepartmentId.Value);
            }
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(dto.FirstName)) employee.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) employee.LastName = dto.LastName;
        if (!string.IsNullOrEmpty(dto.Email)) employee.Email = dto.Email;
        if (dto.Phone != null) employee.Phone = dto.Phone;
        if (dto.DateOfBirth.HasValue) employee.DateOfBirth = dto.DateOfBirth.Value;
        if (dto.HireDate.HasValue) employee.HireDate = dto.HireDate.Value;
        if (dto.Salary.HasValue) employee.Salary = dto.Salary.Value;
        if (dto.DepartmentId.HasValue) employee.DepartmentId = dto.DepartmentId.Value;
        if (dto.Status.HasValue) employee.Status = dto.Status.Value;

        // NOTE: UpdatedAt, UpdatedBy set automatically by Interceptor
        _unitOfWork.Employees.Update(employee);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Employee {EmployeeId} updated successfully", id);

        // Reload for response
        var updatedEmployee = await _unitOfWork.Employees
            .GetByIdWithIncludeAsync(id, trackChanges: false, e => e.Department);

        return MapToDto(updatedEmployee!);
    }

    /// <summary>
    /// Delete employee (soft delete via Interceptor)
    ///
    /// HOW IT WORKS:
    /// 1. We call Delete() on repository
    /// 2. Repository calls _dbSet.Remove() (marks as Deleted)
    /// 3. Interceptor intercepts SaveChanges
    /// 4. Interceptor converts Deleted → Modified with IsDeleted=true
    /// 5. Database UPDATE (not DELETE) is executed
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        _logger.LogInformation("Deleting employee {EmployeeId}", id);

        // Need tracking for delete operation
        var employee = await _unitOfWork.Employees.GetByIdAsync(id, trackChanges: true);

        if (employee == null)
        {
            _logger.LogWarning("Employee {EmployeeId} not found for deletion", id);
            return false;
        }

        // Just call Delete - Interceptor handles soft delete
        // Sets IsDeleted=true, DeletedAt, DeletedBy automatically
        _unitOfWork.Employees.Delete(employee);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
            "Employee {EmployeeId} soft-deleted successfully by interceptor",
            id);

        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _unitOfWork.Employees.ExistsAsync(id);
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeId = null)
    {
        if (excludeId.HasValue)
        {
            return await _unitOfWork.Employees
                .AnyAsync(e => e.Email == email && e.Id != excludeId.Value);
        }

        return await _unitOfWork.Employees.AnyAsync(e => e.Email == email);
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
