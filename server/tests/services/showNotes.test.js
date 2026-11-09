const notes = require('@/services/showNotes');

describe('show notes rules', () => {
  it('always starts Payment and safety with "Never pay outside the app.", once', () => {
    expect(notes.normalise({}).payment).toBe('Never pay outside the app.');
    expect(notes.normalise({ payment: 'never pay outside the app. Bids are held.' }).payment).toBe('Never pay outside the app. Bids are held.');
  });

  it('refuses links, phone and account numbers in plain words', () => {
    expect(() => notes.normalise({ delivery: 'call 08031234567' })).toThrow('Take out the phone numbers in "Delivery"');
    expect(() => notes.normalise({ fromSeller: 'follow ig.com/tolu' })).toThrow('links in "From the seller"');
    expect(() => notes.normalise({ payment: 'pay 0123456789' })).toThrow('account numbers');
  });

  it('keeps all of it to 600 characters', () => {
    expect(() => notes.normalise({ fromSeller: 'x'.repeat(600) })).toThrow(/600 characters/);
  });

  it('gives buyers a short first line', () => {
    expect(notes.firstLine({ howToBuy: 'Tap Bid to bid. Highest wins.' })).toBe('Tap Bid to bid.');
    expect(notes.firstLine({ howToBuy: '', delivery: 'We ship from Yaba.' })).toBe('We ship from Yaba.');
  });
});

describe('drafting', () => {
  it('uses the AI when it is on, and checks what it wrote', async () => {
    const gemini = { isConfigured: () => true, callGemini: jest.fn(async () => ({ howToBuy: 'Tap Bid.', delivery: 'One fee.', payment: 'Bids are held.', sizes: 'Sizes in titles.', fromSeller: 'Welcome.' })) };
    const out = await notes.draft({ title: 'Saturday thrift', type: 'auction', items: [{ name: 'Ankara dress', price: 9000 }] }, { gemini });
    expect(out.ai).toBe(true);
    expect(out.notes.payment).toBe('Never pay outside the app. Bids are held.');
    expect(gemini.callGemini.mock.calls[0][0][0].text).toContain('Ankara dress');
  });

  it('falls back to a plain draft when the AI is off or writes something unsafe', async () => {
    expect((await notes.draft({ type: 'drop' }, { gemini: { isConfigured: () => false } })).ai).toBe(false);
    const unsafe = { isConfigured: () => true, callGemini: async () => ({ howToBuy: 'DM 08031234567', delivery: '', payment: '', sizes: '', fromSeller: '' }) };
    const out = await notes.draft({ type: 'auction', auctionSeconds: 60 }, { gemini: unsafe });
    expect(out.ai).toBe(false);
    expect(out.notes.howToBuy).toContain('60 seconds');
  });
});

describe('suggestions from chat', () => {
  it('after 3 different people ask about delivery to the same place, offers a line once', () => {
    let t = 0;
    const s = notes.createSuggester({ now: () => t });
    expect(s.observe('s1', 'a', 'delivery to Port Harcourt how much?')).toBeNull();
    expect(s.observe('s1', 'a', 'delivery to Port Harcourt?')).toBeNull(); // same person again
    expect(s.observe('s1', 'b', 'do you deliver to Port Harcourt')).toBeNull();
    t += 1000;
    const hit = s.observe('s1', 'c', 'abeg una dey ship to Port Harcourt?');
    expect(hit).toMatchObject({ topic: 'delivery', section: 'delivery', place: 'Port Harcourt', count: 3, text: '3 people asked about delivery to Port Harcourt. Add it?' });
    expect(s.observe('s1', 'd', 'delivery to Port Harcourt?')).toBeNull();
  });

  it('ignores statements, old questions and other shows', () => {
    let t = 0;
    const s = notes.createSuggester({ now: () => t });
    s.observe('s1', 'a', 'what size is it?');
    s.observe('s1', 'b', 'is it size 12?');
    t += 16 * 60 * 1000;
    expect(s.observe('s1', 'c', 'size?')).toBeNull();
    expect(s.observe('s2', 'x', 'nice dress')).toBeNull();
  });
});
