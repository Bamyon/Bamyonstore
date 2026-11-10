'use client';
import { BRAND } from '@/config/brand';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './Providers';
import { Avatar } from './ui';
import type { ReactNode } from 'react';
import Icon from './Icon';
import dynamic from 'next/dynamic';
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
import Drawer from './Drawer';
import { getFb } from '@/lib/firebase';
import { ms } from '@/lib/util';

const seen = (k: string): number => { try { const v = +localStorage['seen_' + k]; if (v) return v; localStorage['seen_' + k] = Date.now(); return Date.now(); } catch { return Date.now(); } };
const mark = (k: string) => { try { localStorage['seen_' + k] = Date.now(); } catch {} };

type DotKey = 'shop' | 'blog' | 'chat' | 'orders' | 'aorders' | 'withdrawals' | 'cashier';
type Dots = Record<DotKey, boolean>;
const NONE: Dots = { shop: false, blog: false, chat: false, orders: false, aorders: false, withdrawals: false, cashier: false };
// Which menu link carries which notification dot.
const KEY_OF: Record<string, DotKey> = { '/shop': 'shop', '/blog': 'blog', '/account/chat': 'chat', '/account/orders': 'orders', '/admin/orders': 'aorders', '/admin/withdrawals': 'withdrawals', '/admin/cashier': 'cashier' };

function useDots(): Dots {
  const { user, profile, can } = useApp();
  const [d, setD] = useState<Dots>(NONE);
  const path = usePathname();
  const here = useRef(path);
  here.current = path;
  const patch = (k: DotKey, v: boolean) => setD((x) => (x[k] === v ? x : { ...x, [k]: v }));
  const onPage = (h: string) => here.current === h || here.current.startsWith(h + '/');
  const staffOrders = can('orders.view'), staffWallet = can('wallet.credit'), staffMoney = can('wallet.monitor'), staffChat = can('support.reply');

  useEffect(() => { // new products or blog posts since the last visit
    const fb = getFb();
    fb.getDoc(fb.doc(fb.db, 'settings', 'news')).then((s: any) => { const n = s.data() || {}; patch('shop', (n.products || 0) > seen('shop')); patch('blog', (n.blog || 0) > seen('blog')); }).catch(() => {});
    // eslint-disable-next-line
  }, []);
  useEffect(() => { // opening a section clears its dot
    const e = Object.entries(KEY_OF).find(([h]) => path === h || path.startsWith(h + '/'));
    if (e) { mark(e[1]); patch(e[1], false); }
    // eslint-disable-next-line
  }, [path]);
  useEffect(() => { // unread chat
    if (!user || !profile) return;
    const fb = getFb();
    if (staffChat) return fb.onSnapshot(fb.query(fb.collection(fb.db, 'chats'), fb.orderBy('updatedAt', 'desc'), fb.limit(20)), (s: any) => patch('chat', !onPage('/account/chat') && s.docs.some((c: any) => c.data().lastRole === 'customer' && ms(c.data().updatedAt) > seen('chat'))), () => {});
    return fb.onSnapshot(fb.doc(fb.db, 'chats', user.uid), (c: any) => patch('chat', !onPage('/account/chat') && c.exists() && c.data().lastRole === 'staff' && ms(c.data().updatedAt) > seen('chat')), () => {});
    // eslint-disable-next-line
  }, [user?.uid, staffChat]);
  useEffect(() => { // my orders changed status
    if (!user) return;
    const fb = getFb();
    return fb.onSnapshot(fb.query(fb.collection(fb.db, 'orders'), fb.where('uid', '==', user.uid), fb.limit(30)), (s: any) => patch('orders', !onPage('/account/orders') && s.docs.some((o: any) => ms(o.data().updatedAt) > seen('orders'))), () => {});
    // eslint-disable-next-line
  }, [user?.uid]);
  useEffect(() => { // staff: new orders, deposits and withdrawals waiting
    if (!user) return;
    const fb = getFb(), off: Array<() => void> = [];
    const watch = (coll: string, key: DotKey, field: string, status: string, href: string) =>
      off.push(fb.onSnapshot(fb.query(fb.collection(fb.db, coll), fb.where('status', '==', status), fb.limit(20)), (s: any) => patch(key, !onPage(href) && s.docs.some((o: any) => ms(o.data()[field]) > seen(key))), () => {}));
    if (staffOrders) watch('orders', 'aorders', 'createdAt', 'PLACED', '/admin/orders');
    if (staffWallet) watch('deposits', 'cashier', 'at', 'PENDING', '/admin/cashier');
    if (staffMoney) watch('withdrawals', 'withdrawals', 'at', 'PENDING', '/admin/withdrawals');
    return () => off.forEach((f) => f());
    // eslint-disable-next-line
  }, [user?.uid, staffOrders, staffWallet, staffMoney]);
  return d;
}

export default function Shell({ children }: { children: ReactNode }) {
  const { pub, user, profile, ready, menu, setMenu, cartCount, cartOpen, setCartOpen, msg, can, staff } = useApp();
  const path = usePathname(), dots = useDots(), [cartEver, setCartEver] = useState(false);
  useEffect(() => { if (cartOpen) setCartEver(true); }, [cartOpen]);
  useEffect(() => { setMenu(false); }, [path, setMenu]);
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);
  const on = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  const anyDot = Object.values(dots).some(Boolean);
  const hideNav = path.startsWith('/login');
  const orders = staff && can('orders.view') ? '/admin/orders' : '/account/orders';
  const NAV: string[][] = !user
    ? [['/', 'Home', 'home'], ['/shop', 'Shop', 'bag'], ['/services', 'Services', 'palette'], ['/login', 'Sign in', 'user']]
    : [['/account', 'Home', 'home'], ['/shop', 'Shop', 'bag'], [orders, 'Orders', 'orders'], staff ? ['#menu', 'Manage', 'grid'] : ['/account/wallet', 'Wallet', 'wallet']];

  return (
    <>
      {pub?.announceOn && pub?.announce && <div className="ann">{pub.announce}</div>}
      <header>
        <div className="row" style={{ flexWrap: 'nowrap', gap: '.6rem' }}>
          <button className={'burger' + (anyDot ? ' dot' : '')} aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}><i /><i /><i /></button>
          <Link className="brandrow" href="/"><img src={BRAND.logo} alt="" width="40" height="40" /><span><b>{BRAND.nameA}<span>{BRAND.nameB}</span></b><small>Store</small></span></Link>
        </div>
        <div className="row hr">
          <button className="alt ibtn" aria-label="Open cart" onClick={() => setCartOpen(true)}><Icon n="cart" />{cartCount > 0 && <span className="badge">{cartCount}</span>}</button>
          {user ? <Link href="/account" className="ibtn" aria-label="Your account"><Avatar u={profile || {}} /></Link> : ready && <Link className="btn alt" href="/login">Sign in</Link>}
        </div>
      </header>

      <div className={'page' + (hideNav ? '' : ' withnav')}>{children}</div>

      <Drawer dots={dots} keyOf={KEY_OF} />

      {!hideNav && (
        <nav className="bnav" aria-label="Main">
          {NAV.map(([h, t, i]) => h === '#menu'
            ? <button key={t} className={menu ? 'on' : ''} onClick={() => setMenu(true)}><Icon n={i} /><span>{t}</span></button>
            : <Link key={t} href={h} className={(on(h) ? 'on ' : '') + (KEY_OF[h] && dots[KEY_OF[h]] ? 'dot' : '')}><Icon n={i} /><span>{t}</span></Link>)}
        </nav>
      )}
      {(cartEver || cartOpen) && <CartDrawer />}
      {msg && <div id="toast" role="status">{msg}</div>}
    </>
  );
}
