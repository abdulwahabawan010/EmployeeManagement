import { Routes } from '@angular/router';

/**
 * Department Feature Routes - Lazy loaded
 */
export const DEPARTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/department-list/department-list.component').then(m => m.DepartmentListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/department-form/department-form.component').then(m => m.DepartmentFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/department-form/department-form.component').then(m => m.DepartmentFormComponent)
  }
];
