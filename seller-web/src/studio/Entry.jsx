import axios from 'axios';
import { BASE_URL } from '@/Constants/Server';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/authService';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { loginSchema } from '@/schemas/loginSchema';
import { signupSchema } from '@/schemas/signupSchema';
import { forgotPasswordStep1Schema, forgotPasswordStep2Schema } from '@/schemas/forgotPasswordSchema';
import { APP_NAME } from '@/config/constants';
import { safeStudioReturn } from '@/config/featureFlags';
import './studio.css';

export default function Entry({ mode = 'login' }) {
  const { handleLoginActivity, handleSignupActivity } = useAuthContext();
  const navigate = useNavigate(), location = useLocation();
  const [form, setForm] = useState({ fullName: '', storeName: '', phoneNumber: '', email: '', password: '', confirmPassword: '', termsAccepted: false, otp: '', newPassword: '' });
  const resetToken = new URLSearchParams(location.search).get('token');
  const [step, setStep] = useState(resetToken && mode === 'forgot' ? 'link' : 'email'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const change = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const finish = async (response) => {
    const result = response.data || response;
    if (!result.user || !result.token) throw new Error('Please check your email, then sign in.');
    if (mode === 'signup') { await handleSignupActivity(result.user, result.token); navigate('/studio/start', { replace: true }); }
    else await handleLoginActivity(result.user, result.token, safeStudioReturn(location.state?.from));
  };
  const submit = async e => {
    e.preventDefault(); if (busy) return; setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'forgot') {
        if (step === 'email') { const values = forgotPasswordStep1Schema.parse(form); await authService.forgotPasswordRequest(values.email); setStep('code'); setResendAt(Date.now() + 30000); setNotice('Check your email for your code.'); }
        else if (step === 'link') { const v = forgotPasswordStep2Schema.parse({ ...form, otp: '0000' }); await axios.post(`${BASE_URL}/seller/reset-password-with-token`, { token: resetToken, newPassword: v.newPassword }); setStep('done'); }
        else { const v = forgotPasswordStep2Schema.parse(form); await authService.resetPasswordWithOtp({ email: form.email.trim().toLowerCase(), code: v.otp, newPassword: v.newPassword }); setStep('done'); }
      } else if (mode === 'signup') {
        let phoneNumber = form.phoneNumber.replace(/\D/g, ''); if (phoneNumber.startsWith('234')) phoneNumber = phoneNumber.slice(3); if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.slice(1);
        await finish(await authService.signUp(signupSchema.parse({ ...form, phoneNumber })));
      } else await finish(await authService.login(loginSchema.parse(form)));
    } catch (e) { setError(e.issues?.[0]?.message || e.response?.data?.message || e.message || 'Please try again.'); }
    finally { setBusy(false); }
  };
  const field = (key, label, type = 'text', props = {}) => <label className="fl" key={key}><span className="lab">{label}</span><input className="in" type={type} value={form[key]} onChange={change(key)} required {...props} /></label>;
  const title = mode === 'signup' ? 'Create your store' : mode === 'forgot' ? step === 'done' ? 'Password changed' : 'Reset your password' : 'Welcome back';
  return <div className="studio-app"><main className="st-inner entry-screen">
    <Link to="/studio" className="f entry-wordmark">{APP_NAME}</Link>
    <h1 className="h1">{title}</h1>
    <p className="mut">{mode === 'signup' ? 'One account for your products, shows and orders.' : mode === 'forgot' ? 'We’ll help you get back to your studio.' : 'Sign in to your studio.'}</p>
    {step === 'done' ? <><p>Your new password is ready. Sign in to continue.</p><Link to="/login" className="btn">Sign in</Link></> : <form className="entry-form" onSubmit={submit}>
      {mode === 'signup' && <>{field('fullName','Full name', 'text', { autoComplete: 'name' })}{field('storeName','Store name')}{field('phoneNumber','Nigerian phone number','tel', { autoComplete: 'tel', placeholder: '0803 123 4567' })}</>}
      {step !== 'link' && field('email','Email','email', { autoComplete: 'email', readOnly: mode === 'forgot' && step === 'code' })}
      {mode !== 'forgot' && field('password','Password','password', { autoComplete: mode === 'signup' ? 'new-password' : 'current-password' })}
      {mode === 'signup' && <>{field('confirmPassword','Confirm password','password', { autoComplete: 'new-password' })}<label className="hint"><input type="checkbox" checked={form.termsAccepted} onChange={change('termsAccepted')} required /> I accept the <Link to="/studio/help#terms">terms and privacy policy</Link>.</label></>}
      {mode === 'forgot' && ['code', 'link'].includes(step) && <>{step === 'code' && field('otp','4-digit email code','text', { inputMode: 'numeric', pattern: '[0-9]{4}', maxLength: 4, autoComplete: 'one-time-code' })}{field('newPassword','New password','password', { autoComplete: 'new-password' })}{field('confirmPassword','Confirm password','password', { autoComplete: 'new-password' })}{step === 'code' && <button className="link" type="button" disabled={busy} onClick={async () => { if (Date.now() < resendAt) { setNotice('Please wait 30 seconds before another code.'); return; } setBusy(true); try { await authService.forgotPasswordRequest(form.email); setResendAt(Date.now()+30000); setNotice('A new code is on its way.'); } catch { setError('Couldn’t send a code. Try again.'); } finally { setBusy(false); } }}>Send another code</button>}</>}
      {error && <span className="err-text" role="alert">{error}</span>}{notice && <span className="hint" role="status">{notice}</span>}
      <button className="btn" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? step !== 'email' ? 'Save new password' : 'Send reset code' : 'Sign in'}</button>
    </form>}
    {mode !== 'forgot' && import.meta.env.VITE_GOOGLE_CLIENT_ID && <div aria-label="Google sign-in"><GoogleLogin onSuccess={async r => { if (!r.credential || busy) return; setBusy(true); setError(''); try { await finish(await authService.googleAuth({ token: r.credential })); } catch(e) { setError(e.response?.data?.message || 'Google sign-in could not finish. Try again.'); } finally { setBusy(false); } }} onError={() => setError('Google sign-in could not finish. Try again.')} /></div>}
    {mode === 'login' && <><Link className="link" to="/forgot-password">Forgot password?</Link><Link className="btn2" to="/signup">Create an account</Link></>}
    {mode !== 'login' && <Link className="link" to="/login">Back to sign in</Link>}
    <Link className="link" to="/studio/help">Need help?</Link>
  </main></div>;
}
