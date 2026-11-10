'use client';
import { useRef, useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { touch } from '@/lib/api';
import Icon from '@/components/Icon';
import { Pill, Empty, Loading } from '@/components/ui';
import ImageUpload from '@/components/ImageUpload';
import { ago, uploadImg, when } from '@/lib/util';

export function ReviewsAdmin() {
  const { toast } = useApp();
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'reviews'), fb.orderBy('createdAt', 'desc'), fb.limit(100)), []);
  const set = async (r: any, status: string) => {
    const fb = getFb();
    try {
      await fb.updateDoc(r.ref, { status });
      const s = await fb.getDocs(fb.query(fb.collection(fb.db, 'reviews'), fb.where('pid', '==', r.pid), fb.where('status', '==', 'PUBLISHED'))), n = s.size;
      const avg = n ? s.docs.reduce((a: number, x: any) => a + x.data().rating, 0) / n : 0;
      await fb.updateDoc(fb.doc(fb.db, 'products', r.pid), { rating: Math.round(avg * 10) / 10, reviewsN: n });
    } catch { toast('Not allowed.'); }
  };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Reviews</h1>
      {loading ? <Loading /> : !docs.length ? <Empty>No reviews yet.</Empty> : docs.map((r) => (
        <div className="ord" key={r.id}>
          <div className="row"><b>{r.pname}</b><Pill>{String(r.status).toLowerCase()}</Pill><span className="stars">{'★'.repeat(r.rating)}</span></div>
          <div>{r.text}</div><div className="mut">{r.name} | {ago(r.createdAt)}</div>
          <div className="row"><button className="go" onClick={() => set(r, 'PUBLISHED')}>Publish</button><button className="alt" onClick={() => set(r, 'HIDDEN')}>Hide</button></div>
        </div>
      ))}
    </>
  );
}

const escapeHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function BlogAdmin() {
  const { toast } = useApp();
  const ed = useRef<HTMLDivElement>(null), fi = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(''), [cover, setCover] = useState(''), [editing, setEditing] = useState<any>(null), [busy, setBusy] = useState(false);
  const posts = useLive((fb) => fb.query(fb.collection(fb.db, 'posts'), fb.orderBy('at', 'desc'), fb.limit(50)), []);
  const cmd = (c: string, v?: string) => { ed.current?.focus(); document.execCommand(c, false, v); };
  const T = ({ c, v, a, children }: { c?: string; v?: string; a: string; children: any }) => <button type="button" aria-label={a} title={a} onPointerDown={(e) => e.preventDefault()} onClick={() => (c ? cmd(c, v) : null)}>{children}</button>;
  const reset = () => { setEditing(null); setTitle(''); setCover(''); if (ed.current) ed.current.innerHTML = ''; };
  const startEdit = (p: any) => {
    setEditing(p); setTitle(p.title || ''); setCover(p.cover || '');
    if (ed.current) ed.current.innerHTML = p.html || String(p.body || '').split(/\n\s*\n/).map((x) => '<p>' + escapeHtml(x) + '</p>').join('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const publish = async () => {
    const el = ed.current; if (!el) return;
    if (!title.trim() || (!el.innerText.trim() && !el.querySelector('img'))) return toast('Add a title and some content.');
    const fb = getFb(); setBusy(true);
    const data = { title: title.trim(), html: el.innerHTML.trim(), body: el.innerText.trim().slice(0, 2000), cover };
    try {
      if (editing) { await fb.updateDoc(editing.ref, { ...data, editedAt: fb.serverTimestamp() }); toast('Post updated.'); }
      else { await fb.addDoc(fb.collection(fb.db, 'posts'), { ...data, published: true, at: fb.serverTimestamp() }); touch('blog'); toast('Published.'); }
      reset();
    } catch { toast('Could not save. Check permissions.'); }
    setBusy(false);
  };
  const flip = async (p: any) => { const fb = getFb(); try { await fb.updateDoc(p.ref, { published: !p.published }); } catch { toast('Not allowed.'); } };
  const del = async (p: any) => { if (!confirm('Delete this post?')) return; const fb = getFb(); try { await fb.deleteDoc(p.ref); if (editing?.id === p.id) reset(); } catch { toast('Not allowed.'); } };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Blog posts</h1>
      <div className="ord">
        <h3>{editing ? 'Edit post' : 'Write a post'}</h3>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <ImageUpload value={cover} onChange={setCover} folder="blog" label="Add a cover picture (optional)" hint="Shown at the top of the post" />
        <div className="tbar">
          <T c="bold" a="Bold"><b>B</b></T><T c="italic" a="Italic"><i>I</i></T><T c="underline" a="Underline"><u>U</u></T><T c="formatBlock" v="h2" a="Heading">H</T><T c="insertUnorderedList" a="Bulleted list">List</T>
          <button type="button" aria-label="Link" onPointerDown={(e) => e.preventDefault()} onClick={() => { const u = prompt('Link address (https://...)'); if (u) cmd('createLink', u); }}>Link</button>
          <button type="button" aria-label="Insert image" onPointerDown={(e) => e.preventDefault()} onClick={() => fi.current?.click()}><Icon n="photo" /></button>
          <T c="removeFormat" a="Clear formatting">Clear</T>
        </div>
        <div className="editor" ref={ed} contentEditable suppressContentEditableWarning role="textbox" aria-label="Post content" />
        <input ref={fi} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { cmd('insertImage', await uploadImg(f, 'blog')); } catch (x: any) { toast(x.message || 'Upload failed.'); } e.target.value = ''; }} />
        <div className="row"><button className="go" disabled={busy} onClick={publish}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Publish post'}</button>{editing && <button className="alt" onClick={reset}>Cancel editing</button>}</div>
      </div>
      {posts.docs.map((p) => (
        <div className={'ord' + (editing?.id === p.id ? ' unread' : '')} key={p.id}><div className="row"><b>{p.title}</b>{!p.published && <Pill>draft</Pill>}{editing?.id === p.id && <Pill>editing</Pill>}</div><div className="mut">{when(p.at)}{p.editedAt ? ' | edited ' + when(p.editedAt) : ''}</div>
          <div className="row"><button className="alt" onClick={() => startEdit(p)}>Edit</button><button className="alt" onClick={() => flip(p)}>{p.published ? 'Unpublish' : 'Publish'}</button><button className="alt" onClick={() => del(p)}>Delete</button></div></div>
      ))}
    </>
  );
}

export function Applications() {
  const { toast } = useApp();
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'applications'), fb.orderBy('createdAt', 'desc'), fb.limit(100)), []);
  const set = async (a: any, status: string) => { const fb = getFb(); try { await fb.updateDoc(a.ref, { status }); } catch { toast('Not allowed.'); } };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Applications</h1>
      {loading ? <Loading /> : !docs.length ? <Empty>No applications yet.</Empty> : docs.map((a) => (
        <div className="ord" key={a.id}>
          <div className="row"><b>{a.name}</b><Pill>{String(a.status).toLowerCase()}</Pill></div>
          <div className="mut">{a.jobTitle} | {a.email} | {a.phone} | {ago(a.createdAt)}</div>
          {a.note && <div>{a.note}</div>}
          <div className="row"><a className="btn alt" href={a.cv} target="_blank" rel="noopener noreferrer">Open CV</a>
            <select value={a.status} onChange={(e) => set(a, e.target.value)} aria-label="Status" style={{ width: 'auto' }}>{['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'].map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
      ))}
    </>
  );
}
