'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApp } from './Providers';
import { useDocLive } from '@/lib/hooks';
import { Avatar } from './ui';
import Icon from './Icon';
import { BROWSE, ADMIN, accountLinks, type Link3 } from '@/lib/nav';
import { BRAND, waLink } from '@/config/brand';
import { getFb } from '@/lib/firebase';
import { naira } from '@/lib/util';

// The one side menu for everybody: explore tiles, the signed-in account, and the management groups a user may open.
export default function Drawer({ dots, keyOf }: { dots: Record<string, boolean>; keyOf: Record<string, string> }) {
  const { user, profile, menu, setMenu, theme, toggleTheme, can, staff } = useApp();
  const path = usePathname(), router = useRouter(), [q, setQ] = useState('');
  const bal = useDocLive((fb) => (user && profile && profile.role !== 'admin' ? fb.doc(fb.db, 'balances', user.uid) : null), [user?.uid, profile?.role]);
  const on = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  const dot = (h: string) => !!(keyOf[h] && dots[keyOf[h]]);
  const account: Link3[] = user && profile ? accountLinks(profile).map(([h, t, i]) => [h, t, i] as Link3) : [];
  const groups: [string, Link3[]][] = staff && profile
    ? ADMIN.map(([g, L]) => [g, L.filter(([, , , p]) => (p === 'admin' ? profile.role === 'admin' : can(p))).map(([s, t, i]) => ['/admin/' + s, t, i] as Link3)] as [string, Link3[]]).filter(([, L]) => L.length > 0)
    : [];
  const all: Link3[] = [...BROWSE, ...account, ...groups.flatMap(([, L]) => L)];
  const found = q.trim() ? all.filter(([, t]) => t.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const signOut = async () => { const fb = getFb(); try { localStorage.signed = '0'; } catch {} await fb.signOut(fb.auth); setMenu(false); router.replace('/'); };
  const tile = ([h, t, i]: Link3, k: number) => (
    <Link key={h} href={h} className={'nd-tile' + (on(h) ? ' on' : '') + (dot(h) ? ' dot' : '')} style={{ ['--i' as any]: k }}><span className="nd-ic"><Icon n={i} /></span><span>{t}</span></Link>
  );
  const row = ([h, t, i]: Link3, k: number) => (
    <Link key={h} href={h} className={'nd-row' + (on(h) ? ' on' : '') + (dot(h) ? ' dot' : '')} style={{ ['--i' as any]: k }}><span className="nd-ic sm"><Icon n={i} /></span><span>{t}</span><Icon n="chevron" /></Link>
  );
  return (
    <>
      <div className={'scrim' + (menu ? ' open' : '')} onClick={() => setMenu(false)} />
      <aside className={'ndrawer' + (menu ? ' open' : '')} aria-label="Menu" aria-hidden={!menu}>
        <div className="nd-hero">
          <button className="nd-x" aria-label="Close menu" onClick={() => setMenu(false)}><Icon n="close" /></button>
          {user && profile ? (
            <>
              <Link href="/account/settings" className="nd-me"><Avatar u={profile} big /><span><b>{profile.name || 'Account'}</b><em>{profile.role === 'admin' ? 'Administrator' : profile.role}{profile.ruthId && profile.role !== 'admin' ? ' | ' + profile.ruthId : ''}</em></span></Link>
              <div className="nd-wallet">
                {profile.role === 'admin' ? <div><small>Signed in as</small><b>Administrator</b></div> : <div><small>{BRAND.wallet}</small><b>{naira(bal.data?.amount || 0)}</b></div>}
                <Link href={profile.role === 'admin' ? '/account' : '/account/wallet?do=add'} className="btn sm">{profile.role === 'admin' ? 'Overview' : 'Add money'}</Link>
              </div>
            </>
          ) : (
            <div className="nd-guest"><b>Welcome to {BRAND.short}</b><p>Sign in for your wallet, orders and chat.</p><div className="row"><Link className="btn sm" href="/login">Sign in</Link><Link className="btn sm" href="/login?mode=up">Create account</Link></div></div>
          )}
        </div>
        <label className="nd-search"><Icon n="search" /><input placeholder="Search the menu" aria-label="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <nav className="nd-body">
          {q.trim() ? (found.length ? found.map(row) : <p className="mut" style={{ padding: '1rem' }}>Nothing matches &ldquo;{q}&rdquo;.</p>) : (
            <>
              <h4>Explore</h4>
              <div className="nd-tiles">{BROWSE.map(tile)}</div>
              {account.length > 0 && <><h4>My account</h4>{account.map(row)}</>}
              {groups.map(([g, L]) => (
                <details className="nd-group" key={g} open={L.some(([h]) => on(h)) || undefined}>
                  <summary>{g}<span className="nd-count">{L.length}</span><Icon n="chevron" /></summary>
                  {L.map(row)}
                </details>
              ))}
            </>
          )}
        </nav>
        <div className="nd-foot">
          <div className="seg" role="group" aria-label="Theme">
            <button className={theme === 'light' ? 'on' : ''} onClick={() => theme !== 'light' && toggleTheme()}><Icon n="sun" />Light</button>
            <button className={theme === 'dark' ? 'on' : ''} onClick={() => theme !== 'dark' && toggleTheme()}><Icon n="moon" />Dark</button>
          </div>
          <div className="row"><a className="btn alt sm" href={waLink('Hello Bamyon')} target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="btn alt sm" href={`mailto:${BRAND.email}`}>Email</a>{user && <button className="alt sm nd-out" onClick={signOut}><Icon n="logout" />Sign out</button>}</div>
        </div>
      </aside>
    </>
  );
}
