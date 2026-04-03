using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmployeeManagement.Core.DTOs.Department;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.API.Controllers;

/// <summary>
/// Department Controller - REST API endpoints
///
/// Note: No try-catch needed - GlobalExceptionMiddleware handles all errors
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    /// <summary>
    /// Get all departments
    /// GET: api/department
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentResponseDto>>> GetAll()
    {
        var departments = await _departmentService.GetAllAsync();
        return Ok(departments);
    }

    /// <summary>
    /// Get department by ID
    /// GET: api/department/5
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentResponseDto>> GetById(int id)
    {
        var department = await _departmentService.GetByIdAsync(id);

        if (department == null)
            throw new NotFoundException("Department", id);

        return Ok(department);
    }

    /// <summary>
    /// Create new department
    /// POST: api/department
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentResponseDto>> Create([FromBody] CreateDepartmentDto dto)
    {
        var department = await _departmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
    }

    /// <summary>
    /// Update department
    /// PUT: api/department/5
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentResponseDto>> Update(int id, [FromBody] UpdateDepartmentDto dto)
    {
        var department = await _departmentService.UpdateAsync(id, dto);

        if (department == null)
            throw new NotFoundException("Department", id);

        return Ok(department);
    }

    /// <summary>
    /// Delete department
    /// DELETE: api/department/5
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _departmentService.DeleteAsync(id);

        if (!result)
            throw new NotFoundException("Department", id);

        return Ok(new { message = "Department deleted successfully" });
    }
}
