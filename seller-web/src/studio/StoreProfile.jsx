import {pickupAddress} from './pickup';
import useStudioBack from './useStudioBack';
// Store profile: name, about, what you sell, and the pickup address (which opens
// the pickup step of Getting started). The store photo stays here too.
import { useEffect, useState } from 'react';
import reloadSeller from './reloadSeller';
import {onboarding} from './api';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { settingsService } from '@/services/settingsService';
import { sellerService } from '@/services/sellerService';
import { sellerUtils, tokenUtils } from '@/util/auth';
import { Icon, TopBar } from './ui';
import { errorText } from './api';


const nameOf = (c) => (typeof c === 'string' ? c : c?.name || '');

export default function StoreProfile() {
  const { seller, dispatch } = useAuthContext();
  const navigate = useNavigate();
  const back=useStudioBack('/studio/me');
  const savedCategories = (seller?.categories || []).map(nameOf).filter(Boolean);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [sells, setSells] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded,setLoaded]=useState(false);
  const [serverPickup,setServerPickup]=useState({});
  const [serverPhoto,setServerPhoto]=useState(null);
  const [categoryOptions,setCategoryOptions]=useState([]);
  useEffect(()=>{let active=true;onboarding.get().then(data=>{if(active){setName(data.store.storeName || '');setAbout(data.store.aboutStore || '');setSells(data.store.categories || []);setServerPickup(data.pickup || {});setServerPhoto(data.store.avatar);setCategoryOptions(data.categories || []);setLoaded(true);}}).catch(()=>{if(active)setError('Couldn’t load your store. Please reload and try again.');});return()=>{active=false;};},[]);
  const address = serverPickup;
  const addressLine = [address.addressLine1 || address.street, address.city, address.state].filter(Boolean).join(', ');
  const options = categoryOptions;

  const toggle = (c) => setSells((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2) { setNameError('Add a store name. It’s what buyers see on your shows.'); document.getElementById('sp-name')?.focus(); return; }
    setBusy(true);
    setError('');
    try {
      if (photo) await settingsService.uploadStoreAvatar(photo);
      // Keep anything saved under a category (sub-categories) as it was
      const categories = sells.map((c) => (seller?.categories || []).find((x) => nameOf(x) === c) || { name: c, subCategories: [] });
      await settingsService.updateStoreProfile({ storeName: name.trim(), aboutStore: about.trim(), categories });
      await reloadSeller(dispatch);
      back();
    } catch (err) {
      setError(errorText(err, 'Couldn’t save your profile. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-app">
      <TopBar title="Store profile" backTo="/studio/me" />
      <form className="ed-page" onSubmit={save} noValidate style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="ed-pad ed-fields" style={{ gap: 22, paddingTop: 16, paddingBottom: 24 }}>
          <div className="fl">
            <label className="lab" htmlFor="sp-name">Store name</label>
            <div className={`inbox${nameError ? ' bad' : ''}`}><input id="sp-name" maxLength={60} value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }} aria-describedby="sp-name-err" /></div>
            {nameError && <p className="field-err" id="sp-name-err">{nameError}</p>}
          </div>
          <div className="fl">
            <label className="lab" htmlFor="sp-about">About the store</label>
            <div className="inbox ta"><textarea id="sp-about" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="What you sell, where you are, when you go live." /></div>
          </div>
          <div className="fl">
            <span className="lab" id="sp-sells">What you sell</span>
            <div role="group" aria-labelledby="sp-sells" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {options.map((c) => <button key={c} type="button" className={`chip${sells.includes(c) ? ' on' : ''}`} aria-pressed={sells.includes(c)} onClick={() => toggle(c)}>{c}</button>)}
            </div>
          </div>
          <div className="fl">
            <span className="lab">Store photo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {serverPhoto && <img src={serverPhoto} width="56" height="56" alt="Current store photo" style={{ borderRadius: '50%', objectFit: 'cover' }} />}
              <label className="btn2" htmlFor="sp-photo" style={{ display: 'inline-flex', width: 'auto' }}>{photo ? photo.name : serverPhoto ? 'Change photo' : 'Choose photo'}</label>
              <input id="sp-photo" className="sr" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0] || null)} />
            </div>
          </div>
          <button type="button" className="list-row" style={{ borderTop: '1px solid var(--border)', minHeight: 72 }} onClick={() => navigate('/studio/pickup',{state:{from:'/studio/profile'}})}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="lab">Pickup address</p>
              <p style={{ marginTop: 2, fontSize: 'var(--t-small)', color: addressLine ? 'var(--text)' : 'var(--text-muted)' }}>{addressLine || 'Add where couriers collect from'}</p>
            </div>
            {Icon.chevron('var(--text-muted)')}
          </button>
          {error && <p className="field-err" role="alert">{error}</p>}
        </div>
        <div className="foot" style={{ borderTop: 0 }}>
          <button className="btn" style={{ width: '100%' }} disabled={busy || !loaded}>{busy ? <><span className="spin" aria-hidden="true" />Saving…</> : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
