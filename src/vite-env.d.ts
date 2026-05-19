/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASTERION_DASHBOARD_DATA_SOURCE?: string;
  readonly VITE_ASTERION_DASHBOARD_DEMO?: string;
  readonly VITE_ASTERION_STUDENT_CLAIM_SOURCE?: string;
  readonly VITE_ASTERION_STORAGE_MODE?: string;
  readonly VITE_ASSET_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
