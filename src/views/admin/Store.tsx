'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';
import { getFb } from '@/lib/firebase';
import { touch } from '@/lib/api';
import { Loading } from '@/components/ui';
import { naira } from '@/lib/util';

export function StoreSettings() {
  const { toast } = useApp();
  const [s, setS] = useState<any>(null);
  useEffect(() => { const fb = getFb(); fb.getDoc(fb.doc(fb.db, 'settings', 'public')).then((d: any) => setS(d.data() || {})).catch(() => setS({})); }, []);
  if (!s) return <Loading />;
  const set = (k: string, v: any) => setS({ ...s, [k]: v });
  const save = async () => {
    const fb = getFb();
    try {
      await fb.setDoc(fb.doc(fb.db, 'settings', 'public'), { announce: s.announce || '', announceOn: !!s.announceOn, whatsapp: String(s.whatsapp || '').replace(/\D/g, ''), showSold: s.showSold !== false, showRating: s.showRating !== false, refBonus: Math.max(0, Math.round(+s.refBonus || 0)) }, { merge: true });
      touch('promo'); toast('Saved.');
    } catch { toast('Not allowed.'); }
  };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Store settings</h1>
      <div className="ord">
        <h3>Announcement bar</h3>
        <input placeholder="Message shown at the top of every page" value={s.announce || ''} onChange={(e) => set('announce', e.target.value)} maxLength={160} />
        <label><input type="checkbox" style={{ width: 'auto' }} checked={!!s.announceOn} onChange={(e) => set('announceOn', e.target.checked)} /> Show the announcement</label>
      </div>
      <div className="ord">
        <h3>Product cards</h3>
        <label><input type="checkbox" style={{ width: 'auto' }} checked={s.showSold !== false} onChange={(e) => set('showSold', e.target.checked)} /> Show units sold</label>
        <label><input type="checkbox" style={{ width: 'auto' }} checked={s.showRating !== false} onChange={(e) => set('showRating', e.target.checked)} /> Show star ratings</label>
      </div>
      <div className="ord">
        <h3>Contact and rewards</h3>
        <p className="mut">The referral bonus is paid to the friend who signs up and to the person who invited them. Both claim it from Rewards once the friend&apos;s first order is delivered. Create one-off reward codes under Reward codes.</p>
        <input placeholder="WhatsApp number (e.g. 2349041486491)" inputMode="numeric" value={s.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} />
        <input type="number" min={0} placeholder={`Referral bonus per person in NGN (now ${naira(s.refBonus || 0)})`} value={s.refBonus ?? ''} onChange={(e) => set('refBonus', e.target.value)} />
      </div>
      <button className="go" onClick={save}>Save settings</button>
    </>
  );
}

export function Reports() {
  const [o, setO] = useState<any[] | null>(null);
  useEffect(() => { const fb = getFb(); fb.getDocs(fb.query(fb.collection(fb.db, 'orders'), fb.orderBy('createdAt', 'desc'), fb.limit(500))).then((s: any) => setO(s.docs.map((d: any) => d.data()))).catch(() => setO([])); }, []);
  if (!o) return <Loading />;
  const done = o.filter((x) => x.status === 'DELIVERED'), rev = done.reduce((a, x) => a + (x.total || 0), 0);
  const day = Date.now() - 864e5, week = Date.now() - 7 * 864e5, at = (x: any) => (x.createdAt?.seconds || 0) * 1000;
  const by: Record<string, number> = {}; o.forEach((x) => { by[x.status] = (by[x.status] || 0) + 1; });
  const top: Record<string, number> = {}; done.forEach((x) => (x.items || []).forEach((i: any) => { top[i.name] = (top[i.name] || 0) + i.qty; }));
  const best = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8), max = best[0]?.[1] || 1;
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Reports</h1>
      <p className="mut">Based on your latest {o.length} orders.</p>
      <div className="info">
        {[['Delivered revenue', naira(rev)], ['Delivered orders', String(done.length)], ['Average order', naira(done.length ? Math.round(rev / done.length) : 0)], ['Orders today', String(o.filter((x) => at(x) > day).length)], ['Orders this week', String(o.filter((x) => at(x) > week).length)]].map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
      </div>
      <h3 style={{ margin: '1.2rem 0 .5rem' }}>Orders by status</h3>
      <div className="row">{Object.entries(by).map(([k, v]) => <span className="pill" key={k}>{k.replaceAll('_', ' ').toLowerCase()}: {v}</span>)}</div>
      <h3 style={{ margin: '1.2rem 0 .5rem' }}>Best sellers</h3>
      {best.length ? best.map(([n, q]) => <div className="line" key={n}><span style={{ flex: 1 }}>{n}<div style={{ height: '.4rem', borderRadius: '99px', background: 'var(--acc)', width: `${Math.max(6, (q / max) * 100)}%`, marginTop: '.3rem' }} /></span><b>{q}</b></div>) : <p className="mut">No delivered orders yet.</p>}
    </>
  );
}
