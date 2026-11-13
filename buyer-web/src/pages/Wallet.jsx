import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, naira } from '../api';
import { useAuth } from '../auth';
import TopUpSheet from '../components/TopUpSheet';
const LEGACY_WALLET_PROFILE_LINK=false;
import { Header, Icon } from '../components/ui';

export default function Wallet() {
  const { signedIn, loading, wallet, signOut } = useAuth();
  const [topUp, setTopUp] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardError, setCardError] = useState('');
  useEffect(() => { if (wallet?.topUpMethods?.savedCards) api.savedCards().then(setCards).catch(() => setCardError('Could not load saved cards.')); }, [wallet?.topUpMethods?.savedCards, topUp]);
  if (!loading && !signedIn) return <Navigate to="/signin?next=/wallet" replace />;
  return (
    <div className="app wallet-page">
      <Header back="/" title="Wallet" />
      <main className="wrap" style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="cap">READY TO SPEND</span>
          <span className="f" style={{ fontSize: 'var(--t-hero)' }}>{naira(wallet?.availableBalance)}</span>
          {wallet?.deliveryHeld>0&&<span className="mut">{naira(wallet.deliveryHeld)} held for delivery.</span>}
          {wallet?.bidHeld>0&&<span className="mut">{naira(wallet.bidHeld)} held for your leading bids. Released if you’re outbid.</span>}
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => setTopUp(true)}>Top up</button>
        </section>
        <p className="mut" style={{ margin: 0, fontSize: 'var(--t-small)' }}>Your wallet pays for bids and Buy Now, so checkout during a show takes one tap.</p>
        {wallet?.topUpMethods?.savedCards && <section className="list" aria-label="Saved cards"><h2 className="h2">Saved cards</h2>
          {cardError && <span className="err" role="alert">{cardError}</span>}
          {!cards.length && <span className="hint">No saved cards yet. When you top up by card, tick "Save this card for one-tap top-ups" and it shows here.</span>}
          {cards.map((card) => <div className="li" key={card.id}><span className="ib" aria-hidden="true">{Icon.wallet}</span><span className="grow">{card.bank} •••• {card.last4}<small className="hint"> Expires {card.expMonth}/{String(card.expYear).slice(-2)} · {card.usable ? 'one-tap top-ups' : 'Use another card'}</small></span><button type="button" className="link" onClick={async () => { try { await api.removeCard(card.id); setCards((all) => all.filter((c) => c.id !== card.id)); } catch { setCardError('Could not remove this card. Try again.'); } }}>Remove</button></div>)}
        </section>}
        {LEGACY_WALLET_PROFILE_LINK&&<Link className="btn2" to="/me">My profile</Link>}
        <button type="button" className="btn3" onClick={signOut}>Sign out</button>
      </main>
      {topUp && <TopUpSheet onClose={() => setTopUp(false)} />}
    </div>
  );
}
