import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/axios';

export interface WalletAdjustment {
  _id: string;
  direction: 'add' | 'deduct';
  amount: number;
  reason: string;
  adminEmail?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;

// What's wrong with a manual wallet change before it's sent (null when it's fine).
export function walletProblem(amount: string, reason: string): string | null {
  const value = Number(String(amount).replace(/[,\s₦]/g, ''));
  if (!Number.isInteger(value) || value <= 0) return 'Enter a whole naira amount above 0.';
  if (reason.trim().length < 5) return 'Write a reason (at least 5 characters). It goes in the audit log.';
  return null;
}

export function confirmWalletChange(direction: 'add' | 'deduct', amount: string, who: string): boolean {
  const value = Number(String(amount).replace(/[,\s₦]/g, ''));
  return window.confirm(`${direction === 'add' ? 'Add' : 'Deduct'} ${naira(value)} ${direction === 'add' ? 'to' : 'from'} ${who}'s wallet?\n\nThis is recorded with your name and reason.`);
}

// The audit log of manual wallet changes, newest first.
export default function WalletAdjustments({ party, id, refreshKey = 0 }: { party: 'seller' | 'buyer'; id?: string; refreshKey?: number }) {
  const [rows, setRows] = useState<WalletAdjustment[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const res = await api.get(`/api/admin/${party}s/${id}/wallet/adjustments`);
      setRows(res.data.adjustments || []);
    } catch {
      setError("Couldn't load the wallet history.");
    }
  }, [party, id]);
  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-white mb-3">Manual wallet changes</h4>
      {error ? (
        <p className="text-sm text-red-400">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>
      ) : rows === null ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No manual changes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase">
              <tr><th className="py-2 pr-4">When</th><th className="py-2 pr-4">Change</th><th className="py-2 pr-4">Balance</th><th className="py-2 pr-4">Reason</th><th className="py-2">By</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className={`py-2 pr-4 whitespace-nowrap ${r.direction === 'add' ? 'text-green-400' : 'text-red-400'}`}>{r.direction === 'add' ? '+' : '−'}{naira(r.amount)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{naira(r.balanceBefore)} → {naira(r.balanceAfter)}</td>
                  <td className="py-2 pr-4">{r.reason}</td>
                  <td className="py-2 whitespace-nowrap">{r.adminEmail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
