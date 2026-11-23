'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { useLive, useDocLive } from '@/lib/hooks';
import { getFb, CFG } from '@/lib/firebase';
import { call } from '@/lib/api';
import Icon from '@/components/Icon';
import { Avatar, Pill, Empty, Loading, Sheet, fd } from '@/components/ui';
import { naira } from '@/lib/util';

const PERMS: [string, string][] = [
  ['orders.view', 'See orders'], ['orders.update_status', 'Update order status'], ['orders.assign_rider', 'Assign riders'], ['payments.verify', 'Verify payments'],
  ['products.view', 'See products'], ['products.create', 'Add products'], ['products.edit', 'Edit products'], ['products.change_price', 'Change prices'],
  ['zones.manage', 'Manage delivery zones'], ['promotions.manage', 'Manage promotions'], ['reviews.moderate', 'Moderate reviews'], ['blog.manage', 'Write blog posts'], ['blog.moderate', 'Moderate comments'],
  ['careers.manage', 'Manage jobs'], ['careers.view_applications', 'See applications'], ['careers.update_application_status', 'Update applications'], ['support.reply', 'Reply to chats'],
  ['users.view', 'See people'], ['customers.view', 'See customers'], ['customers.manage', 'Manage customers'], ['customers.wallet', 'Adjust wallets'],
  ['wallet.credit', 'Credit wallets (cashier)'], ['wallet.monitor', 'See transactions'], ['settings.manage', 'Store settings'], ['analytics.view', 'See reports'], ['full', 'Full access'],
];
const PRESETS: Record<string, string[]> = {
  Cashier: ['wallet.credit', 'customers.view', 'users.view'],
  'Order desk': ['orders.view', 'orders.update_status', 'orders.assign_rider', 'payments.verify', 'support.reply'],
  Inventory: ['products.view', 'products.create', 'products.edit', 'zones.manage'],
  Content: ['blog.manage', 'blog.moderate', 'reviews.moderate', 'careers.manage', 'careers.view_applications'],
};

function Perms({ u, onClose }: { u: any; onClose: () => void }) {
  const { toast } = useApp();
  const [p, setP] = useState<Record<string, boolean>>({ ...(u.perms || {}) });
  const save = async () => { const fb = getFb(); try { await fb.updateDoc(u.ref, { perms: p }); toast('Permissions saved.'); onClose(); } catch { toast('Not allowed.'); } };
  return (
    <Sheet title={'Permissions: ' + (u.name || 'staff')} onClose={onClose}>
      <div className="row">{Object.entries(PRESETS).map(([n, L]) => <button key={n} className="alt" onClick={() => setP(Object.fromEntries(L.map((k) => [k, true])))}>{n}</button>)}</div>
      {PERMS.map(([k, t]) => <label key={k} className="line"><span>{t}</span><input type="checkbox" style={{ width: 'auto' }} checked={!!p[k]} onChange={(e) => setP({ ...p, [k]: e.target.checked })} /></label>)}
      <button className="go" onClick={save}>Save permissions</button>
    </Sheet>
  );
}

function Allocation({ u, onClose }: { u: any; onClose: () => void }) {
  const { toast } = useApp();
  const al = useDocLive((fb) => fb.doc(fb.db, 'allocations', u.id), [u.id]);
  return (
    <Sheet title={'Credit allocation: ' + (u.name || 'staff')} onClose={onClose}>
      <p className="mut">Remaining: <b>{naira(al.data?.remaining || 0)}</b>. A cashier can only credit customers up to this amount.</p>
      <form className="f" onSubmit={async (e) => { const { v } = fd(e); try { await call('setAllocation', { uid: u.id, amount: +v.am }); toast('Allocation updated.'); } catch (x: any) { toast(x.message); } }}>
        <input name="am" type="number" placeholder="Amount to add (use a negative number to remove)" required /><button className="go">Update allocation</button></form>
    </Sheet>
  );
}

function Adjust({ u, onClose }: { u: any; onClose: () => void }) {
  const { toast } = useApp();
  return (
    <Sheet title={'Adjust wallet: ' + (u.name || 'customer')} onClose={onClose}>
      <form className="f" onSubmit={async (e) => { const { v } = fd(e); try { await call('adjust', { uid: u.id, amount: +v.am, reason: v.rs }); toast('Wallet adjusted.'); onClose(); } catch (x: any) { toast(x.message); } }}>
        <input name="am" type="number" placeholder="Amount (negative removes money)" required /><input name="rs" placeholder="Reason (shown in their history)" required maxLength={200} /><button className="go">Apply</button></form>
    </Sheet>
  );
}

function Register({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false), [made, setMade] = useState<any>(null);
  const create = async (e: any) => {
    const { v } = fd(e);
    setBusy(true);
    try {
      const fb = getFb(), app2 = fb.initApp(CFG.firebase, 'reg' + Date.now()), a2 = fb.getAuth(app2), db2 = fb.getFirestore(app2);
      const cr = await fb.createUserWithEmailAndPassword(a2, v.em.trim(), v.pw), u2 = cr.user.uid;
      let ok = false;
      for (let i = 0; i < 5 && !ok; i++) {
        const id = String(1e9 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9e9)), bt = fb.writeBatch(db2);
        bt.set(fb.doc(db2, 'users', u2), { name: v.nm.trim(), phone: v.ph.trim(), role: 'customer', ruthId: id, createdAt: fb.serverTimestamp() });
        bt.set(fb.doc(db2, 'ruthIds', id), { uid: u2, name: v.nm.trim() });
        try { await bt.commit(); ok = true; } catch (x) { if (i === 4) throw x; }
      }
      await fb.updateDoc(fb.doc(fb.db, 'users', u2), { role: v.rl });
      await fb.signOut(a2);
      setMade({ em: v.em.trim(), pw: v.pw, nm: v.nm.trim(), rl: v.rl });
    } catch (x: any) { toast(x.code === 'auth/email-already-in-use' ? 'That email already has an account.' : x.code === 'auth/weak-password' ? 'Use a password of at least 6 characters.' : 'Could not create the account.'); }
    setBusy(false);
  };
  if (made) return (
    <Sheet title="Account created" onClose={onClose}>
      <p>Give {made.nm} these sign-in details:</p><div className="ord"><div>Email: {made.em}</div><div>Password: {made.pw}</div></div>
      <p className="mut">{made.rl === 'staff' ? 'Staff can also take deliveries. Set what they can do with Permissions.' : 'Riders see their assigned deliveries and share live location.'}</p>
    </Sheet>
  );
  return (
    <Sheet title="Register staff or rider" onClose={onClose}>
      <form className="f" onSubmit={create}>
        <input name="nm" placeholder="Full name" required /><input name="ph" type="tel" placeholder="Phone number" required minLength={10} /><input name="em" type="email" placeholder="Email" required />
        <input name="pw" placeholder="Temporary password (min 6)" minLength={6} required /><select name="rl"><option value="rider">Rider</option><option value="staff">Staff (can also deliver)</option></select>
        <button className="go" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button></form>
    </Sheet>
  );
}

export default function People() {
  const { user, profile, can, toast } = useApp();
  const adm = profile.role === 'admin', router = useRouter();
  const [q, setQ] = useState(''), [sheet, setSheet] = useState<{ k: string; u?: any } | null>(null);
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'users'), fb.limit(300)), []);
  const L = docs.filter((u) => `${u.name} ${u.phone} ${u.ruthId} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  const upd = async (u: any, d: any) => { const fb = getFb(); try { await fb.updateDoc(u.ref, d); } catch { toast('Not allowed.'); } };
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ fontSize: '2rem' }}>People</h1>{adm && <button className="go" onClick={() => setSheet({ k: 'reg' })}><Icon n="plus" />Register staff or rider</button>}</div>
      <input placeholder="Search name, phone, Bamyon ID or role" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: '.8rem 0' }} />
      {loading ? <Loading /> : !L.length ? <Empty>No one matches.</Empty> : L.map((u) => (
        <div className="ord" key={u.id}>
          <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar u={u} /><div style={{ flex: 1, minWidth: 0 }}><b>{u.name || 'Unnamed'}</b><div className="mut">{u.phone} | Bamyon ID {u.ruthId}</div></div><Pill>{u.role}</Pill></div>
          {u.disabled && <Pill>suspended</Pill>}
          <div className="row">
            {can('support.reply') && u.id !== user.uid && <button className="alt" onClick={() => router.push('/account/chat?with=' + u.id + '&name=' + encodeURIComponent(u.name || 'Customer'))}>Message</button>}
            {adm && u.id !== user.uid && <select value={u.role} aria-label="Role" style={{ width: 'auto' }} onChange={(e) => upd(u, { role: e.target.value })}>{['customer', 'partner', 'rider', 'staff', 'admin'].map((r) => <option key={r}>{r}</option>)}</select>}
            {adm && u.role === 'staff' && <button className="alt" onClick={() => setSheet({ k: 'perms', u })}>Permissions</button>}
            {adm && u.role === 'staff' && <button className="alt" onClick={() => setSheet({ k: 'alloc', u })}>Allocation</button>}
            {can('customers.wallet') && <button className="alt" onClick={() => setSheet({ k: 'adj', u })}>Adjust wallet</button>}
            {adm && u.id !== user.uid && <button className="alt" onClick={() => upd(u, { disabled: !u.disabled })}>{u.disabled ? 'Restore' : 'Suspend'}</button>}
          </div>
        </div>
      ))}
      {sheet?.k === 'reg' && <Register onClose={() => setSheet(null)} />}
      {sheet?.k === 'perms' && <Perms u={sheet.u} onClose={() => setSheet(null)} />}
      {sheet?.k === 'alloc' && <Allocation u={sheet.u} onClose={() => setSheet(null)} />}
      {sheet?.k === 'adj' && <Adjust u={sheet.u} onClose={() => setSheet(null)} />}
    </>
  );
}

export function Partners() {
  const { toast } = useApp();
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'partners'), fb.limit(100)), []);
  const decide = async (p: any, status: string) => {
    const fb = getFb();
    try {
      await fb.updateDoc(p.ref, { status });
      if (status === 'APPROVED') await fb.updateDoc(fb.doc(fb.db, 'users', p.id), { role: 'partner' });
      toast('Updated.');
    } catch { toast('Not allowed.'); }
  };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Partners</h1>
      {loading ? <Loading /> : !docs.length ? <Empty>No applications yet.</Empty> : docs.map((p) => (
        <div className="ord" key={p.id}><div className="row"><b>{p.business}</b><Pill>{String(p.status).toLowerCase()}</Pill></div><div className="mut">{p.name} | {p.phone}</div><p>{p.about}</p>
          <div className="row"><button className="go" onClick={() => decide(p, 'APPROVED')}>Approve</button><button className="alt" onClick={() => decide(p, 'REJECTED')}>Reject</button></div></div>
      ))}
    </>
  );
}
