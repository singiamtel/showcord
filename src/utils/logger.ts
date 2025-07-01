type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private isTest = import.meta.env.VITEST;

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }

    debug(message: string, context?: LogContext): void {
        if (this.isDevelopment && !this.isTest) {
            console.debug(this.formatMessage('debug', message, context));
        }
    }

    info(message: string, context?: LogContext): void {
        if (this.isDevelopment || !this.isTest) {
            console.info(this.formatMessage('info', message, context));
        }
    }

    warn(message: string, context?: LogContext): void {
        if (!this.isTest) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        if (!this.isTest) {
            const errorInfo = error instanceof Error ?
                { error: error.message, stack: error.stack } :
                { error };
            const fullContext = { ...context, ...errorInfo };
            console.error(this.formatMessage('error', message, fullContext));
        }
    }

    // Legacy console methods for gradual migration
    legacyLog(message: string, ...args: any[]): void {
        if (this.isDevelopment && !this.isTest) {
            console.log(message, ...args);
        }
    }

    legacyWarn(message: string, ...args: any[]): void {
        if (!this.isTest) {
            console.warn(message, ...args);
        }
    }

    legacyError(message: string, ...args: any[]): void {
        if (!this.isTest) {
            console.error(message, ...args);
        }
    }
}

export const logger = new Logger();
