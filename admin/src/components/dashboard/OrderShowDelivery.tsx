import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/axios';

interface Info {
  show: { _id: string; title: string; status: string; type?: string; startedAt?: string } | null;
  delivery: {
    status: string; fee: number; courier: string | null; deliveryEta: string | null; trackingUrl: string | null;
    trackingCode: string | null; shipbubbleStatus: string | null; items: number;
    fix: { party: string; message: string } | null; lastError: string | null;
  } | null;
}
const LABEL: Record<string, string> = {
  collecting: 'Collecting items', quote_failed: 'Price check failed', needs_fix: 'Needs a fix', awaiting_payment: 'Waiting for payment',
  paid: 'Paid, ready to book', booked: 'Pickup booked', in_transit: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
};

// Which live show the order came from, and its Shipbubble delivery
export default function OrderShowDelivery({ orderId }: { orderId?: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!orderId) return;
    setError('');
    try { const res = await api.get(`/api/admin/orders/${orderId}/show-delivery`); setInfo(res.data); }
    catch { setError("Couldn't load the show and delivery."); }
  }, [orderId]);
  useEffect(() => { load(); }, [load]);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-zinc-400">{label}</span><span className="text-zinc-100 text-right min-w-0 break-words">{value}</span></div>
  );
  return (
    <section aria-label="Live show and delivery" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-base font-semibold text-white mb-3">Live show and delivery</h3>
      {error ? <p className="text-sm text-red-400">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>
        : !info ? <p className="text-sm text-zinc-400">Loading…</p>
        : <>
          {info.show ? <>
            {row('Show', <a className="underline" href={`/dashboard/streams?show=${info.show._id}`}>{info.show.title}</a>)}
            {row('Show status', info.show.status)}
            {info.show.startedAt && row('Started', new Date(info.show.startedAt).toLocaleString())}
          </> : <p className="text-sm text-zinc-400 mb-2">Not from a live show.</p>}
          <div className="my-3 border-t border-zinc-800" />
          {info.delivery ? <>
            {row('Delivery', LABEL[info.delivery.status] || info.delivery.status)}
            {info.delivery.fix && row('Needs fixing', `${info.delivery.fix.party === 'seller' ? 'Seller' : 'Buyer'}: ${info.delivery.fix.message}`)}
            {!info.delivery.fix && info.delivery.lastError && row('Last problem', info.delivery.lastError)}
            {row('Delivery fee', `₦${Math.round(info.delivery.fee || 0).toLocaleString()}`)}
            {row('Courier', info.delivery.courier || '—')}
            {info.delivery.deliveryEta && row('Estimate', info.delivery.deliveryEta)}
            {row('Shipbubble status', info.delivery.shipbubbleStatus || '—')}
            {row('Tracking', info.delivery.trackingUrl ? <a className="underline" href={info.delivery.trackingUrl} target="_blank" rel="noreferrer">{info.delivery.trackingCode || 'Open tracking'}</a> : '—')}
            {row('Items in this parcel', info.delivery.items)}
          </> : <p className="text-sm text-zinc-400">No show delivery for this order yet.</p>}
        </>}
    </section>
  );
}
