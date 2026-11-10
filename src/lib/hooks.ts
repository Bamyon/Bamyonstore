'use client';
import { useEffect, useState } from 'react';
import { getFb } from './firebase';

// Realtime list. make(fb) returns a Firestore query (or null to skip).
export function useLive(make: (fb: any) => any, deps: any[] = []): { docs: any[]; loading: boolean } {
  const [s, set] = useState<{ docs: any[]; loading: boolean }>({ docs: [], loading: true });
  useEffect(() => {
    const fb = getFb();
    let q = null;
    try { q = make(fb); } catch { q = null; }
    if (!q) { set({ docs: [], loading: false }); return; }
    set((x) => ({ ...x, loading: true }));
    return fb.onSnapshot(q, (sn) => set({ docs: sn.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })), loading: false }), () => set({ docs: [], loading: false }));
    // eslint-disable-next-line
  }, deps);
  return s;
}
// Realtime single document. make(fb) returns a document reference (or null).
export function useDocLive(make: (fb: any) => any, deps: any[] = []): { data: any; loading: boolean } {
  const [s, set] = useState<{ data: any; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    const fb = getFb();
    let r = null;
    try { r = make(fb); } catch { r = null; }
    if (!r) { set({ data: null, loading: false }); return; }
    return fb.onSnapshot(r, (d) => set({ data: d.exists() ? { id: d.id, ...d.data() } : null, loading: false }), () => set({ data: null, loading: false }));
    // eslint-disable-next-line
  }, deps);
  return s;
}
