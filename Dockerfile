# ============================================================================
# DOCKERFILE - Employee Management API
# ============================================================================
# Multi-stage build for optimized .NET container
#
# WHY MULTI-STAGE?
# 1. Build stage: Uses full SDK (large ~700MB) to compile
# 2. Runtime stage: Uses slim runtime (small ~100MB) to run
# 3. Final image is 7x smaller = faster deployments
#
# Interview Q: "How do you optimize Docker images for .NET?"
# Answer: "Multi-stage builds - use SDK to build, runtime to run.
#         Also use .dockerignore, layer caching, and non-root users."
# ============================================================================

# ==================== STAGE 1: BUILD ====================
# Uses full .NET SDK to restore, build, and publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first (better layer caching)
# If these don't change, Docker reuses cached layers
COPY ["EmployeeManagement.sln", "./"]
COPY ["src/EmployeeManagement.API/EmployeeManagement.API.csproj", "src/EmployeeManagement.API/"]
COPY ["src/EmployeeManagement.Core/EmployeeManagement.Core.csproj", "src/EmployeeManagement.Core/"]
COPY ["src/EmployeeManagement.Infrastructure/EmployeeManagement.Infrastructure.csproj", "src/EmployeeManagement.Infrastructure/"]

# Restore dependencies (cached if .csproj files unchanged)
RUN dotnet restore "EmployeeManagement.sln"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/EmployeeManagement.API"

# Build in Release mode
RUN dotnet build "EmployeeManagement.API.csproj" -c Release -o /app/build

# ==================== STAGE 2: PUBLISH ====================
# Creates optimized, self-contained output
FROM build AS publish
RUN dotnet publish "EmployeeManagement.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==================== STAGE 3: RUNTIME ====================
# Uses lightweight ASP.NET runtime (not full SDK)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# ==================== SECURITY BEST PRACTICES ====================
# Use the built-in non-root user 'app' in .NET 10 images
# Interview Q: "How do you secure Docker containers?"
# Answer: "Run as non-root user, use read-only filesystem where possible,
#         scan images for vulnerabilities, use minimal base images."

# Copy published app from publish stage
COPY --from=publish /app/publish .

# Switch to non-root user (built-in 'app' user in .NET 10)
USER $APP_UID

# ==================== CONFIGURATION ====================
# Expose port (documentation - actual port binding in docker-compose)
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Entry point - runs when container starts
# Note: Health checks are configured in docker-compose.yml for more flexibility
# In production, use Kubernetes liveness/readiness probes
ENTRYPOINT ["dotnet", "EmployeeManagement.API.dll"]
