'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { NEXT, advance, label } from '@/lib/orders';
import OrderSheet from '@/components/OrderSheet';
import { Pill, Empty, Loading, Sheet } from '@/components/ui';
import { naira, when } from '@/lib/util';

const FILTERS = ['ALL', 'PLACED', 'APPROVED', 'PACKING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

function RiderPicker({ o, onClose }: { o: any; onClose: () => void }) {
  const { toast } = useApp();
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'users'), fb.where('role', 'in', ['rider', 'staff'])), []);
  const pick = async (u: any) => {
    const fb = getFb();
    try { await fb.updateDoc(fb.doc(fb.db, 'orders', o.id), { riderId: u.id, updatedAt: fb.serverTimestamp() }); toast('Assigned to ' + (u.name || 'rider')); onClose(); } catch { toast('Not allowed.'); }
  };
  return (
    <Sheet title="Assign a rider" onClose={onClose}>
      {loading ? <Loading /> : !docs.length ? <Empty>No riders yet. Register one under People.</Empty> : docs.map((u) => <button key={u.id} className="alt" onClick={() => pick(u)}>{u.name || 'Unnamed'} ({u.role})</button>)}
    </Sheet>
  );
}

export default function AdminOrders() {
  const { user, can, toast } = useApp();
  const [f, setF] = useState('ALL'), [open, setOpen] = useState<any>(null), [rider, setRider] = useState<any>(null), [busy, setBusy] = useState('');
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'orders'), fb.orderBy('createdAt', 'desc'), fb.limit(100)), []);
  const L = docs.filter((o) => f === 'ALL' || o.status === f || (f === 'CANCELLED' && ['REJECTED', 'CANCELLED', 'DELIVERY_EXCEPTION'].includes(o.status)));
  const move = async (o: any, to: string) => { setBusy(o.id + to); try { await advance(o, to, user.uid, can('orders.update_status')); } catch { toast('Not allowed or invalid change.'); } setBusy(''); };
  const verify = async (o: any) => { const fb = getFb(); try { await fb.updateDoc(fb.doc(fb.db, 'orders', o.id), { pay: 'CONFIRMED', updatedAt: fb.serverTimestamp() }); toast('Payment confirmed.'); } catch { toast('Not allowed.'); } };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Orders</h1>
      <div className="chips">{FILTERS.map((s) => <button key={s} className={f === s ? 'on' : ''} onClick={() => setF(s)}>{label(s)}</button>)}</div>
      {loading ? <Loading /> : !L.length ? <Empty>No orders here.</Empty> : L.map((o) => (
        <div className="ord" key={o.id}>
          <div className="row"><b>#{(o.code || o.id.slice(0, 6)).toUpperCase()}</b><Pill>{label(o.status)}</Pill>{o.pay && <Pill>{o.pay === 'CONFIRMED' ? 'paid' : 'unpaid'}</Pill>}<b style={{ marginLeft: 'auto' }}>{naira(o.total)}</b></div>
          <div>{(o.items || []).map((i: any) => `${i.qty} x ${i.name}`).join(', ')}</div>
          <div className="mut">{o.contact?.name} | {o.contact?.phone} | {o.contact?.addr}{o.zone ? ' | ' + o.zone : ''}</div>
          <div className="mut">{when(o.createdAt)} | {label(o.method || '')}{o.riderId ? ' | rider assigned' : ''}</div>
          <div className="row">
            {can('orders.update_status') && (NEXT[o.status] || []).map((to) => <button key={to} className={['REJECTED', 'CANCELLED', 'DELIVERY_EXCEPTION'].includes(to) ? 'alt' : 'go'} disabled={busy === o.id + to} onClick={() => move(o, to)}>{label(to)}</button>)}
            {can('payments.verify') && o.pay === 'PENDING' && <button className="alt" onClick={() => verify(o)}>Confirm payment</button>}
            {can('orders.assign_rider') && !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status) && <button className="alt" onClick={() => setRider(o)}>{o.riderId ? 'Change rider' : 'Assign rider'}</button>}
            <button className="alt" onClick={() => setOpen(o)}>Details</button>
          </div>
        </div>
      ))}
      {open && <OrderSheet o={open} onClose={() => setOpen(null)} />}
      {rider && <RiderPicker o={rider} onClose={() => setRider(null)} />}
    </>
  );
}
