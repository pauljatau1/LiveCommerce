import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {missingIcons} from '../../shared/iconContract.mjs';
test('every shop Icon name is defined',()=>assert.deepEqual(missingIcons(fileURLToPath(new URL('../src',import.meta.url)),fileURLToPath(new URL('../src/components/ui.jsx',import.meta.url))),[]));
