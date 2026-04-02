using EmployeeManagement.Core.DTOs.Department;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Department Service - Business logic layer
/// Uses IUnitOfWork (not DbContext directly!)
///
/// Service responsibilities:
/// 1. DTO ↔ Entity mapping
/// 2. Business validation
/// 3. Calling repository through UnitOfWork
/// </summary>
public class DepartmentService : IDepartmentService
{
    private readonly IUnitOfWork _unitOfWork;

    public DepartmentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<DepartmentResponseDto>> GetAllAsync()
    {
        // Use repository through UnitOfWork
        var departments = await _unitOfWork.Departments
            .FindWithIncludeAsync(
                d => !d.IsDeleted,           // Filter
                d => d.Employees             // Include
            );

        return departments.Select(MapToDto);
    }

    public async Task<DepartmentResponseDto?> GetByIdAsync(int id)
    {
        var departments = await _unitOfWork.Departments
            .FindWithIncludeAsync(
                d => d.Id == id && !d.IsDeleted,
                d => d.Employees
            );

        var department = departments.FirstOrDefault();
        return department == null ? null : MapToDto(department);
    }

    public async Task<DepartmentResponseDto> CreateAsync(CreateDepartmentDto dto)
    {
        // Map DTO → Entity
        var department = new Department
        {
            Name = dto.Name,
            Description = dto.Description
        };

        // Add through repository (doesn't save yet!)
        _unitOfWork.Departments.Add(department);

        // Save through UnitOfWork (single transaction)
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(department);
    }

    public async Task<DepartmentResponseDto?> UpdateAsync(int id, UpdateDepartmentDto dto)
    {
        var departments = await _unitOfWork.Departments
            .FindWithIncludeAsync(
                d => d.Id == id && !d.IsDeleted,
                d => d.Employees
            );

        var department = departments.FirstOrDefault();

        if (department == null)
            return null;

        // Update only provided fields (business logic)
        if (!string.IsNullOrEmpty(dto.Name))
            department.Name = dto.Name;

        if (dto.Description != null)
            department.Description = dto.Description;

        if (dto.IsActive.HasValue)
            department.IsActive = dto.IsActive.Value;

        // Update through repository
        _unitOfWork.Departments.Update(department);

        // Save through UnitOfWork
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(department);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var department = await _unitOfWork.Departments.GetByIdAsync(id);

        if (department == null || department.IsDeleted)
            return false;

        // Soft delete (business logic)
        department.IsDeleted = true;

        _unitOfWork.Departments.Update(department);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _unitOfWork.Departments
            .AnyAsync(d => d.Id == id && !d.IsDeleted);
    }

    // ==================== MAPPING ====================
    // Service's job: Convert Entity → DTO

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
            EmployeeCount = department.Employees?.Count ?? 0
        };
    }
}
