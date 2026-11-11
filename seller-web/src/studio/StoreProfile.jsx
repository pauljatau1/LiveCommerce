import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { settingsService } from '@/services/settingsService';
import { sellerService } from '@/services/sellerService';
import { sellerUtils, tokenUtils } from '@/util/auth';
import { TopBar } from './ui';
import { errorText } from './api';

export default function StoreProfile() {
  const { seller, dispatch } = useAuthContext(), navigate = useNavigate();
  const [name, setName] = useState(seller?.storeName || ''), [about, setAbout] = useState(seller?.aboutStore || '');
  const [photo, setPhoto] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (photo) await settingsService.uploadStoreAvatar(photo);
      await settingsService.updateStoreProfile({ storeName: name.trim(), aboutStore: about.trim(), categories: seller?.categories || [] });
      const fresh = await sellerService.fetchSellerDetails(); sellerUtils.storeSeller(fresh);
      dispatch({ type: 'AUTH_SUCCESS', payload: { seller: fresh, token: tokenUtils.getBearerToken() } });
      navigate('/studio/me', { state: { studioNotice: 'Store profile saved.' } });
    } catch(e) { setError(errorText(e, 'Couldn’t save your profile. Please try again.')); }
    finally { setBusy(false); }
  };
  return <div className="studio-app"><TopBar title="Edit store profile" onBack={() => navigate('/studio/me')} /><form className="st-inner entry-form" onSubmit={save}>
    <div className="fl"><span className="lab">Store photo</span>{seller?.storeAvatar?.url && <img src={seller.storeAvatar.url} width="72" height="72" alt="Current store" style={{ borderRadius: '50%', objectFit: 'cover' }} />}<label className="btn3" htmlFor="store-photo">{photo ? photo.name : 'Choose photo'}</label><input id="store-photo" className="sr" type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0] || null)} /></div>
    <label className="fl"><span className="lab">Store name</span><input className="in" required minLength={2} value={name} onChange={e => setName(e.target.value)} /></label>
    <label className="fl"><span className="lab">About your store</span><textarea className="in" rows={4} style={{ height: 'auto', padding: 12 }} value={about} onChange={e => setAbout(e.target.value)} /></label>
    <p className="hint">Tell buyers what you sell and what makes your store yours.</p>
    {error && <span className="err-text" role="alert">{error}</span>}<button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
  </form></div>;
}
