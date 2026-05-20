type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private isTest = import.meta.env.VITEST;

    private formatMessage(level: LogLevel, message: string, context?: unknown): string {
        const timestamp = new Date().toISOString();
        const contextStr = context !== undefined ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }

    debug(message: string, context?: unknown): void {
        if (this.isDevelopment && !this.isTest) {
            console.debug(this.formatMessage('debug', message, context));
        }
    }

    info(message: string, context?: unknown): void {
        if (this.isDevelopment || !this.isTest) {
            console.info(this.formatMessage('info', message, context));
        }
    }

    warn(message: string, context?: unknown): void {
        if (!this.isTest) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }

    error(message: string, error?: unknown, context?: unknown): void {
        if (!this.isTest) {
            const errorInfo = error instanceof Error ?
                { error: error.message, stack: error.stack } :
                { error };
            const fullContext = context !== undefined ? { ...errorInfo, context } : errorInfo;
            console.error(this.formatMessage('error', message, fullContext));
        }
    }
}

export const logger = new Logger();
