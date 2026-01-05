/**
 * Centralized error logging utility for secure production error handling.
 * In development, logs full error details.
 * In production, logs only safe generic messages to prevent information leakage.
 */

export const logError = (error: unknown, context?: string): void => {
  if (import.meta.env.DEV) {
    // In development, log full error details for debugging
    console.error(context || 'Error:', error);
  } else {
    // In production, log only safe message to prevent information leakage
    console.error(context || 'Operation failed');
    // Note: For production monitoring, consider integrating with a service like Sentry
    // which can capture full error details server-side without exposing them in browser console
  }
};

/**
 * Extracts a user-friendly message from an error without exposing internal details.
 */
export const getSafeErrorMessage = (error: unknown): string => {
  // Return a generic message for production
  if (!import.meta.env.DEV) {
    return 'Ocorreu um erro. Tente novamente.';
  }
  
  // In development, try to extract a useful message
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Erro desconhecido';
};
