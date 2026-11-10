const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('@/app');
const Product = require('@models/Product');
const Category = require('@models/Category');
const Admin = require('@models/Admin');
const ListingCorrection = require('@models/ListingCorrection');
const { signDraft, readDraft, recordCorrection } = require('@/services/ai/listingCorrections');
let db;
const sellerId = new mongoose.Types.ObjectId();
const auth = (role, id = sellerId) => `Bearer ${jwt.sign({ id: String(id), role }, process.env.JWT_SECRET)}`;
const original = { title: 'Patterned Long Dress', category: 'Women', fabric: '', localStyle: '' };
const listing = () => ({ name: 'Adire Bubu Gown', description: 'A loose gown.', price: 10000, category: 'Women',
  stock: 3, fabric: 'Adire', localStyle: 'Bubu', colourVariants: ['Blue and white', 'Green'],
  colourQuantities: [{ colour: 'Blue and white', quantity: 2 }, { colour: 'Green', quantity: 1 }],
  draftProof: signDraft(original, sellerId), images: [] });
beforeAll(async () => {
  db = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  await mongoose.connect(db.getUri());
  await Category.create({ name: 'Women', subCategories: [{ name: 'Dresses' }] });
});
afterAll(async () => { await mongoose.disconnect(); await db.stop(); });
beforeEach(async () => { await ListingCorrection.deleteMany({}); await Product.deleteMany({}); });
it('records publish changes and persists fashion/colour fields', async () => {
  const res = await request(app).post('/api/products').set('Authorization', auth('Seller')).send(listing());
  expect(res.status).toBe(201);
  const saved = await Product.findById(res.body._id);
  expect(saved.fabric).toBe('Adire');
  expect(saved.localStyle).toBe('Bubu');
  expect(saved.colourVariants).toEqual(['Blue and white', 'Green']);
  expect(saved.stock).toBe(3);
  expect(saved.colourQuantities[0].quantity).toBe(2);
  const correction = await ListingCorrection.findOne({ product: saved._id }).lean();
  expect(String(correction.seller)).toBe(String(sellerId));
  expect(correction.changes).toEqual([
    { field: 'title', draftValue: 'Patterned Long Dress', finalValue: 'Adire Bubu Gown' },
    { field: 'fabric', draftValue: '', finalValue: 'Adire' },
    { field: 'localStyle', draftValue: '', finalValue: 'Bubu' },
  ]);
});
it('records category edits as well', async () => {
  await Category.create({ name: 'Men', subCategories: [] });
  const res = await request(app).post('/api/products').set('Authorization', auth('Seller')).send({ ...listing(), category: 'Men' });
  expect(res.status).toBe(201);
  const correction = await ListingCorrection.findOne({ product: res.body._id }).lean();
  expect(correction.changes).toContainEqual({ field: 'category', draftValue: 'Women', finalValue: 'Men' });
});
it('does not record unchanged or manual listings', async () => {
  const payload = { ...listing(), name: original.title, fabric: '', localStyle: '' };
  expect((await request(app).post('/api/products').set('Authorization', auth('Seller')).send(payload)).status).toBe(201);
  delete payload.draftProof;
  expect((await request(app).post('/api/products').set('Authorization', auth('Seller')).send(payload)).status).toBe(201);
  expect(await ListingCorrection.countDocuments()).toBe(0);
});
it.each([
  ['missing', () => undefined],
  ['expired', () => jwt.sign({ purpose: 'listing-correction', sellerId: String(sellerId), original }, process.env.JWT_SECRET, { expiresIn: -1 })],
  ['invalid', () => 'not-a-proof'],
  ['tampered', () => listing().draftProof + 'x'],
  ['another seller', () => signDraft(original, new mongoose.Types.ObjectId())],
])('creates the product but skips the correction for a %s proof', async (_label, proof) => {
  const warn = jest.spyOn(console, 'warn');
  warn.mockClear();
  const draftProof = proof();
  const res = await request(app).post('/api/products').set('Authorization', auth('Seller')).send({ ...listing(), draftProof });
  expect(res.status).toBe(201);
  expect(await Product.findById(res.body._id)).not.toBeNull();
  expect(await ListingCorrection.countDocuments()).toBe(0);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping listing correction'));
  expect(readDraft(draftProof, sellerId)).toBeNull();
});
it('still returns 201 when saving the correction fails', async () => {
  const save = jest.spyOn(ListingCorrection, 'updateOne').mockRejectedValueOnce(new Error('storage unavailable'));
  const warn = jest.spyOn(console, 'warn');
  warn.mockClear();
  try {
    const res = await request(app).post('/api/products').set('Authorization', auth('Seller')).send(listing());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Adire Bubu Gown', category: 'Women', fabric: 'Adire', stock: 3 });
    expect(await Product.findById(res.body._id)).not.toBeNull();
    expect(await ListingCorrection.countDocuments()).toBe(0);
    expect(save).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('publishing is unaffected'));
  } finally { save.mockRestore(); }
});
it('does not log unchanged category and sub-category IDs as corrections', async () => {
  const category = await Category.findOne({ name: 'Women' });
  const product = new Product({ ...listing(), name: original.title, seller: sellerId,
    category: String(category._id), subCategory: String(category.subCategories[0]._id), fabric: '', localStyle: '' });
  await recordCorrection({ ...original, subCategory: 'Dresses' }, product, sellerId);
  expect(await ListingCorrection.countDocuments()).toBe(0);
});
it('compares resolved names and still logs real category changes', async () => {
  const category = await Category.findOne({ name: 'Women' });
  const product = new Product({ ...listing(), name: original.title, seller: sellerId,
    category: String(category._id), subCategory: String(category.subCategories[0]._id), fabric: '', localStyle: '' });
  await recordCorrection({ ...original, category: 'Men', subCategory: 'Tops' }, product, sellerId);
  const correction = await ListingCorrection.findOne({ product: product._id }).lean();
  expect(correction.changes).toEqual([
    { field: 'category', draftValue: 'Men', finalValue: 'Women' },
    { field: 'subCategory', draftValue: 'Tops', finalValue: 'Dresses' },
  ]);
});
it('skips the correction if a category lookup fails', async () => {
  const product = new Product({ ...listing(), seller: sellerId, category: String(new mongoose.Types.ObjectId()) });
  await expect(recordCorrection(original, product, sellerId)).resolves.toBeUndefined();
  expect(await ListingCorrection.countDocuments()).toBe(0);
});
it('rejects invalid per-colour counts', async () => {
  expect((await request(app).post('/api/products').set('Authorization', auth('Seller')).send({ ...listing(), colourQuantities: [{ colour: 'Blue and white', quantity: 1.5 }] })).status).toBe(400);
  expect(await Product.countDocuments()).toBe(0);
});
it('allows only a real admin to list corrections, newest first', async () => {
  const url = '/api/v2/ai/listing-corrections';
  expect((await request(app).get(url)).status).toBe(401);
  for (const role of ['Seller', 'Buyer', 'Admin']) expect((await request(app).get(url).set('Authorization', auth(role))).status).toBe(403);
  const adminId = new mongoose.Types.ObjectId();
  await Admin.collection.insertOne({ _id: adminId, username: 'reviewer' });
  const older = await ListingCorrection.create({ seller: sellerId, product: new mongoose.Types.ObjectId(), changes: [] });
  await ListingCorrection.collection.updateOne({ _id: older._id }, { $set: { createdAt: new Date('2020-01-01') } });
  const newer = await ListingCorrection.create({ seller: sellerId, product: new mongoose.Types.ObjectId(), changes: [] });
  const res = await request(app).get(url).set('Authorization', auth('Admin', adminId));
  expect(res.status).toBe(200);
  expect(res.body.corrections.map((r) => r._id)).toEqual([String(newer._id), String(older._id)]);
});
