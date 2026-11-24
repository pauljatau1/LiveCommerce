import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Mail, RefreshCw, Trash2, UserPlus, Pencil } from 'lucide-react';

type Level = 'none' | 'view' | 'manage';
interface Area { key: string; label: string; hint: string }
interface Role { key: string; label: string; hint: string; permissions: Record<string, Level> }
interface Member { _id: string; username: string; email: string; lastLogin?: string; owner: boolean; active: boolean; super: boolean; roleTemplate: string | null; permissions: Record<string, Level> }
interface Invite { _id: string; email: string; role: string; roleTemplate?: string; permissions: Record<string, Level>; invitedByEmail?: string; createdAt: string; expiresAt: string; expired: boolean }
interface TeamData { me: string; areas: Area[]; roles: Role[]; members: Member[]; invites: Invite[] }

const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const LEVELS: [Level, string][] = [['none', 'No access'], ['view', 'View'], ['manage', 'Manage']];

// The access picker: a ready-made role, then area by area, or super admin
function AccessPicker({ areas, roles, value, onChange }: { areas: Area[]; roles: Role[]; value: Grant; onChange: (g: Grant) => void }) {
  const pickRole = (key: string) => {
    const role = roles.find((r) => r.key === key);
    if (role) onChange({ super: false, roleTemplate: key, permissions: { ...role.permissions } });
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Start from a role</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {roles.map((r) => (
            <button key={r.key} type="button" onClick={() => pickRole(r.key)} aria-pressed={!value.super && value.roleTemplate === r.key}
              className={`rounded-lg border p-3 text-left ${!value.super && value.roleTemplate === r.key ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-foreground/40'}`}>
              <span className="block text-sm font-semibold text-foreground">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.hint}</span>
            </button>
          ))}
          <button type="button" onClick={() => onChange({ super: true, roleTemplate: 'super', permissions: value.permissions })} aria-pressed={value.super}
            className={`rounded-lg border p-3 text-left ${value.super ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-foreground/40'}`}>
            <span className="block text-sm font-semibold text-foreground">Super admin</span>
            <span className="block text-xs text-muted-foreground">Everything, including inviting and removing people</span>
          </button>
        </div>
      </div>
      {!value.super && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Adjust what they can see and change</p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {areas.map((a) => (
              <div key={a.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <span className="block text-sm text-foreground">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.hint}</span>
                </div>
                <div role="group" aria-label={`${a.label} access`} className="flex rounded-full bg-muted p-0.5">
                  {LEVELS.filter(([l]) => a.key !== 'wallets' || l !== 'view').map(([l, label]) => (
                    <button key={l} type="button" aria-pressed={(value.permissions[a.key] || 'none') === l}
                      onClick={() => onChange({ ...value, roleTemplate: 'custom', permissions: { ...value.permissions, [a.key]: l } })}
                      className={`rounded-full px-2.5 py-1 text-xs ${(value.permissions[a.key] || 'none') === l ? (l === 'manage' ? 'bg-emerald-600 text-foreground' : l === 'view' ? 'bg-sky-600 text-foreground' : 'bg-zinc-600 text-foreground') : 'text-muted-foreground'}`}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Grant { super: boolean; roleTemplate: string; permissions: Record<string, Level> }

const accessText = (areas: Area[], g: { super: boolean; permissions: Record<string, Level> }) => {
  if (g.super) return 'Super admin';
  const parts = areas.filter((a) => (g.permissions[a.key] || 'none') !== 'none').map((a) => `${a.label}${g.permissions[a.key] === 'manage' ? ' (manage)' : ''}`);
  return parts.length ? parts.join(', ') : 'No access';
};

export default function Team() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [email, setEmail] = useState('');
  const [grant, setGrant] = useState<Grant>({ super: false, roleTemplate: '', permissions: {} });
  const [busy, setBusy] = useState(false);
  const [lastLink, setLastLink] = useState<{ email: string; link: string; emailed: boolean } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try { const res = await api.get('/api/admin/team'); setData(res.data); }
    catch (e) { setError(message(e, "Couldn't load the team.")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const roleLabel = useMemo(() => Object.fromEntries((data?.roles || []).map((r) => [r.key, r.label])), [data]);
  const startInvite = () => {
    const first = data?.roles[0];
    setEmail(''); setGrant({ super: false, roleTemplate: first?.key || '', permissions: { ...(first?.permissions || {}) } }); setInviting(true);
  };
  const startEdit = (m: Member) => { setGrant({ super: m.super, roleTemplate: m.roleTemplate || 'custom', permissions: { ...m.permissions } }); setEditing(m); };
  const body = (g: Grant) => g.super ? { super: true } : { roleTemplate: g.roleTemplate === 'custom' ? undefined : g.roleTemplate, permissions: g.permissions };

  const sendInvite = async () => {
    setBusy(true);
    try {
      const res = await api.post('/api/admin/team/invites', { email, ...body(grant) });
      setLastLink({ email: email.trim().toLowerCase(), link: res.data.link, emailed: res.data.emailed });
      toast.success(res.data.message); setInviting(false); load();
    } catch (e) { toast.error(message(e, "Couldn't send the invite.")); }
    finally { setBusy(false); }
  };
  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try { const res = await api.patch(`/api/admin/team/members/${editing._id}`, body(grant)); toast.success(res.data.message); setEditing(null); load(); }
    catch (e) { toast.error(message(e, "Couldn't update access.")); }
    finally { setBusy(false); }
  };
  const remove = async (m: Member) => {
    if (!window.confirm(`Remove ${m.email}'s admin access? They'll be signed out straight away.`)) return;
    try { const res = await api.delete(`/api/admin/team/members/${m._id}`); toast.success(res.data.message); load(); }
    catch (e) { toast.error(message(e, "Couldn't remove access.")); }
  };
  const resend = async (i: Invite) => {
    try { const res = await api.post(`/api/admin/team/invites/${i._id}/resend`); setLastLink({ email: i.email, link: res.data.link, emailed: res.data.emailed }); toast.success(res.data.message); load(); }
    catch (e) { toast.error(message(e, "Couldn't resend the invite.")); }
  };
  const cancel = async (i: Invite) => {
    if (!window.confirm(`Cancel the invite to ${i.email}? The link will stop working.`)) return;
    try { const res = await api.delete(`/api/admin/team/invites/${i._id}`); toast.success(res.data.message); load(); }
    catch (e) { toast.error(message(e, "Couldn't cancel the invite.")); }
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success('Link copied.'); } catch { toast.error('Copy failed. Select the link and copy it.'); } };

  if (error) return <div role="alert" className="text-sm text-red-400">{error} <button type="button" className="underline" onClick={load}>Retry</button></div>;
  if (!data) return <p className="text-sm text-zinc-400">Loading the team…</p>;

  const active = data.members.filter((m) => m.active);
  const removed = data.members.filter((m) => !m.active);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Team and access</h1>
          <p className="text-sm text-zinc-400">Invite people and choose what each person can see and change. Changes apply straight away.</p>
        </div>
        <Button onClick={startInvite}><UserPlus className="h-4 w-4 mr-2" />Invite someone</Button>
      </div>

      {lastLink && (
        <Card className="p-4 bg-zinc-900 border-emerald-700/40">
          <p className="text-sm text-zinc-200">{lastLink.emailed ? `Invite emailed to ${lastLink.email}.` : `The email to ${lastLink.email} didn't send.`} You can also send this link yourself (it works for 7 days, once):</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200">{lastLink.link}</code>
            <Button size="sm" variant="outline" onClick={() => copy(lastLink.link)}><Copy className="h-4 w-4 mr-1" />Copy</Button>
          </div>
        </Card>
      )}

      <Card className="p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
        <h2 className="px-4 pt-4 text-base font-semibold text-white">People with access ({active.length})</h2>
        <div className="mt-2 divide-y divide-zinc-800">
          {active.map((m) => (
            <div key={m._id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{m.username} <span className="text-zinc-400 font-normal">· {m.email}</span>
                  {m._id === data.me && <Badge variant="outline" className="ml-2">You</Badge>}
                  {m.owner && <Badge variant="outline" className="ml-2">Owner</Badge>}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">{m.super ? 'Super admin' : `${roleLabel[m.roleTemplate || ''] || 'Custom'}: ${accessText(data.areas, m)}`}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{m.lastLogin ? `Last signed in ${new Date(m.lastLogin).toLocaleString()}` : 'Not signed in yet'}</p>
              </div>
              {!m.owner && m._id !== data.me && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(m)}><Pencil className="h-4 w-4 mr-1" />Change access</Button>
                  <Button size="sm" variant="outline" className="text-red-400" onClick={() => remove(m)}><Trash2 className="h-4 w-4 mr-1" />Remove</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
        <h2 className="px-4 pt-4 text-base font-semibold text-white">Invites waiting ({data.invites.length})</h2>
        {data.invites.length === 0 ? <p className="px-4 py-3 text-sm text-zinc-400">No invites waiting.</p> : (
          <div className="mt-2 divide-y divide-zinc-800">
            {data.invites.map((i) => (
              <div key={i._id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{i.email} {i.expired && <Badge variant="outline" className="ml-2 text-amber-300">Expired</Badge>}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{i.role === 'super' ? 'Super admin' : `${roleLabel[i.roleTemplate || ''] || 'Custom'}: ${accessText(data.areas, { super: false, permissions: i.permissions })}`}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Sent {new Date(i.createdAt).toLocaleDateString()}{i.invitedByEmail ? ` by ${i.invitedByEmail}` : ''} · {i.expired ? 'expired' : `expires ${new Date(i.expiresAt).toLocaleDateString()}`}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resend(i)}>{i.expired ? <RefreshCw className="h-4 w-4 mr-1" /> : <Mail className="h-4 w-4 mr-1" />}{i.expired ? 'Send a new link' : 'Resend'}</Button>
                  <Button size="sm" variant="outline" className="text-red-400" onClick={() => cancel(i)}>Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {removed.length > 0 && (
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <h2 className="text-base font-semibold text-white">Removed ({removed.length})</h2>
          <p className="mt-1 text-xs text-zinc-400">To give someone access again, invite them again.</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">{removed.map((m) => <li key={m._id}>{m.username} · {m.email}</li>)}</ul>
        </Card>
      )}

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite someone</DialogTitle>
            <DialogDescription>They get an email with a link to set their username and password. The link works once, for 7 days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="text-sm font-medium text-foreground">Email</label>
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="mt-1" />
            </div>
            <AccessPicker areas={data.areas} roles={data.roles} value={grant} onChange={setGrant} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviting(false)}>Cancel</Button>
            <Button onClick={sendInvite} disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send invite'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change access for {editing?.username}</DialogTitle>
            <DialogDescription>{editing?.email}. The change applies on their next click.</DialogDescription>
          </DialogHeader>
          <AccessPicker areas={data.areas} roles={data.roles} value={grant} onChange={setGrant} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? 'Saving…' : 'Save access'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
