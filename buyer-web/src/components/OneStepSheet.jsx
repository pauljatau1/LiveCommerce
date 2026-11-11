// "One step, then your bid": everything a new buyer needs, in one sheet over
// the show. Only the missing parts are shown: an account, a delivery address,
// and enough in the wallet. One button does them in order, then bids or buys.
// The show keeps playing behind it.
import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, naira } from '../api';
import { useAuth } from '../auth';
import { PaymentCancelled, topUpWithPaystack } from '../payments';
import { AddressFields, phoneProblem, useAddressForm } from './AddressSheet';
import GoogleButton, { googleEnabled } from './GoogleButton';
import { Sheet } from './ui';

// Top up a little above what's needed, in whole thousands; the rest stays in the wallet
export const topUpFor = (need) => (need > 0 ? Math.max(1000, Math.ceil(need / 1000) * 1000) : 0);

const USERNAME = /^[a-zA-Z0-9_.]{3,20}$/;

/**
 * action: { kind: 'bid', amount } | { kind: 'buy', amount } | { kind: 'chat' } | { kind: 'account' }
 * deposit: delivery deposit due before a first item in this show: Shipbubble's
 *   quote to the buyer's saved address (0 if they already have an item here,
 *   null if it isn't known yet)
 * quote: that quote's details ({ area, courierName }) for the wallet line
 * productId: the item being bid on or bought (the quote is for its weight)
 * onReady(): called once everything is in place; does the bid or buy
 */
export default function OneStepSheet({ action, deposit = null, quote = null, productId, top = null, streamId, onClose, onReady, onOutOfArea, onTopUpNeeded, topUpMethods = {} }) {
  const { buyer, wallet, signedIn, signIn, refresh } = useAuth();
  const address = useAddressForm();
  const [mode, setMode] = useState('signup'); // signup | signin
  const [acct, setAcct] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState({ where: '', text: '' });
  const chatOnly = ['chat', 'account', 'follow'].includes(action.kind);
  // The delivery price for an address typed here comes from Shipbubble too: the
  // host's pickup address to this exact address, for this item. Nothing is
  // guessed: until the address is complete there is no price.
  const [typedQuote, setTypedQuote] = useState({ status: 'idle' });
  const { state: pickedState, city: pickedCity, addressLine1: pickedLine, phoneNumber: pickedPhone } = address.form;
  const phoneForQuote = pickedPhone || buyer?.phoneNumber || '';
  useEffect(() => {
    const complete = pickedState && pickedCity && String(pickedLine).trim().length >= 4 && !phoneProblem(phoneForQuote);
    if (!complete || !streamId) { setTypedQuote({ status: 'idle' }); return undefined; }
    let live = true;
    setTypedQuote({ status: 'loading' });
    const t = window.setTimeout(() => {
      api.deliveryQuote(streamId, {
        productId,
        address: { addressLine1: String(pickedLine).trim(), city: pickedCity, state: pickedState, phoneNumber: phoneForQuote, email: acct.email.trim() || buyer?.email },
      })
        .then((r) => live && setTypedQuote(r?.available ? { status: 'ok', ...r } : { status: 'error', message: r?.message || "Couldn't price delivery to this address." }))
        .catch((e) => live && setTypedQuote({ status: 'error', message: errorMessage(e, "Couldn't price delivery right now. Try again.") }));
    }, 700);
    return () => { live = false; window.clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedState, pickedCity, pickedLine, phoneForQuote, streamId, productId]);

  const needAccount = !signedIn;
  const needAddress = !chatOnly && !(buyer?.shippingAddresses || []).length;
  const available = wallet?.availableBalance || 0;
  // Delivery held with a first item: the quote for the typed address, else the saved one
  const dep = chatOnly ? 0 : needAddress ? (typedQuote.status === 'ok' ? typedQuote.amount : null) : deposit;
  const depInfo = needAddress ? (typedQuote.status === 'ok' ? typedQuote : null) : quote;
  // A saved address is priced on the server when the button is pressed (finish)
  const priced = chatOnly || !needAddress || dep !== null;
  const cost = chatOnly ? 0 : action.amount + (dep || 0);
  const pay = chatOnly || !priced ? 0 : topUpFor(cost - available);

  const title = action.kind === 'follow' ? 'Follow this host' : action.kind === 'account' ? 'Create an account' : chatOnly ? 'Join the chat' : action.kind === 'bid' ? 'One step, then your bid' : "One step, then it's yours";
  const what = action.kind === 'bid' ? `bid ${naira(action.amount)}` : 'buy';
  const buttonText = chatOnly
    ? (mode === 'signup' ? 'Create account' : 'Sign in')
    : !priced ? (typedQuote.status === 'loading' ? 'Getting the delivery price…' : 'Add your address to continue')
      : pay > 0 ? `Pay ${naira(pay)} and ${what}` : action.kind === 'bid' ? `Bid ${naira(action.amount)}` : `Buy now · ${naira(action.amount)}`;

  const fail = (where, text) => { setError({ where, text }); setBusy(''); };
  const setA = (k) => (e) => setAcct((a) => ({ ...a, [k]: e.target.value }));

  // Runs the rest of the steps for a signed-in buyer
  const finish = useCallback(async (me, myWallet) => {
    if (chatOnly) { setBusy(''); onReady(); return; }
    let who = me;
    let myW = myWallet;
    if (!(me?.shippingAddresses || []).length) {
      setBusy('Saving your address…');
      try { await address.save(me); } catch (e) { if ((e.response?.data?.code === 'out_of_area' || e.response?.data?.reason === 'out_of_area') && onOutOfArea) { setBusy(''); onOutOfArea(e.response.data); return; } fail('address', errorMessage(e, "Couldn't save the address.")); return; }
      // Reload the profile so the app knows the address is saved (no asking twice)
      try { const r = await refresh(); if (r?.buyer) { who = r.buyer; myW = r.wallet || myW; } } catch { /* the server has it either way */ }
    }
    // What's held for delivery comes from the server: Shipbubble to the saved address
    let depositDue = 0;
    try {
      const r = await api.watchMe(streamId, productId);
      if (r?.depositDue === null || r?.depositDue === undefined) { fail('address', r?.deliveryProblem || "Couldn't price delivery to your address. Check it and try again."); return; }
      depositDue = Number(r.depositDue) || 0;
    } catch (e) { if ((e.response?.data?.code === 'out_of_area' || e.response?.data?.reason === 'out_of_area') && onOutOfArea) { setBusy(''); onOutOfArea(e.response.data); return; } fail('address', errorMessage(e, "Couldn't price delivery right now. Try again.")); return; }
    const due = action.amount + depositDue - (myW?.availableBalance || 0);
    const amount = topUpFor(due);
    if (amount > 0 && onTopUpNeeded && (myW?.topUpMethods?.dva || myW?.topUpMethods?.savedCards || topUpMethods.dva || topUpMethods.savedCards)) {
      setBusy(''); onTopUpNeeded(due, action, who?._id); return;
    }
    if (amount > 0) {
      setBusy('Waiting for Paystack…');
      try {
        await topUpWithPaystack({ email: who?.email, buyerId: who?._id, amount });
      } catch (e) {
        if (e instanceof PaymentCancelled) { fail('pay', 'Payment cancelled. Your account and address are saved.'); return; }
        fail('pay', `${errorMessage(e, e.message || "We couldn't confirm the payment yet.")} If you were charged, it will show up shortly.`);
        return;
      }
      try { await refresh(); } catch { /* wallet refreshes on the next screen too */ }
    }
    setBusy(action.kind === 'bid' ? 'Placing your bid…' : 'Buying…');
    try { await onReady(); } finally { setBusy(''); }
  }, [action, address, chatOnly, onReady, onOutOfArea, refresh, streamId, productId, onTopUpNeeded, topUpMethods]);

  const afterSignIn = async (token) => {
    const { buyer: me, wallet: w } = await signIn(token, { quiet: true });
    await finish(me, w);
  };

  const go = async () => {
    setError({ where: '', text: '' });
    // Check everything first, so nothing is half done
    if (needAccount) {
      if (mode === 'signup' && !USERNAME.test(acct.username)) return fail('account', 'Pick a username: 3–20 letters, numbers, _ or .');
      if (!/^\S+@\S+\.\S+$/.test(acct.email.trim())) return fail('account', 'Add your email.');
      if (acct.password.length < 8) return fail('account', 'Use at least 8 characters for your password.');
    }
    if (needAddress) {
      const problem = address.problem(!buyer?.phoneNumber);
      if (problem) return fail('address', problem);
      if (typedQuote.status === 'error') return fail('address', typedQuote.message);
      if (typedQuote.status !== 'ok') return fail('address', 'Getting the delivery price for your address. One moment.');
    }
    if (needAccount) {
      setBusy(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
      let token;
      try {
        const res = mode === 'signup'
          ? await api.register({ username: acct.username.trim(), email: acct.email.trim(), password: acct.password })
          : await api.login({ email: acct.email.trim(), password: acct.password });
        token = res?.token || res?.accessToken || res?.data?.token;
        if (!token) throw new Error('No token');
      } catch (e) {
        return fail('account', errorMessage(e, mode === 'signup' ? "Couldn't create your account." : 'Email or password is wrong.'));
      }
      await afterSignIn(token);
      return;
    }
    await finish(buyer, wallet);
  };

  const google = useCallback(async (credential) => {
    setError({ where: '', text: '' });
    setBusy('Signing in with Google…');
    try {
      const res = await api.googleAuth(credential);
      if (!res?.token) throw new Error('No token');
      // Google fills the account; the address (if shown) still needs to be complete
      await afterSignIn(res.token);
    } catch (e) {
      fail('account', errorMessage(e, "Google sign-in didn't finish. Nothing was lost. Try again, or use email below."));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  const errFor = (where) => (error.where === where ? <span className="err" role="alert">{error.text}</span> : null);

  return (
    <Sheet title={title} top={top} onClose={busy ? () => {} : onClose}>
      {action.kind === 'chat' && <p className="mut" style={{ margin: 0 }}>Anyone can watch. To chat, create an account. No payment needed.</p>}
      {action.kind === 'follow' && <p className="mut" style={{ margin: 0 }}>Create an account to follow. No payment needed.</p>}
      {action.kind === 'account' && <p className="mut" style={{ margin: 0 }}>Your wallet pays for bids and Buy Now, so checkout is instant. Create an account to top up.</p>}

      {needAccount && (
        <section className="step" aria-label="Your account">
          {!chatOnly && <h3 className="step-h">Your account</h3>}
          {googleEnabled && (
            <>
              <GoogleButton onCredential={google} onError={(t) => fail('account', t)} />
              <span className="hint" style={{ textAlign: 'center' }}>or use email</span>
            </>
          )}
          {mode === 'signup' && (
            <div className="fl">
              <label className="lab" htmlFor="os-u">Username</label>
              <input id="os-u" className="in" value={acct.username} onChange={setA('username')} placeholder="e.g. ada_lagos" autoComplete="username" autoCapitalize="none" />
            </div>
          )}
          <div className="fl">
            <label className="lab" htmlFor="os-e">Email</label>
            <input id="os-e" className="in" type="email" value={acct.email} onChange={setA('email')} autoComplete="email" />
          </div>
          <div className="fl">
            <label className="lab" htmlFor="os-p">Password</label>
            <input id="os-p" className="in" type="password" value={acct.password} onChange={setA('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          {errFor('account')}
          <button type="button" className="link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError({ where: '', text: '' }); }}>
            {mode === 'signup' ? 'I have an account' : 'New here? Create an account'}
          </button>
        </section>
      )}

      {needAddress && (
        <section className="step" aria-label="Delivery">
          <h3 className="step-h">Delivery</h3>
          <AddressFields address={address} askPhone={!buyer?.phoneNumber} idPrefix="os" />
          {typedQuote.status === 'ok' && <p style={{ margin: 0, fontWeight: 'var(--w-medium)' }}>Delivery to {typedQuote.area}: {naira(typedQuote.amount)}{typedQuote.courierName ? ` · ${typedQuote.courierName}` : ''}</p>}
          {typedQuote.status === 'loading' && <span className="hint">Getting the delivery price from Shipbubble…</span>}
          {typedQuote.status === 'error' && <span className="err" role="alert">{typedQuote.message}</span>}
          {errFor('address')}
        </section>
      )}

      {!chatOnly && priced && pay > 0 && (
        <section className="step" aria-label="Wallet">
          <h3 className="step-h">Wallet</h3>
          <p style={{ margin: 0 }}>
            {action.kind === 'bid' ? `${naira(action.amount)} is held for your bid. It comes back if someone outbids you.` : `${naira(action.amount)} pays for the item.`}
            {dep > 0 ? ` ${naira(dep)} for delivery${depInfo?.area ? ` to ${depInfo.area}` : ''}, priced by Shipbubble, is held with your first item. The final fee for everything you get in this show is confirmed after it ends.` : ''}
            {pay > cost - available ? ' Anything left stays in your wallet.' : ''}
          </p>
          <span className="hint">Card, bank transfer or USSD, through Paystack.{available > 0 ? ` You have ${naira(available)} already.` : ''}</span>
          {errFor('pay')}
        </section>
      )}

      {error.where === '' && error.text && <span className="err" role="alert">{error.text}</span>}
      <button type="button" className="btn" disabled={Boolean(busy) || !priced} onClick={go}>{busy || buttonText}</button>
      {!chatOnly && <span className="hint" style={{ textAlign: 'center' }}>The show keeps playing while you do this.</span>}
    </Sheet>
  );
}
