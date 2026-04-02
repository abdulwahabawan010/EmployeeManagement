import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Error Interceptor - Global error handling
 *
 * Enterprise patterns:
 * - Centralized error handling
 * - User-friendly error messages
 * - Error logging (can integrate with services like Sentry)
 * - Consistent error format
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);

        // Log error (in production, send to error tracking service)
        console.error('HTTP Error:', {
          url: request.url,
          status: error.status,
          message: errorMessage,
          error: error.error
        });

        // Return error with user-friendly message
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          errors: this.extractValidationErrors(error)
        }));
      })
    );
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Network error
    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    // Server returned error message
    if (error.error?.message) {
      return error.error.message;
    }

    // Handle common HTTP status codes
    switch (error.status) {
      case 400:
        return error.error?.title || 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation conflicts with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'An unexpected server error occurred. Please try again later.';
      case 503:
        return 'Service is temporarily unavailable. Please try again later.';
      default:
        return `An error occurred (${error.status}). Please try again.`;
    }
  }

  /**
   * Extract validation errors from response
   */
  private extractValidationErrors(error: HttpErrorResponse): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    // .NET validation errors format
    if (error.error?.errors) {
      Object.keys(error.error.errors).forEach(key => {
        const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
        errors[fieldName] = error.error.errors[key];
      });
    }

    return errors;
  }
}
