import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest
} from '@core/models';

/**
 * Employee Service - Handles employee CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private api = inject(ApiService);
  private readonly endpoint = '/employee';

  /**
   * Get all employees
   */
  getAll(): Observable<Employee[]> {
    return this.api.get<Employee[]>(this.endpoint);
  }

  /**
   * Get employee by ID
   */
  getById(id: number): Observable<Employee> {
    return this.api.get<Employee>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new employee
   */
  create(data: CreateEmployeeRequest): Observable<Employee> {
    return this.api.post<Employee>(this.endpoint, data);
  }

  /**
   * Update employee
   */
  update(id: number, data: UpdateEmployeeRequest): Observable<Employee> {
    return this.api.put<Employee>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete employee
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Get employees by department
   */
  getByDepartment(departmentId: number): Observable<Employee[]> {
    return this.api.get<Employee[]>(`${this.endpoint}/department/${departmentId}`);
  }
}
