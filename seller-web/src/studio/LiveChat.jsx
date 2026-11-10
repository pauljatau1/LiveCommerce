// Live studio chat: plain text on the video, the same lines as the buyer's Watch.
// Scrolls by touch; stays on the newest message unless the host has scrolled up,
// then "New messages ↓" jumps back down.
import { useLayoutEffect, useRef, useState } from 'react';

export default function LiveChat({ feed, onUndo }) {
  const ref = useRef(null);
  const stuck = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const lastId = feed[feed.length - 1]?.id;
  const toBottom = (smooth) => { const el = ref.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); };
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (stuck.current) setUnseen(false);
  };
  useLayoutEffect(() => {
    if (stuck.current) toBottom(false);
    else if (lastId) setUnseen(true);
  }, [lastId]);

  return (
    <div className="lv-feed-wrap">
      <div ref={ref} className="lv-feed" aria-live="polite" aria-label="Live chat" onScroll={onScroll}>
        {feed.map((m) => (m.kind === 'hidden'
          ? (
            <div key={m.id} className="lv-hid">
              <span>{m.notice} · </span>
              <button type="button" className="lv-undo" onClick={() => onUndo(m)}>Undo</button>
              <span className="lv-hid-tx">{m.user}: “{m.text}”</span>
            </div>
          )
          : (
            <div key={m.id} className={`line ${m.kind}`}>
              {m.kind !== 'sys' && <span className="ava" aria-hidden="true">{m.avatar ? <img src={m.avatar} alt="" /> : (m.user || '?').slice(0, 1).toUpperCase()}</span>}
              <span className="line-tx">
                {m.user && m.kind !== 'sys' && <span className="nm">{m.user}{m.host && <span className="host-tag">Host</span>}</span>}
                <span className="tx">{m.text}</span>
              </span>
            </div>
          )))}
      </div>
      {unseen && <button type="button" className="lv-new-msgs" onClick={() => { stuck.current = true; setUnseen(false); toBottom(true); }}>New messages ↓</button>}
    </div>
  );
}
