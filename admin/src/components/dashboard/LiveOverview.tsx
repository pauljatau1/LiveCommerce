import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/axios';

type Range = 'today' | '7d' | '30d';
interface Overview {
  sales: number; orders: number; liveNow: number; shows: number; newSellers: number; newBuyers: number;
  topUps: number; topUpCount: number; withdrawalsPending: number; withdrawalsPendingAmount: number;
}
const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const RANGES: [Range, string][] = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days']];

// The numbers that matter for live selling, above the classic dashboard.
export default function LiveOverview() {
  const [range, setRange] = useState<Range>('7d');
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError(''); setData(null);
    try { const res = await api.get(`/api/admin/overview?range=${range}`); setData(res.data); }
    catch { setError("Couldn't load the numbers."); }
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const tiles: [string, string, string?][] = data ? [
    ['Sales', naira(data.sales), `${data.orders} paid order${data.orders === 1 ? '' : 's'}`],
    ['Live now', String(data.liveNow), `${data.shows} show${data.shows === 1 ? '' : 's'} in this period`],
    ['Wallet top-ups', naira(data.topUps), `${data.topUpCount} top-up${data.topUpCount === 1 ? '' : 's'}`],
    ['New sellers', String(data.newSellers)],
    ['New buyers', String(data.newBuyers)],
    ['Withdrawals waiting', String(data.withdrawalsPending), naira(data.withdrawalsPendingAmount)],
  ] : [];

  return (
    <section aria-label="Live selling overview" className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white">Live selling</h2>
        <div role="group" aria-label="Period" className="flex gap-1 rounded-full bg-zinc-800 p-1">
          {RANGES.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={range === key} onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${range === key ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-400">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>
      ) : !data ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {tiles.map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 truncate">{label}</div>
              <div className="mt-1 text-2xl font-bold text-white truncate">{value}</div>
              {sub && <div className="mt-1 text-xs text-zinc-400 truncate">{sub}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
