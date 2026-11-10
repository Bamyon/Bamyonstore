'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getFb } from '@/lib/firebase';
import { track } from '@/lib/api';
import { useApp } from './Providers';
import Icon from './Icon';
import { Avatar } from './ui';
import { ago, short, uploadImg, safeImg, K } from '@/lib/util';
import type { Post } from '@/lib/types';
import { BRAND } from '@/config/brand';

const OK = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'UL', 'OL', 'LI', 'H2', 'H3', 'A', 'IMG', 'DIV', 'SPAN', 'BLOCKQUOTE']);
function san(src: Node, dst: Node) {
  for (const c of src.childNodes) {
    if (c.nodeType === 3) { dst.appendChild(document.createTextNode(c.textContent || '')); continue; }
    if (c.nodeType !== 1) continue;
    const el = c as Element, t = el.tagName;
    if (t === 'SCRIPT' || t === 'STYLE') continue;
    if (!OK.has(t)) { san(c, dst); continue; }
    if (t === 'IMG') { const s = safeImg(el.getAttribute('src')); if (s) { const i = document.createElement('img'); i.src = s; i.alt = ''; i.loading = 'lazy'; dst.appendChild(i); } continue; }
    const e: any = document.createElement(t.toLowerCase());
    if (t === 'A') { const u = el.getAttribute('href') || ''; if (/^https?:\/\//.test(u)) { e.href = u; e.target = '_blank'; e.rel = 'noopener noreferrer'; } }
    san(c, e); dst.appendChild(e);
  }
}
function Rich({ html, text, clip }: { html?: string; text?: string; clip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    d.replaceChildren();
    if (html) san(new DOMParser().parseFromString(html, 'text/html').body, d);
    else for (const x of String(text || '').split(/\n\s*\n/)) { const p = document.createElement('p'); p.textContent = x; d.appendChild(p); }
  }, [html, text]);
  return <div className={'rich' + (clip ? ' clip' : '')} ref={ref} suppressHydrationWarning />;
}

function Composer({ post, parent, ph, onDone, focus }: { post: string; parent?: string; ph?: string; onDone?: () => void; focus?: boolean }) {
  const { user, profile, toast } = useApp();
  const [t, setT] = useState(''), [photo, setPhoto] = useState(''), [busy, setBusy] = useState(false), fl = useRef<HTMLInputElement>(null);
  const send = async () => {
    if (!user) return toast('Sign in to comment.');
    if (!t.trim() && !photo) return;
    setBusy(true);
    try {
      const fb = getFb();
      await fb.addDoc(fb.collection(fb.db, 'posts', post, 'comments'), { uid: user.uid, name: profile?.name || 'Customer', avatar: profile?.photo || '', text: t.trim(), photo, at: fb.serverTimestamp(), ...(parent ? { parent } : {}) });
      setT(''); setPhoto(''); track('comment', post); onDone && onDone();
    } catch { toast('Could not post.'); }
    setBusy(false);
  };
  return (
    <div>
      <div className="cm1"><Avatar u={profile || {}} />
        <div className="cbox">
          <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder={ph || 'Write a comment...'} maxLength={500} aria-label="Comment" autoFocus={focus} />
          {(t.trim() || photo) && <button type="button" className="sendb" disabled={busy} aria-label="Send" onClick={send}><Icon n="send" /></button>}
          <button type="button" aria-label="Add a photo" onClick={() => fl.current?.click()}><Icon n="photo" /></button>
        </div>
      </div>
      {photo && <div className="cprev"><img src={photo} alt="" /></div>}
      <input ref={fl} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files[0]; if (!f) return; try { setPhoto(await uploadImg(f, 'comments')); } catch (x) { toast(x.message); } e.target.value = ''; }} />
    </div>
  );
}

function Node({ c, top, onReply }: { c: any; top: any; onReply: (id: string, name: string) => void }) {
  const { user, profile, toast } = useApp();
  const [n, setN] = useState(0), [me, setMe] = useState(false), [open, setOpen] = useState(false);
  useEffect(() => { const fb = getFb(); return fb.onSnapshot(fb.collection(c.ref, 'likes'), (s) => { setN(s.size); setMe(!!user && s.docs.some((x) => x.id === user.uid)); }, () => {}); }, [c.id, user]);
  const legacy = !('avatar' in c), att = !legacy && safeImg(c.photo);
  const like = async () => {
    if (!user) return toast('Sign in to like.');
    const fb = getFb(), r = fb.doc(c.ref, 'likes', user.uid);
    try { me ? await fb.deleteDoc(r) : await fb.setDoc(r, { at: fb.serverTimestamp() }); } catch { toast('Try again.'); }
  };
  return (
    <div className="cm1"><Avatar u={{ name: c.name, photo: legacy ? c.photo : c.avatar }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cbub"><b>{c.name || 'Customer'}</b>{c.text && <div className={'ctext' + (open ? ' open' : '')} onClick={() => setOpen(true)}>{c.text}</div>}</div>
        {att && <img className="cimg" src={att} alt="" loading="lazy" />}
        <div className="cmeta"><span>{short(c.at)}</span><button className={me ? 'on' : ''} onClick={like}>Like</button><button onClick={() => onReply(top.id, c.name)}>Reply</button>
          {user && (c.uid === user.uid || profile?.role === 'admin') && <button onClick={() => getFb().deleteDoc(c.ref).catch(() => toast('Not allowed.'))}>Delete</button>}
          {n > 0 && <span className="clk">{K(n)} 👍</span>}</div>
      </div>
    </div>
  );
}

function Comments({ id, onCount }: { id: string; onCount: (n: number) => void }) {
  const [A, setA] = useState<any[]>([]), [reply, setReply] = useState<{ tid: string; nm: string } | null>(null);
  useEffect(() => {
    const fb = getFb();
    return fb.onSnapshot(fb.query(fb.collection(fb.db, 'posts', id, 'comments'), fb.orderBy('at', 'asc'), fb.limit(300)), (s) => { const L = s.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })); setA(L); onCount(L.length); }, () => {});
    // eslint-disable-next-line
  }, [id]);
  return (
    <div className="cmbox">
      {A.filter((c) => !c.parent).map((c) => (
        <div key={c.id}>
          <Node c={c} top={c} onReply={(tid, nm) => setReply({ tid, nm })} />
          <div className="replies">{A.filter((r) => r.parent === c.id).map((r) => <Node key={r.id} c={r} top={c} onReply={(tid, nm) => setReply({ tid, nm })} />)}</div>
          {reply?.tid === c.id && <div className="replies"><Composer post={id} parent={c.id} ph={'Reply to ' + (reply.nm || 'comment') + '...'} focus onDone={() => setReply(null)} /></div>}
        </div>
      ))}
      <Composer post={id} />
    </div>
  );
}

export function PostCard({ p, full }: { p: Post; full?: boolean }) {
  const { user, toast } = useApp();
  const [nl, setNl] = useState(0), [nc, setNc] = useState(0), [ns, setNs] = useState(0), [liked, setLiked] = useState(false), [cm, setCm] = useState(!!full), [more, setMore] = useState(false);
  const long = (p.html || p.body || '').length > 420;
  useEffect(() => {
    const fb = getFb(), ref = fb.doc(fb.db, 'posts', p.id), cnt = (c) => fb.getCountFromServer(fb.collection(ref, c)).then((s) => s.data().count).catch(() => 0);
    Promise.all([cnt('likes'), cnt('comments'), cnt('shares')]).then(([a, b, c]) => { setNl(a); setNc(b); setNs(c); });
    if (full) track('post_view', p.title);
  }, [p.id, p.title, full]);
  useEffect(() => { if (!user) return setLiked(false); const fb = getFb(); fb.getDoc(fb.doc(fb.db, 'posts', p.id, 'likes', user.uid)).then((d) => setLiked(d.exists())).catch(() => {}); }, [user, p.id]);
  const like = async () => {
    if (!user) return toast('Sign in to like.');
    const fb = getFb(), r = fb.doc(fb.db, 'posts', p.id, 'likes', user.uid);
    try { if (liked) { await fb.deleteDoc(r); setNl((n) => n - 1); setLiked(false); } else { await fb.setDoc(r, { at: fb.serverTimestamp() }); setNl((n) => n + 1); setLiked(true); track('like', p.title); } } catch { toast('Try again.'); }
  };
  const share = async () => {
    const url = location.origin + '/blog/' + p.id; track('share', p.title);
    try {
      if (navigator.share) await navigator.share({ title: p.title, url }); else { await navigator.clipboard.writeText(url); toast('Link copied.'); }
      if (user) { const fb = getFb(); await fb.setDoc(fb.doc(fb.db, 'posts', p.id, 'shares', user.uid), { at: fb.serverTimestamp() }); setNs((n) => n + 1); }
    } catch {}
  };
  return (
    <article className="post">
      <div className="ph-head"><img src={BRAND.logo} alt="" /><div><b>{BRAND.name}</b><div className="mut">{ago(p.at)} · Public</div></div></div>
      <h2><Link href={'/blog/' + p.id}>{p.title}</Link></h2>
      <Rich html={p.html} text={p.body} clip={!full && long && !more} />
      {!full && long && !more && <button className="lnk more" onClick={() => setMore(true)}>See more</button>}
      {safeImg(p.cover) && <img className="pcover" src={safeImg(p.cover)} alt="" loading="lazy" />}
      <div className="pstats"><span>{nl ? '👍 ' + (liked ? (nl === 1 ? 'You' : `You and ${K(nl - 1)} other${nl - 1 > 1 ? 's' : ''}`) : K(nl)) : ''}</span><button className="lnk" onClick={() => setCm(true)}>{nc ? `${K(nc)} comment${nc > 1 ? 's' : ''}` : ''}</button></div>
      <div className="pacts">
        <button className={'pill-b' + (liked ? ' on' : '')} aria-label="Like" onClick={like}><span className="em">👍</span><span>{nl ? K(nl) : ''}</span></button>
        <button className="pill-b" aria-label="Comment" onClick={() => setCm(!cm)}><Icon n="chat" /><span>{nc ? K(nc) : ''}</span></button>
        <button className="pill-b" aria-label="Share" onClick={share}><Icon n="share" /><span>{ns ? K(ns) : ''}</span></button>
      </div>
      {cm && <Comments id={p.id} onCount={setNc} />}
    </article>
  );
}

export default function BlogFeed({ posts, full }: { posts: Post[]; full?: boolean }) {
  if (!posts.length) return <p className="mut empty">The first story is coming soon.</p>;
  return <div className="feedlist">{posts.map((p) => <PostCard key={p.id} p={p} full={full} />)}</div>;
}
