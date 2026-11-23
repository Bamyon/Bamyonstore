'use client';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { K, off, soldOut, low, cl, naira } from '@/lib/util';
import type { Product } from '@/lib/types';

export function Meta({ p }: { p: Product }) {
  const { pub } = useApp();
  const r = pub.showRating !== false && p.rating > 0, s = pub.showSold !== false && p.sold > 0, t = typeof p.qty === 'number' && p.qty > 0;
  if (!r && !s && !t) return null;
  return (
    <div className="meta">
      {r && <span className="rt"><Icon n="star" />{(+p.rating).toFixed(1)}{p.reviewsN ? <em>({K(p.reviewsN)})</em> : null}</span>}
      {s && <span>{K(p.sold)}{p.sold >= 1000 ? '+' : ''} sold</span>}
      {t && <span className={low(p) ? 'lowtxt' : 'stk'}>{low(p) ? `Only ${p.qty} left` : `${p.qty} in stock`}</span>}
    </div>
  );
}
// Keeps the picture hidden until it has loaded, including pictures that finish before hydration.
export const imgRef = (el: HTMLImageElement | null) => { if (el && el.complete && el.naturalWidth) el.classList.add('ld'); };

export default function ProductCard({ p, add = true }: { p: Product; add?: boolean }) {
  const { addToCart } = useApp();
  const o = off(p), out = soldOut(p), im = cl(p.img, 420), lq = cl(p.img, 24);
  return (
    <article className="pc">
      <Link className="pimg" href={`/shop/${p.id}`} aria-label={`View ${p.name}`} style={lq ? { backgroundImage: `url(${lq})` } : undefined}>
        {im ? <img ref={imgRef} src={im} alt={p.name} loading="lazy" onLoad={(e) => e.currentTarget.classList.add('ld')} onError={(e) => e.currentTarget.remove()} /> : <div className="ph"><Icon n="bag" /></div>}
        {o > 0 && !out && <span className="tag">-{o}%</span>}
        {out && <span className="tag out">Sold out</span>}
      </Link>
      <div className="pb">
        <Link href={`/shop/${p.id}`} className="ptitle"><h3 className="clamp">{p.name}</h3></Link>
        <Meta p={p} />
        <div className="pf">
          <div className="pr"><b>{naira(p.price)}</b>{o > 0 && <s>{naira(p.was)}</s>}</div>
          {add && !out && <button className="plus" aria-label={`Add ${p.name} to cart`} onClick={() => addToCart(p)}><Icon n="plus" /></button>}
        </div>
      </div>
    </article>
  );
}
