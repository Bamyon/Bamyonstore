'use client';
import { useEffect, useState } from 'react';
import { call } from '@/lib/api';
import { useApp } from '@/components/Providers';
import { naira, when } from '@/lib/util';
import { Pill } from '@/components/ui';

const STEPS = ['PLACED', 'APPROVED', 'PACKING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const label = (s: string) => s.replaceAll('_', ' ').toLowerCase();

export default function Track() {
  const { toast } = useApp();
  const [code, setCode] = useState(''), [phone, setPhone] = useState(''), [r, setR] = useState<any>(null), [busy, setBusy] = useState(false);
  const go = async (c: string = code, p: string = phone) => {
    if (!c || !p) return toast('Enter your reference and phone number.');
    setBusy(true);
    try { setR(await call('trackOrder', { code: c, phone: p })); } catch (e) { setR(null); toast(e.message); }
    setBusy(false);
  };
  useEffect(() => {
    const q = new URLSearchParams(location.search), c = q.get('code') || '', p = q.get('phone') || '';
    if (c) { setCode(c); setPhone(p); if (p) go(c, p); }
    // eslint-disable-next-line
  }, []);
  const at = r ? STEPS.indexOf(r.status) : -1;
  return (
    <div className="wrap" style={{ maxWidth: '40rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Track an order</h1>
      <form className="f" onSubmit={(e) => { e.preventDefault(); go(); }}>
        <input placeholder="Order reference (6 characters)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
        <input placeholder="Phone number used on the order" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="go" disabled={busy}>{busy ? 'Looking...' : 'Track order'}</button>
      </form>
      {r && (
        <div className="ord">
          <div className="row"><b>#{r.code}</b><Pill>{label(r.status)}</Pill><b style={{ marginLeft: 'auto' }}>{naira(r.total)}</b></div>
          {r.status === 'REJECTED' || r.status === 'CANCELLED' || r.status === 'DELIVERY_EXCEPTION' ? <p className="mut">This order was {label(r.status)}.</p>
            : <div className="steps">{STEPS.map((s, i) => <div key={s} className={'step' + (i <= at ? ' on' : '')}><i />{label(s).replace('out for delivery', 'on the way')}</div>)}</div>}
          <div className="mut">{r.items.map((i) => `${i.qty} x ${i.name}`).join(', ')}</div>
          {r.events.map((e, i) => <div className="line" key={i}><span>{label(e.to)}</span><span className="mut">{when({ seconds: e.at / 1000 })}</span></div>)}
        </div>
      )}
    </div>
  );
}
