/**
 * E2E Global Setup — Playwright calls this once before all tests.
 *
 * 1. Builds the Vite renderer with relative asset paths (base: '')
 * 2. Patches the compiled main.js to use loadFile instead of dev server URL
 * 3. Verifies the renderer output exists
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function log(msg) {
  console.log(`[e2e-setup] ${msg}`);
}

function buildRenderer() {
  log('Building renderer with E2E config...');
  execSync(
    `npx vite build --config vite.renderer.e2e.config.ts --outDir .vite/renderer/main_window`,
    { cwd: ROOT, stdio: 'pipe' }
  );
  log('Renderer built successfully.');
}

function patchMainJs() {
  const mainJsPath = resolve(ROOT, '.vite/build/main.js');
  if (!existsSync(mainJsPath)) {
    console.error('[e2e-setup] ERROR: .vite/build/main.js not found. Run npm start first.');
    process.exit(1);
  }

  let content = readFileSync(mainJsPath, 'utf-8');

  // Check if it already uses loadFile
  if (content.includes('loadFile(path.join(__dirname')) {
    log('main.js already patched (loadFile).');
    return;
  }

  // Replace loadURL with loadFile
  const urlMatch = content.match(/mainWindow\.loadURL\("([^"]+)"\)/);
  if (!urlMatch) {
    log('main.js does not contain loadURL — nothing to patch.');
    return;
  }

  const devServerUrl = urlMatch[1];
  const fileLoad = `mainWindow.loadFile(path.join(__dirname, "../renderer/main_window/index.html"))`;
  content = content.replace(urlMatch[0], fileLoad);

  writeFileSync(mainJsPath, content, 'utf-8');
  log(`Patched main.js: loadURL("${devServerUrl}") → loadFile(...)`);
}

function verifyOutput() {
  const indexPath = resolve(ROOT, '.vite/renderer/main_window/index.html');
  if (!existsSync(indexPath)) {
    console.error('[e2e-setup] ERROR: Renderer output not found at', indexPath);
    process.exit(1);
  }

  const html = readFileSync(indexPath, 'utf-8');
  if (html.includes('src="/assets/')) {
    console.error('[e2e-setup] ERROR: Built HTML still has absolute asset paths!');
    process.exit(1);
  }

  log('Output verified: relative asset paths detected.');
}

export default async function globalSetup() {
  log('Starting E2E setup...');
  buildRenderer();
  patchMainJs();
  verifyOutput();
  log('E2E setup complete!');
}
