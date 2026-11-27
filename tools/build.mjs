import { build } from 'esbuild';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(root, 'extension');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'static'), output, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: {
    observe: 'src/browser/observe.js',
    content: 'src/browser/content.js',
    background: 'src/browser/background.js',
    'popup/popup': 'src/browser/popup.js',
  },
  outdir: output, bundle: true, format: 'iife', platform: 'browser',
  target: 'chrome121', minify: true, legalComments: 'none',
  loader: { '.css': 'text', '.svg': 'text', '.png': 'dataurl' },
});

const dependencies = ['lucide-static', '@floating-ui/dom', '@floating-ui/core', '@floating-ui/utils'];
const licenses = await Promise.all(dependencies.map(async name => {
  const license = await readFile(path.join(root, 'node_modules', name, 'LICENSE'), 'utf8');
  return `${name}\n\n${license.trim()}`;
}));
await cp(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'));
await writeFile(path.join(output, 'THIRD_PARTY_LICENSES.txt'), licenses.join('\n\n----------------\n\n') + '\n');

const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
const prefix = value => `extension/${value}`;
const icons = values => Object.fromEntries(Object.entries(values).map(([size, value]) => [size, prefix(value)]));
const rootManifest = {
  ...manifest,
  icons: icons(manifest.icons),
  background: { ...manifest.background, service_worker: prefix(manifest.background.service_worker) },
  action: { ...manifest.action, default_popup: prefix(manifest.action.default_popup), default_icon: icons(manifest.action.default_icon) },
  content_scripts: manifest.content_scripts.map(script => ({ ...script, js: script.js.map(prefix) })),
};
await writeFile(path.join(root, 'manifest.json'), JSON.stringify(rootManifest, null, 2) + '\n');

if (process.argv.includes('--zip')) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'xscroll-'));
  const portable = path.join(temporary, 'portable');
  function zip(directory, filename) {
    const archive = path.join(temporary, filename);
    const result = spawnSync('zip', ['-q', '-r', archive, '.'], { cwd: directory, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw result.error || new Error('Couldn’t create the release archive.');
    return archive;
  }
  try {
    const versioned = zip(output, `xscroll-${manifest.version}.zip`);
    await cp(output, portable, { recursive: true });
    for (const file of ['Install-XScroll.ps1', 'Installer-XScroll.cmd']) {
      await cp(path.join(root, file), path.join(portable, file));
    }
    await cp(path.join(root, 'remote'), path.join(portable, 'remote'), { recursive: true });
    const download = zip(portable, 'XScroll.zip');
    await mkdir(path.join(root, 'dist'), { recursive: true });
    await mkdir(path.join(root, 'downloads'), { recursive: true });
    await cp(versioned, path.join(root, 'dist', path.basename(versioned)));
    await cp(download, path.join(root, 'downloads', 'XScroll.zip'));
    console.log('downloads/XScroll.zip');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
} else {
  console.log('Ready to load from the project root or extension/.');
}
