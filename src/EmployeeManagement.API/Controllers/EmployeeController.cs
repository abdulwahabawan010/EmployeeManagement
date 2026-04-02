using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmployeeManagement.Core.DTOs.Employee;
using EmployeeManagement.Core.Interfaces.Services;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeeController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    /// <summary>
    /// Get all employees
    /// GET: api/employee
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetAll()
    {
        var employees = await _employeeService.GetAllAsync();
        return Ok(employees);
    }

    /// <summary>
    /// Get employee by ID
    /// GET: api/employee/5
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeResponseDto>> GetById(int id)
    {
        var employee = await _employeeService.GetByIdAsync(id);

        if (employee == null)
            return NotFound(new { message = $"Employee with ID {id} not found" });

        return Ok(employee);
    }

    /// <summary>
    /// Get employees by department
    /// GET: api/employee/department/5
    /// </summary>
    [HttpGet("department/{departmentId}")]
    public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetByDepartment(int departmentId)
    {
        var employees = await _employeeService.GetByDepartmentAsync(departmentId);
        return Ok(employees);
    }

    /// <summary>
    /// Create new employee
    /// POST: api/employee
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<EmployeeResponseDto>> Create([FromBody] CreateEmployeeDto dto)
    {
        try
        {
            var employee = await _employeeService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update employee
    /// PUT: api/employee/5
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<EmployeeResponseDto>> Update(int id, [FromBody] UpdateEmployeeDto dto)
    {
        try
        {
            var employee = await _employeeService.UpdateAsync(id, dto);

            if (employee == null)
                return NotFound(new { message = $"Employee with ID {id} not found" });

            return Ok(employee);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete employee
    /// DELETE: api/employee/5
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _employeeService.DeleteAsync(id);

        if (!result)
            return NotFound(new { message = $"Employee with ID {id} not found" });

        return Ok(new { message = "Employee deleted successfully" });
    }
}
