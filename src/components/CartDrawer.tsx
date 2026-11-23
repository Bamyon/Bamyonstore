'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from './Providers';
import { getFb } from '@/lib/firebase';
import { call, track } from '@/lib/api';
import { naira, cl } from '@/lib/util';
import { BRAND } from '@/config/brand';

export default function CartDrawer() {
  const { cart, setQty, clearCart, cartOpen, setCartOpen, user, profile, toast } = useApp();
  const items: any[] = Object.values(cart);
  const [zones, setZones] = useState<any[]>([]), [zone, setZone] = useState(''), [code, setCode] = useState(''), [promo, setPromo] = useState<any>(null);
  const [f, setF] = useState({ name: '', phone: '', email: '', addr: '' }), [pin, setPin] = useState(''), [geo, setGeo] = useState<number[] | null>(null);
  const [bal, setBal] = useState<number | null>(null), [busy, setBusy] = useState(false), [done, setDone] = useState<any>(null), [req, setReq] = useState<any>(null);
  const set = (k: string) => (e: any) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    if (!cartOpen) return;
    const fb = getFb();
    fb.getDocs(fb.query(fb.collection(fb.db, 'zones'), fb.where('active', '==', true))).then((s) => setZones(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
    try { const s = JSON.parse(localStorage.bmform || '{}'); setF((x) => ({ ...x, ...s })); } catch {}
  }, [cartOpen]);
  useEffect(() => { if (profile) setF((x) => ({ ...x, name: x.name || profile.name || '', phone: x.phone || profile.phone || '', email: x.email || user?.email || '' })); }, [profile, user]);
  useEffect(() => {
    if (!user) return setBal(null);
    const fb = getFb();
    return fb.onSnapshot(fb.doc(fb.db, 'balances', user.uid), (d) => setBal(d.data()?.amount || 0), () => {});
  }, [user]);

  const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
  const z = zones.find((x) => x.id === zone), fee = z ? (z.free ? 0 : z.price || 0) : 0;
  const disc = promo && sub >= (promo.min || 0) ? Math.min(sub, promo.type === 'PERCENT' ? Math.round(sub * promo.value / 100) : promo.value) : 0;
  const total = sub - disc + fee;

  const apply = async () => {
    const fb = getFb(), c = code.trim().toUpperCase().replaceAll('/', '');
    if (!c) return;
    try {
      const s = await fb.getDoc(fb.doc(fb.db, 'promos', c)), p = s.data();
      if (s.exists() && p.active && (!p.expires || p.expires > Date.now())) { setPromo({ ...p, code: c }); toast('Promo applied.'); } else { setPromo(null); toast('That code is not valid.'); }
    } catch { toast('Could not check the code.'); }
  };
  const share = () => navigator.geolocation?.getCurrentPosition((p) => { setGeo([+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5)]); toast('Your location will go with the order.'); }, () => toast('Location permission denied.'));
  const body = (method: string) => ({ items: items.map((i) => ({ id: i.id, qty: i.qty })), zone, promo: promo?.code || '', method, pin, contact: { ...f, geo } });
  const check = () => {
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 10 || !f.addr.trim()) { toast('Enter your name, phone number and delivery address.'); return false; }
    if (zones.length && !zone) { toast('Choose a delivery zone.'); return false; }
    try { localStorage.bmform = JSON.stringify(f); } catch {}
    return true;
  };
  const place = async (method: string) => {
    if (!check()) return;
    setBusy(true);
    try { const r = await call('placeOrder', body(method)); clearCart(); setPin(''); setDone({ ...r, phone: f.phone }); track('order', r.code); } catch (e) { toast(e.message); }
    setBusy(false);
  };
  const ask = async () => {
    if (!check()) return;
    setBusy(true);
    try { setReq(await call('createPayRequest', body('PAID_BY_OTHER'))); } catch (e) { toast(e.message); }
    setBusy(false);
  };
  const close = () => { setCartOpen(false); setTimeout(() => { setDone(null); setReq(null); }, 300); };

  return (
    <aside id="drawer" className={cartOpen ? 'open' : ''} aria-label="Cart" aria-hidden={!cartOpen}>
      <div className="row" style={{ justifyContent: 'space-between' }}><h2>Your cart</h2><button className="alt" onClick={close}>Close</button></div>
      {done ? (
        <div className="ord"><h3>Order placed</h3><p>Your reference is <b>{done.code}</b>. Total {naira(done.total)}.</p>
          <Link className="btn go" href={`/track?code=${done.code}&phone=${encodeURIComponent(done.phone)}`} onClick={close}>Track this order</Link></div>
      ) : req ? (
        <div className="ord"><h3>Share this code</h3><p>Ask a friend to open <b>Wallet, Pay request</b> and enter <b>{req.code}</b>. It is valid for 48 hours.</p>
          <a className="btn go" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Please pay for my ${BRAND.short} order (${naira(req.total)}). Open ${location.origin}/account/wallet?pay=${req.code}`)}`}>Send on WhatsApp</a></div>
      ) : !items.length ? <p className="mut empty">Your cart is empty.</p> : (
        <>
          {items.map((i) => (
            <div className="line" key={i.id}>
              <span className="row" style={{ flexWrap: 'nowrap' }}>{cl(i.img, 96) && <img src={cl(i.img, 96)} alt="" width="44" height="44" style={{ borderRadius: '.6rem', objectFit: 'contain', background: '#fff' }} />}<span>{i.name}<br /><small className="mut">{naira(i.price)}</small></span></span>
              <span className="q"><button className="alt" aria-label="One less" onClick={() => setQty(i.id, i.qty - 1)}>-</button> <b>{i.qty}</b> <button className="alt" aria-label="One more" onClick={() => setQty(i.id, i.qty + 1)}>+</button></span>
            </div>
          ))}
          <div className="row"><input style={{ flex: 1 }} placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} /><button className="alt" onClick={apply}>Apply</button></div>
          {disc > 0 && <p className="line"><span>Discount</span><b>-{naira(disc)}</b></p>}
          <p className="line"><span>Items</span><b>{naira(sub)}</b></p>
          <p className="line"><span>Delivery</span><b>{z ? (z.free ? 'Free' : naira(fee)) : '-'}</b></p>
          <p className="line"><span>Total</span><b>{naira(total)}</b></p>
          <div className="f" style={{ display: 'grid', gap: '.6rem', margin: '.6rem 0' }}>
            <input placeholder="Full name" value={f.name} onChange={set('name')} autoComplete="name" />
            <input placeholder="Phone number" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" />
            <input placeholder="Email (for your receipt)" type="email" value={f.email} onChange={set('email')} autoComplete="email" />
            <input placeholder="Delivery address" value={f.addr} onChange={set('addr')} autoComplete="street-address" />
            <select value={zone} onChange={(e) => setZone(e.target.value)}><option value="">Delivery zone</option>{zones.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.free ? 'free' : naira(x.price)})</option>)}</select>
            <button type="button" className="alt" onClick={share}>{geo ? 'Location added' : 'Share my location with the rider'}</button>
          </div>
          {user && bal !== null && <>
            <p className="mut">Wallet balance {naira(bal)}</p>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="PIN (for wallet payment)" value={pin} onChange={(e) => setPin(e.target.value)} />
            <button className="go" disabled={busy || bal < total || pin.length !== 4} onClick={() => place('WALLET')}>{bal < total ? 'Wallet balance too low' : 'Pay with wallet'}</button>
            <button className="alt" disabled={busy} onClick={ask}>Ask someone to pay for me</button>
          </>}
          <button disabled={busy} onClick={() => place('PAY_ON_DELIVERY')}>{busy ? 'Please wait...' : 'Place order, pay on delivery'}</button>
        </>
      )}
    </aside>
  );
}
