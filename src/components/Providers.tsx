'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getFb } from '@/lib/firebase';

const Ctx = createContext<any>(null);
export const useApp = (): any => useContext(Ctx);
export const canDo = (p: any, k: string): boolean => !!p && !p.disabled && (p.role === 'admin' || p.perms?.full === true || p.perms?.[k] === true);
export const isStaff = (p: any): boolean => !!p && !['customer', 'partner', 'rider'].includes(p.role);

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState('');
  const [cart, setCart] = useState<Record<string, any>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [pub, setPub] = useState<any>({});
  const tt = useRef<any>(null);

  const toast = useCallback((m: string) => { setMsg(m); clearTimeout(tt.current); tt.current = setTimeout(() => setMsg(''), 3500); }, []);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'dark');
    try { setCart(JSON.parse(localStorage.bmcart || '{}')); } catch {}
    try { setPub(JSON.parse(localStorage.pub || '{}')); } catch {}
    const fb = getFb();
    fb.getDoc(fb.doc(fb.db, 'settings', 'public')).then((d) => { const v = d.data() || {}; setPub(v); try { localStorage.pub = JSON.stringify(v); } catch {} }).catch(() => {});
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    const fb = getFb();
    let off: () => void = () => {};
    const un = fb.onAuthStateChanged(fb.auth, (u) => {
      off(); setUser(u);
      try { localStorage.signed = u ? '1' : '0'; } catch {}
      if (!u) { setProfile(null); setReady(true); return; }
      off = fb.onSnapshot(fb.doc(fb.db, 'users', u.uid), (d) => {
        const data = d.exists() ? { id: d.id, ...d.data() } : { id: u.uid, role: 'customer', name: '' };
        setProfile(data); setReady(true);
        try { localStorage.role = data.role || 'customer'; } catch {}
      }, () => setReady(true));
    });
    return () => { un(); off(); };
  }, []);

  const saveCart = (c: Record<string, any>) => { setCart(c); try { localStorage.bmcart = JSON.stringify(c); } catch {} };
  const addToCart = (p: any, n = 1) => {
    const max = typeof p.qty === 'number' ? p.qty : 99;
    if (max <= 0 || p.stock === false) return toast('Sorry, that item is sold out.');
    const q = Math.min(99, max, (cart[p.id]?.qty || 0) + n), c = { ...cart };
    if (q <= 0) delete c[p.id]; else c[p.id] = { id: p.id, name: p.name, price: p.price, img: p.img || '', qty: q };
    saveCart(c);
    if (n > 0) toast('Added to cart');
  };
  const setQty = (id: string, q: number) => { const c = { ...cart }; if (q <= 0) delete c[id]; else c[id] = { ...c[id], qty: Math.min(99, q) }; saveCart(c); };
  const toggleTheme = () => { const n = theme === 'dark' ? 'light' : 'dark'; setTheme(n); document.documentElement.dataset.theme = n; try { localStorage.theme = n; } catch {} };
  const can = (k: string) => canDo(profile, k);

  return (
    <Ctx.Provider value={{ pub, user, profile, ready, msg, toast, cart, cartCount: Object.values(cart).reduce((a, i) => a + i.qty, 0), addToCart, setQty, clearCart: () => saveCart({}), cartOpen, setCartOpen, menu, setMenu, theme, toggleTheme, can, staff: isStaff(profile) }}>
      {children}
    </Ctx.Provider>
  );
}
