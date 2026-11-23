'use client';
import { useEffect, useRef, useState } from 'react';
import { getFb } from '@/lib/firebase';
import { useLive, useDocLive } from '@/lib/hooks';
import { label } from '@/lib/orders';
import { naira, when } from '@/lib/util';
import { useApp } from './Providers';
import { Sheet, Pill } from './ui';

// Order details: timeline, live rider map, and a chat between customer, rider and staff.
export default function OrderSheet({ o, onClose }: { o: any; onClose: () => void }) {
  const { user, can, toast } = useApp();
  const asRider = o.riderId === user.uid, asCustomer = o.uid === user.uid;
  const role = asRider ? 'rider' : asCustomer ? 'customer' : 'staff';
  const ev = useLive((fb) => fb.query(fb.collection(fb.db, 'orders', o.id, 'events'), fb.orderBy('at', 'asc')), [o.id]);
  const msgs = useLive((fb) => fb.query(fb.collection(fb.db, 'orders', o.id, 'chat'), fb.orderBy('at', 'asc'), fb.limit(100)), [o.id]);
  const loc = useDocLive((fb) => fb.doc(fb.db, 'live', o.id), [o.id]);
  const [text, setText] = useState(''), [sharing, setSharing] = useState(false), box = useRef<HTMLDivElement>(null), last = useRef(0);
  const canChat = role !== 'staff' || can('support.reply');
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.docs.length]);
  useEffect(() => { // rider shares position while this sheet is open
    if (!sharing || !navigator.geolocation) return;
    const fb = getFb();
    const id = navigator.geolocation.watchPosition((p) => {
      if (Date.now() - last.current < 8000) return;
      last.current = Date.now();
      fb.setDoc(fb.doc(fb.db, 'live', o.id), { lat: p.coords.latitude, lng: p.coords.longitude, by: user.uid, at: fb.serverTimestamp() }).catch(() => {});
    }, () => { toast('Location permission denied.'); setSharing(false); }, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line
  }, [sharing]);
  const send = async (e: any) => {
    e.preventDefault();
    const t = text.trim(); if (!t) return;
    setText('');
    const fb = getFb();
    try { await fb.addDoc(fb.collection(fb.db, 'orders', o.id, 'chat'), { from: user.uid, role, text: t, at: fb.serverTimestamp() }); } catch { toast('Not sent.'); }
  };
  const pos = loc.data;
  return (
    <Sheet title={`Order #${o.code || o.id.slice(0, 6)}`} onClose={onClose}>
      <div className="row"><Pill>{label(o.status)}</Pill><b style={{ marginLeft: 'auto' }}>{naira(o.total)}</b></div>
      <div className="mut">{(o.items || []).map((i: any) => `${i.qty} x ${i.name}`).join(', ')}</div>
      {o.contact && <div className="mut">{o.contact.name} | {o.contact.phone}<br />{o.contact.addr}</div>}
      {pos && <div className="mapbox"><iframe title="Rider location" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${pos.lng - 0.012}%2C${pos.lat - 0.007}%2C${pos.lng + 0.012}%2C${pos.lat + 0.007}&layer=mapnik&marker=${pos.lat}%2C${pos.lng}`} />
        <a className="btn alt" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`}>Open in Maps</a></div>}
      {asRider && o.status === 'OUT_FOR_DELIVERY' && <button className={sharing ? 'go' : 'alt'} onClick={() => setSharing(!sharing)}>{sharing ? 'Sharing live location (tap to stop)' : 'Share my live location'}</button>}
      {o.contact?.geo && !asCustomer && <a className="btn alt" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${o.contact.geo[0]},${o.contact.geo[1]}`}>Customer location</a>}
      <h4>Timeline</h4>
      {ev.docs.map((e) => <div className="line" key={e.id}><span>{label(e.to)}</span><span className="mut">{when(e.at)}</span></div>)}
      {canChat && <>
        <h4>Order chat</h4>
        <div className="chatbox" ref={box}>{msgs.docs.length ? msgs.docs.map((m) => <div key={m.id} className={'bub' + (m.from === user.uid ? ' me' : '')}>{m.text}</div>) : <p className="mut">No messages yet.</p>}</div>
        <form className="chatf" onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" maxLength={500} autoComplete="off" /><button className="go" aria-label="Send">Send</button></form>
      </>}
    </Sheet>
  );
}
