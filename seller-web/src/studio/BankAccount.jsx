import reloadSeller from './reloadSeller';
import useStudioBack from './useStudioBack';
// Where payouts go: pick a bank (searchable), type the 10-digit number, and the
// name check runs by itself. Then "Is this you?" with the name the bank has.
// Opened from Money and from Me; goes back to wherever it came from.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { sellerService } from '@/services/sellerService';
import { sellerUtils, tokenUtils } from '@/util/auth';
import { account, errorText } from './api';
import { Icon, Sheet, TopBar } from './ui';

// Shown first in the picker, matched loosely against the bank list
const POPULAR = [/^access bank$/i, /guaranty|gtbank/i, /^kuda/i, /moniepoint/i, /^opay|paycom/i, /united bank for africa|^uba$/i, /^zenith/i];

const shortName = (name = '') => (name.match(/\(([^)]+)\)/)?.[1] || name.replace(/ (Bank|Plc|PLC|Limited|Ltd)\b.*$/, '') || name);

function BankPicker({ banks, onPick, onClose, onReload }) {
  const [q, setQ] = useState('');
  const popular = useMemo(() => POPULAR.map((re) => banks.find((b) => re.test(b.name))).filter(Boolean), [banks]);
  const found = q.trim() ? banks.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase())) : null;
  const row = (b) => <button key={b.code} type="button" className="list-row" onClick={() => onPick(b)}>{b.name}</button>;
  return (
    <Sheet label="Choose your bank" onClose={onClose} maxHeight="88dvh" className="bank-sheet">
      <p className="h1" style={{ margin: '4px 4px 0' }}>Choose your bank</p>
      <div className="inbox" style={{ marginTop: 2 }}>
        {Icon.search}
        <input aria-label="Search banks" placeholder="Search banks" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>
      {!banks.length && (
        <p className="hint" style={{ margin: 0 }}>Banks didn’t load. <button type="button" className="link" onClick={onReload}>Try again</button></p>
      )}
      {found ? (
        <div>{found.length ? found.map(row) : <p className="hint" style={{ margin: '8px 0' }}>No bank called “{q}”. Check the spelling.</p>}</div>
      ) : (
        <div>
          {popular.length > 0 && <><p className="sec" style={{ margin: '6px 0 0' }}>Popular</p>{popular.map(row)}</>}
          {banks.length > 0 && <p className="sec" style={{ margin: '20px 0 0' }}>All banks</p>}
          {banks.map(row)}
        </div>
      )}
    </Sheet>
  );
}

export function BankFlow({ onDone, onBack }) {
  const { seller, dispatch } = useAuthContext();
  const saved = seller?.bankDetails || {};
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState(saved.bankIdentifierCode ? { code: saved.bankIdentifierCode, name: saved.bankName || '' } : null);
  const [number, setNumber] = useState(saved.accountNumber || '');
  const [picking, setPicking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(null); // { code, number, name }
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);
  const touched = useRef(false); // the saved account isn't re-checked until something changes

  const load = () => {
    setError('');
    account.banks()
      .then((r) => {
        const list = r.data || r.banks || [];
        setBanks(list);
        setBank((b) => (b && !b.name ? list.find((x) => x.code === b.code) || b : b));
      })
      .catch((e) => setError(errorText(e, 'Couldn’t load the list of banks. Check your connection and try again.')));
  };
  useEffect(() => { load(); return () => { revision.current += 1; }; }, []);

  // The name check runs as soon as the 10th digit is in
  useEffect(() => {
    revision.current += 1;
    setVerified(null);
    if (!touched.current) return;
    if (!bank?.code || number.length !== 10) { setChecking(false); return; }
    const current = revision.current;
    setChecking(true);
    setError('');
    account.checkBank({ accountNumber: number, bankCode: bank.code })
      .then((r) => {
        if (current !== revision.current) return;
        const name = r.data?.accountName;
        if (!name) throw new Error('no name');
        setVerified({ code: bank.code, number, name });
        setConfirm(true);
      })
      .catch((e) => { if (current === revision.current) setError(errorText(e, 'We couldn’t find this account. Check the number and the bank, then try again.')); })
      .finally(() => { if (current === revision.current) setChecking(false); });
  }, [bank?.code, number]);

  const save = async () => {
    if (!verified || saving) return;
    setSaving(true);
    setError('');
    try {
      await account.saveBank({
        bankDetails: {
          ...saved,
          bankCountry: 'Nigeria',
          bankName: bank.name,
          bankAccountType: saved.bankAccountType || 'Savings',
          accountCurrency: 'NGN',
          accountNumber: verified.number,
          accountName: verified.name,
          bankIdentifierCode: verified.code,
        },
        isVerified: true,
      });
      await reloadSeller(dispatch);
      onDone();
    } catch (e) {
      setError(errorText(e, 'Couldn’t save your account. Check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (confirm && verified) {
    return (
      <div className="ed-page" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Bank account" onBack={() => setConfirm(false)} />
        <main className="ed-pad" style={{ paddingTop: 8, maxWidth: 560, width: '100%', margin: '0 auto' }}>
          <h1 className="disp">Is this you?</h1>
          <div style={{ marginTop: 28, padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <p className="hero" style={{ fontSize: 28, overflowWrap: 'anywhere' }}>{verified.name}</p>
            <p className="mut" style={{ margin: '6px 0 0' }}>{shortName(bank.name)} · {verified.number}</p>
          </div>
          <p className="mut" style={{ margin: '16px 0 0' }}>This is the name your bank has for this account. Each order pays out here 1 day after delivery.</p>
          {error && <p className="field-err" role="alert" style={{ marginTop: 16 }}>{error}</p>}
        </main>
        <div className="entry-actions" style={{ marginTop: 'auto', paddingTop: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <button type="button" className="btn" disabled={saving} onClick={save}>{saving ? <><span className="spin" aria-hidden="true" />Saving…</> : "Yes, that's me"}</button>
          <button type="button" className="link" style={{ justifyContent: 'center' }} onClick={() => { setConfirm(false); setNumber(''); }}>Change</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Bank account" onBack={onBack} />
      <main className="ed-pad" style={{ paddingTop: 8, maxWidth: 560, width: '100%', margin: '0 auto' }}>
        <h1 className="disp">Where should we send your money?</h1>
        <div className="ed-fields" style={{ marginTop: 24 }}>
          <div className="fl">
            <span className="lab" id="bk-bank-l">Bank</span>
            <button type="button" className="inbox" aria-labelledby="bk-bank-l bk-bank-v" style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'var(--text)' }} onClick={() => setPicking(true)}>
              <span id="bk-bank-v" style={{ flex: 1, minWidth: 0, color: bank ? 'var(--text)' : 'var(--text-muted)' }}>{bank?.name || 'Choose your bank'}</span>
              {Icon.chevron('var(--text-muted)')}
            </button>
          </div>
          <div className="fl">
            <label className="lab" htmlFor="bk-number">Account number <span className="opt">10 digits</span></label>
            <div className={`inbox${error && number.length === 10 ? ' bad' : ''}`}>
              <input id="bk-number" inputMode="numeric" autoComplete="off" maxLength={10} value={number} onChange={(e) => { touched.current = true; setNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); }} aria-describedby="bk-status" />
            </div>
            <div id="bk-status" role="status">
              {checking && <p className="hint" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 0' }}><span className="spin dark" aria-hidden="true" />Checking the name with your bank…</p>}
              {!checking && verified && <button type="button" className="link" onClick={() => setConfirm(true)}>{verified.name} · Continue</button>}
              {!checking && !touched.current && saved.accountName && <p className="hint" style={{ margin: '4px 0 0' }}>Payouts go to {saved.accountName} now.</p>}
              {!checking && !bank && number.length === 10 && <p className="hint" style={{ margin: '4px 0 0' }}>Choose your bank to check the name.</p>}
            </div>
          </div>
          {error && <p className="field-err" role="alert">{error}</p>}
        </div>
      </main>
      {picking && <BankPicker banks={banks} onReload={load} onClose={() => setPicking(false)} onPick={(b) => { touched.current = true; setBank(b); setPicking(false); setError(''); }} />}
    </div>
  );
}

// Kept for anything that still opens bank details as a sheet
export function BankAccountSheet({ onClose, onSaved }) {
  return (
    <Sheet label="Bank account" onClose={onClose} closeX maxHeight="92dvh">
      <BankFlow onBack={onClose} onDone={() => { onSaved?.(); onClose(); }} />
    </Sheet>
  );
}

export default function BankAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const back = location.state?.back === '/studio/money' ? '/studio/money' : '/studio/me';
  const returnBack=useStudioBack(back);
  return (
    <div className="studio-app">
      <BankFlow onBack={returnBack} onDone={returnBack} />
    </div>
  );
}
