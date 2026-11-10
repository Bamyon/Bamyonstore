'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFb } from '@/lib/firebase';
import { useApp } from './Providers';
import { Pill } from './ui';

export default function Reviews({ pid, pname }: { pid: string; pname: string }) {
  const { user, profile, toast, ready } = useApp();
  const [list, setList] = useState<any[] | null>(null), [state, setState] = useState('loading'), [order, setOrder] = useState<string | null>(null), [rt, setRt] = useState(5), [tx, setTx] = useState('');
  useEffect(() => {
    const fb = getFb();
    fb.getDocs(fb.query(fb.collection(fb.db, 'reviews'), fb.where('pid', '==', pid), fb.where('status', '==', 'PUBLISHED'), fb.limit(30)))
      .then((s) => setList(s.docs.map((d) => d.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))).catch(() => setList([]));
  }, [pid]);
  useEffect(() => {
    if (!ready) return;
    if (!user) return setState('guest');
    const fb = getFb();
    Promise.all([fb.getDocs(fb.query(fb.collection(fb.db, 'orders'), fb.where('uid', '==', user.uid), fb.where('status', '==', 'DELIVERED'))), fb.getDoc(fb.doc(fb.db, 'reviews', user.uid + '_' + pid))])
      .then(([os, ex]) => {
        if (ex.exists()) return setState(ex.data().status === 'PUBLISHED' ? 'live' : 'pending');
        const o = os.docs.find((d) => (d.data().items || []).some((i) => i.id === pid));
        if (!o) return setState('none');
        setOrder(o.id); setState('form');
      }).catch(() => setState('none'));
  }, [user, ready, pid]);
  const send = async () => {
    if (!tx.trim()) return toast('Write a few words first.');
    const fb = getFb();
    try {
      await fb.setDoc(fb.doc(fb.db, 'reviews', user.uid + '_' + pid), { pid, pname, oid: order, uid: user.uid, name: profile?.name || 'Customer', rating: rt, text: tx.trim(), status: 'PENDING', createdAt: fb.serverTimestamp() });
      setState('pending');
    } catch { toast('Could not send your review.'); }
  };
  return (
    <section>
      <h3 style={{ margin: '2rem 0 .5rem' }}>Customer reviews</h3>
      {state === 'guest' && <p className="mut">Sign in to review products you have received. <Link className="btn alt" href="/login">Sign in</Link></p>}
      {state === 'none' && <p className="mut">Only customers who received this product can review it.</p>}
      {state === 'pending' && <p className="mut">Thanks, your review is awaiting approval.</p>}
      {state === 'live' && <p className="mut">Thanks, your review is live.</p>}
      {state === 'form' && (
        <div className="ord"><b>Rate this product</b>
          <div className="starpick">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" className={i <= rt ? 'on' : ''} aria-label={i + ' stars'} onClick={() => setRt(i)}>★</button>)}</div>
          <textarea rows={3} maxLength={1000} placeholder="How was it? Quality, freshness, delivery..." value={tx} onChange={(e) => setTx(e.target.value)} />
          <button className="go" onClick={send}>Submit review</button></div>
      )}
      {list === null ? <p className="mut">Loading reviews...</p> : list.length === 0 ? <p className="mut">No reviews yet.</p>
        : list.map((r, i) => <div className="rv" key={i}><div><span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> <b>{r.name || 'Customer'}</b> <Pill>Verified buyer</Pill></div><p>{r.text}</p></div>)}
    </section>
  );
}
