// Help: talk to a person first (WhatsApp, then email), then the common questions.
// Open before sign-in too, so the sign-up page can link to the terms.
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/config/constants';
import { TopBar } from './ui';

const ic = { 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Chat = <svg {...ic} width="20" height="20" viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 10.5c.5 2 2.5 4 4.5 4.5l1.2-1.2 2 1-.6 1.6c-3.6.2-7.9-4.1-7.7-7.7L10 8l1 2z" /></svg>;
const Mail = <svg {...ic} width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>;
const Down = <svg {...ic} strokeWidth="2.2" width="20" height="20" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>;

// Answers only where the product already decides them
const HELP_FAQS = [
  ['How do I get paid?', 'Each order pays out to your bank account 1 day after the buyer receives it. You’ll see every date in Money, and you can withdraw from there.'],
  ['How does delivery work?', 'After your show, book a pickup from Orders. A courier collects from your pickup address and you can follow each parcel in Orders.'],
  ['How do I go live?', 'Tap the red Go Live button, pick the items for your show and start. You can also plan a show ahead and share the link first.'],
  ['What about returns?', 'Message us on WhatsApp or email with the order, and we’ll sort it out with you and the buyer.'],
  ['What are the fees?', 'Money shows each sale with the fees taken off, so you always see what reaches your bank. Ask us if anything looks wrong.'],
];

export default function Help() {
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/studio'));
  return (
    <div className="studio-app">
      <TopBar title="Help" onBack={back} />
      <main className="ed-pad" style={{ width: '100%', maxWidth: 640, margin: '0 auto', paddingTop: 8, paddingBottom: 40 }}>
        <h1 className="disp">How can we help?</h1>
        <p className="mut" style={{ margin: '4px 0 0' }}>Talk to a person on our team.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {SUPPORT_WHATSAPP && <a className="btn" href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer">{Chat}WhatsApp us</a>}
          <a className="btn2" href={`mailto:${SUPPORT_EMAIL}`}>{Mail}Email us</a>
        </div>
        <p className="hint" style={{ margin: '10px 0 0' }}>Include your order or show. Never send your password or a payment code.</p>

        <p className="sec" style={{ marginTop: 32 }}>Common questions</p>
        <div style={{ marginTop: 4 }}>
          {HELP_FAQS.map(([q, a], i) => (
            <details key={q} className="faq" open={i === 0}>
              <summary>{q}{Down}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        <section id="terms" style={{ marginTop: 32 }}>
          <p className="sec">Terms and privacy</p>
          <p className="mut" style={{ margin: '8px 0 0' }}>Email us for the current {APP_NAME} terms, privacy policy, or a question about your data.</p>
        </section>
        <section id="seller-policy" style={{ marginTop: 24 }}>
          <p className="sec">Seller policy</p>
          <p className="mut" style={{ margin: '8px 0 0' }}>Email us for the current seller policy: what you can sell and how orders, delivery and payouts work.</p>
        </section>
        <Link className="link" to="/studio" style={{ marginTop: 16 }}>Go to studio</Link>
      </main>
    </div>
  );
}
