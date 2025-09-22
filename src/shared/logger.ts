import pino from 'pino';
import { env } from './env';

const redactedKeys = [
  'password',
  'secret',
  'token',
  'key',
  'authorization',
  'cookie',
  'x-api-key',
  'connectionString',
  'sas',
  'signature'
];

const logger = pino({
  level: env.LOG_LEVEL,
  redact: env.REDACT_SECRETS ? {
    paths: redactedKeys,
    censor: '[REDACTED]'
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss',
      },
    },
  }),
});

export interface LogContext {
  requestId?: string;
  userId?: string;
  container?: string;
  blobName?: string;
  operation?: string;
  duration?: number;
  size?: number;
  [key: string]: unknown;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, extra?: LogContext) {
    const logContext = { ...this.context, ...extra };
    logger[level](logContext, message);
  }

  debug(message: string, extra?: LogContext): void {
    this.log('debug', message, extra);
  }

  info(message: string, extra?: LogContext): void {
    this.log('info', message, extra);
  }

  warn(message: string, extra?: LogContext): void {
    this.log('warn', message, extra);
  }

  error(message: string, error?: Error | unknown, extra?: LogContext): void {
    const errorContext: LogContext = { ...extra };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log('error', message, errorContext);
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

export function logRequest(requestId: string, method: string, url: string, startTime: number): void {
  const duration = Date.now() - startTime;
  logger.info({
    requestId,
    method,
    url,
    duration,
    type: 'request'
  }, `${method} ${url} - ${duration}ms`);
}

export function logError(requestId: string, error: Error, context?: LogContext): void {
  logger.error({
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context
  }, `Request ${requestId} failed: ${error.message}`);
}

export { logger as rootLogger };