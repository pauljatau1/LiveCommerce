const { checkEnv, featureStatus, CORE } = require('@/config/env');

describe('config/env', () => {
  const saved = { ...process.env };
  const log = { warn: jest.fn(), info: jest.fn() };

  afterEach(() => {
    process.env = { ...saved };
    log.warn.mockReset();
    log.info.mockReset();
  });

  it('refuses to start in production without the core secrets', () => {
    process.env.NODE_ENV = 'production';
    for (const name of CORE) delete process.env[name];
    expect(() => checkEnv(log)).toThrow(/Missing required settings: MONGODB_URI, JWT_SECRET, SESSION_SECRET/);
  });

  it('only warns about missing core secrets outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SESSION_SECRET;
    expect(() => checkEnv(log)).not.toThrow();
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('SESSION_SECRET'));
  });

  it('treats blank values as missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://x';
    process.env.JWT_SECRET = '   ';
    process.env.SESSION_SECRET = 's';
    expect(() => checkEnv(log)).toThrow(/JWT_SECRET/);
  });

  it('reports a feature as on only when all of its settings are present', () => {
    process.env.GEMINI_API_KEY = 'key';
    delete process.env.SHIPBUBBLE_API_KEY;
    const status = Object.fromEntries(featureStatus().map((f) => [f.feature, f]));
    expect(status['AI features (Gemini)'].enabled).toBe(true);
    expect(status['Delivery (Shipbubble)']).toMatchObject({ enabled: false, missing: ['SHIPBUBBLE_API_KEY'] });
  });
});
