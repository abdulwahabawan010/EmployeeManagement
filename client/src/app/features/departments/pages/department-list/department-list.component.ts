import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { Department } from '@core/models';

/**
 * Department List Component - Displays all departments
 *
 * Enterprise patterns:
 * - Loading and error states
 * - Confirm before delete
 * - Reactive signals for state
 */
@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss'
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);

  departments = signal<Department[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  deleteId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadDepartments();
  }

  /**
   * Load all departments
   */
  loadDepartments(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load departments');
        this.isLoading.set(false);
      }
    });
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
   * Delete department
   */
  deleteDepartment(id: number): void {
    this.departmentService.delete(id).subscribe({
      next: () => {
        this.departments.update(list => list.filter(d => d.id !== id));
        this.deleteId.set(null);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete department');
        this.deleteId.set(null);
      }
    });
  }
}
