'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import Icon from '@/components/Icon';
import { Empty } from '@/components/ui';
import { ago, cl, isImageUrl, uploadImg, when } from '@/lib/util';

function Bubble({ m, mine }: { m: any; mine: boolean }) {
  const pic = isImageUrl(m.text);
  return (
    <div className={'bub' + (mine ? ' me' : '') + (pic ? ' pic' : '')}>
      {pic ? <a href={m.text} target="_blank" rel="noopener noreferrer"><img src={cl(m.text, 600)} alt="Shared picture" loading="lazy" /></a> : m.text}
      <small className="bt">{(when(m.at).split(',')[1] || '').trim()}</small>
    </div>
  );
}

function Thread({ id, name, role }: { id: string; name?: string; role: 'customer' | 'staff' }) {
  const { user, profile, toast } = useApp();
  const [t, setT] = useState(''), [up, setUp] = useState(false), box = useRef<HTMLDivElement>(null), fl = useRef<HTMLInputElement>(null);
  const msgs = useLive((fb) => fb.query(fb.collection(fb.db, 'chats', id, 'messages'), fb.orderBy('at', 'asc'), fb.limit(300)), [id]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.docs.length]);
  const deliver = async (text: string) => {
    const fb = getFb(), cr = fb.doc(fb.db, 'chats', id), last = isImageUrl(text) ? 'Photo' : text.slice(0, 120);
    const ex = await fb.getDoc(cr);
    if (!ex.exists()) await fb.setDoc(cr, { uid: id, name: role === 'customer' ? profile?.name || 'Customer' : name || 'Customer', status: 'OPEN', last, lastRole: role, updatedAt: fb.serverTimestamp() });
    else await fb.updateDoc(cr, { last, lastRole: role, ...(role === 'customer' ? { status: 'OPEN' } : {}), updatedAt: fb.serverTimestamp() });
    await fb.addDoc(fb.collection(cr, 'messages'), { from: user.uid, role, text, at: fb.serverTimestamp() });
  };
  const send = async (e: any) => {
    e.preventDefault();
    const text = t.trim(); if (!text) return;
    setT('');
    try { await deliver(text); } catch { toast('Not sent. Try again.'); }
  };
  const photo = async (f?: File | null) => {
    if (!f) return;
    setUp(true);
    try { await deliver(await uploadImg(f, 'chat')); } catch (x: any) { toast(x.message || 'Could not send the picture.'); }
    setUp(false);
  };
  return (
    <>
      <div className="chatbox big" ref={box}>{msgs.docs.length ? msgs.docs.map((m) => <Bubble key={m.id} m={m} mine={m.from === user.uid} />) : <p className="mut" style={{ margin: 'auto' }}>No messages yet. Say hello.</p>}{up && <div className="bub me">Sending picture...</div>}</div>
      <form className="chatf" onSubmit={send}>
        <button type="button" className="alt ibtn" aria-label="Send a picture" onClick={() => fl.current?.click()}><Icon n="photo" /></button>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Type a message" maxLength={900} autoComplete="off" />
        <button className="go ibtn" aria-label="Send"><Icon n="send" /></button>
        <input ref={fl} type="file" accept="image/*" hidden onChange={(e) => { photo(e.target.files?.[0]); e.target.value = ''; }} />
      </form>
    </>
  );
}

function Inbox() {
  const { toast } = useApp();
  const [sel, setSel] = useState<any>(null);
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'chats'), fb.orderBy('updatedAt', 'desc'), fb.limit(50)), []);
  useEffect(() => { // opened from People > Message
    const q = new URLSearchParams(location.search), w = q.get('with');
    if (!w) return;
    const fb = getFb(), ref = fb.doc(fb.db, 'chats', w), nm = q.get('name') || 'Customer';
    fb.getDoc(ref).then(async (d: any) => {
      if (!d.exists()) await fb.setDoc(ref, { uid: w, name: nm, status: 'OPEN', last: '', lastRole: 'system', updatedAt: fb.serverTimestamp() });
      setSel({ id: w, name: d.exists() ? d.data().name : nm });
    }).catch(() => toast('Could not open that chat.'));
    // eslint-disable-next-line
  }, []);
  if (sel) return <><button className="lnk" onClick={() => setSel(null)}>All conversations</button><h3 style={{ margin: '.5rem 0' }}>{sel.name}</h3><Thread id={sel.id} name={sel.name} role="staff" /></>;
  if (loading) return <Empty>Loading...</Empty>;
  return <>{docs.length ? docs.map((c) => (
    <button key={c.id} className={'ord inbox' + (c.lastRole === 'customer' ? ' unread' : '')} onClick={() => setSel(c)}>
      <span className="inb-av">{(c.name || '?')[0].toUpperCase()}</span>
      <span style={{ minWidth: 0, textAlign: 'left' }}><b>{c.name || 'Customer'}</b><span className="mut" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last || 'New conversation'}</span></span>
      <small className="mut">{ago(c.updatedAt)}</small>
    </button>)) : <Empty>No conversations yet. Customers can message you from their dashboard.</Empty>}</>;
}

export default function Chat() {
  const { user, can } = useApp();
  const staff = can('support.reply');
  return (
    <div className="wrap" style={{ maxWidth: '44rem' }}>
      <h1 style={{ fontSize: '2rem' }}>{staff ? 'Customer chats' : 'Chat with Bamyon'}</h1>
      {!staff && <p className="mut" style={{ margin: '.4rem 0 .8rem' }}>Send us a message or a picture and we will reply here.</p>}
      {staff ? <Inbox /> : <Thread id={user.uid} role="customer" />}
    </div>
  );
}
