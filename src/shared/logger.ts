import pino from 'pino';
import { env } from '../config/env';

const redactedKeys = [
  'password',
  'secret',
  'token',
  'key',
  'authorization',
  'cookie',
  'connectionString',
  'sas',
  'signature',
  'apiKey',
  'accountKey'
];

// Create logger configuration without transport initially
const baseConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: env.REDACT_SECRETS ? {
    paths: redactedKeys,
    censor: '[REDACTED]'
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Only use pino-pretty in development and when running locally (not in Azure Functions runtime)
let loggerConfig = baseConfig;
if (env.NODE_ENV === 'development' && !process.env.FUNCTIONS_WORKER_RUNTIME) {
  try {
    // Test if pino-pretty is available
    require.resolve('pino-pretty');
    loggerConfig = {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
      },
    };
  } catch (error) {
    // pino-pretty not available, use base config
    console.warn('pino-pretty not available, using basic JSON logging');
  }
}

const logger = pino(loggerConfig);

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