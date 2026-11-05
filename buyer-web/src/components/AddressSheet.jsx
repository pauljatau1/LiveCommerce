// Delivery address, asked for once before a first bid or purchase.
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API, api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Sheet } from './ui';

export default function AddressSheet({ onClose, onSaved }) {
  const { buyer, refresh } = useAuth();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ state: '', city: '', addressLine1: '', landmark: '', phoneNumber: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    axios.get(`${API}/api/v2/orders/states`).then((r) => setStates(r.data?.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    const st = states.find((s) => s.name === form.state);
    setCities([]);
    if (st) axios.get(`${API}/api/v2/orders/cities/${st.isoCode}`).then((r) => setCities(r.data?.data || [])).catch(() => {});
  }, [form.state, states]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.state || !form.city || !form.addressLine1.trim()) { setError('Add your state, area and street address.'); return; }
    setBusy(true);
    try {
      await api.addAddress({
        addressType: 'home',
        firstName: buyer?.firstName,
        lastName: buyer?.lastName,
        email: buyer?.email,
        phoneNumber: form.phoneNumber || buyer?.phoneNumber,
        country: 'NG',
        state: form.state,
        city: form.city,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.landmark.trim() || undefined,
      });
      await refresh();
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the address."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Where should we deliver?" onClose={onClose}>
      <p className="mut" style={{ margin: 0, fontSize: 15 }}>We need this once, so anything you win or buy can be shipped straight away.</p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="fl">
          <label className="lab" htmlFor="ad-st">State</label>
          <select id="ad-st" className="sel" value={form.state} onChange={set('state')}>
            <option value="">Choose your state</option>
            {states.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="fl">
          <label className="lab" htmlFor="ad-ct">Area</label>
          <select id="ad-ct" className="sel" value={form.city} onChange={set('city')} disabled={!cities.length}>
            <option value="">{form.state ? 'Choose your area' : 'Choose a state first'}</option>
            {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="fl">
          <label className="lab" htmlFor="ad-l1">Street address</label>
          <input id="ad-l1" className="in" value={form.addressLine1} onChange={set('addressLine1')} placeholder="e.g. 12 Herbert Macaulay Way" autoComplete="street-address" />
        </div>
        <div className="fl">
          <label className="lab" htmlFor="ad-lm">Landmark <span className="hint" style={{ fontWeight: 600 }}>optional</span></label>
          <input id="ad-lm" className="in" value={form.landmark} onChange={set('landmark')} placeholder="e.g. opposite Yaba bus stop" />
        </div>
        {!buyer?.phoneNumber && (
          <div className="fl">
            <label className="lab" htmlFor="ad-ph">Phone for the courier</label>
            <input id="ad-ph" className="in" type="tel" inputMode="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. 0803 123 4567" autoComplete="tel" />
          </div>
        )}
        {error && <span className="err" role="alert">{error}</span>}
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
      </form>
    </Sheet>
  );
}
