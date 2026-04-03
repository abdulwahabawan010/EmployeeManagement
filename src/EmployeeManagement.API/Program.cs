using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using EmployeeManagement.API.Middleware;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;
using EmployeeManagement.Core.Validators;
using EmployeeManagement.Infrastructure;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ==================== SERVICES ====================

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Unit of Work (manages repositories + transactions)
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Add Services (use UnitOfWork internally)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Add FluentValidation
// Automatically registers all validators from the Core assembly
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeDtoValidator>();

// Add JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!)
        )
    };
});

// Add Authorization
builder.Services.AddAuthorization();

// Add Controllers with custom validation error response
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Customize validation error response to use our ErrorResponse format
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => char.ToLowerInvariant(kvp.Key[0]) + kvp.Key.Substring(1), // camelCase
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            var errorResponse = new ErrorResponse
            {
                StatusCode = 422,
                ErrorCode = "VALIDATION_ERROR",
                Message = "One or more validation errors occurred",
                Details = errors,
                Path = context.HttpContext.Request.Path,
                TraceId = context.HttpContext.TraceIdentifier
            };

            return new UnprocessableEntityObjectResult(errorResponse);
        };
    });

// Add CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add OpenAPI/Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// ==================== DATABASE SEEDING ====================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(context);
}

// ==================== MIDDLEWARE ====================

// Global Exception Handler (MUST be first in pipeline to catch all errors)
app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAngular");

// Authentication & Authorization (ORDER MATTERS!)
app.UseAuthentication();
app.UseAuthorization();

// Enable routing for controllers
app.MapControllers();

app.Run();
