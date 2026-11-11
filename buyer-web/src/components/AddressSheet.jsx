// Delivery address, asked for once before a first bid or purchase.
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API, api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Sheet } from './ui';

// The address form, shared by this sheet and the "One step, then your bid" sheet.
// Nigerian mobile numbers: 0803 123 4567 (11 digits), +234 803 123 4567, or 803 123 4567
export const phoneProblem = (raw) => {
  const d = String(raw || '').replace(/[^\d]/g, '');
  if (!d) return 'Add a phone number so the courier can reach you.';
  const local = d.startsWith('234') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d;
  if (local.length !== 10 || !/^[789]/.test(local)) return 'Check the phone number: it should look like 0803 123 4567 (11 digits).';
  return '';
};

export function useAddressForm() {
  const { buyer } = useAuth();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ state: '', city: '', addressLine1: '', landmark: '', phoneNumber: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    axios.get(`${API}/api/v2/orders/states`).then((r) => setStates(r.data?.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    const st = states.find((s) => s.name === form.state);
    setCities([]);
    if (st) axios.get(`${API}/api/v2/orders/cities/${st.isoCode}`).then((r) => setCities(r.data?.data || [])).catch(() => {});
  }, [form.state, states]);

  // Plain-language problem with the form, or '' when it's complete
  const problem = (needPhone) => {
    if (!form.state || !form.city || !form.addressLine1.trim()) return 'Add your state, area and street address.';
    if (needPhone || form.phoneNumber) {
      const p = phoneProblem(form.phoneNumber);
      if (p) return p;
    }
    return '';
  };

  // `who` fills the name and email for a buyer who just signed up
  const save = (who = buyer) => api.addAddress({
    addressType: 'home',
    firstName: who?.firstName,
    lastName: who?.lastName,
    email: who?.email,
    phoneNumber: form.phoneNumber || who?.phoneNumber,
    country: 'NG',
    state: form.state,
    city: form.city,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.landmark.trim() || undefined,
  });

  return { form, set, states, cities, problem, save };
}

export function AddressFields({ address, askPhone, idPrefix = 'ad' }) {
  const { form, set, states, cities } = address;
  return (
    <>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-st`}>State</label>
        <select id={`${idPrefix}-st`} className="sel" value={form.state} onChange={set('state')}>
          <option value="">Choose your state</option>
          {states.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-ct`}>Area</label>
        <select id={`${idPrefix}-ct`} className="sel" value={form.city} onChange={set('city')} disabled={!cities.length}>
          <option value="">{form.state ? 'Choose your area' : 'Choose a state first'}</option>
          {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-l1`}>Street address</label>
        <input id={`${idPrefix}-l1`} className="in" value={form.addressLine1} onChange={set('addressLine1')} placeholder="e.g. 12 Herbert Macaulay Way" autoComplete="street-address" />
      </div>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-lm`}>Landmark <span className="hint" style={{ fontWeight: 'var(--w-medium)' }}>optional</span></label>
        <input id={`${idPrefix}-lm`} className="in" value={form.landmark} onChange={set('landmark')} placeholder="e.g. opposite Yaba bus stop" />
      </div>
      {askPhone && (
        <div className="fl">
          <label className="lab" htmlFor={`${idPrefix}-ph`}>Phone for the courier</label>
          <input id={`${idPrefix}-ph`} className="in" type="tel" inputMode="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. 0803 123 4567" autoComplete="tel" />
        </div>
      )}
    </>
  );
}

// Change the delivery address later (the first one is asked in the one-step sheet).
export default function AddressSheet({ onClose, onSaved, top = null }) {
  const { buyer, refresh } = useAuth();
  const address = useAddressForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    const problem = address.problem(!buyer?.phoneNumber);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      await address.save();
      await refresh();
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the address."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Where should we deliver?" onClose={onClose} top={top}>
      <p className="mut" style={{ margin: 0, fontSize: 'var(--t-body)' }}>Anything you win or buy ships here.</p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AddressFields address={address} askPhone={!buyer?.phoneNumber} />
        {error && <span className="err" role="alert">{error}</span>}
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
      </form>
    </Sheet>
  );
}
