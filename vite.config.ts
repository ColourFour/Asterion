import { defineConfig } from 'vite';

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig(() => {
  const isVercelBuild = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

  return {
    base: isVercelBuild ? '/' : './',
  };
});
