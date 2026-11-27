import { readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

for (const directory of ['../', '../extension/']) {
  test(`Chrome can load the unpacked extension from ${directory}`, () => {
    const base = new URL(directory, import.meta.url);
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8'));
    assert.equal(manifest.name, 'XScroll');
    assert.equal(manifest.manifest_version, 3);
    const resources = [
      manifest.action.default_popup,
      manifest.background.service_worker,
      ...Object.values(manifest.icons),
      ...Object.values(manifest.action.default_icon),
      ...manifest.content_scripts.flatMap(script => script.js),
    ];
    for (const resource of resources) assert.ok(statSync(new URL(resource, base)).isFile(), resource);
  });
}
