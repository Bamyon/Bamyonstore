'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive, useDocLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { call } from '@/lib/api';
import { Pill, Empty, Loading } from '@/components/ui';
import { naira, when } from '@/lib/util';

export function Cashier() {
  const { user, profile, toast } = useApp();
  const unlimited = profile.role === 'admin' || profile.perms?.full === true;
  const [rid, setRid] = useState(''), [amt, setAmt] = useState(''), [dep, setDep] = useState(''), [name, setName] = useState(''), [busy, setBusy] = useState(false);
  const pend = useLive((fb) => fb.query(fb.collection(fb.db, 'deposits'), fb.where('status', '==', 'PENDING'), fb.limit(50)), []);
  const alloc = useDocLive((fb) => fb.doc(fb.db, 'allocations', user.uid), [user.uid]);
  useEffect(() => {
    setName('');
    if (rid.length !== 10) return;
    const fb = getFb();
    fb.getDoc(fb.doc(fb.db, 'ruthIds', rid)).then((d: any) => setName(d.exists() ? d.data().name : 'No account found')).catch(() => {});
  }, [rid]);
  const credit = async () => {
    if (!name || name === 'No account found') return toast('Enter a valid Bamyon ID.');
    if (!confirm(`Credit ${naira(+amt)} to ${name}?`)) return;
    setBusy(true);
    try { const r = await call('credit', { ruthId: rid, amount: +amt, depositId: dep || undefined }); toast(`Credited ${r.name}. New balance ${naira(r.balance)}.`); setRid(''); setAmt(''); setDep(''); } catch (e: any) { toast(e.message); }
    setBusy(false);
  };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.4rem' }}>Cashier</h1>
      {!unlimited && <p className="mut">Your remaining allocation: <b>{naira(alloc.data?.remaining || 0)}</b></p>}
      <div className="ord">
        <input placeholder="Customer Bamyon ID" inputMode="numeric" maxLength={10} value={rid} onChange={(e) => setRid(e.target.value.trim())} />
        {name && <span className="mut">{name}</span>}
        <input type="number" min={1} placeholder="Amount (NGN)" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <button className="go" disabled={busy || !rid || !amt} onClick={credit}>{busy ? 'Crediting...' : 'Credit wallet'}</button>
      </div>
      <h3 style={{ margin: '1.2rem 0 .5rem' }}>Pending deposits</h3>
      {pend.loading ? <Loading /> : !pend.docs.length ? <Empty>No pending deposits.</Empty> : pend.docs.map((d) => (
        <div className="ord" key={d.id}><div className="row"><b>{d.name}</b><Pill>ref {d.id.slice(0, 6).toUpperCase()}</Pill><b style={{ marginLeft: 'auto' }}>{naira(d.amount)}</b></div><div className="mut">Bamyon ID {d.ruthId} | {when(d.at)}</div>
          <button className={dep === d.id ? 'go' : 'alt'} onClick={() => { setRid(d.ruthId); setAmt(String(d.amount)); setDep(d.id); }}>{dep === d.id ? 'Selected' : 'Use this deposit'}</button></div>
      ))}
    </>
  );
}

export function Transactions() {
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'transactions'), fb.orderBy('at', 'desc'), fb.limit(100)), []);
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Transactions</h1>
      {loading ? <Loading /> : !docs.length ? <Empty>No transactions yet.</Empty> : docs.map((t) => (
        <div className="line" key={t.id}><span><b>{t.name || 'System'}</b> <Pill>{String(t.type).toLowerCase()}</Pill><br /><small className="mut">{t.reason} | by {t.byName || 'system'} | {when(t.at)}</small></span><b style={{ color: t.amount > 0 ? '#2fbf86' : 'inherit' }}>{(t.amount > 0 ? '+' : '') + naira(t.amount)}</b></div>
      ))}
    </>
  );
}

const WNEXT: Record<string, string[]> = { PENDING: ['PROCESSING', 'PAID', 'REJECTED'], PROCESSING: ['PAID', 'REJECTED'] };
export function Withdrawals() {
  const { toast } = useApp(), [busy, setBusy] = useState('');
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'withdrawals'), fb.orderBy('at', 'desc'), fb.limit(100)), []);
  const set = async (w: any, status: string) => {
    const note = status === 'REJECTED' ? prompt('Reason for rejecting (shown to the customer)') || '' : '';
    setBusy(w.id + status);
    try { await call('setWithdrawal', { id: w.id, status, note }); toast('Updated.'); } catch (e: any) { toast(e.message); }
    setBusy('');
  };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Withdrawals</h1>
      {loading ? <Loading /> : !docs.length ? <Empty>No withdrawal requests.</Empty> : docs.map((w) => (
        <div className="ord" key={w.id}>
          <div className="row"><b>{w.name}</b><Pill>{String(w.status).toLowerCase()}</Pill><b style={{ marginLeft: 'auto' }}>{naira(w.amount)}</b></div>
          <div>{w.bank} | {w.acct} | {w.acctName}</div><div className="mut">{w.phone} | {when(w.at)}{w.note ? ' | ' + w.note : ''}</div>
          <div className="row">{(WNEXT[w.status] || []).map((s) => <button key={s} className={s === 'PAID' ? 'go' : 'alt'} disabled={busy === w.id + s} onClick={() => set(w, s)}>{s === 'PAID' ? 'Mark paid' : s.toLowerCase()}</button>)}</div>
        </div>
      ))}
    </>
  );
}
