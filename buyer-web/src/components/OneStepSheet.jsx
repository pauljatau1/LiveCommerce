// "One step, then your bid": everything a new buyer needs, in one sheet over
// the show. Only the missing parts are shown: an account, a delivery address,
// and enough in the wallet. One button does them in order, then bids or buys.
// The show keeps playing behind it.
import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, naira } from '../api';
import { useAuth } from '../auth';
import { PaymentCancelled, topUpWithPaystack } from '../payments';
import { AddressFields, useAddressForm } from './AddressSheet';
import GoogleButton, { googleEnabled } from './GoogleButton';
import { Sheet } from './ui';
import { deliveryLine } from './watch';

// Top up a little above what's needed, in whole thousands; the rest stays in the wallet
export const topUpFor = (need) => (need > 0 ? Math.max(1000, Math.ceil(need / 1000) * 1000) : 0);

const USERNAME = /^[a-zA-Z0-9_.]{3,20}$/;

/**
 * action: { kind: 'bid', amount } | { kind: 'buy', amount } | { kind: 'chat' } | { kind: 'account' }
 * deposit: delivery deposit still due in this show (0 if already paid)
 * estimate: optional line about delivery cost to the buyer's area
 * onReady(): called once everything is in place; does the bid or buy
 */
export default function OneStepSheet({ action, deposit = 0, estimate = null, top = null, streamId, onClose, onReady, onTopUpNeeded, topUpMethods = {} }) {
  const { buyer, wallet, signedIn, signIn } = useAuth();
  const address = useAddressForm();
  const [mode, setMode] = useState('signup'); // signup | signin
  const [acct, setAcct] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState({ where: '', text: '' });
  const chatOnly = ['chat', 'account', 'follow'].includes(action.kind);
  const [est, setEst] = useState(null);
  const { state: pickedState, city: pickedCity } = address.form;
  useEffect(() => {
    if (!pickedState || !pickedCity || !streamId) { setEst(null); return undefined; }
    let live = true;
    api.estimate(streamId, { state: pickedState, city: pickedCity }).then((r) => live && setEst(r)).catch(() => live && setEst(null));
    return () => { live = false; };
  }, [pickedState, pickedCity, streamId]);

  const needAccount = !signedIn;
  const needAddress = !chatOnly && !(buyer?.shippingAddresses || []).length;
  const available = wallet?.availableBalance || 0;
  const cost = chatOnly ? 0 : action.amount + deposit;
  const pay = chatOnly ? 0 : topUpFor(cost - available);

  const title = action.kind === 'follow' ? 'Follow this host' : action.kind === 'account' ? 'Create an account' : chatOnly ? 'Join the chat' : action.kind === 'bid' ? 'One step, then your bid' : "One step, then it's yours";
  const what = action.kind === 'bid' ? `bid ${naira(action.amount)}` : 'buy';
  const buttonText = chatOnly
    ? (mode === 'signup' ? 'Create account' : 'Sign in')
    : pay > 0 ? `Pay ${naira(pay)} and ${what}` : action.kind === 'bid' ? `Bid ${naira(action.amount)}` : `Buy now · ${naira(action.amount)}`;

  const fail = (where, text) => { setError({ where, text }); setBusy(''); };
  const setA = (k) => (e) => setAcct((a) => ({ ...a, [k]: e.target.value }));

  // Runs the rest of the steps for a signed-in buyer
  const finish = useCallback(async (me, myWallet, depositDue) => {
    if (chatOnly) { setBusy(''); onReady(); return; }
    if (!(me?.shippingAddresses || []).length) {
      setBusy('Saving your address…');
      try { await address.save(me); } catch (e) { fail('address', errorMessage(e, "Couldn't save the address.")); return; }
    }
    const due = action.amount + depositDue - (myWallet?.availableBalance || 0);
    const amount = topUpFor(due);
    if (amount > 0 && onTopUpNeeded && (myWallet?.topUpMethods?.dva || myWallet?.topUpMethods?.savedCards || topUpMethods.dva || topUpMethods.savedCards)) {
      setBusy(''); onTopUpNeeded(due, action, me?._id); return;
    }
    if (amount > 0) {
      setBusy('Waiting for Paystack…');
      try {
        await topUpWithPaystack({ email: me?.email, buyerId: me?._id, amount });
      } catch (e) {
        if (e instanceof PaymentCancelled) { fail('pay', 'Payment cancelled. Your account and address are saved.'); return; }
        fail('pay', `${errorMessage(e, e.message || "We couldn't confirm the payment yet.")} If you were charged, it will show up shortly.`);
        return;
      }
    }
    setBusy(action.kind === 'bid' ? 'Placing your bid…' : 'Buying…');
    try { await onReady(); } finally { setBusy(''); }
  }, [action, address, chatOnly, onReady, onTopUpNeeded, topUpMethods]);

  const afterSignIn = async (token) => {
    const { buyer: me, wallet: w } = await signIn(token, { quiet: true });
    let depositDue = deposit;
    try { depositDue = (await api.watchMe(streamId)).depositDue ?? deposit; } catch { /* use the show's deposit */ }
    await finish(me, w, depositDue);
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
    await finish(buyer, wallet, deposit);
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
          {deliveryLine(est) ? <p style={{ margin: 0, fontWeight: 700 }}>{deliveryLine(est)}</p> : est?.message ? <span className="hint">{est.message}</span> : estimate}
          {errFor('address')}
        </section>
      )}

      {!chatOnly && pay > 0 && (
        <section className="step" aria-label="Wallet">
          <h3 className="step-h">Wallet</h3>
          <p style={{ margin: 0 }}>
            {action.kind === 'bid' ? `${naira(action.amount)} is held for your bid. It comes back if someone outbids you.` : `${naira(action.amount)} pays for the item.`}
            {deposit > 0 ? ` ${naira(deposit)} covers delivery for everything you get in this show.` : ''}
            {pay > cost - available ? ' Anything left stays in your wallet.' : ''}
          </p>
          <span className="hint">Card, bank transfer or USSD, through Paystack.{available > 0 ? ` You have ${naira(available)} already.` : ''}</span>
          {errFor('pay')}
        </section>
      )}

      {error.where === '' && error.text && <span className="err" role="alert">{error.text}</span>}
      <button type="button" className="btn" disabled={Boolean(busy)} onClick={go}>{busy || buttonText}</button>
      {!chatOnly && <span className="hint" style={{ textAlign: 'center' }}>The show keeps playing while you do this.</span>}
    </Sheet>
  );
}
