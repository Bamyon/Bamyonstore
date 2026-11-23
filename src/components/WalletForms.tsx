'use client';
import { useEffect, useState } from 'react';
import { getFb, CFG } from '@/lib/firebase';
import { call } from '@/lib/api';
import { naira } from '@/lib/util';
import { useApp } from './Providers';
import { fd } from './ui';
import { BRAND } from '@/config/brand';

const pinProps = { type: 'password', inputMode: 'numeric' as const, maxLength: 4, placeholder: 'Your 4-digit PIN', required: true, autoComplete: 'off' };

export function DepositForm({ done }: { done: () => void }) {
  const { user, profile, pub, toast } = useApp();
  const [a, setA] = useState('');
  const wa = String(pub?.whatsapp || CFG.whatsapp || '').replace(/\D/g, '');
  const dep = async () => {
    const v = Math.round(+a);
    if (!(v >= 100)) return toast('Enter at least ₦100.');
    if (!wa) return toast('Deposits are not set up yet. Please contact the store.');
    const fb = getFb();
    try {
      const r = await fb.addDoc(fb.collection(fb.db, 'deposits'), { uid: user.uid, name: profile.name || '', ruthId: profile.ruthId || '', amount: v, status: 'PENDING', at: fb.serverTimestamp() });
      done();
      window.open(`https://wa.me/${wa}?text=` + encodeURIComponent(`Hello ${BRAND.short}, I want to deposit ${naira(v)} to my wallet.\nName: ${profile.name}\n${BRAND.idLabel}: ${profile.ruthId}\nRef: ${r.id.slice(0, 6).toUpperCase()}`), '_blank', 'noopener');
    } catch { toast('Could not start the deposit.'); }
  };
  const paystack = async () => {
    const v = Math.round(+a);
    if (!(v >= 100)) return toast('Enter at least ₦100.');
    if (!CFG.paystack) return toast('Paystack is not connected yet.');
    const w = window as any;
    if (!w.PaystackPop) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://js.paystack.co/v1/inline.js'; s.onload = ok; s.onerror = no; document.head.append(s); });
    w.PaystackPop.setup({ key: CFG.paystack, email: user.email, amount: v * 100, currency: 'NGN', metadata: { uid: user.uid }, callback: () => toast('Payment received. Your balance updates in a moment.'), onClose: () => {} }).openIframe();
  };
  return (
    <div style={{ display: 'grid', gap: '.6rem' }}>
      <p className="mut">Send the money to our cashier on WhatsApp. Your wallet is credited once they confirm.</p>
      <input type="number" min={100} placeholder="Amount to deposit (NGN)" value={a} onChange={(e) => setA(e.target.value)} />
      <button className="go" onClick={dep}>Deposit via WhatsApp</button>
      <button className="alt" disabled={!CFG.paystack} onClick={paystack}>{CFG.paystack ? 'Pay with Paystack' : 'Paystack (coming soon)'}</button>
    </div>
  );
}

export function SendForm({ done }: { done: () => void }) {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const look = async (v: string) => {
    setName('');
    if (v.length !== 10) return;
    const fb = getFb();
    try { const d = await fb.getDoc(fb.doc(fb.db, 'ruthIds', v)); setName(d.exists() ? d.data().name : 'No account found'); } catch {}
  };
  return (
    <form className="f" onSubmit={async (e) => {
      const { v } = fd(e);
      if (!name || name === 'No account found') return toast(`Enter a valid ${BRAND.idLabel}.`);
      if (!confirm(`Send ${naira(+v.am)} to ${name}?`)) return;
      try { await call('transfer', { toRuthId: v.rid.trim(), amount: +v.am, pin: v.pn, note: v.nt }); done(); toast('Money sent.'); } catch (x: any) { toast(x.message || 'Transfer failed.'); }
    }}>
      <input name="rid" placeholder={`Recipient ${BRAND.idLabel}`} inputMode="numeric" maxLength={10} onChange={(e) => look(e.target.value.trim())} />
      {name && <span className="mut">{name}</span>}
      <input name="am" type="number" min={1} placeholder="Amount (NGN)" required />
      <input name="nt" placeholder="Note (optional)" maxLength={80} />
      <input name="pn" {...pinProps} />
      <button className="go">Send money</button>
    </form>
  );
}

export function WithdrawForm({ done }: { done: () => void }) {
  const { toast } = useApp();
  return (
    <form className="f" onSubmit={async (e) => {
      const { v } = fd(e);
      if (!confirm(`Withdraw ${naira(+v.am)} to ${v.an}?`)) return;
      try { await call('withdraw', { amount: +v.am, bank: v.bk, acct: v.ac, acctName: v.an, pin: v.pn }); done(); toast('Withdrawal requested. We will update you.'); } catch (x: any) { toast(x.message || 'Could not request withdrawal.'); }
    }}>
      <input name="am" type="number" min={1000} placeholder="Amount (minimum 1,000)" required />
      <input name="bk" placeholder="Bank name" required />
      <input name="ac" placeholder="10-digit account number" inputMode="numeric" maxLength={10} required />
      <input name="an" placeholder="Account name" required />
      <input name="pn" {...pinProps} />
      <button className="go">Request withdrawal</button>
    </form>
  );
}

export function PayForm({ code, done }: { code?: string; done: () => void }) {
  const { toast } = useApp();
  const [c, setC] = useState(code || ''), [info, setInfo] = useState<any>(null), [pin, setPin] = useState('');
  const look = async (v = c) => { setInfo(null); try { setInfo(await call('lookupPayRequest', { code: v })); } catch (e: any) { toast(e.message); } };
  useEffect(() => { if (code) look(code); /* eslint-disable-next-line */ }, [code]);
  const pay = async () => { try { const r = await call('payRequest', { code: c, pin }); done(); toast('Paid for ' + r.name + '.'); } catch (e: any) { toast(e.message); } };
  return (
    <div style={{ display: 'grid', gap: '.6rem' }}>
      <div className="row"><input style={{ flex: 1 }} placeholder="Request code (RT-XXXXXX)" value={c} onChange={(e) => setC(e.target.value.toUpperCase())} /><button className="alt" onClick={() => look()}>Find</button></div>
      {info && <div className="ord"><b>{info.name}</b>
        {info.items.map((i: any, k: number) => <div className="line" key={k}><span>{i.qty} x {i.name}</span><b>{naira(i.price * i.qty)}</b></div>)}
        <p className="line"><span>Total</span><b>{naira(info.total)}</b></p>
        {info.status === 'OPEN' ? <><input {...pinProps} value={pin} onChange={(e) => setPin(e.target.value)} /><button className="go" onClick={pay}>Pay {naira(info.total)}</button></> : <p className="mut">This request is {info.status.toLowerCase()}.</p>}</div>}
    </div>
  );
}
