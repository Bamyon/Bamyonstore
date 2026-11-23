import { getFb, CFG } from './firebase';
import { makeLocal } from './local';

let L: any;
// Same names as functions/index.js. Runs in the browser by default; set NEXT_PUBLIC_USE_FUNCTIONS=true to use Cloud Functions.
export async function call(name: string, data?: any): Promise<any> {
  const fb = getFb();
  if (CFG.useFunctions) {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    try {
      return (await httpsCallable(getFunctions(fb.app), name)(data)).data;
    } catch (e) {
      const down = e.code === 'functions/internal' && /^internal$/i.test(e.message || '');
      throw new Error(down ? 'The wallet service did not respond. Check your connection and try again.' : e.message || 'Something went wrong.');
    }
  }
  L = L || makeLocal(fb);
  if (!L[name]) throw new Error('Not available.');
  try {
    return await L[name](data);
  } catch (e) {
    if (e.code === 'permission-denied') throw new Error('Not allowed. Publish the latest Firestore rules in the Firebase console.');
    throw e;
  }
}

export async function touch(k: string): Promise<void> {
  const fb = getFb();
  try { await fb.setDoc(fb.doc(fb.db, 'settings', 'news'), { [k]: Date.now() }, { merge: true }); } catch {}
}

export async function makeProfile(u: any, { name, phone, ref }: { name: string; phone: string; ref?: string }): Promise<string | undefined> {
  const fb = getFb();
  for (let i = 0; i < 5; i++) {
    const id = String(1e9 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9e9));
    const b = fb.writeBatch(fb.db);
    b.set(fb.doc(fb.db, 'users', u.uid), { name, phone, role: 'customer', ruthId: id, ...(ref ? { ref } : {}), createdAt: fb.serverTimestamp() });
    b.set(fb.doc(fb.db, 'ruthIds', id), { uid: u.uid, name });
    try { await b.commit(); } catch (e) { if (i === 4) throw e; continue; }
    if (ref) { // remember who invited this person; never blocks sign-up
      try {
        const rs = await fb.getDoc(fb.doc(fb.db, 'ruthIds', ref));
        if (rs.exists() && rs.data().uid !== u.uid) await fb.setDoc(fb.doc(fb.db, 'referrals', u.uid), { referrerUid: rs.data().uid, name, status: 'PENDING', createdAt: fb.serverTimestamp() });
      } catch {}
    }
    return id;
  }
}

export function track(t: string, ref: any = ''): void {
  try {
    const fb = getFb();
    let vid = localStorage.vid;
    if (!vid) { vid = Math.random().toString(36).slice(2, 12); localStorage.vid = vid; }
    fb.addDoc(fb.collection(fb.db, 'events'), { t, ref: String(ref).slice(0, 100), vid, at: fb.serverTimestamp() }).catch(() => {});
  } catch {}
}
