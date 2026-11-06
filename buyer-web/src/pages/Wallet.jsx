import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { naira } from '../api';
import { useAuth } from '../auth';
import TopUpSheet from '../components/TopUpSheet';
import { Header } from '../components/ui';

export default function Wallet() {
  const { signedIn, loading, wallet, signOut } = useAuth();
  const [topUp, setTopUp] = useState(false);
  if (!loading && !signedIn) return <Navigate to="/signin?next=/wallet" replace />;
  return (
    <div className="app">
      <Header back="/" title="Wallet" />
      <main className="wrap" style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="cap">READY TO SPEND</span>
          <span className="f" style={{ fontSize: 40 }}>{naira(wallet?.availableBalance)}</span>
          {wallet?.onHoldAmount > 0 && <span className="mut" style={{ fontSize: 14 }}>{naira(wallet.onHoldAmount)} is held for your leading bids. It's released if you're outbid.</span>}
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => setTopUp(true)}>Top up</button>
        </section>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>Your wallet pays for bids and Buy Now, so checkout during a show takes one tap.</p>
        <button type="button" className="btn3" onClick={signOut}>Sign out</button>
      </main>
      {topUp && <TopUpSheet onClose={() => setTopUp(false)} />}
    </div>
  );
}
