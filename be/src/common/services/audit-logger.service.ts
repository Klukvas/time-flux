import { Injectable, Logger } from '@nestjs/common';

export type AuditEvent =
  | 'USER_REGISTERED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'GOOGLE_LOGIN'
  | 'TOKEN_REFRESHED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_CANCELLED';

interface AuditEntry {
  readonly event: AuditEvent;
  readonly userId?: string;
  readonly email?: string;
  readonly metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger('Audit');

  log(entry: AuditEntry): void {
    this.logger.log({
      msg: `[AUDIT] ${entry.event}`,
      audit: true,
      event: entry.event,
      userId: entry.userId,
      email: entry.email,
      metadata: entry.metadata,
    });
  }
}
