/**
 * E2E Global Teardown — Playwright calls this once after all tests.
 *
 * Restores the original compiled main.js from Git if it was patched.
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function log(msg) {
  console.log(`[e2e-teardown] ${msg}`);
}

function restoreMainJs() {
  const mainJsPath = resolve(ROOT, '.vite/build/main.js');
  if (!existsSync(mainJsPath)) {
    log('main.js not found — nothing to restore.');
    return;
  }

  try {
    execSync('git checkout -- .vite/build/main.js', { cwd: ROOT, stdio: 'pipe' });
    log('main.js restored from git.');
  } catch {
    log('Could not restore main.js from git (maybe not tracked).');
  }
}

export default async function globalTeardown() {
  log('Starting E2E teardown...');
  restoreMainJs();
  log('E2E teardown complete!');
}
