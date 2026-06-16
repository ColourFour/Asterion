#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const viteNodeEntry = path.join(repoRoot, 'node_modules', 'vite-node', 'vite-node.mjs');
const worker = path.join(scriptDir, 'run-unit-improvement-loop.ts');

if (!existsSync(viteNodeEntry)) {
  console.error('Missing vite-node. Run npm install before running the unit improvement loop.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteNodeEntry, worker, ...process.argv.slice(2)], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
