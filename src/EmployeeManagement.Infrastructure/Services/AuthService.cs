using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using EmployeeManagement.Core.DTOs.Auth;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces.Services;
using EmployeeManagement.Infrastructure.Data;

namespace EmployeeManagement.Infrastructure.Services;

/// <summary>
/// Authentication Service
/// Handles user registration, login, and token management
/// Throws custom exceptions for proper error handling
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        // Check if user already exists by email
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == registerDto.Email);

        if (emailExists)
            throw new ConflictException("User", "email", registerDto.Email);

        // Check if username already exists
        var usernameExists = await _context.Users
            .AnyAsync(u => u.Username == registerDto.Username);

        if (usernameExists)
            throw new ConflictException("User", "username", registerDto.Username);

        // Hash password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        // Create new user
        var user = new User
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = passwordHash,
            Role = Role.Employee,  // Default role
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate JWT token and refresh token
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

        if (user == null)
            throw new UnauthorizedException("Invalid email or password");

        // Verify password
        var isValidPassword = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);

        if (!isValidPassword)
            throw new UnauthorizedException("Invalid email or password");

        // Check if user is active
        if (!user.IsActive)
            throw new ForbiddenException("Your account has been deactivated. Please contact support.");

        // Update last login time
        user.LastLoginAt = DateTime.UtcNow;

        // Generate JWT token and refresh token
        return await GenerateAuthResponseAsync(user);
    }

    public Task<bool> ValidateTokenAsync(string token)
    {
        // Token validation is handled by JWT middleware
        // This can be used for additional checks if needed
        return Task.FromResult(true);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        // Find the refresh token in database
        var storedToken = await _context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (storedToken == null)
            throw new UnauthorizedException("Invalid refresh token");

        // Check if token is active (not revoked and not expired)
        if (!storedToken.IsActive)
            throw new UnauthorizedException("Refresh token is expired or revoked");

        // Get the user
        var user = storedToken.User;

        if (!user.IsActive)
            throw new ForbiddenException("Your account has been deactivated. Please contact support.");

        // Revoke the old refresh token
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        // Generate new tokens
        var response = await GenerateAuthResponseAsync(user);
        await _context.SaveChangesAsync();

        return response;
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (storedToken == null)
            throw new NotFoundException("Refresh token not found");

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    // ==================== PRIVATE METHODS ====================

    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user)
    {
        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(
            double.Parse(_configuration["Jwt:ExpiryHours"] ?? "24")
        );

        // Generate refresh token (valid for 7 days)
        var refreshToken = GenerateRefreshToken();
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            ExpiresAt = expiresAt,
            RefreshTokenExpiresAt = refreshTokenEntity.ExpiresAt
        };
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!)
        );

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(
                double.Parse(_configuration["Jwt:ExpiryHours"] ?? "24")
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
