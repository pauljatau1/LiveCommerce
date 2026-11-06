import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, naira } from '../api';
import { useAuth } from '../auth';
import { Header } from '../components/ui';

const STATUS = { processing: 'Paid · preparing', shipped: 'On the way', 'in_transit': 'On the way', 'in-transit': 'On the way', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function Orders() {
  const { signedIn, loading } = useAuth();
  const [orders, setOrders] = useState(null);
  useEffect(() => { if (signedIn) api.orders().then((o) => setOrders(Array.isArray(o) ? o : o?.orders || [])).catch(() => setOrders([])); }, [signedIn]);
  if (!loading && !signedIn) return <Navigate to="/signin?next=/orders" replace />;
  return (
    <div className="app">
      <Header back="/" title="Your orders" />
      <main className="wrap" style={{ padding: '20px 16px 40px' }}>
        {orders === null ? <span className="mut">Loading…</span> : orders.length === 0 ? (
          <div className="card empty"><span className="f" style={{ fontSize: 18 }}>No orders yet</span><span className="mut" style={{ fontSize: 14 }}>Things you win or buy in a show appear here.</span><Link to="/" className="btn2">Find a show</Link></div>
        ) : (
          <div className="list">
            {orders.map((o) => {
              const item = o.items?.[0] || {};
              return (
                <div key={o._id} className="li">
                  {item.productImages?.[0]?.url ? <img src={item.productImages[0].url} alt="" /> : <span className="sk" style={{ width: 56, height: 56 }} />}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{item.productName || 'Order'}{o.items?.length > 1 ? ` + ${o.items.length - 1} more` : ''}</span>
                    <span className="mut" style={{ fontSize: 13 }}>#{o.order_id} · {new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="f" style={{ fontSize: 16 }}>{naira((o.totalAmount || 0) + (o.shipping?.fee?.amount || 0))}</span>
                    <span className={`pill ${o.status === 'delivered' ? 'p-active' : 'p-show'}`}>{STATUS[o.status] || o.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
