'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive, useDocLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { call } from '@/lib/api';
import Icon from '@/components/Icon';
import ClaimCode from '@/components/ClaimCode';
import { Pill } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { naira } from '@/lib/util';

// Invite friends with your code. When a friend's first order is delivered, both of you can claim the bonus the admin has set.
export default function Referrals() {
  const { user, profile, pub, toast } = useApp();
  const bonus = Math.round(+pub?.refBonus || 0);
  const mine = useLive((fb) => fb.query(fb.collection(fb.db, 'referrals'), fb.where('referrerUid', '==', user.uid), fb.limit(100)), [user.uid]);
  const self = useDocLive((fb) => fb.doc(fb.db, 'referrals', user.uid), [user.uid]);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({}), [busy, setBusy] = useState('');
  const ids = [...mine.docs.map((d) => d.id), ...(self.data ? [user.uid] : [])].join(',');
  const refresh = useCallback(async () => {
    const fb = getFb(), out: Record<string, boolean> = {};
    await Promise.all(ids.split(',').filter(Boolean).map(async (id) => { try { out[id] = (await fb.getDoc(fb.doc(fb.db, 'referrals', id, 'claims', user.uid))).exists(); } catch { out[id] = false; } }));
    setClaimed(out);
  }, [ids, user.uid]);
  useEffect(() => { refresh(); }, [refresh]);
  const claim = async (id: string) => {
    setBusy(id);
    try { const r = await call('claimReferral', { id }); toast(`${naira(r.amount)} added to your wallet.`); await refresh(); } catch (e: any) { toast(e.message || 'Could not claim.'); }
    setBusy('');
  };
  const link = typeof window === 'undefined' ? '' : `${location.origin}/login?mode=up&ref=${profile.ruthId}`;
  const text = `Join me on ${BRAND.name}. Use my code ${profile.ruthId} when you sign up: ${link}`;
  const ready = mine.docs.filter((d) => d.status === 'READY' && !claimed[d.id]).length + (self.data?.status === 'READY' && !claimed[user.uid] ? 1 : 0);
  const state = (r: any, id: string) => (claimed[id] ? 'claimed' : r.status === 'READY' ? 'ready to claim' : 'waiting for the first order');
  return (
    <div className="wrap" style={{ maxWidth: '44rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Rewards</h1>
      <section className="acct">
        <span className="sub">Your referral code</span>
        <div className="bal" style={{ letterSpacing: '.04em' }}>{profile.ruthId || '...'}</div>
        <p className="sub">{bonus > 0 ? `You and your friend each earn ${naira(bonus)} once their first order is delivered.` : 'Share your code with friends. Bonuses appear here when the store turns them on.'}</p>
        <div className="row">
          <button className="alt" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }} onClick={() => navigator.clipboard?.writeText(profile.ruthId || '').then(() => toast('Code copied'))}><Icon n="copy" />Copy code</button>
          <a className="btn go" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}><Icon n="send" />Share on WhatsApp</a>
        </div>
      </section>
      <div className="info"><div><small>Friends joined</small><b>{mine.docs.length}</b></div><div><small>Ready to claim</small><b>{ready}</b></div><div><small>Bonus each</small><b>{bonus > 0 ? naira(bonus) : '-'}</b></div></div>

      {self.data && (
        <div className="ord"><div className="row"><b>Your welcome bonus</b><Pill>{state(self.data, user.uid)}</Pill></div>
          <p className="mut">You joined with a friend&apos;s code. Your bonus unlocks after your first delivered order.</p>
          {self.data.status === 'READY' && !claimed[user.uid] && <button className="go" disabled={busy === user.uid} onClick={() => claim(user.uid)}>Claim {bonus > 0 ? naira(bonus) : 'bonus'}</button>}</div>
      )}

      <h3 className="sec">Friends you invited</h3>
      {mine.docs.length ? mine.docs.map((r) => (
        <div className="ord" key={r.id}>
          <div className="row"><b>{r.name || 'A friend'}</b><Pill>{state(r, r.id)}</Pill></div>
          {r.status === 'READY' && !claimed[r.id] && <button className="go" disabled={busy === r.id} onClick={() => claim(r.id)}>{busy === r.id ? 'Claiming...' : `Claim ${bonus > 0 ? naira(bonus) : 'bonus'}`}</button>}
        </div>
      )) : <p className="mut">No one has joined with your code yet. Share it and watch this space.</p>}

      <h3 className="sec">Reward codes</h3>
      <ClaimCode />
    </div>
  );
}
