import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {missingIcons} from '../../../shared/iconContract.mjs';
test('every studio Icon name is defined',()=>assert.deepEqual(missingIcons(fileURLToPath(new URL('.',import.meta.url)),fileURLToPath(new URL('./ui.jsx',import.meta.url))),[]));
