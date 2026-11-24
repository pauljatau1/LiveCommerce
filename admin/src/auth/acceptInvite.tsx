import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { APP_NAME } from '@/config/withdrawals';

interface Preview { email: string; invitedBy?: string; expiresAt: string; access: string }
const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

// Opened from the invite email: choose a username and password, then sign in.
export default function AcceptInvite() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [problem, setProblem] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    api.get(`/api/admin/invites/${encodeURIComponent(token)}`, { quiet: true } as object)
      .then((r) => setPreview(r.data))
      .catch((e) => setProblem(message(e, "We couldn't open this invite. Check the link, or ask for a new one.")));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setBusy(true);
    try { const r = await api.post('/api/admin/invites/accept', { token, username, password }); setDone(r.data.message); }
    catch (err) { setError(message(err, "Couldn't finish setting up your account. Try again.")); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800">
        <h1 className="text-xl font-bold text-white">Join the {APP_NAME} admin</h1>
        {problem ? (
          <><p role="alert" className="mt-3 text-sm text-red-400">{problem}</p><Link to="/login" className="mt-4 inline-block text-sm underline text-zinc-300">Go to sign in</Link></>
        ) : done ? (
          <><p className="mt-3 text-sm text-emerald-300">{done}</p><Button className="mt-4 w-full" onClick={() => navigate('/login')}>Sign in</Button></>
        ) : !preview ? (
          <p className="mt-3 text-sm text-zinc-400">Opening your invite…</p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-4">
            <div className="rounded-lg bg-zinc-800/60 p-3 text-sm">
              <p className="text-zinc-200">For <strong>{preview.email}</strong>{preview.invitedBy ? `, invited by ${preview.invitedBy}` : ''}.</p>
              <p className="mt-1 text-zinc-400">Your access: {preview.access}</p>
            </div>
            <div>
              <label htmlFor="inv-user" className="text-sm font-medium text-zinc-200">Username</label>
              <Input id="inv-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="mt-1" />
              <p className="mt-1 text-xs text-zinc-500">3 to 30 letters, numbers, dots, dashes or underscores. You can also sign in with your email.</p>
            </div>
            <div>
              <label htmlFor="inv-pass" className="text-sm font-medium text-zinc-200">Password</label>
              <div className="mt-1 flex gap-2">
                <Input id="inv-pass" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                <Button type="button" variant="outline" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</Button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">At least 10 characters.</p>
            </div>
            <div>
              <label htmlFor="inv-confirm" className="text-sm font-medium text-zinc-200">Password again</label>
              <Input id="inv-confirm" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="mt-1" />
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !username || !password}>{busy ? 'Setting up…' : 'Create my account'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
