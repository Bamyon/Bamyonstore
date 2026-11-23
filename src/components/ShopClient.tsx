'use client';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { Empty } from './ui';
import type { Product, Section } from '@/lib/types';

export default function ShopClient({ products, sections }: { products: Product[]; sections: Section[] }) {
  const [q, setQ] = useState(''), [sort, setSort] = useState('default'), [sec, setSec] = useState('all');
  const filtered = useMemo(() => {
    let L = products.filter((p) => (sec === 'all' || p.section === sec) && (!q || (p.name + ' ' + (p.desc || '')).toLowerCase().includes(q.toLowerCase())));
    if (sort === 'low') L = [...L].sort((a, b) => a.price - b.price);
    if (sort === 'high') L = [...L].sort((a, b) => b.price - a.price);
    if (sort === 'new') L = [...L].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return L;
  }, [products, q, sort, sec]);
  const plain = q || sort !== 'default' || sec !== 'all';
  const rows = sections.map((s): [Section, Product[]] => [s, products.filter((p) => p.section === s.id)]).filter(([, L]) => L.length > 0);
  const rest = products.filter((p) => !sections.some((s) => s.id === p.section));
  return (
    <div className="wrap">
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Shop</h1>
      <div className="tools">
        <input type="search" placeholder="Search clothes, shoes, gadgets, food..." aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="new">Newest first</option>
        </select>
      </div>
      <div className="chips">
        <button className={sec === 'all' ? 'on' : ''} onClick={() => setSec('all')}>All</button>
        {sections.map((s) => <button key={s.id} className={sec === s.id ? 'on' : ''} onClick={() => setSec(s.id)}>{s.name}</button>)}
      </div>
      {!products.length ? <Empty>New products are on the way. Please check back shortly.</Empty>
        : plain ? (filtered.length ? <div className="pgrid">{filtered.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty>Nothing matches your search.</Empty>)
        : (<>
          {rows.map(([s, L]) => (
            <section className="rowx" key={s.id}>
              <div className="rowh"><h3>{s.name}</h3>{s.sub && <span className="mut">{s.sub}</span>}</div>
              <div className="rail">{L.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </section>
          ))}
          {rest.length > 0 && <section className="rowx"><div className="rowh"><h3>{rows.length ? 'More to explore' : 'All products'}</h3></div><div className="pgrid">{rest.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>}
        </>)}
    </div>
  );
}
