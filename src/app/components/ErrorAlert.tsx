// Error Display Component
// Reusable component for displaying API errors with proper styling

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, WifiOff, Lock, AlertTriangle, Info } from 'lucide-react';
import { VoizmaticApiError } from '../services/api';
import {
  getErrorMessage,
  getErrorActionMessage,
  getErrorSeverity,
  isNetworkError,
  isAuthError,
  isValidationError,
  type ErrorSeverity,
} from '../utils/errorHandling';

interface ErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ error, onRetry, className = '' }: ErrorAlertProps) {
  if (!error) return null;

  const severity = getErrorSeverity(error);
  const message = getErrorMessage(error);
  const actionMessage = getErrorActionMessage(error);

  // Determine icon and styling based on error type
  const getIcon = () => {
    if (isNetworkError(error)) return <WifiOff className="h-5 w-5" />;
    if (isAuthError(error)) return <Lock className="h-5 w-5" />;
    if (isValidationError(error)) return <AlertTriangle className="h-5 w-5" />;
    if (severity === 'info') return <Info className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const getSeverityClass = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 text-red-900';
      case 'error':
        return 'border-red-400 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-400 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-400 bg-blue-50 text-blue-800';
      default:
        return 'border-red-400 bg-red-50 text-red-800';
    }
  };

  const getTitle = () => {
    if (isNetworkError(error)) return 'Connection Error';
    if (isAuthError(error)) return 'Authentication Required';
    if (isValidationError(error)) return 'Validation Error';
    if (severity === 'critical') return 'Server Error';
    if (severity === 'warning') return 'Warning';
    if (severity === 'info') return 'Notice';
    return 'Error';
  };

  // For validation errors, show formatted field errors
  const getErrorContent = () => {
    if (error instanceof VoizmaticApiError && error.validationErrors) {
      return (
        <div className="space-y-2 mt-2">
          <p className="font-medium">{message}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {error.validationErrors.map((ve, idx) => {
              const field = ve.loc.slice(1).join('.') || 'field';
              return (
                <li key={idx} className="text-sm">
                  <span className="font-semibold">{field}:</span> {ve.msg}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    return <p>{message}</p>;
  };

  return (
    <Alert className={`${getSeverityClass()} ${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-2 font-semibold">{getTitle()}</AlertTitle>
          <AlertDescription className="space-y-2">
            {getErrorContent()}
            <p className="text-sm mt-2 opacity-80">{actionMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 bg-white border border-current rounded hover:bg-opacity-10 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Inline error message (smaller, for form fields)
interface InlineErrorProps {
  error: unknown;
  className?: string;
}

export function InlineError({ error, className = '' }: InlineErrorProps) {
  if (!error) return null;

  const message = getErrorMessage(error);
  const isValidation = isValidationError(error);

  return (
    <div className={`text-sm text-red-600 mt-1 flex items-start gap-1 ${className}`}>
      {isValidation ? (
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
