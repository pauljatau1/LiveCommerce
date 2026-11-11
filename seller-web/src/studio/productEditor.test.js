import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  editorForm, productPayload, missingFields, weightError, initialWeight, categoryWeight, colourRow,
  WEIGHT_ERROR, WEIGHT_PICKS, DEFAULT_DIMENSIONS,
} from './productEditor.js';

const table = { fallback: 1, categories: { Shoes: 3, Accessories: 0.5 } };
const editorSource = readFileSync(new URL('./ProductEditor.jsx', import.meta.url), 'utf8');

test('the form has no size or dimension fields', () => {
  const p = { _id: 'p1', name: 'Gown', size: 'M', dimensions: '20x10x5', shippingInfo: { dimensions: { length: 20, width: 12, height: 5 }, freeShipping: true, shippingClass: 'express' }, variants: [{ name: 'Size', value: 'M', price: 1, totalStock: 2, images: [] }] };
  const form = editorForm(p);
  for (const key of ['size', 'sizes', 'dimensions', 'length', 'width', 'height', 'freeShipping', 'shippingClass']) assert.equal(key in form, false, key);
  assert.deepEqual(form.colours, [], 'a size variant is not shown as an option');
  // and the screen itself never asks for them
  for (const word of [/\bLength\b/, /\bWidth\b/, /\bHeight\b/, /Free (shipping|delivery)/i, /Shipping class/i, /'Size'/, /Option name/]) assert.equal(word.test(editorSource), false, String(word));
});

test('weight starts from the listing agent, the saved product, or the category', () => {
  assert.deepEqual(initialWeight({ fromDraft: true, weightKg: 2, weight: 1 }), { weight: 2, weightSource: 'agent' });
  assert.deepEqual(initialWeight({ fromDraft: true, weight: 1.5 }), { weight: 1.5, weightSource: 'agent' });
  assert.deepEqual(initialWeight({ _id: 'p', shippingInfo: { weight: { value: 750, unit: 'g' } } }), { weight: 0.75, weightSource: 'saved' });
  assert.deepEqual(initialWeight({ _id: 'p', weight: 2.5 }), { weight: 2.5, weightSource: 'saved' });
  assert.deepEqual(initialWeight({ category: 'Shoes' }, table), { weight: 3, weightSource: 'category' });
  assert.deepEqual(initialWeight({ category: 'Toys' }, table), { weight: 1, weightSource: 'category' });
  assert.deepEqual(initialWeight({}, null), { weight: 1, weightSource: 'category' });
  assert.equal(categoryWeight({ fallback: 2, categories: {} }, 'Men'), 2);
  assert.deepEqual(WEIGHT_PICKS.map(([, kg]) => kg), [0.5, 1, 2, 3]);
  const f = editorForm({ fromDraft: true, weight: 2, category: 'Shoes' }, table);
  assert.equal(f.weight, 2); assert.equal(f.weightSource, 'agent');
});

test('weight must be more than 0 and at most 30 kg', () => {
  for (const ok of [0.1, 1, '2', '0.5', '1,5', 30]) assert.equal(weightError(ok), '', String(ok));
  for (const bad of ['', 0, '0', -1, 30.5, 100, 'abc', null]) assert.equal(weightError(bad), WEIGHT_ERROR, String(bad));
  assert.equal(WEIGHT_ERROR, 'Enter the weight in kg, for example 1');
  const form = editorForm({ name: 'Bag', price: 5000, condition: 'Thrift', category: 'Bags', images: [{ url: 'x' }] });
  assert.deepEqual(missingFields(form), []);
  assert.deepEqual(missingFields({ ...form, weight: 45 }).map((m) => m.key), ['weight']);
  assert.deepEqual(missingFields({ ...form, price: '', condition: '' }).map((m) => m.key), ['price', 'condition']);
});

test('saving keeps the saved dimensions, or the default ones', () => {
  const p = { _id: 'p', name: 'Gown', price: 1000, stock: 1, images: [], shippingInfo: { weight: { value: 1, unit: 'kg' }, dimensions: { length: 20, width: 12, height: 5 }, freeShipping: true, shippingClass: 'express' } };
  const form = editorForm(p); form.weight = '2.5';
  const payload = productPayload(form, p);
  assert.deepEqual(payload.shippingInfo.dimensions, { length: 20, width: 12, height: 5 });
  assert.deepEqual(payload.shippingInfo.weight, { value: 2.5, unit: 'kg' });
  assert.equal(payload.weight, 2.5);
  assert.equal(payload.shippingInfo.freeShipping, true);
  const fresh = productPayload(editorForm({ name: 'Top', price: 500, images: [] }), {});
  assert.deepEqual(fresh.shippingInfo.dimensions, DEFAULT_DIMENSIONS);
  assert.equal(fresh.shippingInfo.freeShipping, false);
  assert.equal(fresh.shippingInfo.shippingClass, 'standard');
});

test('size variants stay saved, colours are edited around them', () => {
  const size = { _id: 's', name: 'Size', value: 'M', price: 9000, totalStock: 2, images: [] };
  const blue = { _id: 'b', name: 'Colour', value: 'Blue', price: 9000, totalStock: 3, images: [{ url: 'https://cdn.test/b.jpg' }], subVariants: [{ _id: 'bs', name: 'Size', value: 'L', stock: 3, images: [] }] };
  const red = { _id: 'r', name: 'Color', value: 'Red', price: 9000, totalStock: 1, images: [] };
  const p = { _id: 'p', name: 'Dress', price: 9000, stock: 6, images: [{ url: 'https://cdn.test/d.jpg' }], variants: [size, blue, red] };
  const form = editorForm(p);
  assert.deepEqual(form.colours.map((c) => c.value), ['Blue', 'Red']);
  // change Blue's stock, remove Red, add Green
  form.colours = [{ ...form.colours[0], stock: 4 }, { ...colourRow(), value: 'Green', stock: 2 }];
  const payload = productPayload(form, p);
  assert.equal(payload.variants.length, 3);
  assert.deepEqual(payload.variants[0], { ...size, images: [] }, 'size variant untouched');
  assert.equal(payload.variants[1]._id, 'b');
  assert.equal(payload.variants[1].totalStock, 4);
  assert.deepEqual(payload.variants[1].subVariants, [{ _id: 'bs', name: 'Size', value: 'L', stock: 3, images: [] }], 'sizes under a colour untouched');
  assert.deepEqual(payload.variants[2], { name: 'Colour', value: 'Green', price: 9000, totalStock: 2, images: [], subVariants: [] });
  assert.equal(payload.stock, 6, 'stock is the total of the colours');
  // a product with only size variants saves them unchanged
  const only = { ...p, variants: [size] };
  assert.deepEqual(productPayload(editorForm(only), only).variants, [{ ...size, images: [] }]);
});
