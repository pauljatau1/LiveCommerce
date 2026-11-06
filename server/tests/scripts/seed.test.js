const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Category = require('@models/Category');
const MajorCategory = require('@models/MajorCategory');
const Admin = require('@models/Admin');

let mongoServer;
const saved = { ...process.env };

// run() connects itself; keep the test's own connection and skip that call
const connectSpy = jest.spyOn(mongoose, 'connect');
const { run, CATALOGUE, fixStreamLinks } = require('../../scripts/seed');
const Stream = require('@models/Stream');
const { generateStreamLink } = require('@/utils/helpers');

describe('scripts/seed', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    await mongoose.connect(mongoServer.getUri());
    connectSpy.mockImplementation(async () => mongoose);
  });

  afterAll(async () => {
    connectSpy.mockRestore();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    process.env = { ...saved, MONGODB_URI: 'mongodb://seed-test', ADMIN_EMAILS: 'paul@example.com, ops@example.com' };
    await Promise.all([Category.deleteMany({}), MajorCategory.deleteMany({}), Admin.deleteMany({})]);
  });

  afterAll(() => {
    process.env = { ...saved };
  });

  const expectedCategories = CATALOGUE.reduce((n, g) => n + g.categories.length, 0);

  it('creates every category and links them to their group', async () => {
    await run();
    expect(await Category.countDocuments()).toBe(expectedCategories);
    const anime = await MajorCategory.findOne({ name: 'Anime & Manga' }).populate('categories');
    expect(anime.categories.map((c) => c.name)).toContain('Figures');
    const figures = await Category.findOne({ name: 'Figures' });
    expect(figures.subCategories.map((s) => s.name)).toContain('Blind boxes');
  });

  it('is safe to run twice', async () => {
    await run();
    await run();
    expect(await Category.countDocuments()).toBe(expectedCategories);
    expect(await MajorCategory.countDocuments()).toBe(CATALOGUE.length);
  });

  it('creates the first admin only for an allowed email, with a hashed password', async () => {
    Object.assign(process.env, {
      SEED_ADMIN_EMAIL: 'Paul@Example.com',
      SEED_ADMIN_USERNAME: 'paul',
      SEED_ADMIN_PASSWORD: 'correct-horse-battery',
    });
    await run();
    await run();
    const admins = await Admin.find();
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe('paul@example.com');
    expect(admins[0].password).not.toBe('correct-horse-battery');
    expect(await admins[0].comparePassword('correct-horse-battery')).toBe(true);
  });

  it('skips the admin when the email is not in ADMIN_EMAILS', async () => {
    Object.assign(process.env, {
      SEED_ADMIN_EMAIL: 'intruder@example.com',
      SEED_ADMIN_USERNAME: 'intruder',
      SEED_ADMIN_PASSWORD: 'correct-horse-battery',
    });
    await run();
    expect(await Admin.countDocuments()).toBe(0);
  });

  it('rejects a short admin password', async () => {
    Object.assign(process.env, {
      SEED_ADMIN_EMAIL: 'paul@example.com',
      SEED_ADMIN_USERNAME: 'paul',
      SEED_ADMIN_PASSWORD: 'short',
    });
    await expect(run()).rejects.toThrow(/at least 12 characters/);
  });

  it('refuses any admin when ADMIN_EMAILS is empty', async () => {
    process.env.ADMIN_EMAILS = '';
    await expect(
      Admin.create({ email: 'paul@example.com', username: 'paul', password: 'correct-horse-battery' })
    ).rejects.toThrow(/not allowed to register as an admin/);
  });

  describe('show links', () => {
    it('points new and old show links at the buyer app', async () => {
      const seller = new mongoose.Types.ObjectId();
      const old = await Stream.create({ seller, title: 'Old', category: 'Figures', channelName: 'c1', status: 'ended', type: 'open_show', streamLink: 'https://app.auqli.live/livestream/feed?id=x&type=auction' });
      const current = await Stream.create({ seller, title: 'Current', category: 'Figures', channelName: 'c2', status: 'scheduled', type: 'open_show' });
      current.streamLink = generateStreamLink(current._id);
      await current.save();
      expect(current.streamLink).toBe(`https://livecommerce-shop.onrender.com/live/${current._id}`);

      expect(await fixStreamLinks()).toBe(1);
      expect((await Stream.findById(old._id).lean()).streamLink).toBe(`https://livecommerce-shop.onrender.com/live/${old._id}`);
      expect(await fixStreamLinks()).toBe(0);
    });

    it('follows BUYER_APP_URL when the app moves to its own domain', async () => {
      const saved = process.env.BUYER_APP_URL;
      process.env.BUYER_APP_URL = 'https://shop.example.com/';
      try {
        expect(generateStreamLink('abc')).toBe('https://shop.example.com/live/abc');
        await fixStreamLinks();
        const any = await Stream.findOne().lean();
        expect(any.streamLink).toBe(`https://shop.example.com/live/${any._id}`);
      } finally {
        if (saved === undefined) delete process.env.BUYER_APP_URL; else process.env.BUYER_APP_URL = saved;
      }
    });
  });
});
