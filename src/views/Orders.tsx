'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { advance, label } from '@/lib/orders';
import OrderSheet from '@/components/OrderSheet';
import { Pill, Empty, Loading } from '@/components/ui';
import { naira, when } from '@/lib/util';

// "mine" = orders I placed. "deliveries" = orders assigned to me as a rider.
export default function Orders({ mode }: { mode: 'mine' | 'deliveries' }) {
  const { user, can, toast } = useApp();
  const [open, setOpen] = useState<any>(null), [busy, setBusy] = useState('');
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'orders'), fb.where(mode === 'mine' ? 'uid' : 'riderId', '==', user.uid), fb.limit(50)), [user.uid, mode]);
  const L = [...docs].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const mark = async (o: any, to: string) => { setBusy(o.id + to); try { await advance(o, to, user.uid, can('orders.update_status')); } catch { toast('Not allowed.'); } setBusy(''); };
  return (
    <div className="wrap">
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{mode === 'mine' ? 'My orders' : 'My deliveries'}</h1>
      {loading ? <Loading /> : !L.length ? <Empty>{mode === 'mine' ? 'No orders yet. Your orders will appear here.' : 'No deliveries assigned to you.'}</Empty> : L.map((o) => (
        <div className="ord" key={o.id}>
          <div className="row"><b>#{(o.code || o.id.slice(0, 6)).toUpperCase()}</b><Pill>{label(o.status)}</Pill><b style={{ marginLeft: 'auto' }}>{naira(o.total)}</b></div>
          <div className="mut">{(o.items || []).map((i: any) => `${i.qty} x ${i.name}`).join(', ')}</div>
          <div className="mut">{when(o.createdAt)}{o.contact?.addr ? ' | ' + o.contact.addr : ''}</div>
          <div className="row"><button className="alt" onClick={() => setOpen(o)}>Track and chat</button>
            {mode === 'deliveries' && o.status === 'OUT_FOR_DELIVERY' && ['DELIVERED', 'DELIVERY_EXCEPTION'].map((to) => <button key={to} className={to === 'DELIVERED' ? 'go' : 'alt'} disabled={busy === o.id + to} onClick={() => mark(o, to)}>{to === 'DELIVERED' ? 'Mark delivered' : 'Problem delivering'}</button>)}</div>
        </div>
      ))}
      {open && <OrderSheet o={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
