'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive, useDocLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import Icon from '@/components/Icon';
import { Sheet, Pill, Empty } from '@/components/ui';
import { DepositForm, SendForm, WithdrawForm, PayForm } from '@/components/WalletForms';
import { naira, when, ms } from '@/lib/util';
import ClaimCode from '@/components/ClaimCode';

type Mode = 'add' | 'send' | 'withdraw' | 'pay' | null;
const newest = (a: any, b: any) => ms(b.at) - ms(a.at);

export default function Wallet() {
  const { user, toast } = useApp();
  const [mode, setMode] = useState<Mode>(null), [code, setCode] = useState('');
  const bal = useDocLive((fb) => fb.doc(fb.db, 'balances', user.uid), [user.uid]);
  const led = useLive((fb) => fb.query(fb.collection(fb.db, 'wallet', user.uid, 'ledger'), fb.orderBy('at', 'desc'), fb.limit(100)), [user.uid]);
  const dep = useLive((fb) => fb.query(fb.collection(fb.db, 'deposits'), fb.where('uid', '==', user.uid), fb.limit(20)), [user.uid]);
  const wd = useLive((fb) => fb.query(fb.collection(fb.db, 'withdrawals'), fb.where('uid', '==', user.uid), fb.limit(20)), [user.uid]);
  const reqs = useLive((fb) => fb.query(fb.collection(fb.db, 'payRequests'), fb.where('requesterUid', '==', user.uid), fb.limit(10)), [user.uid]);
  useEffect(() => {
    const q = new URLSearchParams(location.search), d = q.get('do'), p = q.get('pay');
    if (p) { setCode(p); setMode('pay'); } else if (d === 'add' || d === 'send' || d === 'withdraw' || d === 'pay') setMode(d);
  }, []);
  const close = () => setMode(null);
  const cancel = async (ref: any) => { const fb = getFb(); try { await fb.updateDoc(ref, { status: 'CANCELLED' }); } catch { toast('Not allowed.'); } };
  const open = reqs.docs.filter((r) => r.status === 'OPEN');
  return (
    <div className="wrap">
      <section className="acct">
        <span className="sub">Wallet balance</span>
        <div className="bal">{naira(bal.data?.amount || 0)}</div>
        <div className="acts">
          <button onClick={() => setMode('add')}><Icon n="down" />Add money</button><button onClick={() => setMode('send')}><Icon n="send" />Send</button>
          <button onClick={() => setMode('withdraw')}><Icon n="out" />Withdraw</button><button onClick={() => setMode('pay')}><Icon n="cart" />Pay request</button>
        </div>
      </section>
      <div style={{ marginTop: '.8rem' }}><ClaimCode /></div>
      {open.length > 0 && <>{open.map((r) => <div className="ord" key={r.id} style={{ marginTop: '.8rem' }}><div className="row"><b>Pay request {r.id}</b><Pill>open</Pill><b style={{ marginLeft: 'auto' }}>{naira(r.total)}</b></div><button className="alt" onClick={() => cancel(r.ref)}>Cancel request</button></div>)}</>}
      <h3 style={{ margin: '1.4rem 0 .4rem' }}>History</h3>
      {led.docs.length ? led.docs.map((e) => <div className="line" key={e.id}><span>{e.reason}<br /><small className="mut">{when(e.at)}</small></span><b style={{ color: e.amount > 0 ? '#2fbf86' : 'inherit' }}>{(e.amount > 0 ? '+' : '') + naira(e.amount)}</b></div>) : <Empty>No transactions yet.</Empty>}
      {(dep.docs.length > 0 || wd.docs.length > 0) && <h3 style={{ margin: '1.4rem 0 .4rem' }}>Deposits and withdrawals</h3>}
      {[...dep.docs.map((x) => ({ ...x, k: 'Deposit' })), ...wd.docs.map((x) => ({ ...x, k: 'Withdrawal' }))].sort(newest).map((x) => (
        <div className="line" key={x.k + x.id}><span>{x.k} {naira(x.amount)}<br /><small className="mut">{when(x.at)}</small></span>
          <span className="row"><Pill>{String(x.status).toLowerCase()}</Pill>{x.k === 'Deposit' && x.status === 'PENDING' && <button className="alt" onClick={() => cancel(x.ref)}>Cancel</button>}</span></div>
      ))}
      {mode === 'add' && <Sheet title="Add money" onClose={close}><DepositForm done={close} /></Sheet>}
      {mode === 'send' && <Sheet title="Send money" onClose={close}><SendForm done={close} /></Sheet>}
      {mode === 'withdraw' && <Sheet title="Withdraw to your bank" onClose={close}><WithdrawForm done={close} /></Sheet>}
      {mode === 'pay' && <Sheet title="Pay for someone" onClose={close}><PayForm code={code} done={close} /></Sheet>}
    </div>
  );
}
