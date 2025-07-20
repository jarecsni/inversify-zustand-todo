import { injectable } from 'inversify';
import { ILoggingService, LogData } from '../services/LoggingService';

@injectable()
export class MockLoggingService implements ILoggingService {
  public infoLogs: Array<{ message: string; data?: LogData }> = [];
  public errorLogs: Array<{ message: string; error?: Error | LogData }> = [];
  public warnLogs: Array<{ message: string; data?: LogData }> = [];

  info(message: string, data?: LogData): void {
    this.infoLogs.push({ message, data });
  }

  error(message: string, error?: Error | LogData): void {
    this.errorLogs.push({ message, error });
  }

  warn(message: string, data?: LogData): void {
    this.warnLogs.push({ message, data });
  }

  // Helper methods for testing
  getLastInfoLog() {
    return this.infoLogs[this.infoLogs.length - 1];
  }

  getLastErrorLog() {
    return this.errorLogs[this.errorLogs.length - 1];
  }

  getLastWarnLog() {
    return this.warnLogs[this.warnLogs.length - 1];
  }

  clear() {
    this.infoLogs = [];
    this.errorLogs = [];
    this.warnLogs = [];
  }

  getTotalLogCount() {
    return this.infoLogs.length + this.errorLogs.length + this.warnLogs.length;
  }
}