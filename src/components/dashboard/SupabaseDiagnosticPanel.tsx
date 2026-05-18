import { useState } from 'react';
import { checkSupabaseHealth, type SupabaseHealthResult } from '../../lib/supabaseHealth';
import { supabaseConfig } from '../../lib/supabaseConfig';

function statusLabel(result: SupabaseHealthResult | undefined): string {
  if (!result) {
    if (supabaseConfig.missing.length > 0) return 'Missing config';
    if (!supabaseConfig.isConfigured) return 'Failed';
    return 'Configured';
  }
  if (result.status === 'connected') return 'Connected';
  if (result.status === 'disabled') return result.reason === 'missing-config' ? 'Missing config' : 'Failed';
  return 'Failed';
}

function statusDetail(result: SupabaseHealthResult | undefined): string {
  if (!result) {
    if (supabaseConfig.missing.length > 0) return 'Browser-safe Supabase config is missing. Dashboard data remains mock/local.';
    if (!supabaseConfig.isConfigured) return 'Browser-safe Supabase config is invalid. Dashboard data remains mock/local.';
    return 'Browser-safe Supabase config is present. Dashboard data remains mock/local.';
  }
  if (result.status === 'connected') return `${result.payload.service} ${result.payload.schema_phase} checked at ${new Date(result.payload.checked_at).toLocaleString()}.`;
  return result.message;
}

export function SupabaseDiagnosticPanel() {
  const [result, setResult] = useState<SupabaseHealthResult>();
  const [checking, setChecking] = useState(false);

  async function handleCheckConnection() {
    setChecking(true);
    try {
      setResult(await checkSupabaseHealth());
    } finally {
      setChecking(false);
    }
  }

  const label = statusLabel(result);

  return (
    <section className="dashboard-section supabase-diagnostic-panel" aria-label="Supabase diagnostic">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Diagnostics</span>
          <h2>Supabase diagnostic</h2>
        </div>
        <strong className={`diagnostic-status diagnostic-${result?.status ?? 'idle'}`}>{checking ? 'Checking' : label}</strong>
      </div>
      <p>{statusDetail(result)}</p>
      <div className="admin-action-row">
        <button type="button" className="quiet-button" onClick={handleCheckConnection} disabled={checking}>
          {checking ? 'Checking connection' : 'Check connection'}
        </button>
      </div>
    </section>
  );
}
