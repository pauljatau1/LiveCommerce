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
      setBuyer(p?.buyer || p?.user || p);
      setWallet(w);
    } catch (e) {
      if (e?.response?.status === 401) { setToken(null); setBuyer(null); }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    try { setWallet(await api.wallet()); } catch { /* keep the last value */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const signIn = async (token) => { setToken(token); setLoading(true); await refresh(); };
  const signOut = () => { setToken(null); setBuyer(null); setWallet(null); };

  return (
    <AuthContext.Provider value={{ buyer, wallet, loading, refresh, refreshWallet, signIn, signOut, signedIn: Boolean(buyer) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
