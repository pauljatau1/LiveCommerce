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

const Brand = ({ bg, children }) => (
  <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 16, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 18px var(--font-body)' }}>{children}</span>
);

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

  return (
    <Sheet label="Share your show" onClose={onClose}>
      <h2 className="f" style={{ margin: 0, fontSize: 22 }}>Share your show</h2>
      <span className="mut" style={{ fontSize: 14, marginTop: -8 }}>Anyone with the link can watch{show.status === 'live' ? ' now' : ' and set a reminder'}.</span>

      <div className="fl">
        <label className="lab" htmlFor="share-link">Show link</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="share-link" className="in" readOnly value={link} onFocus={(e) => e.target.select()} style={{ fontSize: 14 }} />
          <button type="button" className="btn" style={{ minHeight: 52, flex: 'none' }} onClick={async () => setNote((await copy(link)) ? 'Link copied' : "Couldn't copy. Press and hold the link to copy it.")}>Copy</button>
        </div>
      </div>

      <div role="group" aria-label="Share to" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
        {targets.map((t) => (
          <button key={t.name} type="button" onClick={t.go} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0', minHeight: 80, border: 0, background: 'none', cursor: 'pointer', font: '700 12px var(--font-body)', color: 'var(--text)' }}>
            <Brand bg={t.bg}>{t.mark}</Brand>{t.name}
          </button>
        ))}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button type="button" onClick={() => navigator.share({ title: show.title, text, url: link }).catch(() => {})} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0', minHeight: 80, border: 0, background: 'none', cursor: 'pointer', font: '700 12px var(--font-body)', color: 'var(--text)' }}>
            <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.share}</span>More
          </button>
        )}
      </div>

      <div className="fl">
        <span className="lab">Message</span>
        <div className="soft" style={{ background: 'var(--surface-page)', border: '1px solid var(--border)', fontSize: 14, lineHeight: 1.45 }}>{text}<br /><span className="mut">{link}</span></div>
        <button type="button" className="btn3" onClick={async () => setNote((await copy(`${text}\n${link}`)) ? 'Message and link copied' : "Couldn't copy.")}>Copy message with link</button>
      </div>

      {note && <div className="toast" role="status"><span style={{ flex: 1 }}>{note}</span></div>}
    </Sheet>
  );
}
