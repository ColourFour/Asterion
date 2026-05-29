export interface StaticPilotRuntimeEnv {
  VITE_CHINA_STATIC_PILOT?: string | boolean;
}

function envString(value: string | boolean | undefined): string | undefined {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

export function isChinaStaticPilotMode(env: StaticPilotRuntimeEnv = import.meta.env): boolean {
  const normalized = envString(env.VITE_CHINA_STATIC_PILOT);
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'enabled';
}
