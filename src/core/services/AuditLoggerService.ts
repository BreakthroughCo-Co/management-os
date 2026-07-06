import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../../lib/firebase";

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

  public static async log(entry: Omit<AuditLog, 'timestamp'>): Promise<void> {
    const logEntry: AuditLog = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    
    // In a real application, this would send logs to a secure, append-only data store
    console.log(`[AUDIT LOG] ${logEntry.timestamp} - ${logEntry.userId} performed ${logEntry.action} on ${logEntry.resource} ${logEntry.resourceId || ''}`);

    try {
      const functions = getFunctions(app);
      const writeAuditLog = httpsCallable(functions, "writeAuditLog");
      await writeAuditLog(logEntry);
    } catch (error) {
      console.error("[AuditLoggerService] Failed to write audit log via Cloud Function:", error);
    }
  }

  public static getRecentLogs(): AuditLog[] {
    return [...this.logs].reverse().slice(0, 100);
  }
}
