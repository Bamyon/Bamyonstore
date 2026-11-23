import { getFb, CFG } from './firebase';
import { call } from './api';

// Order lifecycle. Mirrors the Firestore security rules (step()).
export const NEXT: Record<string, string[]> = {
  PLACED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PACKING', 'CANCELLED'],
  PACKING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_EXCEPTION'],
};
export const STEPS = ['PLACED', 'APPROVED', 'PACKING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
export const label = (s: string) => (s || '').replaceAll('_', ' ').toLowerCase();

/** Moves an order to a new status, keeps stock in sync, and triggers refunds and referral bonuses in browser mode. */
export async function advance(o: any, to: string, uid: string, canStock: boolean): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db), r = fb.doc(fb.db, 'orders', o.id);
  b.update(r, { status: to, updatedAt: fb.serverTimestamp() });
  b.set(fb.doc(fb.collection(r, 'events')), { from: o.status, to, by: uid, at: fb.serverTimestamp() });
  const k = to === 'APPROVED' ? 1 : to === 'CANCELLED' && ['APPROVED', 'PACKING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status) ? -1 : 0;
  if (k && canStock) {
    for (const i of o.items || []) {
      const ps = await fb.getDoc(fb.doc(fb.db, 'products', i.id)), p = ps.data();
      if (!p) continue;
      const u: any = { sold: Math.max(0, (p.sold || 0) + k * i.qty) };
      if (typeof p.qty === 'number') u.qty = Math.max(0, p.qty - k * i.qty);
      b.update(ps.ref, u);
    }
  }
  await b.commit();
  if (!CFG.useFunctions) {
    if (['CANCELLED', 'REJECTED'].includes(to) && o.pay === 'CONFIRMED' && o.paidByUid && !o.refunded) call('refundOrder', { id: o.id }).catch(() => {});
  }
  if (to === 'DELIVERED' && o.uid) unlockReferral(o.uid);
}

/** A customer's first delivered order unlocks the referral bonus for them and for the friend who invited them. */
async function unlockReferral(uid: string): Promise<void> {
  const fb = getFb();
  try {
    const r = fb.doc(fb.db, 'referrals', uid), s = await fb.getDoc(r);
    if (s.exists() && s.data().status === 'PENDING') await fb.updateDoc(r, { status: 'READY', readyAt: fb.serverTimestamp() });
  } catch { /* the referral is optional; never block an order */ }
}
