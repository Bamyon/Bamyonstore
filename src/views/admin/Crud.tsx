'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { Pill, Empty, Loading, Sheet, fd } from '@/components/ui';

export interface Field { k: string; label: string; type?: 'text' | 'number' | 'checkbox' | 'textarea' | 'select' | 'date'; options?: string[]; required?: boolean }
interface Props { coll: string; title: string; fields: Field[]; idField?: string; sortBy?: string; summary: (r: any) => string; defaults?: any }

const dateIn = (ms: any) => (typeof ms === 'number' && ms ? new Date(ms).toISOString().slice(0, 10) : '');

// A small generic editor for simple collections (zones, promotions, homepage rows, jobs). Rows are archived, never deleted.
export default function Crud({ coll, title, fields, idField, sortBy, summary, defaults = { active: true } }: Props) {
  const { toast } = useApp();
  const [edit, setEdit] = useState<any>(null);
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, coll), fb.limit(300)), [coll]);
  const L = [...docs].sort((a, b) => (sortBy ? (a[sortBy] || 0) - (b[sortBy] || 0) : String(a.name || a.title || a.id).localeCompare(String(b.name || b.title || b.id))));
  const save = async (e: any) => {
    const { v } = fd(e), fb = getFb(), data: any = {};
    for (const f of fields) {
      if (f.type === 'checkbox') data[f.k] = v[f.k] === 'on';
      else if (f.type === 'number') data[f.k] = +v[f.k] || 0;
      else if (f.type === 'date') data[f.k] = v[f.k] ? new Date(v[f.k]).getTime() + 86399000 : 0;
      else data[f.k] = String(v[f.k] ?? '').trim();
    }
    try {
      if (idField) { const id = String(data[idField]).toUpperCase().replaceAll('/', ''); if (!id) throw new Error('x'); delete data[idField]; await fb.setDoc(fb.doc(fb.db, coll, id), data, { merge: true }); }
      else if (edit.id) await fb.updateDoc(edit.ref, data);
      else await fb.addDoc(fb.collection(fb.db, coll), data);
      setEdit(null); toast('Saved.');
    } catch { toast('Could not save. Check the fields and your permissions.'); }
  };
  const toggle = async (r: any) => { const fb = getFb(); try { await fb.updateDoc(r.ref, { active: !r.active }); } catch { toast('Not allowed.'); } };
  const row = edit || {};
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ fontSize: '2rem' }}>{title}</h1><button className="go" onClick={() => setEdit({ ...defaults })}>Add</button></div>
      {loading ? <Loading /> : !L.length ? <Empty>Nothing here yet.</Empty> : L.map((r) => (
        <div className="ord" key={r.id}>
          <div className="row"><b>{r.name || r.title || r.id}</b>{!r.active && <Pill>archived</Pill>}</div>
          <div className="mut">{summary(r)}</div>
          <div className="row"><button className="alt" onClick={() => setEdit(r)}>Edit</button><button className="alt" onClick={() => toggle(r)}>{r.active ? 'Archive' : 'Restore'}</button></div>
        </div>
      ))}
      {edit && (
        <Sheet title={edit.id ? 'Edit' : 'Add'} onClose={() => setEdit(null)}>
          <form className="f" onSubmit={save}>
            {fields.map((f) => f.type === 'checkbox'
              ? <label key={f.k}><input type="checkbox" name={f.k} defaultChecked={!!(f.k === idField ? row.id : row[f.k])} style={{ width: 'auto' }} /> {f.label}</label>
              : f.type === 'textarea' ? <textarea key={f.k} name={f.k} rows={4} placeholder={f.label} defaultValue={row[f.k] || ''} required={f.required} />
              : f.type === 'select' ? <select key={f.k} name={f.k} defaultValue={row[f.k] || f.options?.[0]}>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
              : <input key={f.k} name={f.k} type={f.type || 'text'} placeholder={f.label} aria-label={f.label} defaultValue={f.k === idField ? row.id || '' : f.type === 'date' ? dateIn(row[f.k]) : row[f.k] ?? ''} required={f.required} readOnly={f.k === idField && !!row.id} />)}
            <button className="go">Save</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
