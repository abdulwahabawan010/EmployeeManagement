import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards';

/**
 * Application Routes - Lazy loaded with guards
 *
 * Enterprise patterns:
 * - Lazy loading for all feature modules
 * - Auth guard for protected routes
 * - Guest guard for auth pages
 * - Layout-based routing
 */
export const routes: Routes = [
  // Auth routes (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Protected routes (authenticated only)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/departments/department.routes').then(m => m.DEPARTMENT_ROUTES)
      },
      {
        path: 'employees',
        loadChildren: () =>
          import('./features/employees/employee.routes').then(m => m.EMPLOYEE_ROUTES)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Default redirect
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
