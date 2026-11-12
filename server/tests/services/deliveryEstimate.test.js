const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('@/services/shipbubble', () => ({
  isConfigured: jest.fn(() => true),
  validateAddress: jest.fn(async ({ address }) => ({ address_code: address.startsWith('Lekki') ? 111 : 222 })),
  boxFor: jest.fn(async () => ({ length: 20, width: 15, height: 10 })),
  pickupDate: jest.fn(() => '2026-11-15'),
  categoryIdFor: jest.fn(async () => 7),
  fetchRates: jest.fn(async () => ({ couriers: [{ courier_name: 'Kwik', rate_card_amount: 2650, delivery_eta: '1-2 days' }, { courier_name: 'GIG', rate_card_amount: 3100 }] })),
}));

const shipbubble = require('@/services/shipbubble');
const Seller = require('@models/Seller');
const DeliveryEstimate = require('@/models/DeliveryEstimate');
const { estimate, EstimateUnavailable } = require('@/services/deliveryEstimate');

let mongoServer; let sellerId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });
beforeEach(async () => {
  jest.clearAllMocks();
  await Promise.all([Seller.deleteMany({}), DeliveryEstimate.deleteMany({})]);
  sellerId = (await Seller.collection.insertOne({
    storeName: 'Tolu Thrift', email: 't@example.com', phoneNumber: '08031234567', agoraUid: 9,
    businessAddress: { addressLine1: '14 Herbert Macaulay Way', city: 'Yaba', state: 'Lagos' },
    shipbubbleAddress: { code: 999, key: '14 Herbert Macaulay Way, Yaba, Lagos Mainland, Lagos, Nigeria|08031234567' },
  })).insertedId;
});

describe('delivery estimate', () => {
  it('quotes the cheapest courier from the host area to the buyer area, rounded up to ₦100', async () => {
    const est = await estimate({ sellerId, city: 'Lekki', state: 'Lagos' });
    expect(est).toMatchObject({ amount: 2700, area: 'Lekki', courierName: 'Kwik', cached: false });
    expect(shipbubble.validateAddress).toHaveBeenCalledWith(expect.objectContaining({address:'Lekki, Eti-Osa, Lagos, Nigeria'}));
    expect(shipbubble.fetchRates).toHaveBeenCalledWith(expect.objectContaining({ sender_address_code: 999, reciever_address_code: 111 }));
  });

  it('caches per seller-area → buyer-area pair', async () => {
    await estimate({ sellerId, city: 'Lekki', state: 'Lagos' });
    const again = await estimate({ sellerId, city: ' lekki ', state: 'LAGOS' });
    expect(again).toMatchObject({ amount: 2700, cached: true });
    expect(shipbubble.fetchRates).toHaveBeenCalledTimes(1);
    await estimate({ sellerId, city: 'Wuse 2', state: 'FCT' });
    expect(shipbubble.fetchRates).toHaveBeenCalledTimes(2);
    expect(await DeliveryEstimate.countDocuments({ kind: 'quote' })).toBe(2);
  });

  it('says plainly why there is no estimate', async () => {
    await expect(estimate({ sellerId, city: '', state: 'Lagos' })).rejects.toThrow('Pick your state and area');
    shipbubble.isConfigured.mockReturnValueOnce(false);
    await expect(estimate({ sellerId, city: 'Lekki', state: 'Lagos' })).rejects.toThrow("aren't switched on");
    shipbubble.fetchRates.mockResolvedValueOnce({ couriers: [] });
    await expect(estimate({ sellerId, city: 'Ikeja', state: 'Lagos' })).rejects.toThrow('No courier covers this area');
    shipbubble.fetchRates.mockRejectedValueOnce(new Error('timeout'));
    const err = await estimate({ sellerId, city: 'Surulere', state: 'Lagos' }).catch((e) => e);
    expect(err).toBeInstanceOf(EstimateUnavailable);
    expect(err.message).toMatch(/confirmed after the show/);
  });
});
