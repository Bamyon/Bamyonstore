'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFb } from '@/lib/firebase';
import { Loading, Empty } from '@/components/ui';

export default function ReviewsPage() {
  const [L, setL] = useState<any[] | null>(null);
  useEffect(() => { const fb = getFb(); fb.getDocs(fb.query(fb.collection(fb.db, 'reviews'), fb.where('status', '==', 'PUBLISHED'), fb.limit(60))).then((s) => setL(s.docs.map((d) => d.data()))).catch(() => setL([])); }, []);
  return (
    <div className="wrap">
      <h1 style={{ fontSize: '2rem' }}>Customer reviews</h1>
      <p className="mut" style={{ margin: '.4rem 0 1rem' }}>From customers who received their order. Open any product in the shop to leave yours once it is delivered.</p>
      {L === null ? <Loading /> : !L.length ? <Empty>No reviews yet.</Empty> : <div className="grid">{L.map((r, i) => <div className="card" key={i}><b>{r.pname}</b><div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div><p>{r.text}</p><p className="mut">{r.name} | Verified buyer</p></div>)}</div>}
      <p style={{ marginTop: '1.5rem' }}><Link className="btn go" href="/shop">Go to the shop</Link></p>
    </div>
  );
}
