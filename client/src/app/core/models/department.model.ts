/**
 * Department Models - Match backend DTOs
 */

// ==================== REQUESTS ====================

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== RESPONSES ====================

export interface Department {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  employeeCount: number;
}
