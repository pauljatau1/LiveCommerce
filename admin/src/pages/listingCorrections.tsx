import { useEffect, useState } from 'react';
import { api } from '@/api/axios';

type Correction = {
  _id: string; createdAt: string; seller: string; product: string;
  changes: { field: string; draftValue: string; finalValue: string }[];
};

export default function ListingCorrections() {
  const [rows, setRows] = useState<Correction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/api/v2/ai/listing-corrections', { params: { page } }).then(({ data }) => {
      if (active) { setRows(data.corrections); setHasMore(data.hasMore); }
    }).catch(() => { if (active) setError('Could not load corrections. Try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);
  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">Listing AI corrections</h1>
    <p>Seller changes before publishing, newest first. Use these to improve the Nigerian fashion guide.</p>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading…</p> : !error && <>
      {!rows.length && <p>No corrections yet.</p>}
      {rows.map((row) => <article key={row._id} className="border rounded p-4 space-y-2">
        <p>{new Date(row.createdAt).toLocaleString()} · Product {row.product} · Seller {row.seller}</p>
        <table className="w-full text-left"><thead><tr><th>Field</th><th>AI draft</th><th>Published</th></tr></thead>
          <tbody>{row.changes.map((change) => <tr key={change.field}><td>{change.field}</td><td>{change.draftValue || '—'}</td><td>{change.finalValue || '—'}</td></tr>)}</tbody>
        </table>
      </article>)}
    </>}
    <div className="flex gap-4">
      <button disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
      <span>Page {page}</span>
      <button disabled={!hasMore || loading || !!error} onClick={() => setPage((p) => p + 1)}>Next</button>
    </div>
  </section>;
}
