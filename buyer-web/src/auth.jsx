// Who is signed in, their wallet and their delivery address.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [buyer, setBuyer] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const refresh = useCallback(async () => {
    if (!getToken()) { setBuyer(null); setWallet(null); setLoading(false); return; }
    try {
      const [p, w] = await Promise.all([api.profile(), api.wallet().catch(() => null)]);
      const me = p?.buyer || p?.user || p;
      setBuyer(me);
      setWallet(w);
      return { buyer: me, wallet: w };
    } catch (e) {
      if (e?.response?.status === 401) { setToken(null); setBuyer(null); }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    try { const w = await api.wallet(); setWallet(w); return w; } catch { return null; /* keep the last value */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Resolves with { buyer, wallet } so a flow can carry on without waiting for a re-render
  // quiet: keep the current screen mounted (e.g. signing up mid-show)
  const signIn = async (token, { quiet = false } = {}) => { setToken(token); if (!quiet) setLoading(true); return refresh(); };
  const signOut = () => { setToken(null); setBuyer(null); setWallet(null); };

  return (
    <AuthContext.Provider value={{ buyer, wallet, loading, refresh, refreshWallet, signIn, signOut, signedIn: Boolean(buyer) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
