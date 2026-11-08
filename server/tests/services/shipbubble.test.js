const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, create: jest.fn(() => ({ get: (...a) => mockGet(...a), post: (...a) => mockPost(...a) })) };
});
const shipbubble = require('@/services/shipbubble');

describe('shipbubble client', () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.SHIPBUBBLE_API_KEY = 'sb_sandbox_test';
    delete process.env.SHIPBUBBLE_COURIERS;
    mockGet.mockReset(); mockPost.mockReset();
    shipbubble._resetCache();
  });
  afterAll(() => { process.env = saved; });

  it('schedules for tomorrow after 6pm Lagos time', () => {
    expect(shipbubble.pickupDate(new Date('2026-11-06T16:30:00Z'))).toBe('2026-11-06'); // 5:30pm Lagos
    expect(shipbubble.pickupDate(new Date('2026-11-06T17:05:00Z'))).toBe('2026-11-07'); // 6:05pm Lagos
  });

  it('formats Nigerian phone numbers', () => {
    expect(shipbubble.toPhone('08031234567')).toBe('+2348031234567');
    expect(shipbubble.toPhone('8031234567')).toBe('+2348031234567');
    expect(shipbubble.toPhone('+234 803 123 4567')).toBe('+2348031234567');
  });

  it('picks the smallest box that carries the weight', async () => {
    mockGet.mockResolvedValue({ data: { status: 'success', data: [
      { box_size_id: 1, name: 'tiny', length: 5, width: 5, height: 2, max_weight: 1 },
      { box_size_id: 2, name: 'small', length: 20, width: 15, height: 10, max_weight: 3 },
      { box_size_id: 3, name: 'large', length: 50, width: 40, height: 30, max_weight: 20 },
    ] } });
    expect(await shipbubble.boxFor(0.5, 1)).toEqual({ length: 5, width: 5, height: 2 });
    expect(await shipbubble.boxFor(0.5, 3)).toEqual({ length: 20, width: 15, height: 10 });
    expect(await shipbubble.boxFor(8, 2)).toEqual({ length: 50, width: 40, height: 30 });
    expect(mockGet).toHaveBeenCalledTimes(1); // cached
  });

  it('quotes only the chosen couriers when SHIPBUBBLE_COURIERS is set', async () => {
    mockPost.mockResolvedValue({ data: { status: 'success', data: { request_token: 't', couriers: [] } } });
    await shipbubble.fetchRates({});
    process.env.SHIPBUBBLE_COURIERS = 'gigl, kwik';
    await shipbubble.fetchRates({});
    expect(mockPost.mock.calls[0][0]).toBe('/shipping/fetch_rates');
    expect(mockPost.mock.calls[1][0]).toBe('/shipping/fetch_rates/gigl,kwik');
  });

  it('turns Shipbubble errors into readable messages', async () => {
    mockPost.mockRejectedValue({ response: { status: 422, data: { status: 'failed', message: 'Invalid', errors: ['phone is required'] } } });
    await expect(shipbubble.validateAddress({ name: 'A', email: 'a@b.c', phone: '', address: 'x' })).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/phone is required/) });
  });

  it('refuses to call Shipbubble without a key', async () => {
    delete process.env.SHIPBUBBLE_API_KEY;
    await expect(shipbubble.fetchRates({})).rejects.toMatchObject({ status: 503 });
    expect(mockPost).not.toHaveBeenCalled();
  });
});
