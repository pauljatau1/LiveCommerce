// Share a show: copy the link, or send it straight to WhatsApp, X, Facebook,
// Telegram. Instagram and TikTok have no web share link, so we copy the link
// and say where to paste it.
import { useEffect, useState } from 'react';
import { when } from './api';
import { Icon, Sheet } from './ui';

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / no permission: fall back to a hidden textarea
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  }
};

export const shareMessage = (show) => (show.status === 'live'
  ? `I'm LIVE now: ${show.title}. Come and ${show.type === 'drop' ? 'shop' : 'bid'} with me 👇`
  : `${show.title}: live ${when(show.scheduledStartTime)}. Tap to get a reminder and ${show.type === 'drop' ? 'shop' : 'bid'} live 👇`);

// A short version of the link for the pill: no "https://", "…" in the middle if long
const shortLink = (link) => {
  const bare = String(link || '').replace(/^https?:\/\//, '');
  return bare.length > 34 ? `${bare.slice(0, 18)}…${bare.slice(-12)}` : bare;
};

const AppIcon = ({ bg, children }) => (
  <span aria-hidden="true" className="sh-ic" style={{ background: bg }}>{children}</span>
);

// Like the phone's own share sheet: compact, sized to its content, the video stays visible.
export default function ShareSheet({ show, onClose }) {
  const [note, setNote] = useState('');
  useEffect(() => { if (!note) return undefined; const t = setTimeout(() => setNote(''), 4000); return () => clearTimeout(t); }, [note]);
  const link = show.link;
  const text = shareMessage(show);
  const enc = encodeURIComponent;
  const open = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const targets = [
    { name: 'WhatsApp', bg: '#1FA855', mark: 'W', go: () => open(`https://wa.me/?text=${enc(`${text}\n${link}`)}`) },
    { name: 'Instagram', bg: '#C13584', mark: 'IG', go: async () => { await copy(link); setNote('Link copied. Paste it in your Instagram story (link sticker) or bio.'); } },
    { name: 'TikTok', bg: '#111', mark: 'TT', go: async () => { await copy(link); setNote('Link copied. Paste it in your TikTok bio, then tell viewers "link in bio".'); } },
    { name: 'X', bg: '#000', mark: 'X', go: () => open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(link)}`) },
    { name: 'Facebook', bg: '#1877F2', mark: 'f', go: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`) },
    { name: 'Telegram', bg: '#229ED9', mark: 'T', go: () => open(`https://t.me/share/url?url=${enc(link)}&text=${enc(text)}`) },
  ];
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Sheet label="Share your show" onClose={onClose} closeX>
      <div className="sh-head">
        <h2 className="f" style={{ margin: 0, fontSize: 'var(--t-h2)' }}>Share your show</h2>
        <span className="mut" style={{ fontSize: 'var(--t-small)' }}>Anyone with the link can watch{show.status === 'live' ? ' now' : ' and set a reminder'}.</span>
      </div>

      <div className="sh-pill">
        <span className="sh-pill-tx" title={link}>{shortLink(link)}</span>
        <button type="button" className="sh-copy" onClick={async () => setNote((await copy(link)) ? 'Link copied' : "Couldn't copy. Press and hold the link to copy it.")}>Copy</button>
      </div>

      <div className="sh-apps" role="group" aria-label="Share to">
        {targets.map((t) => (
          <button key={t.name} type="button" className="sh-app" onClick={t.go}><AppIcon bg={t.bg}>{t.mark}</AppIcon>{t.name}</button>
        ))}
        {canShare && (
          <button type="button" className="sh-app" onClick={() => navigator.share({ title: show.title, text, url: link }).catch(() => {})}>
            <AppIcon bg="var(--surface-sunken)"><span style={{ color: 'var(--text)', display: 'flex' }}>{Icon.share}</span></AppIcon>More
          </button>
        )}
      </div>

      <div className="sh-pill">
        <span className="sh-pill-tx sh-msg" title={`${text} ${link}`}>{text}</span>
        <button type="button" className="sh-copy" onClick={async () => setNote((await copy(`${text}\n${link}`)) ? 'Message and link copied' : "Couldn't copy.")}>Copy message</button>
      </div>

      {note && <div className="toast" role="status"><span style={{ flex: 1 }}>{note}</span></div>}
    </Sheet>
  );
}
