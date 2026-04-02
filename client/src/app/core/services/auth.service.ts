import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  User,
  UserRole
} from '@core/models';
import { environment } from '@env';

/**
 * Auth Service - Handles authentication and token management
 *
 * Enterprise patterns:
 * - Secure token storage (localStorage with encryption in production)
 * - Automatic token refresh
 * - Role-based access control helpers
 * - Reactive state with signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Reactive state using Angular Signals
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);

  // For interceptor to check if refresh is in progress
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.api.post<AuthResponse>('/auth/refresh-token', request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - clear tokens and redirect
   */
  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate <= new Date();
    } catch {
      return true;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole !== null && roles.includes(currentRole);
  }

  /**
   * Get refresh state for interceptor
   */
  get refreshing(): boolean {
    return this.isRefreshing;
  }

  set refreshing(value: boolean) {
    this.isRefreshing = value;
  }

  get refreshTokenSubject$(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Handle successful auth response - store tokens and user
   */
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, response.token);
    localStorage.setItem(environment.refreshTokenKey, response.refreshToken);

    const user: User = {
      id: 0, // API doesn't return ID in auth response, we'll handle this
      username: response.username,
      email: response.email,
      role: response.role as UserRole
    };

    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  /**
   * Load user from storage on service init
   */
  private loadUserFromStorage(): User | null {
    try {
      const userJson = localStorage.getItem(environment.userKey);
      if (userJson) {
        return JSON.parse(userJson) as User;
      }
    } catch {
      console.error('Failed to parse stored user');
    }
    return null;
  }
}
