import Link from 'next/link';
import Icon from '@/components/Icon';
import ProductCard from '@/components/ProductCard';
import { getProducts, getPosts } from '@/lib/server';
import { cl } from '@/lib/util';
import { BRAND, waLink } from '@/config/brand';
import { SERVICES } from '@/config/services';

export const revalidate = 60;
const WHY = [
  ['bag', 'Shop everything', 'Clothes, shoes, food, gadgets and more, all under one roof.'],
  ['star', 'Quality you can trust', 'Real products, honest prices and reviews from verified buyers.'],
  ['wallet', BRAND.wallet, `Pay with your balance and send money to friends by ${BRAND.idLabel}.`],
  ['truck', 'Delivery & tracking', 'Follow every order from packing to your doorstep.'],
];

export default async function Home() {
  const [prods, posts] = await Promise.all([getProducts(), getPosts()]);
  const pick = prods.filter((p) => p.stock !== false && !(typeof p.qty === 'number' && p.qty <= 0))
    .sort((a, b) => (Number(!!b.featured) - Number(!!a.featured)) || ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))).slice(0, 8);
  return (
    <>
      <section className="lx-hero">
        <div className="in">
          <h1>Shop what you love. <span className="gold">Build what you need.</span></h1>
          <p className="lead">{BRAND.name} brings clothes, food and gadgets to your door. Bamyon Studio builds the websites, brands and Google presence that help businesses get found and trusted.</p>
          <div className="row"><Link className="btn go lg" href="/shop">Enter the shop</Link><Link className="btn alt lg" href="/services">Explore our services</Link></div>
        </div>
        <div className="emb" aria-hidden="true"><i /><i /><i /><img src={BRAND.logoLg} alt="" width="256" height="256" /><span>Fashion</span><span>Gadgets</span><span>Websites</span></div>
      </section>

      <section className="lx-sec"><h2>What Bamyon does</h2>
        <div className="duo">
          <article className="duo-card store">
            <span className="svc-ic"><Icon n="bag" /></span><h3>Bamyon Store</h3>
            <p>An online store for clothes, shoes, food, gadgets, beauty and home items. Pay on delivery or from your {BRAND.wallet}, track every order, and chat with us any time.</p>
            <div className="tags"><span>Clothes</span><span>Shoes</span><span>Food</span><span>Gadgets</span><span>Beauty</span><span>Home</span></div>
            <Link className="btn go" href="/shop">Shop now</Link>
          </article>
          <article className="duo-card studio">
            <span className="svc-ic"><Icon n="palette" /></span><h3>Bamyon Studio</h3>
            <p>A creative studio for businesses. We build websites, design brands and set up your Google Business Profile, all shaped around how customers think and decide.</p>
            <div className="tags"><span>Websites</span><span>Graphic design</span><span>Google Business Profile</span></div>
            <Link className="btn alt" href="/services">See services</Link>
          </article>
        </div>
      </section>

      {pick.length > 0 && <section className="lx-sec"><h2>New in the shop</h2><div className="pgrid">{pick.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <p style={{ marginTop: '1.5rem' }}><Link className="btn alt" href="/shop">See everything in the shop</Link></p></section>}

      <section className="lx-sec"><h2>Make your business easy to choose.</h2>
        <div className="lx-grid">{SERVICES.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="lx-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Icon n={s.icon} /><h3>{s.title}</h3><p>{s.hook}</p><span className="svc-more">Learn more <Icon n="arrowr" /></span>
          </Link>))}</div></section>

      <section className="lx-sec"><h2>Why shop with us.</h2>
        <div className="lx-grid">{WHY.map(([i, t, d]) => <div className="lx-card" key={t}><Icon n={i} /><h3>{t}</h3><p>{d}</p></div>)}</div></section>

      <section className="lx-sec"><h2>Three steps. No stress.</h2>
        <div className="lx-steps"><div><b>1</b><h3>Choose</h3><p>Browse the shop and pick what you love.</p></div><div><b>2</b><h3>Pay your way</h3><p>Pay on delivery, or from your {BRAND.wallet} with a PIN.</p></div><div><b>3</b><h3>Track</h3><p>Follow your order from packing to your doorstep.</p></div></div></section>

      <section className="lx-cta"><div><h2>Need a website, a logo or a Google listing?</h2><p>Tell us about your business. We will reply with a clear plan and a written quote. Free to ask.</p></div>
        <div className="row"><a className="btn go lg" href={waLink('Hello Bamyon, I would like to talk about your services.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a><a className="btn alt lg" href={`mailto:${BRAND.email}`}>Email us</a></div></section>

      <section className="lx-cta alt2"><div><h2>Sell with {BRAND.short}.</h2><p>Open an account and apply as a partner. Once approved, your products appear in front of our customers.</p></div><Link className="btn go lg" href="/login?mode=up">Become a partner</Link></section>

      {posts.length > 0 && <section className="lx-sec"><h2>From the blog</h2><div className="jgrid">{posts.slice(0, 3).map((p) => (
        <Link key={p.id} href={`/blog/${p.id}`} className="pc" style={{ textDecoration: 'none' }}>
          {cl(p.cover, 640) ? <img src={cl(p.cover, 640)} alt="" loading="lazy" style={{ width: '100%', height: 'auto' }} /> : <div className="ph"><Icon n="book" /></div>}
          <div className="pb"><h3 className="clamp">{p.title}</h3><p className="mut clamp">{(p.body || '').slice(0, 120)}</p></div></Link>))}</div></section>}

      <footer className="foot">
        <div><b>{BRAND.name}</b><p className="mut">{BRAND.tagline}{BRAND.location ? ' ' + BRAND.location : ''}</p></div>
        <div><a href={waLink('Hello Bamyon')} target="_blank" rel="noopener noreferrer">WhatsApp +{BRAND.whatsapp}</a><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></div>
        <div><Link href="/shop">Shop</Link><Link href="/services">Services</Link><Link href="/blog">Blog</Link><Link href="/reviews">Reviews</Link><Link href="/careers">Careers</Link></div>
      </footer>
    </>
  );
}
