export type DashboardDataServiceErrorCode =
  | 'auth_required'
  | 'config_missing'
  | 'config_invalid'
  | 'supabase_unavailable'
  | 'read_failed'
  | 'write_failed'
  | 'not_found'
  | 'read_only';

export class DashboardDataServiceError extends Error {
  readonly code: DashboardDataServiceErrorCode;
  readonly safeMessage: string;

  constructor(code: DashboardDataServiceErrorCode, safeMessage: string, cause?: unknown) {
    super(safeMessage);
    this.name = 'DashboardDataServiceError';
    this.code = code;
    this.safeMessage = safeMessage;
    void cause;
  }
}

export function isDashboardDataServiceError(error: unknown): error is DashboardDataServiceError {
  return error instanceof DashboardDataServiceError;
}
