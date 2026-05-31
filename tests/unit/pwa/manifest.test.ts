import { describe, it, expect } from 'vitest';
import manifest from '../../../public/manifest.json';

describe('PWA manifest', () => {
  it('has required PWA fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('has file_handlers for .hkinv files', () => {
    expect(manifest.file_handlers).toBeDefined();
    expect(manifest.file_handlers.length).toBeGreaterThanOrEqual(1);

    const handler = manifest.file_handlers[0];
    expect(handler.action).toBe('./#/open-file');
    expect(handler.accept['application/octet-stream']).toContain('.hkinv');
  });

  it('has app shortcuts', () => {
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);

    const names = manifest.shortcuts.map(s => s.name);
    expect(names).toContain('New Invoice');
    expect(names).toContain('Dashboard');
  });

  it('all shortcuts have valid URLs', () => {
    for (const shortcut of manifest.shortcuts) {
      expect(shortcut.url).toMatch(/^\.\/#\//);
    }
  });

  it('file handler has icons', () => {
    const handler = manifest.file_handlers[0];
    expect(handler.icons.length).toBeGreaterThanOrEqual(1);
    expect(handler.icons[0].src).toBeTruthy();
  });
});
