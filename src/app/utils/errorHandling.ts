// Error Handling Utilities
// Helper functions for displaying user-friendly error messages

import { VoizmaticApiError } from '../services/api';

/**
 * Extract user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  // Handle VoizmaticApiError
  if (error instanceof VoizmaticApiError) {
    // For validation errors, show formatted validation messages
    if (error.validationErrors && error.validationErrors.length > 0) {
      return error.getValidationErrorMessage();
    }
    return error.message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.message.toLowerCase().includes('network');
  }
  
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.name === 'TypeError';
  }
  
  return false;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.status === 401;
  }
  return false;
}

/**
 * Check if error is a validation error (422)
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.status === 422 && 
           error.validationErrors !== undefined && 
           error.validationErrors.length > 0;
  }
  return false;
}

/**
 * Check if error is a permission error (403)
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.status === 403;
  }
  return false;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.status === 404;
  }
  return false;
}

/**
 * Check if error is a server error (500+)
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof VoizmaticApiError) {
    return error.status !== undefined && error.status >= 500;
  }
  return false;
}

/**
 * Get error severity level for UI display
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isValidationError(error)) {
    return 'warning';
  }
  
  if (isNotFoundError(error)) {
    return 'info';
  }
  
  if (isAuthError(error) || isPermissionError(error)) {
    return 'warning';
  }
  
  if (isServerError(error)) {
    return 'critical';
  }
  
  if (isNetworkError(error)) {
    return 'error';
  }
  
  return 'error';
}

/**
 * Get recommended action message for user
 */
export function getErrorActionMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Please check your internet connection and try again.';
  }
  
  if (isAuthError(error)) {
    return 'Please log in again to continue.';
  }
  
  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.';
  }
  
  if (isValidationError(error)) {
    return 'Please review your input and try again.';
  }
  
  if (isServerError(error)) {
    return 'The server is experiencing issues. Please try again later or contact support if the problem persists.';
  }
  
  if (isNotFoundError(error)) {
    return 'The requested resource was not found.';
  }
  
  return 'Please try again or contact support if the problem persists.';
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: unknown): string {
  if (error instanceof VoizmaticApiError) {
    const parts = [
      `VoizmaticApiError: ${error.message}`,
      error.status ? `Status: ${error.status}` : null,
      error.statusText ? `Status Text: ${error.statusText}` : null,
      error.validationErrors ? 
        `Validation Errors:\n${error.validationErrors.map(e => 
          `  - ${e.loc.join('.')}: ${e.msg} (${e.type})`
        ).join('\n')}` : null,
    ];
    return parts.filter(Boolean).join('\n');
  }
  
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\nStack: ${error.stack}`;
  }
  
  return String(error);
}

/**
 * Show error in console with proper formatting
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]';
  console.error(prefix, formatErrorForLogging(error));
}
