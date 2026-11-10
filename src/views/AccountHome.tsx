'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { useLive, useDocLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import Icon from '@/components/Icon';
import { Avatar, Pill } from '@/components/ui';
import { ADMIN } from '@/lib/nav';
import { BRAND } from '@/config/brand';
import { naira, when } from '@/lib/util';
import { STEPS, label } from '@/lib/orders';

const FINISHED = ['DELIVERED', 'CANCELLED', 'REJECTED', 'DELIVERY_EXCEPTION'];
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

function useCount(coll: string, status: string): number {
  return useLive((fb) => fb.query(fb.collection(fb.db, coll), fb.where('status', '==', status), fb.limit(99)), [coll, status]).docs.length;
}

function Hello({ profile }: { profile: any }) {
  return (
    <div className="hello">
      <div><small>{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</small><h1>{greet()}, {(profile.name || 'there').split(' ')[0]}</h1></div>
      <Link href="/account/settings" className="ibtn" aria-label="Settings"><Avatar u={profile} /></Link>
    </div>
  );
}

function WalletHero() {
  const { user, profile, toast } = useApp();
  const r = useRouter();
  const bal = useDocLive((fb) => fb.doc(fb.db, 'balances', user.uid), [user.uid]);
  const A = ({ t, i, d }: { t: string; i: string; d: string }) => <button onClick={() => r.push('/account/wallet?do=' + d)}><Icon n={i} />{t}</button>;
  return (
    <section className="acct">
      <span className="sub">{BRAND.wallet}</span>
      <div className="bal">{naira(bal.data?.amount || 0)}</div>
      <div className="row"><span className="sub">{BRAND.idLabel}</span><b>{profile.ruthId || 'none'}</b>
        <button className="alt ibtn" aria-label={`Copy ${BRAND.idLabel}`} style={{ width: '2.1rem', height: '2.1rem', color: '#fff', background: 'rgba(255,255,255,.16)' }} onClick={() => navigator.clipboard?.writeText(profile.ruthId || '').then(() => toast('Copied'))}><Icon n="copy" /></button></div>
      <div className="acts"><A t="Add money" i="down" d="add" /><A t="Send" i="send" d="send" /><A t="Withdraw" i="out" d="withdraw" /><A t="Pay request" i="cart" d="pay" /></div>
    </section>
  );
}

function Tile({ href, icon, big, small, wide }: { href: string; icon: string; big: string; small: string; wide?: boolean }) {
  return <Link href={href} className={'tile' + (wide ? ' wide' : '')}><span className="t-ic"><Icon n={icon} /></span><b>{big}</b><small>{small}</small></Link>;
}

function AdminKpis() {
  const { profile, can } = useApp();
  const [total, setTotal] = useState('...');
  const o = useCount('orders', 'PLACED'), d = useCount('deposits', 'PENDING'), w = useCount('withdrawals', 'PENDING');
  useEffect(() => {
    const fb = getFb();
    fb.getAggregateFromServer(fb.collection(fb.db, 'balances'), { t: fb.sum('amount') }).then((r: any) => setTotal(naira(r.data().t || 0)))
      .catch(() => fb.getDocs(fb.collection(fb.db, 'balances')).then((s: any) => setTotal(naira(s.docs.reduce((a: number, x: any) => a + (x.data().amount || 0), 0)))).catch(() => setTotal('n/a')));
  }, []);
  const quick = ADMIN.flatMap(([, L]) => L).filter(([, , , p]) => (p === 'admin' ? profile.role === 'admin' : can(p))).slice(0, 8);
  return (
    <>
      <section className="acct">
        <span className="sub">Total in all wallets</span><div className="bal">{total}</div>
        <div className="stats"><div><small>New orders</small><b>{o}</b></div><div><small>Deposits waiting</small><b>{d}</b></div><div><small>Withdrawals waiting</small><b>{w}</b></div></div>
      </section>
      <h3 className="sec">Quick links</h3>
      <div className="quick">{quick.map(([s, t, i]) => <Link key={s} href={'/admin/' + s} className="qk"><span className="t-ic"><Icon n={i} /></span><span>{t}</span></Link>)}</div>
    </>
  );
}

function Restock() {
  const { toast } = useApp();
  const { docs } = useLive((fb) => fb.query(fb.collection(fb.db, 'products'), fb.limit(300)), []);
  const [add, setAdd] = useState<Record<string, string>>({});
  const L = docs.filter((p) => typeof p.qty === 'number' && p.qty <= (p.lowAt ?? 5)).sort((a, b) => a.qty - b.qty);
  if (!L.length) return null;
  return (
    <>
      <h3 className="sec">Needs restocking</h3>
      {L.map((p) => (
        <div className="ord" key={p.id}>
          <div className="row"><b>{p.name}</b><Pill>{p.qty <= 0 ? 'Out of stock' : p.qty + ' left'}</Pill></div>
          <div className="lowrow"><input type="number" min={1} placeholder="+ units" aria-label="Units to add" value={add[p.id] || ''} onChange={(e) => setAdd({ ...add, [p.id]: e.target.value })} />
            <button className="alt" onClick={async () => { const v = Math.round(+add[p.id]); if (!(v > 0)) return toast('Enter units to add.'); const fb = getFb(); try { await fb.updateDoc(p.ref, { qty: fb.increment(v) }); setAdd({ ...add, [p.id]: '' }); toast('Stock updated.'); } catch { toast('Not allowed.'); } }}>Add stock</button></div>
        </div>
      ))}
    </>
  );
}

export default function AccountHome() {
  const { user, profile, can } = useApp();
  const adm = profile.role === 'admin';
  const orders = useLive((fb) => {
    const c = fb.collection(fb.db, 'orders');
    if (profile.role === 'rider') return fb.query(c, fb.where('riderId', '==', user.uid), fb.limit(30));
    if (adm || (profile.role !== 'customer' && profile.role !== 'partner' && can('orders.view'))) return fb.query(c, fb.orderBy('createdAt', 'desc'), fb.limit(30));
    return fb.query(c, fb.where('uid', '==', user.uid), fb.limit(30));
  }, [user.uid, profile.role]);
  const recent = [...orders.docs].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 4);
  const active = orders.docs.filter((o) => !FINISHED.includes(o.status)).length;
  return (
    <div className="wrap">
      <Hello profile={profile} />
      {adm ? <AdminKpis /> : <>
        <WalletHero />
        <div className="bento">
          <Tile href="/account/orders" icon="orders" big={String(active)} small="Orders in progress" />
          <Tile href="/shop" icon="bag" big="Shop" small="See what is new" />
          <Tile href="/account/referrals" icon="gift" big="Rewards" small="Invite friends, claim codes" />
          <Tile href="/account/chat" icon="chat" big="Chat" small="Talk to us" />
          <Tile href="/services" icon="palette" big="Studio" small="Websites, graphics, Google" wide />
        </div>
      </>}
      <h3 className="sec">{adm ? 'Latest orders' : 'Recent orders'}</h3>
      {recent.length ? recent.map((o) => {
        const at = STEPS.indexOf(o.status), pct = at < 0 ? 0 : Math.round(((at + 1) / STEPS.length) * 100);
        return (
          <div className="ord" key={o.id}>
            <div className="row"><b>#{(o.code || o.id.slice(0, 6)).toUpperCase()}</b><Pill>{label(o.status)}</Pill><b style={{ marginLeft: 'auto' }}>{naira(o.total)}</b></div>
            <div className="mut">{(o.items || []).map((i: any) => `${i.qty} x ${i.name}`).join(', ')}</div>
            {at >= 0 && <div className="oprog"><i style={{ width: pct + '%' }} /></div>}
          </div>
        );
      }) : <p className="mut">No orders yet. Your next order will show up here.</p>}
      {adm && <Restock />}
      <h3 className="sec">Account details</h3>
      <div className="info">
        {[['Phone', profile.phone || 'Add one in Settings'], ['Email', user.email || '-'], ['Member since', profile.createdAt ? when(profile.createdAt).split(',')[0] : '-'], ['Status', profile.disabled ? 'Suspended' : 'Active']].map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
      </div>
    </div>
  );
}
