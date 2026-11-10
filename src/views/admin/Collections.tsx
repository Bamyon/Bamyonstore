'use client';
import Crud from './Crud';
import { naira } from '@/lib/util';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { BRAND } from '@/config/brand';

export const Zones = () => <Crud coll="zones" title="Delivery zones" fields={[{ k: 'name', label: 'Zone name', required: true }, { k: 'price', label: 'Delivery fee (NGN)', type: 'number' }, { k: 'free', label: 'Free delivery', type: 'checkbox' }, { k: 'active', label: 'Active', type: 'checkbox' }]} summary={(z) => (z.free ? 'Free delivery' : naira(z.price))} />;
export const Promos = () => <Crud coll="promos" title="Promotions" idField="code" fields={[{ k: 'code', label: 'Code (e.g. WELCOME10)', required: true }, { k: 'type', label: 'Type', type: 'select', options: ['PERCENT', 'FIXED'] }, { k: 'value', label: 'Value (percent or NGN)', type: 'number' }, { k: 'min', label: 'Minimum order (NGN)', type: 'number' }, { k: 'expires', label: 'Expires', type: 'date' }, { k: 'active', label: 'Active', type: 'checkbox' }]}
  summary={(p) => `${p.type === 'PERCENT' ? p.value + '% off' : naira(p.value) + ' off'}${p.min ? ' over ' + naira(p.min) : ''}${p.expires ? ' | until ' + new Date(p.expires).toLocaleDateString('en-NG') : ''}`} />;
const SectionsList = () => <Crud coll="sections" title="Homepage rows" sortBy="order" fields={[{ k: 'name', label: 'Row title', required: true }, { k: 'sub', label: 'Short subtitle' }, { k: 'order', label: 'Position (1, 2, 3...)', type: 'number' }, { k: 'active', label: 'Active', type: 'checkbox' }]} summary={(s) => `Position ${s.order || 0}${s.sub ? ' | ' + s.sub : ''}`} />;
export const Jobs = () => <Crud coll="jobs" title="Jobs" fields={[{ k: 'title', label: 'Job title', required: true }, { k: 'location', label: 'Location' }, { k: 'desc', label: 'Description', type: 'textarea' }, { k: 'active', label: 'Open', type: 'checkbox' }]} summary={(j) => j.location || ''} />;

// First-run helper: one tap creates the starter homepage rows (Clothes, Shoes, Food...). They can be renamed or archived later.
export function Sections() {
  const { toast } = useApp();
  const { docs, loading } = useLive((fb) => fb.query(fb.collection(fb.db, 'sections'), fb.limit(1)), []);
  const seed = async () => {
    const fb = getFb();
    try { const b = fb.writeBatch(fb.db); BRAND.starterSections.forEach((n, i) => b.set(fb.doc(fb.collection(fb.db, 'sections')), { name: n, sub: '', order: i + 1, active: true })); await b.commit(); toast('Starter sections added.'); } catch { toast('Not allowed.'); }
  };
  return (
    <>
      {!loading && !docs.length && <div className="ord"><h3>Start with the basics</h3><p className="mut">Add {BRAND.starterSections.join(', ')} as homepage rows. Rename or archive any of them later.</p><button className="go" onClick={seed}>Add starter sections</button></div>}
      <SectionsList />
    </>
  );
}

export const Rewards = () => <Crud coll="rewards" title="Reward codes" idField="code" fields={[
  { k: 'code', label: 'Code (e.g. WELCOME500)', required: true }, { k: 'amount', label: 'Reward added to the wallet (NGN)', type: 'number' },
  { k: 'max', label: 'How many people can claim it (0 = unlimited)', type: 'number' }, { k: 'expires', label: 'Expires', type: 'date' },
  { k: 'note', label: 'Note for yourself (optional)' }, { k: 'active', label: 'Active', type: 'checkbox' }]}
  summary={(r) => `${naira(r.amount)} each | claimed ${r.usedCount || 0}${r.max ? ' of ' + r.max : ''}${r.expires ? ' | until ' + new Date(r.expires).toLocaleDateString('en-NG') : ''}${r.note ? ' | ' + r.note : ''}`} />;
