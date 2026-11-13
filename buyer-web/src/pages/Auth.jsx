import CourierNameFields from '../components/CourierNameFields';
import {hasCourierName,NAME_ERROR} from '../courierName';
import PasswordReset from '../components/PasswordReset';
import PasswordInput from '../components/PasswordInput';
import {loginError} from '../loginError';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Header } from '../components/ui';

export default function Auth() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ firstName:'',lastName:'',username: '', email: params.get('email') || '', password: '' });
  const [reset,setReset]=useState(window.location.pathname==='/forgot-password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const exitReset=()=>{setReset(false);setMode('signin');if(window.location.pathname==='/forgot-password')navigate(`/signin${next!=='/'?'?next='+encodeURIComponent(next):''}`,{replace:true});};
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if(mode==='signup'&&!hasCourierName(form)){setError(NAME_ERROR);return;}
    if (mode === 'signup' && !/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) { setError('Pick a username: 3–20 letters, numbers, _ or .'); return; }
    if (form.password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    setBusy(true);
    try {
      const res = mode === 'signup'
        ? await api.register({ username: form.username.trim(), email: form.email.trim(), password: form.password,firstName:form.firstName.trim(),lastName:form.lastName.trim() })
        : await api.login({ email: form.email.trim(), password: form.password });
      const token = res?.token || res?.accessToken || res?.data?.token;
      if (!token) throw new Error('No token');
      await signIn(token);
      navigate(next, { replace: true });
    } catch (err) {
      setError(mode==='signin' ? loginError(err) : errorMessage(err,"Couldn't create your account."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app auth-page">
      <Header back={next} accountActions={false} />
      <main className="wrap" style={{ maxWidth: 440, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {reset?<PasswordReset token={params.get('token') || ''} initialCode={params.get('code') || ''} initialEmail={form.email} onDone={exitReset} onCancel={exitReset}/>:<><div>
          <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-h1)' }}>{mode === 'signup' ? 'Join the show' : 'Welcome back'}</h1>
          <p className="mut" style={{ margin: '6px 0 0' }}>{mode === 'signup' ? 'Takes 20 seconds. Then you can chat, bid and buy.' : 'Sign in to bid and buy.'}</p>
        </div>
        <form onSubmit={submit} className={`auth-form${error && mode==='signin' ? ' auth-invalid' : ''}`} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode==='signup'&&<CourierNameFields value={form} onChange={(key,value)=>setForm(f=>({...f,[key]:value}))}/>}
          {mode === 'signup' && (
            <div className="fl">
              <label className="lab" htmlFor="au-u">Username</label>
              <input id="au-u" className="in" value={form.username} onChange={set('username')} placeholder="e.g. ada_lagos" autoComplete="username" autoCapitalize="none" />
              <span className="hint">This is how you appear in chat and on bids.</span>
            </div>
          )}
          <div className="fl">
            <label className="lab" htmlFor="au-e">Email</label>
            <input id="au-e" className="in" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </div>
          <div className="fl">
            <label className="lab" htmlFor="au-p">Password</label>
            <PasswordInput id="au-p" className="in" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
          </div>
          {error && <span className="err" role="alert">{mode==='signin' && error==='Wrong email or password. Try again or reset it.' ? <>Wrong email or password. Try again or <button type="button" className="link" onClick={()=>setReset(true)}>reset it</button>.</> : error}</span>}
          {mode==='signin'&&<button className="link" type="button" onClick={()=>setReset(true)}>Forgot password?</button>}
          <button type="submit" className="btn" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        </form>
        <p style={{ margin: 0, textAlign: 'center' }} className="mut">
          {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
          <button type="button" className="link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p></>}
      </main>
    </div>
  );
}
