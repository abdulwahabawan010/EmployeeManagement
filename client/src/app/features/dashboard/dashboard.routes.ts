import { Routes } from '@angular/router';

/**
 * Dashboard Feature Routes
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
];
