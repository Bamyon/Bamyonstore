'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { touch } from '@/lib/api';
import { naira, cl } from '@/lib/util';
import ImageUpload from '@/components/ImageUpload';
import { Pill, Empty, Loading, Sheet, fd } from '@/components/ui';

function ProductForm({ p, partner, sections, onClose }: { p?: any; partner?: boolean; sections: any[]; onClose: () => void }) {
  const { user, profile, toast } = useApp();
  const [busy, setBusy] = useState(false), [img, setImg] = useState<string>(p?.img || '');
  const save = async (e: any) => {
    const { v } = fd(e), fb = getFb();
    setBusy(true);
    try {
      const base: any = { name: v.name.trim(), unit: (v.unit || '').trim(), desc: (v.desc || '').trim(), price: Math.round(+v.price), was: Math.round(+v.was) || 0, img, stock: v.stock === 'on' };
      if (!(base.price > 0)) throw new Error('Enter a price.');
      if (partner) {
        Object.assign(base, { active: false, status: 'PENDING' });
        if (p) await fb.updateDoc(p.ref, base);
        else await fb.addDoc(fb.collection(fb.db, 'products'), { ...base, partner: user.uid, partnerName: profile.name || '', createdAt: fb.serverTimestamp() });
      } else {
        Object.assign(base, { active: v.active === 'on', featured: v.featured === 'on', section: v.section || '', sold: Math.max(0, Math.round(+v.sold || 0)), lowAt: Math.max(0, Math.round(+v.lowAt || 5)) });
        if (String(v.qty).trim() !== '') base.qty = Math.max(0, Math.round(+v.qty)); else if (p) base.qty = fb.deleteField();
        if (p) await fb.updateDoc(p.ref, base);
        else { await fb.addDoc(fb.collection(fb.db, 'products'), { ...base, createdAt: fb.serverTimestamp() }); touch('products'); }
      }
      toast(partner ? 'Saved. It goes live after review.' : 'Saved.'); onClose();
    } catch (x: any) { toast(x.message?.startsWith('Enter') ? x.message : 'Could not save. Check your permissions.'); }
    setBusy(false);
  };
  return (
    <Sheet title={p ? 'Edit product' : 'New product'} onClose={onClose}>
      <form className="f" onSubmit={save}>
        <input name="name" placeholder="Name" defaultValue={p?.name} required />
        <input name="unit" placeholder="Size or unit (e.g. 35cl, 50kg)" defaultValue={p?.unit} />
        <textarea name="desc" rows={3} placeholder="Description" defaultValue={p?.desc} maxLength={600} />
        <div className="row"><input style={{ flex: 1 }} name="price" type="number" min={1} placeholder="Price (NGN)" defaultValue={p?.price} required /><input style={{ flex: 1 }} name="was" type="number" min={0} placeholder="Old price (optional)" defaultValue={p?.was || ''} /></div>
        {!partner && <>
          <select name="section" defaultValue={p?.section || ''}><option value="">Homepage row (none)</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <p className="mut">Stock: leave blank to not track. It drops when you approve an order and returns if you cancel.</p>
          <div className="row"><input style={{ flex: 1 }} name="qty" type="number" min={0} placeholder="Units in stock" defaultValue={p?.qty ?? ''} /><input style={{ flex: 1 }} name="lowAt" type="number" min={0} placeholder="Warn me at" defaultValue={p?.lowAt ?? ''} /><input style={{ flex: 1 }} name="sold" type="number" min={0} placeholder="Units sold so far" defaultValue={p?.sold || ''} /></div>
          <label><input type="checkbox" name="active" defaultChecked={p ? !!p.active : true} style={{ width: 'auto' }} /> Visible in the shop</label>
          <label><input type="checkbox" name="featured" defaultChecked={!!p?.featured} style={{ width: 'auto' }} /> Feature on the home page</label>
        </>}
        <label><input type="checkbox" name="stock" defaultChecked={p ? p.stock !== false : true} style={{ width: 'auto' }} /> In stock</label>
        <ImageUpload value={img} onChange={setImg} folder="products" label="Add product photo" hint="Tap or drop the main picture" />
        <button className="go" disabled={busy}>{busy ? 'Saving...' : 'Save product'}</button>
      </form>
    </Sheet>
  );
}

export function ProductManager({ partner }: { partner?: boolean }) {
  const { user, can, toast } = useApp();
  const [edit, setEdit] = useState<any>(null), [q, setQ] = useState('');
  const prods = useLive((fb) => partner ? fb.query(fb.collection(fb.db, 'products'), fb.where('partner', '==', user.uid)) : fb.query(fb.collection(fb.db, 'products'), fb.orderBy('createdAt', 'desc'), fb.limit(300)), [partner, user.uid]);
  const secs = useLive((fb) => fb.query(fb.collection(fb.db, 'sections'), fb.limit(100)), []);
  const L = prods.docs.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const patch = async (p: any, d: any) => { const fb = getFb(); try { await fb.updateDoc(p.ref, d); } catch { toast('Not allowed.'); } };
  const del = async (p: any) => { if (!confirm(`Delete ${p.name}?`)) return; const fb = getFb(); try { await fb.deleteDoc(p.ref); } catch { toast('Not allowed.'); } };
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ fontSize: '2rem' }}>{partner ? 'My products' : 'Products'}</h1>{(partner || can('products.create')) && <button className="go" onClick={() => setEdit({})}>Add product</button>}</div>
      {partner && <p className="mut">New and edited products are reviewed before they appear in the shop.</p>}
      <input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: '.8rem 0' }} />
      {prods.loading ? <Loading /> : !L.length ? <Empty>No products yet.</Empty> : L.map((p) => (
        <div className="ord" key={p.id}>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            {cl(p.img, 120) ? <img src={cl(p.img, 120)} alt="" width={52} height={52} style={{ borderRadius: '.7rem', objectFit: 'contain', background: '#fff' }} /> : null}
            <div style={{ flex: 1, minWidth: 0 }}><b>{p.name}</b><div className="mut">{naira(p.price)}{p.was ? ' (was ' + naira(p.was) + ')' : ''}{typeof p.qty === 'number' ? ' | ' + p.qty + ' in stock' : ''}{p.sold ? ' | ' + p.sold + ' sold' : ''}</div></div>
          </div>
          <div className="row">{!p.active && <Pill>hidden</Pill>}{p.status === 'PENDING' && <Pill>awaiting review</Pill>}{p.partnerName && <Pill>{p.partnerName}</Pill>}{p.featured && <Pill>featured</Pill>}{typeof p.qty === 'number' && p.qty <= (p.lowAt ?? 5) && <Pill>low stock</Pill>}</div>
          <div className="row">
            <button className="alt" onClick={() => setEdit(p)}>Edit</button>
            {!partner && p.status === 'PENDING' && can('products.edit') && <button className="go" onClick={() => patch(p, { active: true, status: 'APPROVED' })}>Approve</button>}
            {!partner && can('products.edit') && p.status !== 'PENDING' && <button className="alt" onClick={() => patch(p, { active: !p.active })}>{p.active ? 'Hide' : 'Show'}</button>}
            {!partner && can('products.edit') && <button className="alt" onClick={() => del(p)}>Delete</button>}
          </div>
        </div>
      ))}
      {edit && <ProductForm p={edit.id ? edit : undefined} partner={partner} sections={secs.docs} onClose={() => setEdit(null)} />}
    </>
  );
}
export const PartnerProducts = () => <div className="wrap"><ProductManager partner /></div>;
export default function AdminProducts() { return <ProductManager />; }
