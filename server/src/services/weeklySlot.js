// A seller's weekly show slot, e.g. Saturdays at 19:00 Lagos time.
// Lagos is UTC+1 all year (no daylight saving), so times convert simply.

const LAGOS_OFFSET_MIN = 60;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const validSlot = (slot) => slot && Number.isInteger(Number(slot.day)) && Number(slot.day) >= 0 && Number(slot.day) <= 6 && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(slot.time || ''));

const parse = (slot) => {
  if (!validSlot(slot)) return null;
  const [h, m] = String(slot.time).split(':').map(Number);
  return { day: Number(slot.day), h, m };
};

// The next start at or after `from` (default: now), as a UTC Date
const nextOccurrence = (slot, from = new Date()) => {
  const s = parse(slot);
  if (!s) return null;
  const lagosNow = new Date(from.getTime() + LAGOS_OFFSET_MIN * 60000); // read with getUTC* as Lagos wall time
  const candidate = new Date(Date.UTC(lagosNow.getUTCFullYear(), lagosNow.getUTCMonth(), lagosNow.getUTCDate(), s.h, s.m));
  let add = (s.day - lagosNow.getUTCDay() + 7) % 7;
  if (add === 0 && candidate.getTime() <= lagosNow.getTime()) add = 7;
  candidate.setUTCDate(candidate.getUTCDate() + add);
  return new Date(candidate.getTime() - LAGOS_OFFSET_MIN * 60000);
};

// The slot a show at `date` would make (its weekday and time in Lagos)
const slotFromDate = (date) => {
  const d = new Date(new Date(date).getTime() + LAGOS_OFFSET_MIN * 60000);
  return { day: d.getUTCDay(), time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` };
};

// "Live every Saturday at 7pm" / "… at 7:30pm"
const label = (slot) => {
  const s = parse(slot);
  if (!s) return '';
  const h12 = s.h % 12 || 12;
  const ampm = s.h < 12 ? 'am' : 'pm';
  return `Live every ${DAYS[s.day]} at ${h12}${s.m ? `:${String(s.m).padStart(2, '0')}` : ''}${ampm}`;
};

module.exports = { validSlot, nextOccurrence, slotFromDate, label, DAYS };
