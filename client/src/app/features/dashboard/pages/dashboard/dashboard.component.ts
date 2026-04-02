import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { Department, Employee } from '@core/models';

/**
 * Dashboard Component - Overview page with statistics
 *
 * Enterprise patterns:
 * - Data fetching on init
 * - Loading states
 * - Statistics cards
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  // Stats signals
  totalEmployees = signal(0);
  totalDepartments = signal(0);
  activeEmployees = signal(0);
  recentEmployees = signal<Employee[]>([]);

  isLoading = signal(true);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load dashboard statistics
   */
  private loadDashboardData(): void {
    // Load employees
    this.api.get<Employee[]>('/employee').subscribe({
      next: (employees) => {
        this.totalEmployees.set(employees.length);
        this.activeEmployees.set(employees.filter(e => e.status === 0).length);
        this.recentEmployees.set(employees.slice(0, 5));
      },
      error: (err) => console.error('Failed to load employees:', err)
    });

    // Load departments
    this.api.get<Department[]>('/department').subscribe({
      next: (departments) => {
        this.totalDepartments.set(departments.length);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Get status label
   */
  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Active',
      1: 'On Leave',
      2: 'Inactive',
      3: 'Terminated'
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Get status class
   */
  getStatusClass(status: number): string {
    const classes: Record<number, string> = {
      0: 'status-active',
      1: 'status-leave',
      2: 'status-inactive',
      3: 'status-terminated'
    };
    return classes[status] || '';
  }
}
