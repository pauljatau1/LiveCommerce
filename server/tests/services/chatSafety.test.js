const { check, buyerNotice, sellerNotice } = require('@/services/chatSafety');

describe('chat safety', () => {
  it.each([
    ['call me 08031234567', 'phone'],
    ['0803 123 4567 abeg', 'phone'],
    ['+234 803-123-4567', 'phone'],
    ['whatsapp 2348031234567', 'phone'],
    ['pay to 0123456789 GTB', 'account'],
    ['acct: 012 345 6789', 'account'],
    ['see wa.me/2348031234567', 'phone'],
    ['DM me on instagram.com/tolu', 'link'],
    ['https://pay.example.com/x', 'link'],
    ['www.cheapdeals.ng', 'link'],
    ['mail me ada@gmail.com', 'link'],
  ])('hides %p (%s)', (text, kind) => {
    expect(check(text)).toEqual({ hide: true, kind });
  });

  it.each([
    'how much to Lekki?',
    'bid 34,500!',
    '1000000 naira no be beans',
    'size 12, UK 9',
    'e fine o. 30cm',
    'Order #A2F-118',
  ])('lets %p through', (text) => {
    expect(check(text)).toEqual({ hide: false });
  });

  it('writes the notices in plain words', () => {
    expect(buyerNotice('phone')).toBe('1 message with a phone number was hidden');
    expect(buyerNotice('link', 2)).toBe('2 messages with links were hidden');
    expect(sellerNotice('account')).toBe('Hid 1 message with an account number');
  });
});
