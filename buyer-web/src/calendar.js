// Calendar invites for a show: an .ics file (Apple, Outlook, most phones) and
// a Google Calendar link. `weekly` makes it repeat every week at the same time.
const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => String(s || '').replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export const showEvent = ({ title, host, start, minutes = 60, url, weekly = false }) => {
  const begin = new Date(start);
  const end = new Date(begin.getTime() + minutes * 60000);
  const name = host ? `${title} · ${host} live` : title;
  return { name, begin, end, url, weekly };
};

export const icsFor = (ev, uid = `${stamp(ev.begin)}-${Math.random().toString(36).slice(2)}@show`) => [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//live-shows//EN',
  'BEGIN:VEVENT',
  `UID:${uid}`,
  `DTSTAMP:${stamp(new Date())}`,
  `DTSTART:${stamp(ev.begin)}`,
  `DTEND:${stamp(ev.end)}`,
  ev.weekly ? 'RRULE:FREQ=WEEKLY' : null,
  `SUMMARY:${esc(ev.name)}`,
  `DESCRIPTION:${esc(`Watch live: ${ev.url}`)}`,
  `URL:${ev.url}`,
  'BEGIN:VALARM',
  'TRIGGER:-PT15M',
  'ACTION:DISPLAY',
  `DESCRIPTION:${esc(ev.name)}`,
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
].filter(Boolean).join('\r\n');

export const googleCalendarUrl = (ev) => {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.name,
    dates: `${stamp(ev.begin)}/${stamp(ev.end)}`,
    details: `Watch live: ${ev.url}`,
  });
  if (ev.weekly) p.set('recur', 'RRULE:FREQ=WEEKLY');
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

export const icsHref = (ev) => `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFor(ev))}`;
