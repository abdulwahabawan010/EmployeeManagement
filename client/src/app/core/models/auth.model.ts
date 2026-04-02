/**
 * Auth Models - Match backend DTOs
 */

// ==================== REQUESTS ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== RESPONSES ====================

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  role: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
}

// ==================== APP MODELS ====================

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Employee = 'Employee'
}
