'use client';
import { BRAND } from '@/config/brand';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFb } from '@/lib/firebase';
import { makeProfile, call } from '@/lib/api';
import { naira } from '@/lib/util';
import { useApp } from '@/components/Providers';

const ERR = { 'auth/invalid-credential': 'Wrong email or password.', 'auth/user-not-found': 'No account with that email.', 'auth/wrong-password': 'Wrong email or password.', 'auth/email-already-in-use': 'That email already has an account.', 'auth/weak-password': 'Use a password of at least 6 characters.', 'auth/too-many-requests': 'Too many tries. Please wait a moment.' };

export default function Login() {
  const router = useRouter(), { user, ready, toast } = useApp();
  const [mode, setMode] = useState('in'), [busy, setBusy] = useState(false), [next, setNext] = useState('/account'), [ref, setRef] = useState('');
  useEffect(() => { const q = new URLSearchParams(location.search); setNext(q.get('next') || '/account'); setRef(q.get('ref') || ''); if (q.get('mode') === 'up') setMode('up'); }, []);
  useEffect(() => { if (ready && user) router.replace(next); }, [ready, user, next, router]);

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget, v = Object.fromEntries(new FormData(form)) as Record<string, any>, fb = getFb();
    setBusy(true);
    try {
      if (mode === 'forgot') { await fb.sendPasswordResetEmail(fb.auth, v.email.trim()); toast('Reset link sent. Check your email.'); setMode('in'); }
      else if (mode === 'in') await fb.signInWithEmailAndPassword(fb.auth, v.email.trim(), v.password);
      else {
        if (v.phone.replace(/\D/g, '').length < 10) throw Object.assign(new Error('Enter a valid phone number.'), { code: 'x' });
        const c = await fb.createUserWithEmailAndPassword(fb.auth, v.email.trim(), v.password);
        const rf = (v.ref || '').trim().toUpperCase(), isId = /^\d{10}$/.test(rf);
        await makeProfile(c.user, { name: v.name.trim(), phone: v.phone.trim(), ref: isId ? rf : '' });
        if (rf && !isId) { try { const r = await call('claimReward', { code: rf }); toast(`Welcome! ${naira(r.amount)} was added to your wallet.`); } catch (x: any) { toast('Account created. ' + (x.message || 'That code could not be used.')); } }
      }
    } catch (x) { toast(ERR[x.code] || x.message || 'Something went wrong.'); }
    setBusy(false);
  };
  return (
    <div className="auth2" style={{ minHeight: '80vh' }}>
      <div className="art">
        <Link className="brandrow" href="/"><img src={BRAND.logo} alt="" width="40" height="40" /><span><b>{BRAND.nameA}<span>{BRAND.nameB}</span></b><small>Store</small></span></Link>
        <div><h1>Welcome to {BRAND.short}.</h1><p className="mut">Track orders, pay from your wallet and reorder in a tap.</p></div>
      </div>
      <form className="glass" onSubmit={submit}>
        <h2>{mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Reset password'}</h2>
        {mode === 'up' && <><input name="name" placeholder="Full name" required autoComplete="name" /><input name="phone" type="tel" placeholder="Phone number" required autoComplete="tel" /></>}
        <input name="email" type="email" placeholder="Email" required autoComplete="email" />
        {mode !== 'forgot' && <input name="password" type="password" placeholder="Password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />}
        {mode === 'up' && <input name="ref" placeholder="Referral or reward code (optional)" defaultValue={ref} maxLength={30} autoCapitalize="characters" />}
        <button className="go" disabled={busy}>{busy ? 'Please wait...' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}</button>
        <p className="mut">
          {mode === 'in' && <><button type="button" className="lnk" onClick={() => setMode('up')}>Create an account</button> | <button type="button" className="lnk" onClick={() => setMode('forgot')}>Forgot password?</button></>}
          {mode !== 'in' && <button type="button" className="lnk" onClick={() => setMode('in')}>Back to sign in</button>}
        </p>
      </form>
    </div>
  );
}
