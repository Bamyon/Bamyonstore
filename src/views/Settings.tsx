'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { getFb } from '@/lib/firebase';
import { call } from '@/lib/api';
import { fd } from '@/components/ui';
import ImageUpload from '@/components/ImageUpload';

export default function Settings() {
  const { user, profile, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const save = async (e: any) => {
    const { v } = fd(e), fb = getFb();
    setBusy(true);
    try {
      const upd: any = { name: v.nm.trim(), phone: v.ph.trim() };
      await fb.updateDoc(fb.doc(fb.db, 'users', user.uid), upd);
      if (profile.ruthId) fb.updateDoc(fb.doc(fb.db, 'ruthIds', profile.ruthId), { name: upd.name }).catch(() => {});
      toast('Saved.');
    } catch { toast('Could not save. Check your connection.'); }
    setBusy(false);
  };
  const savePhoto = async (url: string) => {
    const fb = getFb();
    try { await fb.updateDoc(fb.doc(fb.db, 'users', user.uid), { photo: url }); toast(url ? 'Photo updated.' : 'Photo removed.'); }
    catch { throw new Error('The picture uploaded but could not be saved to your profile. Please publish the latest Firestore rules and try again.'); }
  };
  const pin = async (e: any) => {
    const { v, form } = fd(e);
    try { await call('setPin', { pin: v.np, oldPin: v.op }); form.reset(); toast('PIN saved.'); } catch (x: any) { toast(x.message || 'Could not save PIN.'); }
  };
  return (
    <div className="wrap" style={{ maxWidth: '40rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Settings</h1>
      <form className="ord" onSubmit={save}>
        <h3>Your profile</h3>
        <ImageUpload shape="circle" value={profile.photo} folder="profiles" label="Add photo" onChange={savePhoto} />
        <input name="nm" defaultValue={profile.name || ''} placeholder="Full name" required />
        <input name="ph" type="tel" defaultValue={profile.phone || ''} placeholder="WhatsApp number" />
        <button className="go" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
      </form>
      {profile.role !== 'admin' && (
        <form className="ord" onSubmit={pin}>
          <h3>Transaction PIN</h3><p className="mut">Your PIN confirms every payment, transfer and withdrawal.</p>
          <input name="op" type="password" inputMode="numeric" maxLength={4} placeholder="Current PIN (if you have one)" autoComplete="off" />
          <input name="np" type="password" inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN" required autoComplete="off" />
          <button className="alt">Save PIN</button>
        </form>
      )}
    </div>
  );
}
