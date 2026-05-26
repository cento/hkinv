import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// E2E test build config: uses base: '' so that the built HTML uses relative
// asset paths (assets/foo.js) instead of absolute ones (/assets/foo.js).
// This is required because Electron loads the file via file:// protocol.
export default defineConfig({
  plugins: [react()],
  base: '',
});
