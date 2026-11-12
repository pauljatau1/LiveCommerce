import {PHONE_HINT,PHONE_ERROR,phoneProblem,phoneDigits} from './phone';
// Sign in, sign up and forgot password for the studio.
// Forgot password has two ways in: the 6-digit code (email → code + new password),
// and the link in the email (?token=… from the link email, or ?email=…&code=… from
// the code email's "Reset password" button), which goes straight to a new password.
import axios from 'axios';
import { BASE_URL } from '@/Constants/Server';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/authService';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { loginSchema } from '@/schemas/loginSchema';
import { studioSignupSchema as signupSchema } from '@/schemas/signupSchema';
import { forgotPasswordStep1Schema, forgotPasswordStep2Schema } from '@/schemas/forgotPasswordSchema';
import { APP_NAME } from '@/config/constants';
import { safeStudioReturn } from '@/config/featureFlags';
import './studio.css';

const ic = { 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const EyeOpen = <svg {...ic} width="22" height="22" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeShut = <svg {...ic} width="22" height="22" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.1 1.5M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.1-1.5" /><path d="M3 3l18 18" /></svg>;
const Alert = <svg {...ic} width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>;
const Back = <svg {...ic} width="24" height="24" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>;
const Tick = <svg {...ic} strokeWidth="2.2" width="32" height="32" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const NoWifi = <svg {...ic} width="20" height="20" viewBox="0 0 24 24"><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M5 12.9a10 10 0 0 1 5.2-2.8" /><path d="M19 12.9a10 10 0 0 0-2.4-1.6" /><path d="M2 8.8a15 15 0 0 1 4.2-2.6" /><path d="M22 8.8A15 15 0 0 0 11 5" /><path d="M12 20h.01" /></svg>;

const googleOn = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const RESEND_SECONDS = 30;

const weakPassword = (pw = '') => (pw.length
  ? `That's ${pw.length} character${pw.length === 1 ? '' : 's'}. Use at least 8. A short phrase is easy to remember, like "saturday drop".`
  : 'Choose a password with at least 8 characters.');

// Zod issue → the field it belongs to and a plain sentence
function fieldIssue(issue, form) {
  const field = String(issue.path?.[0] || '');
  const text = {
    email: 'Enter your email, like you@example.com.',
    password: form.mode === 'login' ? 'Enter your password.' : weakPassword(form.password),
    newPassword: weakPassword(form.newPassword),
    fullName: 'Add your full name.',
    storeName: 'Add a store name. You can change it later.',
    phoneNumber: PHONE_ERROR,
    termsAccepted: 'Tick the box to agree to the Terms and Seller policy.',
    otp: 'Enter the 6-digit code from the email.',
  }[field];
  return { field: text ? field : '', text: text || issue.message };
}

const isOffline = (e) => (typeof navigator !== 'undefined' && navigator.onLine === false) || (e?.isAxiosError && !e.response);

function FieldError({ id, children }) {
  return children ? <p className="field-err" id={id}>{Alert}<span>{children}</span></p> : null;
}

function Field({ id, label, note, error, hint, children }) {
  return (
    <div className="fl">
      <label className="lab" htmlFor={id}>{label}{note && <span className="opt">{note}</span>}</label>
      {children}
      <FieldError id={`${id}-err`}>{error}</FieldError>
      {hint && !error && <p className="hint" style={{ margin: 0 }}>{hint}</p>}
    </div>
  );
}

function Password({ id, value, onChange, error, autoComplete }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`inbox${error ? ' bad' : ''}`}>
      <input id={id} type={shown ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={`${id}-err`} />
      <button type="button" className="eye" aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} onClick={() => setShown(!shown)}>{shown ? EyeShut : EyeOpen}</button>
    </div>
  );
}

// Six boxes: typing moves to the next one, backspace to the previous, paste fills all
function CodeBoxes({ value, onChange, bad }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const put = (i, d) => {
    const next = [...digits];
    next[i] = d;
    onChange(next.join('').slice(0, 6));
  };
  const paste = (e) => {
    const got = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!got) return;
    e.preventDefault();
    onChange(got);
    refs.current[Math.min(got.length, 5)]?.focus();
  };
  return (
    <div className={`code-boxes${bad ? ' bad' : ''}`} onPaste={paste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          maxLength={i === 0 ? 6 : 1}
          value={d}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '');
            if (typed.length > 1) { onChange(typed.slice(0, 6)); refs.current[Math.min(typed.length, 5)]?.focus(); return; }
            put(i, typed);
            if (typed && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) { put(i - 1, ''); refs.current[i - 1]?.focus(); } }}
        />
      ))}
    </div>
  );
}

const Wordmark = () => <Link to="/studio" className="entry-wordmark">{APP_NAME}<i>studio</i></Link>;

export default function Entry({ mode = 'login' }) {
  const { handleLoginActivity, handleSignupActivity } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const resetToken = params.get('token');
  const linkEmail = params.get('email') || '';
  const linkCode = /^\d{6}$/.test(params.get('code') || '') ? params.get('code') : '';
  const fromLink = mode === 'forgot' && (resetToken || (linkEmail && linkCode));

  const [form, setForm] = useState({ fullName: '', storeName: '', phoneNumber: '', email: linkEmail, password: '', termsAccepted: false, otp: '', newPassword: '' });
  const [step, setStep] = useState(fromLink ? 'link' : 'email'); // forgot: email | code | link | done
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({}); // { field: text, '': general }
  const [notice, setNotice] = useState('');
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => {
    if (step !== 'code') return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: '' }));
  };

  const finish = async (response) => {
    const result = response.data || response;
    if (!result.user || !result.token) throw new Error('Please check your email, then sign in.');
    if (mode === 'signup') {
      await handleSignupActivity(result.user, result.token);
      navigate('/studio/start', { replace: true });
    } else {
      await handleLoginActivity(result.user, result.token, safeStudioReturn(location.state?.from));
    }
  };

  // Any failure → a field error, the offline bar, or one general line
  const explain = (e) => {
    if (e?.issues?.length) {
      const next = {};
      e.issues.forEach((issue) => { const { field, text } = fieldIssue(issue, { ...form, mode }); if (!(field in next)) next[field] = text; });
      return setErrors(next);
    }
    if (isOffline(e)) { setOffline(true); return setErrors({}); }
    setOffline(false);
    const status = e?.response?.status;
    const data = e?.response?.data || {};
    const message = String(data.message || '');
    if (mode === 'login' && [400, 401, 404].includes(status)) return setErrors({ password: 'wrong' });
    if (mode === 'signup' && (data.errors?.some?.((x) => x.field === 'email') || /already|exist|in use/i.test(message))) return setErrors({ email: 'used' });
    if (mode === 'forgot' && step === 'email' && status === 404) return setErrors({ email: `We can't find a store with this email. Check it, or create your store.` });
    if (mode === 'forgot' && step === 'code' && [400, 404].includes(status)) return setErrors({ otp: "That code doesn't match or has run out. Check the email, or send a new code." });
    if (mode === 'forgot' && step === 'link' && [400, 404].includes(status)) return setErrors({ '': 'expired' });
    return setErrors({ '': message || e?.message || 'Something went wrong on our side. Try again.' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErrors({});
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        if (step === 'email') {
          const values = forgotPasswordStep1Schema.parse(form);
          await authService.forgotPasswordRequest(values.email);
          setForm((f) => ({ ...f, email: values.email }));
          setStep('code');
          setResendAt(Date.now() + RESEND_SECONDS * 1000);
          setNow(Date.now());
        } else if (step === 'link' && resetToken) {
          const v = forgotPasswordStep2Schema.parse({ otp: '000000', newPassword: form.newPassword, confirmPassword: form.newPassword });
          await axios.post(`${BASE_URL}/seller/reset-password-with-token`, { token: resetToken, newPassword: v.newPassword });
          setStep('done');
        } else {
          const code = step === 'link' ? linkCode : form.otp;
          const v = forgotPasswordStep2Schema.parse({ otp: code, newPassword: form.newPassword, confirmPassword: form.newPassword });
          await authService.resetPasswordWithOtp({ email: form.email.trim().toLowerCase(), code: v.otp, newPassword: v.newPassword });
          setStep('done');
        }
      } else if (mode === 'signup') {
        const phoneNumber=phoneDigits(form.phoneNumber);
        if(phoneProblem(phoneNumber))throw {issues:[{path:['phoneNumber'],message:PHONE_ERROR}]};
        // No "confirm password" on screen: the eye shows what was typed
        // Keep the classic signup schema for classic screens; studio submits the local form.
        const validated=signupSchema.parse({...form,phoneNumber,confirmPassword:form.password});
        await finish(await authService.signUp({...validated,phoneNumber}));
      } else {
        await finish(await authService.login(loginSchema.parse(form)));
      }
    } catch (err) {
      explain(err);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || Date.now() < resendAt) return;
    setBusy(true);
    setErrors({});
    try {
      await authService.forgotPasswordRequest(form.email);
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      setNow(Date.now());
      setNotice('A new code is on its way.');
    } catch (err) {
      if (isOffline(err)) setOffline(true);
      else setErrors({ '': 'Couldn’t send a new code. Try again in a minute.' });
    } finally {
      setBusy(false);
    }
  };

  const google = googleOn && mode !== 'forgot' && (
    <div aria-label="Google sign-in" style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
      <GoogleLogin
        text="continue_with"
        shape="pill"
        width="320"
        logo_alignment="center"
        onSuccess={async (r) => {
          if (!r.credential || busy) return;
          setBusy(true);
          setErrors({});
          try { await finish(await authService.googleAuth({ token: r.credential })); } catch (err) { setErrors({ '': err.response?.data?.message || 'Google sign-in didn’t finish. Try again, or use your email.' }); } finally { setBusy(false); }
        }}
        onError={() => setErrors({ '': 'Google sign-in didn’t finish. Try again, or use your email.' })}
      />
    </div>
  );

  const general = errors[''] === 'expired'
    ? <FieldError>This link has run out. <Link to="/forgot-password">Ask for a new code</Link>.</FieldError>
    : <FieldError>{errors['']}</FieldError>;
  const offlineBar = offline && (
    <div className="offline-bar" role="status">{NoWifi}<p style={{ margin: 0 }}><b>You're offline.</b> Check your data or Wi‑Fi, then try again.</p></div>
  );
  const button = (label, busyLabel) => (
    <button className="btn" disabled={busy}>{busy ? <><span className="spin" aria-hidden="true" />{busyLabel}</> : offline ? 'Try again' : label}</button>
  );
  const keptHint = offline && <p className="hint" style={{ margin: '-6px 0 0', textAlign: 'center' }}>We kept what you typed.</p>;

  // ---- Forgot password ----
  if (mode === 'forgot') {
    if (step === 'done') {
      return (
        <div className="studio-app entry">
          <div className="entry-head"><Wordmark /></div>
          <main className="entry-center">
            <span className="state-ic ok">{Tick}</span>
            <h1 className="hero" style={{ marginTop: 24 }}>Password changed</h1>
            <p className="lede" style={{ marginTop: 8 }}>Sign in with your new password to get back to your studio.</p>
          </main>
          <div className="entry-actions"><Link to="/login" className="btn">Sign in</Link></div>
        </div>
      );
    }
    const backTo = step === 'code' ? () => { setStep('email'); setErrors({}); setForm((f) => ({ ...f, otp: '' })); } : () => navigate('/login');
    const secs = Math.max(0, Math.ceil((resendAt - now) / 1000));
    return (
      <div className="studio-app entry">
        {offlineBar}
        {step === 'link'
          ? <div className="entry-head"><Wordmark /></div>
          : <div className="top" style={{ background: 'none', borderBottom: 0, padding: '6px 8px' }}><button type="button" className="eye" aria-label={step === 'code' ? 'Back' : 'Back to sign in'} onClick={backTo}>{Back}</button></div>}
        <main className={`entry-body${step === 'link' ? '' : ' near'}`}>
          {step === 'email' && <>
            <h1 className="hero">Reset your password</h1>
            <p className="lede" style={{ marginTop: 8 }}>Enter the email you sign in with. We'll send you a 6-digit code.</p>
          </>}
          {step === 'code' && <>
            <h1 className="hero">Check your email</h1>
            <p className="lede" style={{ marginTop: 8 }}>
              We sent a 6-digit code to <b style={{ color: 'var(--text)' }}>{form.email}</b>.{' '}
              <button type="button" className="link" style={{ minHeight: 0, fontSize: 15 }} onClick={backTo}>Wrong email?</button>
            </p>
          </>}
          {step === 'link' && <>
            <h1 className="hero">Choose a new password</h1>
            {form.email && <p className="lede" style={{ marginTop: 8 }}>For <b style={{ color: 'var(--text)' }}>{form.email}</b></p>}
          </>}
          <form className="entry-fields" style={{ gap: step === 'email' ? 20 : 24, marginTop: 28 }} onSubmit={submit} noValidate>
            {step === 'email' && (
              <Field id="en-email" label="Email" error={errors.email}>
                <div className={`inbox${errors.email ? ' bad' : ''}`}><input id="en-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="en-email-err" /></div>
              </Field>
            )}
            {step === 'code' && (
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="lab" style={{ padding: 0, marginBottom: 8 }}>Code</legend>
                <CodeBoxes value={form.otp} onChange={set('otp')} bad={!!errors.otp} />
                <FieldError>{errors.otp}</FieldError>
                {secs > 0
                  ? <p className="hint" style={{ margin: '10px 0 0' }} aria-live="polite">Resend code in 0:{String(secs).padStart(2, '0')}</p>
                  : <button type="button" className="link" disabled={busy} onClick={resend}>Send a new code</button>}
                {notice && <p className="hint" role="status" style={{ margin: '4px 0 0' }}>{notice}</p>}
              </fieldset>
            )}
            {step !== 'email' && (
              <Field id="en-new" label="New password" error={errors.newPassword} hint="At least 8 characters.">
                <Password id="en-new" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} autoComplete="new-password" />
              </Field>
            )}
            {general}
            {button(step === 'email' ? 'Send code' : 'Change password', step === 'email' ? 'Sending…' : 'Saving…')}
          </form>
        </main>
        {step === 'email' && <p className="entry-bottom">Remembered it? <Link className="link" to="/login">Sign in</Link></p>}
      </div>
    );
  }

  // ---- Sign up ----
  if (mode === 'signup') {
    const switchLink = <>Already selling? <Link className="link" to="/login">Sign in</Link></>;
    return (
      <div className="studio-app entry">
        {offlineBar}
        <div className="entry-head"><Wordmark /><p className="entry-switch mut">{switchLink}</p></div>
        <main className="entry-body wide">
          <h1 className="hero">Start selling live</h1>
          <p className="lede">Your store is one step from its first show.</p>
          <form className="entry-fields tight" onSubmit={submit} noValidate>
            {google}
            {google && <p className="or" style={{ margin: '2px 0' }}>or with email</p>}
            <div className="pair">
              <Field id="en-name" label="Full name" error={errors.fullName}>
                <div className={`inbox${errors.fullName ? ' bad' : ''}`}><input id="en-name" autoComplete="name" placeholder="Tolulope Adeyemi" value={form.fullName} onChange={set('fullName')} aria-describedby="en-name-err" /></div>
              </Field>
              <Field id="en-store" label="Store name" note="You can change it later" error={errors.storeName}>
                <div className={`inbox${errors.storeName ? ' bad' : ''}`}><input id="en-store" placeholder="Thrift by Tolu" value={form.storeName} onChange={set('storeName')} aria-describedby="en-store-err" /></div>
              </Field>
            </div>
            <div className="pair">
              <Field id="en-email" label="Email" error={errors.email === 'used' ? <>This email already has a store. <Link to="/login">Sign in instead</Link>, or use another email.</> : errors.email}>
                <div className={`inbox${errors.email ? ' bad' : ''}`}><input id="en-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="en-email-err" /></div>
              </Field>
              <Field id="en-phone" label="Phone" note={PHONE_HINT} error={errors.phoneNumber}>
                <div className={`inbox${errors.phoneNumber ? ' bad' : ''}`}><input id="en-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="0803 123 4567" value={form.phoneNumber} onChange={set('phoneNumber')} aria-describedby="en-phone-err" /></div>
              </Field>
            </div>
            <Field id="en-pw" label="Password" error={errors.password} hint="At least 8 characters.">
              <Password id="en-pw" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
            </Field>
            <label className="check" style={{ marginTop: 2 }}>
              <input type="checkbox" checked={form.termsAccepted} onChange={set('termsAccepted')} aria-describedby="en-terms-err" />
              <span>I agree to the <Link to="/studio/help#terms">Terms</Link> and <Link to="/studio/help#seller-policy">Seller policy</Link>.</span>
            </label>
            <FieldError id="en-terms-err">{errors.termsAccepted}</FieldError>
            {general}
            {button('Create my store', 'Creating your store…')}
            {keptHint}
          </form>
        </main>
        <p className="entry-bottom switch">{switchLink}</p>
      </div>
    );
  }

  // ---- Sign in ----
  const switchLink = <>New to {APP_NAME}? <Link className="link" to="/signup">Create your store</Link></>;
  const wrong = errors.password === 'wrong';
  return (
    <div className="studio-app entry">
      {offlineBar}
      <div className="entry-head"><Wordmark /><p className="entry-switch mut">{switchLink}</p></div>
      <main className="entry-body">
        <h1 className="hero">Welcome back</h1>
        <p className="lede">Sign in to your studio.</p>
        <form className="entry-fields" onSubmit={submit} noValidate>
          <Field id="en-email" label="Email" error={errors.email}>
            <div className={`inbox${errors.email ? ' bad' : ''}`}><input id="en-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="en-email-err" /></div>
          </Field>
          <div className="fl">
            <label className="lab" htmlFor="en-pw">Password</label>
            <Password id="en-pw" value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
            <FieldError id="en-pw-err">{wrong ? "That password doesn't match this email. Check it with the eye, or reset it." : errors.password}</FieldError>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: wrong ? -8 : -4 }}>
              <Link className="link" to="/forgot-password">{wrong ? 'Reset password' : 'Forgot password?'}</Link>
            </div>
          </div>
          {general}
          {button('Sign in', 'Signing in…')}
          {keptHint}
          {google && <p className="or">or</p>}
          {google}
        </form>
      </main>
      <p className="entry-bottom switch">{switchLink}</p>
    </div>
  );
}
