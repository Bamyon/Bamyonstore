'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFb } from '@/lib/firebase';
import { useApp } from '@/components/Providers';
import { fd } from '@/components/ui';
import { BRAND } from '@/config/brand';

// One-time page that creates the first administrator. It locks itself as soon as the first admin exists.
export default function Setup() {
  const { toast } = useApp();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'open' | 'done'>('loading'), [busy, setBusy] = useState(false);
  useEffect(() => { const fb = getFb(); fb.getDoc(fb.doc(fb.db, 'settings', 'setup')).then((d: any) => setState(d.exists() ? 'done' : 'open')).catch(() => setState('open')); }, []);
  const create = async (e: any) => {
    const { v } = fd(e), fb = getFb();
    setBusy(true);
    try {
      const c = await fb.createUserWithEmailAndPassword(fb.auth, v.em.trim(), v.pw), uid = c.user.uid;
      let ok = false;
      for (let i = 0; i < 5 && !ok; i++) {
        const id = String(1e9 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9e9)), b = fb.writeBatch(fb.db);
        b.set(fb.doc(fb.db, 'users', uid), { name: v.nm.trim(), phone: v.ph.trim(), role: 'admin', ruthId: id, createdAt: fb.serverTimestamp() });
        b.set(fb.doc(fb.db, 'ruthIds', id), { uid, name: v.nm.trim() });
        b.set(fb.doc(fb.db, 'settings', 'setup'), { adminUid: uid, at: fb.serverTimestamp() });
        try { await b.commit(); ok = true; } catch (x) { if (i === 4) throw x; }
      }
      toast('Welcome. Your admin account is ready.'); router.replace('/account');
    } catch (x: any) { toast(x.code === 'auth/email-already-in-use' ? 'That email already has an account. Use a different one.' : x.code === 'auth/weak-password' ? 'Use a password of at least 6 characters.' : 'Setup failed. Check that the Firestore rules are published.'); }
    setBusy(false);
  };
  return (
    <div className="auth2" style={{ minHeight: '80vh' }}>
      <div className="art"><span className="brandrow"><img src={BRAND.logo} alt="" width="40" height="40" /><span><b>{BRAND.nameA}<span>{BRAND.nameB}</span></b><small>Store</small></span></span>
        <div><h1>Set up your store.</h1><p className="mut">Create the administrator account. This page locks itself once the first admin exists.</p></div></div>
      {state === 'loading' ? <p className="mut empty">Loading...</p> : state === 'done' ? (
        <div className="glass" style={{ alignSelf: 'center', justifySelf: 'center', padding: '2rem', borderRadius: '1.8rem', margin: '5vh 0' }}><h2>Setup is complete</h2><p className="mut" style={{ margin: '.6rem 0 1rem' }}>An administrator already exists for this store.</p><Link className="btn go" href="/login">Sign in</Link></div>
      ) : (
        <form className="glass" onSubmit={create}>
          <h2>Create administrator</h2>
          <input name="nm" placeholder="Your full name" required /><input name="ph" type="tel" placeholder="Phone number" required minLength={10} />
          <input name="em" type="email" placeholder="Email" required autoComplete="email" /><input name="pw" type="password" placeholder="Password (min 6)" required minLength={6} autoComplete="new-password" />
          <button className="go" disabled={busy}>{busy ? 'Creating...' : 'Create admin account'}</button>
        </form>
      )}
    </div>
  );
}
