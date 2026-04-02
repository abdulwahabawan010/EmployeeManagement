import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DepartmentService } from '../../services/department.service';

/**
 * Department Form Component - Create/Edit department
 *
 * Enterprise patterns:
 * - Reusable form for create and edit
 * - Route params to determine mode
 * - Form validation
 */
@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './department-form.component.html',
  styleUrl: './department-form.component.scss'
})
export class DepartmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  departmentForm!: FormGroup;
  isEditMode = false;
  departmentId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  /**
   * Check if we're in edit mode
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.departmentId = +id;
      this.loadDepartment(this.departmentId);
    }
  }

  /**
   * Load department for editing
   */
  private loadDepartment(id: number): void {
    this.isLoading = true;

    this.departmentService.getById(id).subscribe({
      next: (dept) => {
        this.departmentForm.patchValue({
          name: dept.name,
          description: dept.description || '',
          isActive: dept.isActive
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load department';
        this.isLoading = false;
      }
    });
  }

  /**
   * Form field getters
   */
  get name() { return this.departmentForm.get('name'); }
  get description() { return this.departmentForm.get('description'); }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = this.departmentForm.value;

    const request$ = this.isEditMode
      ? this.departmentService.update(this.departmentId!, formData)
      : this.departmentService.create(formData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/departments']);
      },
      error: (err) => {
        this.error = err.message || 'Failed to save department';
        this.isSubmitting = false;
      }
    });
  }
}
