'use client';
import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';
import ProductCard, { Meta, imgRef } from './ProductCard';
import Reviews from './Reviews';
import { useApp } from './Providers';
import { off, soldOut, low, left, cl, naira } from '@/lib/util';
import type { Product } from '@/lib/types';

export default function ProductView({ p, related }: { p: Product; related: Product[] }) {
  const { addToCart } = useApp();
  const [q, setQ] = useState(1);
  const o = off(p), out = soldOut(p), l = left(p), im = cl(p.img, 900), lq = cl(p.img, 24);
  return (
    <div className="wrap">
      <Link className="back" href="/shop"><Icon n="back" />Back to shop</Link>
      <div className="pdp">
        <div className="pdp-img" style={lq ? { backgroundImage: `url(${lq})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : undefined}>
          {im ? <img ref={imgRef} src={im} alt={p.name} onLoad={(e) => e.currentTarget.classList.add('ld')} /> : <div className="ph big"><Icon n="bag" /></div>}
          {o > 0 && !out && <span className="tag">-{o}%</span>}
        </div>
        <div className="pdp-info">
          <h1>{p.name}</h1>
          <Meta p={p} />
          <div className="pr big"><b>{naira(p.price)}</b>{o > 0 && <s>{naira(p.was)}</s>}{o > 0 && <span className="tag inl">Save {o}%</span>}</div>
          <p className={'stockl ' + (out ? 'out' : low(p) ? 'low' : 'ok')}>{out ? 'Sold out' : low(p) ? `Only ${l} left, order soon` : typeof p.qty === 'number' ? `${p.qty} in stock` : 'In stock'}</p>
          {p.unit && <p className="mut">{p.unit}</p>}
          {p.partnerName && <p className="mut">Sold by {p.partnerName}</p>}
          {!out && (
            <div className="row">
              <span className="q"><button className="alt" aria-label="One less" onClick={() => setQ(Math.max(1, q - 1))}>-</button> <b>{q}</b> <button className="alt" aria-label="One more" onClick={() => setQ(Math.min(99, l, q + 1))}>+</button></span>
              <button className="go" style={{ flex: 1 }} onClick={() => addToCart(p, q)}>Add to cart</button>
            </div>
          )}
          <h4 style={{ margin: '.8rem 0 0' }}>About this product</h4>
          <p className="desc">{p.desc || 'A quality product from Bamyon Store.'}</p>
        </div>
      </div>
      <Reviews pid={p.id} pname={p.name} />
      {related.length > 0 && <><h3 style={{ margin: '2rem 0 .5rem' }}>More like this</h3><div className="rail">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
    </div>
  );
}
