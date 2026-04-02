import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services';
import {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest
} from '@core/models';

/**
 * Department Service - Handles department CRUD operations
 *
 * Enterprise patterns:
 * - Single responsibility (only department operations)
 * - Uses base ApiService for HTTP calls
 * - Typed responses
 */
@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private api = inject(ApiService);
  private readonly endpoint = '/department';

  /**
   * Get all departments
   */
  getAll(): Observable<Department[]> {
    return this.api.get<Department[]>(this.endpoint);
  }

  /**
   * Get department by ID
   */
  getById(id: number): Observable<Department> {
    return this.api.get<Department>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new department
   */
  create(data: CreateDepartmentRequest): Observable<Department> {
    return this.api.post<Department>(this.endpoint, data);
  }

  /**
   * Update department
   */
  update(id: number, data: UpdateDepartmentRequest): Observable<Department> {
    return this.api.put<Department>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete department
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
