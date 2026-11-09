// Recap: "Same time next week?" One tap books the next weekly slot with the
// assistant's plan (unsold items plus new listings), using the same create-show
// call as the planner. Also: money on the way.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';

export default function NextWeek({ showId, slot, payout }) {
  const [state, setState] = useState({ busy: false, booked: null, error: '', note: '' });

  const book = async () => {
    setState({ busy: true, booked: null, error: '', note: '' });
    try {
      const r = await studio.nextPlan(showId);
      if (!r.plan) { setState({ busy: false, booked: null, error: '', note: r.message || 'Nothing to sell yet: list a few items first.' }); return; }
      if (!r.slot.saved) await studio.saveSlot(r.slot.day, r.slot.time);
      const { plan } = r;
      const body = { title: plan.title, description: plan.description || plan.title, category: plan.category, scheduledStartTime: plan.scheduledStartTime, products: plan.products };
      const res = plan.type === 'auction' ? await studio.createAuction(body) : await studio.createDrop(body);
      const show = res.stream || res.data?.stream || res;
      // Reuse the seller's saved show notes, if any; never blocks the booking
      try { const d = await studio.notesDefault(); if (d?.notes && show?._id) await studio.saveNotes(show._id, d.notes); } catch { /* notes can be pinned later */ }
      setState({ busy: false, booked: { id: show?._id, at: plan.scheduledStartTime, count: plan.products.length, unsold: r.counts.unsold, fresh: r.counts.new }, error: '', note: '' });
    } catch (e) {
      setState({ busy: false, booked: null, error: errorText(e, "Couldn't book it. Nothing was created. Try again."), note: '' });
    }
  };

  return (
    <>
      {payout?.onTheWay > 0 && (
        <Link to="/studio/money" className="st-row" style={{ minHeight: 56 }}>
          <span style={{ flex: 1 }}><strong>{naira(payout.onTheWay)}</strong> on the way · {payout.rule.replace(/\.$/, '').toLowerCase()}</span>
          <span aria-hidden="true">›</span>
        </Link>
      )}
      {slot && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Next week">
          {state.booked ? (
            <>
              <h2 className="h2">Booked: {when(state.booked.at)}</h2>
              <span>{state.booked.count} item{state.booked.count === 1 ? '' : 's'}{state.booked.unsold ? ` · ${state.booked.unsold} from tonight` : ''}{state.booked.fresh ? ` · ${state.booked.fresh} new` : ''}. Buyers who follow you see it.</span>
              <Link to="/studio/shows" className="btn2">Edit the plan</Link>
            </>
          ) : (
            <>
              <h2 className="h2">Same time next week?</h2>
              <span className="mut">{slot.label}. I'll plan it from what didn't sell and anything new you list.</span>
              {state.note && <span>{state.note}</span>}
              {state.error && <span className="err-text" role="alert">{state.error}</span>}
              <button type="button" className="btn" disabled={state.busy} onClick={book}>{state.busy ? 'Booking…' : `Book ${when(slot.next)}`}</button>
            </>
          )}
        </section>
      )}
    </>
  );
}
