// "Continue with Google" using Google Identity Services. Renders nothing
// unless VITE_GOOGLE_CLIENT_ID is set.
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../api';

const loadGsi = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve(window.google);
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => resolve(window.google);
  s.onerror = () => reject(new Error("Couldn't load Google sign-in."));
  document.head.appendChild(s);
});

export default function GoogleButton({ onCredential, onError }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let live = true;
    loadGsi().then((google) => {
      if (!live || !ref.current) return;
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => (r?.credential ? onCredential(r.credential) : onError?.("Google sign-in didn't finish. Nothing was lost. Try again, or use email below.")) });
      google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(ref.current.offsetWidth || 320, 400) });
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [onCredential, onError]);
  if (!GOOGLE_CLIENT_ID || failed) return null;
  return <div ref={ref} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />;
}

export const googleEnabled = Boolean(GOOGLE_CLIENT_ID);
