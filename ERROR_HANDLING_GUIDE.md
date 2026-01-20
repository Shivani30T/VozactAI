# API Error Handling Guide

## Overview

This guide explains how the application handles API errors and warnings from the Voizmatic backend API (`https://api.voizmatic.com`).

## Error Handling Architecture

### 1. Custom Error Class: `VoizmaticApiError`

Located in `src/app/services/api.ts`, this custom error class extends the standard JavaScript `Error` and includes additional properties:

```typescript
class VoizmaticApiError extends Error {
  status?: number;              // HTTP status code
  statusText?: string;          // HTTP status text
  validationErrors?: ValidationError[];  // 422 validation errors
}
```

### 2. Error Types (OpenAPI Schema)

**ValidationError** - Field-level validation errors (HTTP 422):
```typescript
interface ValidationError {
  loc: (string | number)[];  // Field location path
  msg: string;               // Error message
  type: string;              // Error type
}
```

**HTTPValidationError** - Contains array of ValidationError:
```typescript
interface HTTPValidationError {
  detail: ValidationError[];
}
```

## HTTP Status Code Handling

### Status Codes and Messages

| Status Code | Error Type | Message | Action |
|------------|-----------|---------|--------|
| 400 | Bad Request | "Bad request. Please check your input." | Review input data |
| 401 | Unauthorized | "Session expired or invalid. Please login again." | Auto-redirect to login |
| 403 | Forbidden | "Access forbidden. You do not have permission..." | Contact administrator |
| 404 | Not Found | "Resource not found." | Check resource ID |
| 422 | Validation Error | Field-specific validation messages | Fix validation errors |
| 429 | Rate Limit | "Too many requests. Please try again later." | Wait and retry |
| 500 | Server Error | "Internal server error. Please try again later." | Retry or contact support |
| 502 | Bad Gateway | "The server is temporarily unavailable." | Retry later |
| 503 | Service Unavailable | "Service unavailable. Please try again later." | Retry later |
| 504 | Gateway Timeout | "The request took too long." | Retry or check parameters |

### Network Errors

Network failures (e.g., no internet, DNS failure) are detected and wrapped with:
```
"Network error. Please check your internet connection."
```

## Error Handling in API Calls

### 1. Automatic Error Parsing

The `apiCall()`, `apiUpload()`, `apiDownload()`, and `apiDownloadBlob()` functions automatically:

1. Parse JSON error responses from the API
2. Extract `detail` field (string or ValidationError array)
3. Create user-friendly error messages
4. Throw `VoizmaticApiError` with full context

### 2. 401 Unauthorized Auto-Redirect

When a 401 error occurs:
1. Auth token is cleared from localStorage
2. User is redirected to login page (after 100ms delay)
3. Error is thrown with session expired message

### 3. Validation Error Formatting

For 422 Validation Errors, the error message combines all field errors:
```
"phone: Must be a valid phone number; email: Invalid email format"
```

## Using Error Handling in Components

### Import Error Utilities

```typescript
import { VoizmaticApiError } from '../services/api';
import { 
  getErrorMessage, 
  getErrorActionMessage,
  isValidationError,
  logError 
} from '../utils/errorHandling';
import { ErrorAlert } from '../components/ErrorAlert';
```

### Basic Try-Catch Pattern

```typescript
const [error, setError] = useState<unknown>(null);
const [isLoading, setIsLoading] = useState(false);

const handleApiCall = async () => {
  try {
    setError(null);
    setIsLoading(true);
    
    const result = await api.someEndpoint.call();
    // Handle success
    
  } catch (err) {
    setError(err);
    logError(err, 'handleApiCall');
  } finally {
    setIsLoading(false);
  }
};
```

### Display Error with ErrorAlert Component

```typescript
{error && (
  <ErrorAlert 
    error={error} 
    onRetry={() => {
      setError(null);
      handleApiCall();
    }}
  />
)}
```

### Display Inline Validation Errors

```typescript
import { InlineError } from '../components/ErrorAlert';

{fieldError && <InlineError error={fieldError} />}
```

### Manual Error Message Extraction

```typescript
import { getErrorMessage } from '../utils/errorHandling';

catch (err) {
  const message = getErrorMessage(err);
  alert(message);  // or show in UI
}
```

## Error Utility Functions

### `getErrorMessage(error: unknown): string`
Extracts user-friendly error message from any error type.

### `getErrorActionMessage(error: unknown): string`
Returns recommended action message for the user.

### `getErrorSeverity(error: unknown): ErrorSeverity`
Returns severity level: 'info' | 'warning' | 'error' | 'critical'

### `isValidationError(error: unknown): boolean`
Checks if error is a 422 validation error.

### `isNetworkError(error: unknown): boolean`
Checks if error is a network connectivity issue.

### `isAuthError(error: unknown): boolean`
Checks if error is a 401 authentication error.

### `isPermissionError(error: unknown): boolean`
Checks if error is a 403 permission error.

### `isNotFoundError(error: unknown): boolean`
Checks if error is a 404 not found error.

### `isServerError(error: unknown): boolean`
Checks if error is a 500+ server error.

### `logError(error: unknown, context?: string): void`
Logs error to console with proper formatting for debugging.

## Example: Handling Different Error Types

```typescript
const handleSubmit = async () => {
  try {
    await api.contacts.create(formData);
    alert('Success!');
  } catch (err) {
    if (isValidationError(err)) {
      // Show field-specific errors
      setFormErrors(err);
    } else if (isNetworkError(err)) {
      // Show network error with retry button
      setNetworkError(err);
    } else if (isAuthError(err)) {
      // Will auto-redirect to login
      // Just log it
      logError(err, 'handleSubmit');
    } else {
      // Generic error display
      alert(getErrorMessage(err));
    }
  }
};
```

## Testing Error Scenarios

### Test 401 Unauthorized
- Let token expire or manually clear it
- Make any authenticated API call
- Should redirect to login automatically

### Test 422 Validation Error
- Upload contacts file with invalid data
- Missing required fields
- Should show field-specific error messages

### Test Network Error
- Disable internet connection
- Make any API call
- Should show "Network error" message

### Test 500 Server Error
- Backend returns 500 (server issue)
- Should show "Internal server error" message

## Best Practices

1. **Always wrap API calls in try-catch**
   ```typescript
   try {
     await api.someCall();
   } catch (err) {
     logError(err, 'componentName.functionName');
     setError(err);
   }
   ```

2. **Use ErrorAlert component for full error display**
   - Shows icon based on error type
   - Includes actionable message
   - Optional retry button

3. **Use InlineError for form validation**
   - Smaller, inline display
   - Validation icon
   - Field-level errors

4. **Log errors for debugging**
   ```typescript
   logError(error, 'LoginScreen.handleLogin');
   ```

5. **Clear errors before retry**
   ```typescript
   const handleRetry = () => {
     setError(null);
     performAction();
   };
   ```

6. **Don't show auth errors to user**
   - 401 errors auto-redirect
   - Just log them for debugging

7. **Provide context in error logs**
   ```typescript
   logError(err, 'Dashboard.fetchReports');
   // vs just
   console.error(err);
   ```

## API Endpoint Error Responses

All endpoints follow OpenAPI 3.1.0 specification:

### Success Response (200)
```json
{
  "data": { ... }
}
```

### Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

### Generic Error (400, 403, 404, 500)
```json
{
  "detail": "Error message string"
}
```

## Summary

The error handling system provides:

✅ **Comprehensive error parsing** - All HTTP status codes handled
✅ **Validation error formatting** - Field-level error messages
✅ **Network error detection** - Connectivity issues caught
✅ **Auto-redirect on auth failure** - 401 handled automatically
✅ **User-friendly messages** - Technical errors translated
✅ **Reusable components** - ErrorAlert & InlineError
✅ **Utility functions** - Easy error type detection
✅ **Debugging support** - Structured error logging

This ensures all API errors and warnings are properly handled and displayed to users with actionable guidance.
