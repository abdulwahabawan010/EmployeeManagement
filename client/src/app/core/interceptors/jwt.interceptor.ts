import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env';

/**
 * JWT Interceptor - Handles token injection and automatic refresh
 *
 * Enterprise patterns:
 * - Automatically attaches JWT to requests
 * - Handles 401 errors with token refresh
 * - Queues requests during refresh
 * - Thread-safe refresh handling
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip auth endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add token to request
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - try refresh
        if (error.status === 401 && !this.isAuthEndpoint(request.url)) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add Authorization header to request
   */
  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Handle 401 error - attempt token refresh
   */
  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // If not already refreshing, start refresh
    if (!this.authService.refreshing) {
      this.authService.refreshing = true;
      this.authService.refreshTokenSubject$.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.authService.refreshing = false;
          this.authService.refreshTokenSubject$.next(response.token);
          return next.handle(this.addToken(request, response.token));
        }),
        catchError(error => {
          this.authService.refreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }

    // If refresh is in progress, wait for it to complete
    return this.authService.refreshTokenSubject$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token!)))
    );
  }

  /**
   * Check if URL is an auth endpoint (skip token injection)
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}
