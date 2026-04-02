import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models';

/**
 * Auth Guard - Protects routes requiring authentication
 *
 * Enterprise patterns:
 * - Functional guard (Angular 15+ recommended)
 * - Role-based access control
 * - Redirect to login with return URL
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if authenticated
  if (!authService.isAuthenticated()) {
    // Store attempted URL for redirect after login
    const returnUrl = route.url.map(segment => segment.path).join('/');
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: returnUrl || '/dashboard' }
    });
    return false;
  }

  // Check token expiration
  if (authService.isTokenExpired()) {
    authService.logout();
    return false;
  }

  // Check role requirements if specified
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authService.hasAnyRole(requiredRoles)) {
      // Redirect to unauthorized page or dashboard
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

/**
 * Guest Guard - Prevents authenticated users from accessing auth pages
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Role Guard Factory - Creates a guard for specific roles
 *
 * Usage in routes:
 * { path: 'admin', canActivate: [authGuard, roleGuard([UserRole.Admin])] }
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.hasAnyRole(allowedRoles)) {
      router.navigate(['/dashboard']);
      return false;
    }

    return true;
  };
};
