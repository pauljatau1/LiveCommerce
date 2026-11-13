const LEGACY_TOPUP_LAYOUT=false; // Retain the prior expanded layout for rollback.
import { useEffect, useRef, useState } from 'react';
import { api, errorMessage, naira } from '../api';
import { resumeSavedCard } from '../payments';
import { useAuth } from '../auth';
import {phoneProblem,PHONE_HINT} from '../phone';
import { oneTapAmount } from '../walletIntents';

export default function StayOnStreamTopUps({ methods, amount, need, onDone, onWaiting, onPending, onMethod, onUseAnotherCard, onBusyChange, initialBank,cardForm,externalBusy=false }) {
  const {buyer,refresh}=useAuth();
  const [phone,setPhone]=useState('');
  const needsPhone=Boolean(phoneProblem(buyer?.phoneNumber));
  const [cards, setCards] = useState([]), [dva, setDva] = useState({ status: 'none' });
  const [bank, setBank] = useState(Boolean(initialBank)), [consent, setConsent] = useState(false);
  const [error, setError] = useState(''), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const [charge, setCharge] = useState(null);
  const attempt = useRef(null), mounted = useRef(true);
  const waitingSince = useRef(initialBank?.since || null);
  const callbacks = useRef({ onDone, onWaiting, onPending }); callbacks.current = { onDone, onWaiting, onPending };
  useEffect(() => { onBusyChange?.(Boolean(busy)); }, [busy, onBusyChange]);
  const card = cards.find((c) => c.usable), topUp = oneTapAmount(need > 0 ? need : amount);
  useEffect(() => {
    mounted.current = true;
    if (methods.savedCards) api.savedCards().then(setCards).catch(() => {});
    if (methods.dva) api.dva().then(setDva).catch(() => {});
    return () => { mounted.current = false; };
  }, [methods.savedCards, methods.dva]);
  useEffect(() => {
    if (!bank) return undefined;
    const update = async () => {
      try {
        const account = await api.dva(waitingSince.current);
        if (!mounted.current) return;
        setDva(account);
        callbacks.current.onWaiting?.({ ...account, since: waitingSince.current });
        if (account.latestCredit) callbacks.current.onDone?.(account.latestCredit.reference, account.latestCredit.amount, 'transfer');
      } catch { /* keep waiting; never suggest transferring again */ }
    };
    const event = () => update(); window.addEventListener('gbam:wallet_dva_ready', event);
    update(); const timer = setInterval(update, 3000);
    return () => { clearInterval(timer); window.removeEventListener('gbam:wallet_dva_ready', event); };
  }, [bank]);
  useEffect(() => {
    if (!charge?.reference || ['success', 'failed'].includes(charge.status)) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const result = await api.topUpStatus(charge.reference);
        if (!active) return;
        if (result.status === 'success') { setCharge(result); setBusy(''); callbacks.current.onDone?.(result.reference, result.amount); }
        else if (result.status === 'failed') { setCharge(result); setBusy(''); setError(result.message); }
      } catch { /* webhook and next poll can still confirm */ }
    };
    poll(); const timer = setInterval(poll, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [charge?.reference, charge?.status]);
  const selectBank = () => {
    setBank(true); setError(''); onMethod('bank');
    waitingSince.current = waitingSince.current || new Date().toISOString();
    if (['active', 'pending'].includes(dva.status)) callbacks.current.onWaiting?.({ ...dva, since: waitingSince.current });
  };
  const assign = async () => {
    setBusy('Setting up your account number…'); setError('');
    try { if(needsPhone){const problem=phoneProblem(phone);if(problem)throw {response:{data:{message:problem}}};await api.savePhone(phone);await refresh();} const account = await api.assignDva(); setDva(account); callbacks.current.onWaiting?.({ ...account, since: waitingSince.current }); }
    catch (e) { setError(errorMessage(e, 'We can’t set up an account number right now. Use a card instead.')); }
    finally { if (mounted.current) setBusy(''); }
  };
  const chargeSaved = async () => {
    if (!card || busy || externalBusy) return;
    setBusy(`Charging ${card.bank} •••• ${card.last4}…`); setError('');
    if (!attempt.current || attempt.current.amount !== topUp || attempt.current.card !== card.id) attempt.current = { key: crypto.randomUUID(), amount: topUp, card: card.id };
    callbacks.current.onPending?.();
    try {
      const result = await api.chargeCard(card.id, topUp, attempt.current.key);
      if (!mounted.current) return;
      setCharge(result);
      if (result.status === 'success') { setBusy(''); callbacks.current.onDone?.(result.reference, result.amount); }
      else if (result.status === 'needs_bank_check') {
        setBusy('Waiting for your bank…'); setNotice(`${card.bank} wants a code. This happens now and then, even with a saved card.`);
        await resumeSavedCard(result.accessCode);
        // Continue server polling after close; a webhook can still confirm it.
      } else setBusy('Confirming your top-up…');
    } catch (e) { setBusy(''); setError(errorMessage(e, 'Your bank declined this card. Try another card or a bank transfer.')); }
  };
  const useCard = () => { setBank(false); onMethod('card'); setError(''); };
  const anotherCard = () => { useCard(); onUseAnotherCard?.(); };
  if (bank) return <section className="step" aria-label="Bank transfer">
    {dva.status === 'active' ? <>
      <span className="lab">{dva.bankName}</span>
      <div className="wallet-available"><strong>{dva.accountNumber}</strong><button type="button" className="link" onClick={async () => { try { await navigator.clipboard.writeText(dva.accountNumber); setNotice('Account number copied'); } catch { setNotice('Select the account number to copy it.'); } }}>Copy</button></div>
      <span className="hint">Account name</span><span>{dva.accountName}</span><span>Send at least {naira(Math.max(100, need || amount))}<span className="hint"> · any extra stays in your wallet</span></span>
      <span className="hint" role="status"><span className="wallet-progress" aria-hidden="true">● </span>Waiting for your transfer. Keep watching; your bid goes in the moment it lands.</span>
      <button type="button" className="link" onClick={async () => { try { const r = await api.requeryDva(); setNotice(r.message); } catch (e) { setError(errorMessage(e, 'Please try checking again later.')); } }}>Sent it but nothing yet?</button>
    </> : dva.status === 'pending' || busy ? <span role="status"><span className="wallet-spinner" aria-hidden="true">◌ </span>Setting up your account number…</span> : <>
      {dva.status === 'failed' && <span className="err" role="alert">We can’t set up an account number right now. Use a card instead.</span>}
      <h3 className="h2">Get your own account number</h3>
      <p className="hint">Paystack opens a bank account number in your name. Any transfer to it lands in your gbam wallet in seconds. You keep it for every show.</p>
      <span>{[buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ') || 'Add your name in your profile'}</span>
      <span className="hint">{!needsPhone ? `•••••••${buyer.phoneNumber.slice(-4)}` : 'Paystack needs it to open the account number. 11 digits starting with 0.'}</span>
      {needsPhone&&<div className="fl"><label className="lab" htmlFor="dva-phone">Phone</label><input id="dva-phone" className="in" type="tel" autoComplete="tel" placeholder="0803 123 4567" value={phone} onChange={e=>setPhone(e.target.value)}/><span className="hint">{PHONE_HINT}</span></div>}
      <label className="hint"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to Paystack opening an account number in my name for gbam top-ups.</label>
      <button type="button" className="btn" disabled={!consent} onClick={assign}>{needsPhone?'Save phone and get my number':'Get my account number'}</button>
    </>}
    {error && <span className="err" role="alert">{error}</span>}{notice && <span className="hint" role="status">{notice}</span>}
    <button type="button" className="link" onClick={useCard}>Pay with card instead</button>
  </section>;
  const legacy = <section className="step" aria-label="Top-up methods">
    {methods.savedCards && card && <>
      <button type="button" className="btn two-line" disabled={Boolean(busy || externalBusy)} onClick={chargeSaved}>{busy ? <span><span className="wallet-spinner" aria-hidden="true">◌ </span><span>{busy}</span></span> : <><span>Top up {naira(topUp)}</span><small>{card.bank} •••• {card.last4} · one tap</small></>}</button>
      <button type="button" className="link" disabled={Boolean(busy || externalBusy)} onClick={anotherCard}>Use another card</button>
    </>}
    {methods.dva && <button type="button" className="btn2 two-line" disabled={Boolean(busy || externalBusy)} onClick={selectBank}><span>Bank transfer</span><small>{dva.status === 'active' ? `To your account ${dva.accountNumber}` : 'Get your own account number'} · arrives in seconds</small></button>}
    {notice && <span className="hint" role="status">{notice}</span>}{error && <span className="err" role="alert">{error}</span>}
  </section>;
  if(LEGACY_TOPUP_LAYOUT)return <>{legacy}{cardForm}</>;
  const bankButton=methods.dva&&<button type="button" className="btn2 two-line" disabled={Boolean(busy || externalBusy)} onClick={selectBank}><span>{card?'Bank transfer':'Pay by bank transfer'}</span><small>{dva.status==='active'?`To your account ${dva.accountNumber}`:'Get your own account number'} · arrives in seconds</small></button>;
  return <section className="step wallet-methods" aria-label="Top-up methods">
    {methods.savedCards&&card?<>
      <button type="button" className="btn two-line wallet-saved-card" disabled={Boolean(busy || externalBusy)} onClick={chargeSaved}>{busy?<span role="status">{busy}</span>:<><span>Top up {naira(topUp)}</span><small>{card.bank} •••• {card.last4} · one tap</small></>}</button>
      <details className="wallet-other-ways"><summary aria-disabled={Boolean(busy || externalBusy)} onClick={e=>{if(busy || externalBusy)e.preventDefault();}}>Other ways to pay</summary><div className="wallet-alternatives"><span className="wallet-bank-alternative">{bankButton}</span><span>Another card</span>{cardForm}</div></details>
    </>:<><span className="wallet-bank-primary">{bankButton}</span><span>Or pay by card</span>{cardForm}</>}
    {notice&&<span className="hint" role="status">{notice}</span>}{error&&<span className="err" role="alert">{error}</span>}
  </section>;
}
