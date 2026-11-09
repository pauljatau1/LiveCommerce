const { nextOccurrence, slotFromDate, label, validSlot } = require('@/services/weeklySlot');

describe('weekly slot', () => {
  const sat7pm = { day: 6, time: '19:00' };
  it('finds the next Saturday 7pm Lagos (18:00 UTC)', () => {
    // Monday 10 Nov 2026, 12:00 Lagos
    expect(nextOccurrence(sat7pm, new Date('2026-11-10T11:00:00Z')).toISOString()).toBe('2026-11-14T18:00:00.000Z');
    // Saturday 14 Nov 18:30 Lagos: still today
    expect(nextOccurrence(sat7pm, new Date('2026-11-14T17:30:00Z')).toISOString()).toBe('2026-11-14T18:00:00.000Z');
    // Saturday 14 Nov 19:30 Lagos: next week
    expect(nextOccurrence(sat7pm, new Date('2026-11-14T18:30:00Z')).toISOString()).toBe('2026-11-21T18:00:00.000Z');
  });
  it('reads a slot from a show time, and says it plainly', () => {
    expect(slotFromDate('2026-11-14T18:00:00Z')).toEqual(sat7pm);
    expect(label(sat7pm)).toBe('Live every Saturday at 7pm');
    expect(label({ day: 5, time: '20:30' })).toBe('Live every Friday at 8:30pm');
    expect(validSlot({ day: 7, time: '19:00' })).toBe(false);
    expect(validSlot({ day: 1, time: '7pm' })).toBe(false);
  });
});
