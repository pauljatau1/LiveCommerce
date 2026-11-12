// Components that App.jsx renders outside <AppRouter> can't use router hooks:
// doing so throws on start-up and leaves every page blank.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(src, 'App.jsx'), 'utf8');
const outside = [...app.matchAll(/import\s+(\w+)\s+from\s+["']@\/Components\/([\w./]+)["']/g)]
  .map(([, name, file]) => ({ name, file: file.endsWith('.jsx') ? file : `${file}.jsx` }))
  .filter(({ name }) => new RegExp(`<${name}[\\s/>]`).test(app));

test('App.jsx components outside the router do not use router hooks', () => {
  assert.ok(outside.length > 0, 'expected to find components rendered by App.jsx');
  for (const { name, file } of outside) {
    const full = path.join(src, 'Components', file);
    if (!fs.existsSync(full)) continue;
    const code = fs.readFileSync(full, 'utf8');
    assert.ok(!/\buse(Location|Navigate|Params|SearchParams|Match)\s*\(/.test(code), `${name} (${file}) uses a router hook outside <Router>`);
  }
});
