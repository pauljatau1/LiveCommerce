// Explicitly exercise the retained legacy feature. Default-off cases have their own suite.
beforeEach(()=>{process.env.COLOURS='true';});
afterEach(()=>{delete process.env.COLOURS;});
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mockPost = jest.fn();
const mockGet = jest.fn(async () => ({ status: 200, data: { displayName: 'Gemini Flash' } }));
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, create: jest.fn(() => { const c = actual.create(); c.post = (...a) => mockPost(...a); c.get = (...a) => mockGet(...a); return c; }) };
});

const Category = require('@models/Category');
const { app } = require('@/app');
const { normaliseDraft } = require('@/services/ai/listingDraftService');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');
const geminiReply = (obj) => ({ data: { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] } });
const sellerToken = () => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'Seller' }, process.env.JWT_SECRET);
const buyerToken = () => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'Buyer' }, process.env.JWT_SECRET);
const categories = [{ name: 'Women', subCategories: ['Dresses', 'Tops'] }];

let mongoServer;
const saved = process.env.GEMINI_API_KEY;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
  await Category.create({ name: 'Women', subCategories: [{ name: 'Dresses' }, { name: 'Tops' }] });
  // An older category from the anime catalogue: still in the database, no longer offered
  await Category.create({ name: 'Figures', subCategories: [{ name: 'Prize figures' }] });
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
      title: 'Green Ankara wrap dress', category: 'women', subCategory: 'dresses', condition: 'Fairly used',
      description: 'Ankara wrap dress, worn twice.', tags: ['Ankara', 'dress', 'ankara'],
      priceLowNGN: 9800, priceHighNGN: 15200, estimatedWeightKg: 0.4, confidence: 'medium',
      questions: ['How many do you have?'],
    }));

    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }], note: 'worn twice' });

    expect(res.status).toBe(200);
    expect(res.body.draft).toMatchObject({
      title: 'Green Ankara wrap dress', category: 'Women', subCategory: 'Dresses', condition: 'Fairly used',
      tags: ['ankara', 'dress'], suggestedPrice: { low: 10000, high: 15000, isEstimate: true }, weightKg: 0.4,
    });
    // Always asks about authenticity, even when the model forgets
    expect(res.body.draft.questions).toContain('Is it original or a replica?');
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toMatch(/:generateContent$/);
    const prompt = body.contents[0].parts[0].text;
    expect(prompt).toContain('Women: Dresses, Tops');
    // Older anime categories stay in the database but aren't offered
    expect(prompt).not.toContain('Figures');
    expect(prompt).toContain('Never ask about size');
    expect(prompt).toContain('worn twice');
    expect(body.contents[0].parts[1].inline_data.mime_type).toBe('image/png');
  });

  it('asks for low thinking, and retries without it if the model refuses', async () => {
    mockPost
      .mockRejectedValueOnce({ response: { status: 400, data: { error: { message: 'thinking_level is not supported for this model' } } } })
      .mockResolvedValueOnce(geminiReply({ title: 'x', category: 'Women', condition: 'New with tags', description: 'd', tags: [], confidence: 'high', questions: [] }));

    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });

    expect(res.status).toBe(200);
    expect(mockPost.mock.calls[0][1].generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });
    expect(mockPost.mock.calls[1][1].generationConfig.thinkingConfig).toBeUndefined();
  });

  it('switches to the backup model when the main one is overloaded', async () => {
    mockPost
      .mockRejectedValueOnce({ response: { status: 503, data: { error: { message: 'This model is currently experiencing high demand.' } } } })
      .mockResolvedValueOnce(geminiReply({ title: 'Backup draft', category: 'Women', condition: 'New with tags', description: 'd', tags: [], confidence: 'high', questions: [] }));

    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });

    expect(res.status).toBe(200);
    expect(res.body.draft.title).toBe('Backup draft');
    expect(mockPost.mock.calls[0][0]).toBe('/models/gemini-3.6-flash:generateContent');
    expect(mockPost.mock.calls[1][0]).toBe('/models/gemini-3.5-flash-lite:generateContent');
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
    mockPost.mockResolvedValue(geminiReply({ title: 'Ankara dress', category: 'Women', condition: 'Fairly used', description: 'Short.', tags: [], confidence: 'high', questions: [], priceLowNGN: 99000 }));
    const current = { title: 'Green Ankara wrap dress', category: 'Women', condition: 'Fairly used', description: 'Long.', tags: [], suggestedPrice: { low: 30000, high: 30000, currency: 'NGN' } };

    const res = await request(app).post('/api/v2/ai/listing-draft/refine').set('Authorization', `Bearer ${sellerToken()}`)
      .send({ draft: current, instruction: 'shorter title' });

    expect(res.status).toBe(200);
    expect(res.body.draft.title).toBe('Ankara dress');
    expect(res.body.draft.suggestedPrice).toEqual({ low: 30000, high: 30000, currency: 'NGN' });
  });
});

describe('GET /api/v2/ai/check', () => {
  it('reports timing for a tiny Gemini call without exposing the key', async () => {
    mockPost.mockResolvedValue({ status: 200, data: { candidates: [{ content: { parts: [{ text: 'OK' }] } }] } });
    const res = await request(app).get('/api/v2/ai/check').set('Authorization', `Bearer ${sellerToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ configured: true, thinkingLevel: 'LOW', textTest: { ok: true, reply: 'OK' }, modelInfo: { ok: true, displayName: 'Gemini Flash' } });
    expect(JSON.stringify(res.body)).not.toContain('test-key');
  });
});

describe('normaliseDraft', () => {
  it('drops categories and conditions we do not have', () => {
    const out = normaliseDraft({ title: 'x', category: 'Weapons', condition: 'Brand New', priceLowNGN: 50000, priceHighNGN: 20000, estimatedWeightKg: 900 }, categories);
    expect(out).toMatchObject({ category: null, subCategory: null, condition: null, suggestedPrice: { low: 20000, high: 50000 }, weightKg: 1 });
  });
});

describe('Nigerian fashion drafting', () => {
  const { NIGERIAN_FASHION_GUIDE } = require('@/services/ai/nigerianFashionGuide');
  const { DRAFT_SCHEMA } = require('@/services/ai/listingDraftService');
  it('includes the guide and switches off legacy generation', async () => {
    mockPost.mockResolvedValue(geminiReply({ title: 'Adire Bubu Gown, Indigo', category: 'Women', condition: 'Unknown',
      fabric: 'Adire', localStyle: 'Bubu', fabricConfidence: 'high', styleConfidence: 'high',
      description: 'Loose flowing gown.', tags: ['adire', 'resist-dye', 'bubu', 'gown'], confidence: 'high' }));
    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });
    expect(res.status).toBe(200);
    expect(res.body.draft).toMatchObject({ fabric: 'Adire', localStyle: 'Bubu', title: 'Adire Bubu Gown, Indigo', condition: null });
    const body = mockPost.mock.calls[0][1];
    expect(body.contents[0].parts[0].text).toContain(NIGERIAN_FASHION_GUIDE);
    const properties = body.generationConfig.responseSchema.properties;
    expect(properties).toHaveProperty('fabric');
    expect(properties).toHaveProperty('localStyle');
    expect(properties).not.toHaveProperty('franchise');
    expect(properties).not.toHaveProperty('character');
    expect(DRAFT_SCHEMA.properties).toHaveProperty('franchise');
    expect(DRAFT_SCHEMA.properties).toHaveProperty('character');
    expect(res.body.draft.questions).toContain('Is it new with tags, thrift or fairly used?');
  });
  it('strips colour lists even when Gemini ignores the instruction', async () => {
    mockPost.mockResolvedValue(geminiReply({ title: 'Adire Bubu Gown', category: 'Women', condition: 'Unknown',
      description: 'Loose flowing gown. Available in blue and white, green and yellow, or pink. Wide sleeves.',
      colourVariants: ['Blue and white', 'Green and yellow', 'Pink'], fabric: 'Adire', localStyle: 'Bubu',
      fabricConfidence: 'medium', styleConfidence: 'low', tags: [], confidence: 'medium', questions: ['What size?', 'Which character?'] }));
    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });
    expect(res.status).toBe(200);
    const d = res.body.draft;
    expect(d.colourVariants).toEqual(['Blue and white', 'Green and yellow', 'Pink']);
    expect(d.description).toBe('Loose flowing gown.\nWide sleeves.');
    expect(d.questions).toHaveLength(3);
    expect(d.questions[0]).toBe('How many of each colour?');
    expect(d.questions[1]).toBe('Is it original or a replica?');
    expect(d.questions[2]).toContain('Is it new with tags, thrift or fairly used?');
    expect(d.confirmations).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'fabric', choices: expect.arrayContaining(['Adire', 'Ankara', 'Other']) }),
      expect.objectContaining({ field: 'localStyle' }),
    ]));
    expect(d.questions.join(' ')).not.toMatch(/character|size/i);
  });
  it('uses a neutral description if every sentence lists colours', () => {
    const d = normaliseDraft({ description: 'Indigo, teal and burgundy.', colourVariants: ['Indigo', 'Teal', 'Burgundy'] }, categories);
    expect(d.description).not.toMatch(/indigo|teal|burgundy/i);
    expect(d.description).toBeTruthy();
  });
  it('keeps plain jeans in plain English', async () => {
    mockPost.mockResolvedValue(geminiReply({ title: 'Straight Leg Jeans', category: 'Women', condition: 'Fairly used',
      description: 'Straight-leg jeans with belt loops.', fabric: '', localStyle: '', colourVariants: [],
      tags: ['jeans', 'trousers'], confidence: 'high', questions: [] }));
    const res = await draft({ images: [{ data: PNG, contentType: 'image/png' }] });
    expect(res.status).toBe(200);
    expect(res.body.draft).toMatchObject({ title: 'Straight Leg Jeans', fabric: null, localStyle: null, confirmations: [],
      questions: ['How many do you have?', 'Is it original or a replica?'] });
  });
});

test('off strips model colour fields and only asks for total quantity',()=>{
 delete process.env.COLOURS;
 const ai=require('../../src/services/ai/listingDraftService');const draft=ai.normaliseDraft({title:'Adire Two-Piece – Indigo',colourVariants:['Blue','Red'],questions:['How many of each colour?'],condition:'New with tags'}, []);
 expect(draft).not.toHaveProperty('colourVariants');expect(draft.questions[0]).toBe('How many do you have?');expect(ai.buildInstructions([])).toContain('Never return colour fields');
});

it('off sends Gemini a plain-stock schema and drops colour fields returned by an older model',async()=>{
 delete process.env.COLOURS;mockPost.mockResolvedValue(geminiReply({title:'Adire Two-Piece – Indigo',category:'Women',condition:'New with tags',colourVariants:['Blue','Rust'],questions:['How many of each colour?']}));
 const res=await draft({images:[{data:PNG,contentType:'image/png'}]}).expect(200);
 expect(res.body.draft).not.toHaveProperty('colourVariants');expect(res.body.draft.questions[0]).toBe('How many do you have?');
 const body=mockPost.mock.calls[0][1];expect(body.generationConfig.responseSchema.properties).not.toHaveProperty('colourVariants');expect(body.contents[0].parts[0].text).toContain('Never return colour fields');
});
