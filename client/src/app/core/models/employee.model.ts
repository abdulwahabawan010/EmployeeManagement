/**
 * Employee Models - Match backend DTOs
 */

// ==================== REQUESTS ====================

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  hireDate: string;
  salary: number;
  departmentId: number;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate?: string;
  salary?: number;
  departmentId?: number;
  status?: EmployeeStatus;
}

// ==================== RESPONSES ====================

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  hireDate: string;
  salary: number;
  status: EmployeeStatus;
  profilePictureUrl?: string;
  departmentId: number;
  departmentName: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== ENUMS ====================

export enum EmployeeStatus {
  Active = 0,
  OnLeave = 1,
  Inactive = 2,
  Terminated = 3
}
