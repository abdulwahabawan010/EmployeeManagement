import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { Department, EmployeeStatus } from '@core/models';

/**
 * Employee Form Component - Create/Edit employee
 */
@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  employeeForm!: FormGroup;
  departments: Department[] = [];
  isEditMode = false;
  employeeId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // Status options for edit mode
  statusOptions = [
    { value: EmployeeStatus.Active, label: 'Active' },
    { value: EmployeeStatus.OnLeave, label: 'On Leave' },
    { value: EmployeeStatus.Inactive, label: 'Inactive' },
    { value: EmployeeStatus.Terminated, label: 'Terminated' }
  ];

  ngOnInit(): void {
    this.loadDepartments();
    this.initForm();
    this.checkEditMode();
  }

  /**
   * Load departments for dropdown
   */
  private loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments = data.filter(d => d.isActive);
      },
      error: (err) => console.error('Failed to load departments:', err)
    });
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      dateOfBirth: ['', [Validators.required]],
      hireDate: ['', [Validators.required]],
      salary: ['', [Validators.required, Validators.min(0)]],
      departmentId: ['', [Validators.required]],
      status: [EmployeeStatus.Active]
    });
  }

  /**
   * Check if we're in edit mode
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.employeeId = +id;
      this.loadEmployee(this.employeeId);
    }
  }

  /**
   * Load employee for editing
   */
  private loadEmployee(id: number): void {
    this.isLoading = true;

    this.employeeService.getById(id).subscribe({
      next: (emp) => {
        this.employeeForm.patchValue({
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone || '',
          dateOfBirth: this.formatDateForInput(emp.dateOfBirth),
          hireDate: this.formatDateForInput(emp.hireDate),
          salary: emp.salary,
          departmentId: emp.departmentId,
          status: emp.status
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load employee';
        this.isLoading = false;
      }
    });
  }

  /**
   * Format date for HTML input
   */
  private formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  /**
   * Form field getters
   */
  get firstName() { return this.employeeForm.get('firstName'); }
  get lastName() { return this.employeeForm.get('lastName'); }
  get email() { return this.employeeForm.get('email'); }
  get phone() { return this.employeeForm.get('phone'); }
  get dateOfBirth() { return this.employeeForm.get('dateOfBirth'); }
  get hireDate() { return this.employeeForm.get('hireDate'); }
  get salary() { return this.employeeForm.get('salary'); }
  get departmentId() { return this.employeeForm.get('departmentId'); }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = { ...this.employeeForm.value };
    formData.departmentId = +formData.departmentId;
    formData.salary = +formData.salary;

    // Handle status - convert to number for edit, remove for create
    if (this.isEditMode) {
      formData.status = +formData.status;
    } else {
      delete formData.status;
    }

    const request$ = this.isEditMode
      ? this.employeeService.update(this.employeeId!, formData)
      : this.employeeService.create(formData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        this.error = err.message || 'Failed to save employee';
        this.isSubmitting = false;
      }
    });
  }
}
