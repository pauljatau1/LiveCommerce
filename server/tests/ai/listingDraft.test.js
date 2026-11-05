const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mockPost = jest.fn();
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, create: jest.fn(() => { const c = actual.create(); c.post = (...a) => mockPost(...a); return c; }) };
});

const Category = require('@models/Category');
const { app } = require('@/app');
const { normaliseDraft } = require('@/services/ai/listingDraftService');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');
const geminiReply = (obj) => ({ data: { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] } });
const sellerToken = () => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'Seller' }, process.env.JWT_SECRET);
const buyerToken = () => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'Buyer' }, process.env.JWT_SECRET);
const categories = [{ name: 'Figures', subCategories: ['Scale figures', 'Prize figures'] }];

let mongoServer;
const saved = process.env.GEMINI_API_KEY;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
  await Category.create({ name: 'Figures', subCategories: [{ name: 'Scale figures' }, { name: 'Prize figures' }] });
});

afterAll(async () => {
  process.env.GEMINI_API_KEY = saved;
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => mockPost.mockReset());

const draft = (body, token = sellerToken()) =>
  request(app).post('/api/v2/ai/listing-draft').set('Authorization', `Bearer ${token}`).send(body);

describe('POST /api/v2/ai/listing-draft', () => {
  it('drafts a listing from a photo, using only our categories', async () => {
    mockPost.mockResolvedValue(geminiReply({
      title: 'Gojo Satoru prize figure', category: 'figures', subCategory: 'prize figures', condition: 'Fairly Used',
      description: 'Gojo figure in his blindfold look.', tags: ['JJK', 'gojo', 'jjk'], franchise: 'Jujutsu Kaisen',
      character: 'Gojo Satoru', priceLowNGN: 24800, priceHighNGN: 40200, estimatedWeightKg: 0.6, confidence: 'medium',
      questions: ['How many do you have?'],
    }));

    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }], note: 'used once' });

    expect(res.status).toBe(200);
    expect(res.body.draft).toMatchObject({
      title: 'Gojo Satoru prize figure', category: 'Figures', subCategory: 'Prize figures', condition: 'Fairly Used',
      tags: ['jjk', 'gojo'], suggestedPrice: { low: 25000, high: 40000, isEstimate: true }, weightKg: 0.6,
    });
    // Always asks about authenticity, even when the model forgets
    expect(res.body.draft.questions.some((q) => /official/i.test(q))).toBe(true);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toMatch(/:generateContent$/);
    expect(body.contents[0].parts[0].text).toContain('Figures: Scale figures, Prize figures');
    expect(body.contents[0].parts[0].text).toContain('used once');
    expect(body.contents[0].parts[1].inline_data.mime_type).toBe('image/png');
  });

  it('asks for low thinking, and retries without it if the model refuses', async () => {
    mockPost
      .mockRejectedValueOnce({ response: { status: 400, data: { error: { message: 'thinking_level is not supported for this model' } } } })
      .mockResolvedValueOnce(geminiReply({ title: 'x', category: 'Figures', condition: 'Brand New', description: 'd', tags: [], confidence: 'high', questions: [] }));

    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });

    expect(res.status).toBe(200);
    expect(mockPost.mock.calls[0][1].generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });
    expect(mockPost.mock.calls[1][1].generationConfig.thinkingConfig).toBeUndefined();
  });

  it('only sellers can use it', async () => {
    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] }, buyerToken());
    expect(res.status).toBe(403);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('rejects missing or unsupported photos before calling the AI', async () => {
    expect((await draft({ images: [] })).status).toBe(400);
    expect((await draft({ images: [{ data: PNG, contentType: 'image/gif' }] })).status).toBe(400);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('gives a friendly fallback message when the AI is busy', async () => {
    mockPost.mockRejectedValue({ response: { status: 429 } });
    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/fill the form yourself/);
  });
});

describe('POST /api/v2/ai/listing-draft/refine', () => {
  it('applies the instruction but keeps the price the seller set', async () => {
    mockPost.mockResolvedValue(geminiReply({ title: 'Gojo figure', category: 'Figures', condition: 'Fairly Used', description: 'Short.', tags: [], confidence: 'high', questions: [], priceLowNGN: 99000 }));
    const current = { title: 'Gojo Satoru prize figure', category: 'Figures', condition: 'Fairly Used', description: 'Long.', tags: [], suggestedPrice: { low: 30000, high: 30000, currency: 'NGN' } };

    const res = await request(app).post('/api/v2/ai/listing-draft/refine').set('Authorization', `Bearer ${sellerToken()}`)
      .send({ draft: current, instruction: 'shorter title' });

    expect(res.status).toBe(200);
    expect(res.body.draft.title).toBe('Gojo figure');
    expect(res.body.draft.suggestedPrice).toEqual({ low: 30000, high: 30000, currency: 'NGN' });
  });
});

describe('normaliseDraft', () => {
  it('drops categories and conditions we do not have', () => {
    const out = normaliseDraft({ title: 'x', category: 'Weapons', condition: 'Mint', priceLowNGN: 50000, priceHighNGN: 20000, estimatedWeightKg: 900 }, categories);
    expect(out).toMatchObject({ category: null, subCategory: null, condition: null, suggestedPrice: { low: 20000, high: 50000 }, weightKg: 1 });
  });
});
