interface ErrorLog {
  timestamp: string;
  error: string;
  context?: Record<string, any>;
}

const MAX_ERROR_LOGS = 100;
const errorLogs: ErrorLog[] = [];

export const logDatabaseError = (error: unknown, context?: Record<string, any>) => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : JSON.stringify(error),
    context
  };

  console.error('[Database Error]', errorLog);
  errorLogs.unshift(errorLog);
  
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.pop();
  }

  // Check for potential connectivity issues
  if (error instanceof Error && 
    (error.message.includes('connection') || 
     error.message.includes('network') ||
     error.message.includes('timeout'))) {
    console.warn('[Connection Issue Detected]', {
      timestamp: errorLog.timestamp,
      message: error.message
    });
  }
};

export const getRecentErrors = (limit = 10) => {
  return errorLogs.slice(0, limit);
};

export const clearErrorLogs = () => {
  errorLogs.length = 0;
};