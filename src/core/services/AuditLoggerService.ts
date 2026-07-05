export interface AuditLog {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId?: string;
  userId: string;
  timestamp: string;
  metadata?: any;
}

export class AuditLoggerService {
  private static logs: AuditLog[] = [];

  public static log(entry: Omit<AuditLog, 'timestamp'>) {
    const logEntry: AuditLog = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    
    // In a real application, this would send logs to a secure, append-only data store
    console.log(`[AUDIT LOG] ${logEntry.timestamp} - ${logEntry.userId} performed ${logEntry.action} on ${logEntry.resource} ${logEntry.resourceId || ''}`);
  }

  public static getRecentLogs(): AuditLog[] {
    return [...this.logs].reverse().slice(0, 100);
  }
}
