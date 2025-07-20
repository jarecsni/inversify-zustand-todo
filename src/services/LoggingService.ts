import { injectable } from 'inversify';

export type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

export interface ILoggingService {
  info(message: string, data?: LogData): void;
  error(message: string, error?: Error | LogData): void;
  warn(message: string, data?: LogData): void;
}

@injectable()
export class LoggingService implements ILoggingService {
  info(message: string, data?: LogData): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  error(message: string, error?: Error | LogData): void {
    console.error(`[ERROR] ${message}`, error || '');
  }

  warn(message: string, data?: LogData): void {
    console.warn(`[WARN] ${message}`, data || '');
  }
}