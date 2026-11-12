import useStudioBack from './useStudioBack';
import {PHONE_HINT,phoneProblem} from './phone';
import {allowedPlace} from './googlePlaces';
import PickupAddressForm from './PickupAddressForm';
import {notifyDeliveryState} from './api';
const LEGACY_PICKUP_FORM = false; // Existing manual form remains available as the Google fallback below.
import {PickupAreaField} from './ServiceArea';
const LEGACY_AREA_INPUT = false; // Native datalist kept inactive for reference.
// Getting started (design A): Your store → Pickup address → Get paid → Finished.
// Replaces the old dashboard onboarding for new sellers. Answers are kept on
// this phone, so a weak signal never loses them.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '@/Constants/Server';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { sellerUtils } from '@/util/auth';
import { onboarding, errorText, serviceAreaConfig } from './api';
import { Problem, Skeleton, TopBar } from './ui';

const STEPS = ['store', 'pickup', 'bank', 'done'];
const SAVED_KEY = 'studioStartAnswers';
const load = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}'); } catch { return {}; } };
const keep = (v) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(v)); } catch { /* private mode */ } };
const apiOrigin = () => { try { return new URL(BASE_URL).origin; } catch { return String(BASE_URL).replace(/\/api\/?$/, ''); } };

const useOnline = () => {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
};

export default function Start() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnBack=useStudioBack('/studio/me');
  const pickupEdit=params.get('step')==='pickup';
  const { seller, dispatch } = useAuthContext();
  const online = useOnline();
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(params.get('step') || null);
  const [answers, setAnswers] = useState(load);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // a save waiting for the connection
  const [states, setStates] = useState([]);
  const [areaConfig, setAreaConfig] = useState(null);
  const [cities, setCities] = useState([]);
  const [banks, setBanks] = useState([]);
  const [accountName, setAccountName] = useState('');

  const set = (k) => (e) => setAnswers((a) => { const next = { ...a, [k]: e?.target ? e.target.value : e, ...(k === 'state' ? { city: '', lga: '' } : {}) }; keep(next); return next; });

  const refresh = useCallback(() => onboarding.get().then((r) => {
    setInfo(r);
    setLoadError('');
    setAnswers((a) => {
      const next = {
        storeName: a.storeName ?? r.store.storeName, aboutStore: a.aboutStore ?? r.store.aboutStore, categories: a.categories ?? r.store.categories,
        state: a.state ?? r.pickup.state ?? '', city: a.city ?? (a.state && a.state !== r.pickup.state ? '' : r.pickup.city) ?? '', lga: a.lga ?? r.pickup.lga ?? '',latitude:a.latitude ?? r.pickup.latitude,longitude:a.longitude ?? r.pickup.longitude,addressSource:a.addressSource ?? r.pickup.addressSource,formattedAddress:a.formattedAddress ?? r.pickup.formattedAddress, addressLine1: a.addressLine1 ?? r.pickup.addressLine1 ?? '', landmark: a.landmark ?? r.pickup.landmark ?? '', phone: a.phone ?? r.pickup.phone ?? '',
        bankCode: a.bankCode ?? '', accountNumber: a.accountNumber ?? '',
      };
      keep(next);
      return next;
    });
    setStep((s) => s || (!r.store.done ? 'store' : !r.pickup.done ? 'pickup' : !r.bank.done ? 'bank' : 'done'));
    return r;
  }).catch((e) => setLoadError(errorText(e, "Couldn't load your setup."))), []);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => { serviceAreaConfig().then(config => {
    setAreaConfig(config); setStates(config.states.map(name => ({name,isoCode:name})));
    if(config.states.length === 1) setAnswers(a => ({...a,state:a.state || config.states[0]}));
  }).catch(() => setLoadError('Couldn’t load delivery areas. Please try again.')); }, []);
  useEffect(() => {
    if (!LEGACY_AREA_INPUT) return;
    const groups = areaConfig?.areas?.[answers.state]; setCities([]);
    if(groups) setCities(Object.entries(groups).flatMap(([lga,names]) => [...new Set([lga,...names])].map(name => ({name,lga}))));
    else if(answers.state && areaConfig) axios.get(`${apiOrigin()}/api/v2/orders/states`).then(r => {
      const st = r.data?.data?.find(s => s.name === answers.state);
      if(st) return axios.get(`${apiOrigin()}/api/v2/orders/cities/${st.isoCode}`).then(r => setCities(r.data?.data || []));
    }).catch(()=>{});
  }, [answers.state,areaConfig]);
  useEffect(() => { if (step === 'bank' && !banks.length) onboarding.banks().then((r) => setBanks(r.banks || [])).catch(() => {}); }, [step, banks.length]);

  // Saves; offline, it waits and saves the moment the phone is back online
  const save = useCallback(async (kind, body, next) => {
    setError('');
    if(kind==='pickup' && phoneProblem(body.phone)){setError(phoneProblem(body.phone));return;}
    if (!navigator.onLine) { setPending({ kind, body, next }); return; }
    setBusy(kind);
    try {
      await onboarding[kind](body);
      await refresh();
      // Keep the signed-in seller up to date, so the studio stops asking for a pickup address
      if (kind === 'pickup' || kind === 'store') {
        const updated = { ...(seller || sellerUtils.getSeller() || {}), ...(kind === 'pickup' ? { hasFilledAddress: true, hasFilledBusinessAddress: true, warehouseDetails: { ...seller?.warehouseDetails, address: { state: body.state, city: body.city, lga: body.lga, latitude:body.latitude,longitude:body.longitude,addressSource:body.addressSource,formattedAddress:body.formattedAddress, addressLine1: body.addressLine1, addressLine2: body.landmark } } } : { storeName: body.storeName }) };
        sellerUtils.storeSeller(updated);
        dispatch?.({ type: 'STORE_SELLER', payload: updated });
      }
      setPending(null);
      if(next==='return')returnBack();else setStep(next);
    } catch (e) {
      setError(errorText(e, "Couldn't save. Your answers are still here: try again."));
    } finally {
      setBusy('');
    }
  }, [refresh, seller, dispatch, returnBack]);
  useEffect(() => { if (online && pending) save(pending.kind, pending.body, pending.next); }, [online, pending, save]);

  const checkAccount = async () => {
    setError('');
    setAccountName('');
    if (!answers.bankCode) { setError('Pick your bank.'); return; }
    if (!/^\d{10}$/.test(String(answers.accountNumber || ''))) { setError('Account numbers have 10 digits.'); return; }
    setBusy('check');
    try {
      const r = await onboarding.checkBank({ bankCode: answers.bankCode, accountNumber: answers.accountNumber });
      setAccountName(r.accountName);
    } catch (e) {
      setError(errorText(e, "We couldn't find that bank account. Check the 10 digits, or pick a different bank."));
    } finally {
      setBusy('');
    }
  };

  const bankName = useMemo(() => banks.find((b) => b.code === answers.bankCode)?.name || '', [banks, answers.bankCode]);
  const index = STEPS.indexOf(step);
  const finish = (to) => { try { localStorage.removeItem(SAVED_KEY); } catch { /* fine */ } navigate(to, { replace: true }); };

  if (loadError) return <div className="studio-app"><TopBar title="Getting started" /><div className="st-inner"><Problem text={loadError} onRetry={refresh} /></div></div>;
  if (!info || !step) return <div className="studio-app"><TopBar title="Getting started" /><div className="st-inner"><Skeleton h={48} /><Skeleton h={220} /></div></div>;

  return (
    <div className="studio-app">
      <TopBar
        title="Getting started"
        sub={step === 'done' ? 'All set' : `Step ${index + 1} of 3`}
        onBack={pickupEdit ? returnBack : index > 0 && step !== 'done' ? () => setStep(STEPS[index - 1]) : returnBack}
        right={step === 'store' || step === 'bank' ? <button type="button" className="link" onClick={() => setStep(STEPS[index + 1])}>Do this later</button> : null}
      />
      {!online && <div className="banner b-off" role="status">You're offline. Your answers are saved on this phone.</div>}
      <div className="st-inner" style={{ maxWidth: 520 }}>
        {step !== 'done' && <div className="steps" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className={i <= index ? 'on' : ''} />)}</div>}

        {step === 'store' && (
          <>
            <h1 className="h1">Your store</h1>
            <p className="mut" style={{ margin: 0 }}>This is what buyers see on your shows.</p>
            <div className="fl">
              <label className="lab" htmlFor="st-name">Store name</label>
              <input id="st-name" className="in" value={answers.storeName || ''} onChange={set('storeName')} maxLength={60} />
            </div>
            <div className="fl">
              <label className="lab" htmlFor="st-bio">One-line bio <span className="hint" style={{ fontWeight: 'var(--w-medium)' }}>optional</span></label>
              <input id="st-bio" className="in" value={answers.aboutStore || ''} onChange={set('aboutStore')} maxLength={80} placeholder="e.g. Thrift and Ankara from Yaba. Saturdays 7pm." />
              <span className="hint">{(answers.aboutStore || '').length} / 80</span>
            </div>
            <span className="lab">What do you sell? Pick any</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="What you sell">
              {info.categories.map((c) => {
                const on = (answers.categories || []).includes(c);
                return <button key={c} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set('categories')(on ? answers.categories.filter((x) => x !== c) : [...(answers.categories || []), c])}>{c}</button>;
              })}
            </div>
            {error && <Problem text={error} />}
            <button type="button" className="btn" disabled={busy === 'store'} onClick={() => save('store', { storeName: answers.storeName, aboutStore: answers.aboutStore, categories: answers.categories }, 'pickup')}>
              {busy === 'store' ? 'Saving…' : pending?.kind === 'store' ? 'Save when I’m back online' : 'Continue'}
            </button>
          </>
        )}

        {step === 'pickup' && (
          <>
            <span className="cap">REQUIRED</span>
            <h1 className="h1">Pickup address</h1>
            <p className="mut" style={{ margin: 0 }}>Couriers collect your orders from here, so we can quote delivery before buyers pay.</p>
            {LEGACY_PICKUP_FORM ? <>
            <div className="fl">
              <label className="lab" htmlFor="pk-st">State</label>
              <select id="pk-st" className="sel" disabled={states.length === 1} value={answers.state || ''} onChange={set('state')}>
                <option value="">Choose your state</option>
                {states.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="fl">
              <label className="lab" htmlFor="pk-ct">Area</label>
              {LEGACY_AREA_INPUT ? <>
              <input id="pk-ct" className="in" list="pickup-areas" value={answers.city || ''} onChange={set('city')} placeholder="Search your area" />
              <datalist id="pickup-areas">{cities.map((c,i) => <option key={i} value={c.name}>{c.lga ? `${c.name} · ${c.lga}` : c.name}</option>)}</datalist>
              </> : <PickupAreaField config={areaConfig} state={answers.state} value={answers.city || ''} lga={answers.lga || ''} onChange={area=>setAnswers(previous=>{const next={...previous,city:area.name,lga:area.lga};keep(next);return next;})} />}
            </div>
            <div className="fl">
              <label className="lab" htmlFor="pk-l1">Street address</label>
              <input id="pk-l1" className="in" value={answers.addressLine1 || ''} onChange={set('addressLine1')} autoComplete="street-address" />
            </div>
            <div className="fl">
              <label className="lab" htmlFor="pk-lm">Landmark <span className="hint" style={{ fontWeight: 'var(--w-medium)' }}>optional</span></label>
              <input id="pk-lm" className="in" value={answers.landmark || ''} onChange={set('landmark')} />
            </div>
            <div className="fl">
              <label className="lab" htmlFor="pk-ph">Phone for couriers</label>
              <input id="pk-ph" className="in" type="tel" inputMode="tel" value={answers.phone || ''} onChange={set('phone')} placeholder="0803 123 4567" autoComplete="tel" />
              <span className="hint">{PHONE_HINT}</span>
            </div>
            </> : <PickupAddressForm config={areaConfig} value={answers} onChange={next=>{setAnswers(next);keep(next);}} onNotify={notifyDeliveryState} />}
            {pending?.kind === 'pickup' && <span className="hint">We'll save this the moment you're back online. No need to type it again.</span>}
            {error && <Problem text={error} />}
            <button type="button" className="btn" disabled={busy === 'pickup' || Boolean(areaConfig && answers.state && !allowedPlace(areaConfig,answers.state))} onClick={() => save('pickup', {state:answers.state,city:answers.city,lga:answers.lga,addressLine1:answers.addressLine1,landmark:answers.landmark,phone:answers.phone,latitude:answers.latitude,longitude:answers.longitude,addressSource:answers.addressSource,formattedAddress:answers.formattedAddress}, pickupEdit ? 'return' : 'bank')}>
              {busy === 'pickup' ? 'Saving…' : pending?.kind === 'pickup' ? 'Save when I’m back online' : 'Save address'}
            </button>
          </>
        )}

        {step === 'bank' && (
          <>
            <h1 className="h1">Get paid</h1>
            <p className="mut" style={{ margin: 0 }}>Where we send your money after each delivery.</p>
            <div className="fl">
              <label className="lab" htmlFor="bk-b">Bank</label>
              <select id="bk-b" className="sel" value={answers.bankCode || ''} onChange={(e) => { setAccountName(''); set('bankCode')(e); }}>
                <option value="">{banks.length ? 'Choose your bank' : 'Loading banks…'}</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div className="fl">
              <label className="lab" htmlFor="bk-n">Account number</label>
              <input id="bk-n" className="in" inputMode="numeric" maxLength={10} value={answers.accountNumber || ''} onChange={(e) => { setAccountName(''); set('accountNumber')(e.target.value.replace(/\D/g, '')); }} onBlur={() => String(answers.accountNumber || '').length === 10 && answers.bankCode && !accountName && checkAccount()} />
            </div>
            {busy === 'check' && <span className="mut">Checking the account name… This usually takes a few seconds on slow data.</span>}
            {accountName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="cap">ACCOUNT NAME</span>
                <span className="f" style={{ fontSize: 'var(--t-h2)' }}>{accountName}</span>
                <span className="hint">Not you? Check the number. Payouts only go to an account in your name.</span>
              </div>
            )}
            {error && <Problem text={error} />}
            {accountName
              ? <button type="button" className="btn" disabled={busy === 'bank'} onClick={() => save('bank', { bankCode: answers.bankCode, bankName, accountNumber: answers.accountNumber }, 'done')}>{busy === 'bank' ? 'Saving…' : "Yes, that's me"}</button>
              : <button type="button" className="btn" disabled={busy === 'check'} onClick={checkAccount}>Check account</button>}
            <span className="hint" style={{ textAlign: 'center' }}>Skipping is fine. We'll remind you before your first payout.</span>
          </>
        )}

        {step === 'done' && (
          <>
            <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-display)' }}>You're set{info.firstName ? `, ${info.firstName}` : ''}.</h1>
            <p style={{ margin: 0 }}>{info.store.storeName || 'Your store'} is ready. Let's list your first item.</p>
            {[
              ['Store', info.store.done ? 'Done' : 'Later', 'store'],
              [`Pickup address${info.pickup.city ? ` · ${info.pickup.city}` : ''}`, info.pickup.done ? 'Done' : 'Needed before you sell', 'pickup'],
              ['Bank account', info.bank.done ? 'Done' : 'Later', 'bank'],
            ].map(([label, state, s]) => (
              <button key={s} type="button" className="st-row" onClick={() => setStep(s)}>
                <span style={{ flex: 1, fontWeight: 'var(--w-medium)' }}>{label}</span>
                <span className="mut">{state}</span>
              </button>
            ))}
            <button type="button" className="btn" disabled={!info.pickup.done} onClick={() => finish('/studio/list')}>List my first item</button>
            <button type="button" className="link" style={{ alignSelf: 'center' }} onClick={() => finish('/studio')}>Look around first</button>
          </>
        )}
      </div>
    </div>
  );
}
