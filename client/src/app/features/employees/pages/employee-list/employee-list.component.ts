import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { Employee, Department, EmployeeStatus } from '@core/models';

/**
 * Employee List Component - Displays all employees with filtering
 */
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);

  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  deleteId = signal<number | null>(null);

  // Filters
  searchTerm = '';
  selectedDepartment = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load employees and departments
   */
  loadData(): void {
    this.isLoading.set(true);

    // Load departments for filter
    this.departmentService.getAll().subscribe({
      next: (data) => this.departments.set(data),
      error: (err) => console.error('Failed to load departments:', err)
    });

    // Load employees
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.filteredEmployees.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load employees');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    let result = this.employees();

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        e.fullName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (this.selectedDepartment) {
      result = result.filter(e => e.departmentId === +this.selectedDepartment);
    }

    // Status filter
    if (this.selectedStatus !== '') {
      result = result.filter(e => e.status === +this.selectedStatus);
    }

    this.filteredEmployees.set(result);
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.filteredEmployees.set(this.employees());
  }

  /**
   * Get status label
   */
  getStatusLabel(status: EmployeeStatus): string {
    const labels: Record<number, string> = {
      [EmployeeStatus.Active]: 'Active',
      [EmployeeStatus.OnLeave]: 'On Leave',
      [EmployeeStatus.Inactive]: 'Inactive',
      [EmployeeStatus.Terminated]: 'Terminated'
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Get status class
   */
  getStatusClass(status: EmployeeStatus): string {
    const classes: Record<number, string> = {
      [EmployeeStatus.Active]: 'status-active',
      [EmployeeStatus.OnLeave]: 'status-leave',
      [EmployeeStatus.Inactive]: 'status-inactive',
      [EmployeeStatus.Terminated]: 'status-terminated'
    };
    return classes[status] || '';
  }

  /**
   * Confirm delete
   */
  confirmDelete(id: number): void {
    this.deleteId.set(id);
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.deleteId.set(null);
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: number): void {
    this.employeeService.delete(id).subscribe({
      next: () => {
        this.employees.update(list => list.filter(e => e.id !== id));
        this.applyFilters();
        this.deleteId.set(null);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete employee');
        this.deleteId.set(null);
      }
    });
  }

  /**
   * Format salary
   */
  formatSalary(salary: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(salary);
  }
}
