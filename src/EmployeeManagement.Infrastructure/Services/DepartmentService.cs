using Microsoft.Extensions.Logging;
using EmployeeManagement.Core.DTOs.Department;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Department Service - Business logic layer
///
/// DAY 1 IMPROVEMENTS:
/// 1. Uses AsNoTracking for read-only queries
/// 2. No manual IsDeleted checks (Global Query Filter)
/// 3. Uses Delete() for soft delete (Interceptor handles it)
/// 4. Structured logging
/// </summary>
public class DepartmentService : IDepartmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DepartmentService> _logger;

    public DepartmentService(IUnitOfWork unitOfWork, ILogger<DepartmentService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<IEnumerable<DepartmentResponseDto>> GetAllAsync()
    {
        _logger.LogInformation("Fetching all departments");

        // No need for !d.IsDeleted - Global Query Filter handles it
        var departments = await _unitOfWork.Departments
            .GetAllWithIncludeAsync(
                trackChanges: false,
                d => d.Employees
            );

        _logger.LogInformation("Retrieved {Count} departments", departments.Count());
        return departments.Select(MapToDto);
    }

    public async Task<DepartmentResponseDto?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Fetching department with ID {DepartmentId}", id);

        var department = await _unitOfWork.Departments
            .GetByIdWithIncludeAsync(
                id,
                trackChanges: false,
                d => d.Employees
            );

        if (department == null)
        {
            _logger.LogWarning("Department {DepartmentId} not found", id);
            return null;
        }

        return MapToDto(department);
    }

    public async Task<DepartmentResponseDto> CreateAsync(CreateDepartmentDto dto)
    {
        _logger.LogInformation("Creating department {DepartmentName}", dto.Name);

        // Check if department name already exists
        var nameExists = await _unitOfWork.Departments
            .AnyAsync(d => d.Name.ToLower() == dto.Name.ToLower());

        if (nameExists)
        {
            _logger.LogWarning("Department name {DepartmentName} already exists", dto.Name);
            throw new ConflictException("Department", "name", dto.Name);
        }

        var department = new Department
        {
            Name = dto.Name,
            Description = dto.Description
            // CreatedAt, CreatedBy set by Interceptor
        };

        _unitOfWork.Departments.Add(department);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Department created with ID {DepartmentId}", department.Id);
        return MapToDto(department);
    }

    public async Task<DepartmentResponseDto?> UpdateAsync(int id, UpdateDepartmentDto dto)
    {
        _logger.LogInformation("Updating department {DepartmentId}", id);

        // trackChanges: true for update
        var department = await _unitOfWork.Departments
            .GetByIdWithIncludeAsync(
                id,
                trackChanges: true,
                d => d.Employees
            );

        if (department == null)
        {
            _logger.LogWarning("Department {DepartmentId} not found for update", id);
            return null;
        }

        // Check if new name conflicts
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name.ToLower() != department.Name.ToLower())
        {
            var nameExists = await _unitOfWork.Departments
                .AnyAsync(d => d.Name.ToLower() == dto.Name.ToLower() && d.Id != id);

            if (nameExists)
            {
                _logger.LogWarning("Cannot update: Department name {DepartmentName} already exists", dto.Name);
                throw new ConflictException("Department", "name", dto.Name);
            }
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(dto.Name)) department.Name = dto.Name;
        if (dto.Description != null) department.Description = dto.Description;
        if (dto.IsActive.HasValue) department.IsActive = dto.IsActive.Value;

        // UpdatedAt, UpdatedBy set by Interceptor
        _unitOfWork.Departments.Update(department);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Department {DepartmentId} updated successfully", id);

        // Reload for response
        var updatedDepartment = await _unitOfWork.Departments
            .GetByIdWithIncludeAsync(id, trackChanges: false, d => d.Employees);

        return MapToDto(updatedDepartment!);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        _logger.LogInformation("Deleting department {DepartmentId}", id);

        var department = await _unitOfWork.Departments.GetByIdAsync(id, trackChanges: true);

        if (department == null)
        {
            _logger.LogWarning("Department {DepartmentId} not found for deletion", id);
            return false;
        }

        // Check if department has active employees
        var hasEmployees = await _unitOfWork.Employees
            .AnyAsync(e => e.DepartmentId == id);

        if (hasEmployees)
        {
            _logger.LogWarning("Cannot delete department {DepartmentId}: has active employees", id);
            throw new BadRequestException(
                "Cannot delete department that has active employees. " +
                "Please reassign or remove employees first.");
        }

        // Interceptor converts this to soft delete
        _unitOfWork.Departments.Delete(department);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Department {DepartmentId} soft-deleted successfully", id);
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _unitOfWork.Departments.ExistsAsync(id);
    }

    private static DepartmentResponseDto MapToDto(Department department)
    {
        return new DepartmentResponseDto
        {
            Id = department.Id,
            Name = department.Name,
            Description = department.Description,
            IsActive = department.IsActive,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt,
            EmployeeCount = department.Employees?.Count(e => !e.IsDeleted) ?? 0
        };
    }
}
