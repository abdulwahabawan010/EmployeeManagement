using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using EmployeeManagement.API.Middleware;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Core.Interfaces.Services;
using EmployeeManagement.Core.Settings;
using EmployeeManagement.Core.Validators;
using EmployeeManagement.Infrastructure;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Data.Interceptors;
using EmployeeManagement.Infrastructure.Services;

// ==================== SERILOG BOOTSTRAP ====================
// Configure Serilog BEFORE building the app
// This allows logging during startup (important for debugging)

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Employee Management API");

    var builder = WebApplication.CreateBuilder(args);

    // ==================== SERILOG CONFIGURATION ====================
    // Replace default logging with Serilog
    //
    // WHY SERILOG (Interview Topic):
    // - Structured logging (searchable properties, not just text)
    // - Multiple sinks (Console, File, Seq, Elasticsearch)
    // - Enrichers (add context like TraceId, UserId)
    // - Configuration via appsettings.json
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // ==================== OPTIONS PATTERN ====================
    // Strongly-typed configuration with validation
    //
    // Interview Q: "How do you validate configuration at startup?"
    // Answer: "Use ValidateDataAnnotations() and ValidateOnStart().
    //         App fails fast if required settings are missing."

    builder.Services.AddOptions<JwtSettings>()
        .Bind(builder.Configuration.GetSection(JwtSettings.SectionName))
        .ValidateDataAnnotations()
        .ValidateOnStart();

    builder.Services.AddOptions<CorsSettings>()
        .Bind(builder.Configuration.GetSection(CorsSettings.SectionName))
        .ValidateDataAnnotations()
        .ValidateOnStart();

    // ==================== HTTP CONTEXT ACCESSOR ====================
    // Required for ICurrentUserService to access HttpContext
    builder.Services.AddHttpContextAccessor();

    // ==================== CURRENT USER SERVICE ====================
    // Abstracts access to current authenticated user
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

    // ==================== EF CORE INTERCEPTOR ====================
    // Automatic audit field population
    builder.Services.AddScoped<AuditableEntityInterceptor>();

    // ==================== DATABASE CONTEXT ====================
    // Register DbContext WITH interceptor
    //
    // Interview Q: "How do you register interceptors with DbContext?"
    // Answer: "Use AddInterceptors() in the options action.
    //         Resolve interceptor from DI using GetRequiredService."
    builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
    {
        var interceptor = serviceProvider.GetRequiredService<AuditableEntityInterceptor>();

        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
               .AddInterceptors(interceptor);

        // Enable sensitive data logging in development only
        if (builder.Environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
        }
    });

    // ==================== UNIT OF WORK ====================
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

    // ==================== SERVICES ====================
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IDepartmentService, DepartmentService>();
    builder.Services.AddScoped<IEmployeeService, EmployeeService>();

    // ==================== FLUENT VALIDATION ====================
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeDtoValidator>();

    // ==================== JWT AUTHENTICATION ====================
    // Using Options Pattern - no more magic strings!
    var jwtSettings = builder.Configuration
        .GetSection(JwtSettings.SectionName)
        .Get<JwtSettings>()!;

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
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey)
            ),
            ClockSkew = TimeSpan.Zero // No tolerance for token expiry
        };
    });

    builder.Services.AddAuthorization();

    // ==================== CONTROLLERS ====================
    builder.Services.AddControllers()
        .ConfigureApiBehaviorOptions(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState
                    .Where(e => e.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => char.ToLowerInvariant(kvp.Key[0]) + kvp.Key.Substring(1),
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

    // ==================== CORS ====================
    // Using Options Pattern for CORS settings
    var corsSettings = builder.Configuration
        .GetSection(CorsSettings.SectionName)
        .Get<CorsSettings>()!;

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowConfiguredOrigins", policy =>
        {
            policy.WithOrigins(corsSettings.AllowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();

            if (corsSettings.AllowCredentials)
            {
                policy.AllowCredentials();
            }
        });
    });

    // ==================== OPENAPI / SWAGGER ====================
    builder.Services.AddOpenApi();

    // ==================== HEALTH CHECKS ====================
    // Required for Docker health checks and Kubernetes probes
    //
    // Interview Q: "How do you implement health checks in .NET?"
    // Answer: "AddHealthChecks() with custom checks for DB, cache, etc.
    //         Map endpoints for liveness (/health) and readiness (/ready)."
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>(
            name: "database",
            tags: new[] { "db", "sql", "ready" });

    var app = builder.Build();

    // ==================== DATABASE MIGRATION & SEEDING ====================
    // Automatically apply migrations and seed the database
    // Interview Q: "How do you handle database migrations in Docker?"
    // Answer: "Run migrations on app startup or use a separate init container.
    //         For production, prefer init containers or CI/CD pipeline migrations."
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");

            logger.LogInformation("Seeding database...");
            await DbSeeder.SeedAsync(context);
            logger.LogInformation("Database seeding completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating/seeding the database");
            throw;
        }
    }

    // ==================== MIDDLEWARE PIPELINE ====================

    // Serilog request logging (adds request info to logs)
    //
    // WHY: Automatically logs every HTTP request with:
    // - Method, Path, StatusCode, Duration
    // - Can enrich with custom properties
    app.UseSerilogRequestLogging(options =>
    {
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            // Add UserId to every request log
            var userId = httpContext.User?.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            diagnosticContext.Set("UserId", userId ?? "anonymous");

            // Add client IP
            diagnosticContext.Set("ClientIP",
                httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        };
    });

    // Global Exception Handler
    app.UseGlobalExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseHttpsRedirection();
    app.UseCors("AllowConfiguredOrigins");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // ==================== HEALTH CHECK ENDPOINTS ====================
    // /health - Basic liveness check (is the app running?)
    // /ready  - Readiness check (is the app ready to serve traffic?)
    //
    // Interview Q: "What's the difference between liveness and readiness probes?"
    // Answer: "Liveness = is the container running (restart if dead).
    //         Readiness = is the app ready for traffic (DB connected, etc.)."
    app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = _ => false  // Quick check, no dependencies
    });

    app.MapHealthChecks("/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")  // Check DB, etc.
    });

    Log.Information("Employee Management API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
