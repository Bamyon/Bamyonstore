import Link from 'next/link';
import Icon from '@/components/Icon';
import ProductCard from '@/components/ProductCard';
import { getProducts, getPosts } from '@/lib/server';
import { cl, naira } from '@/lib/util';
import { BRAND, waLink } from '@/config/brand';
import { SERVICES } from '@/config/services';
import { RANKS } from '@/lib/games';

export const revalidate = 60;

export default async function Home() {
  const [prods, posts] = await Promise.all([getProducts(), getPosts()]);
  const pick = prods.filter((p) => p.stock !== false && !(typeof p.qty === 'number' && p.qty <= 0))
    .sort((a, b) => (Number(!!b.featured) - Number(!!a.featured)) || ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))).slice(0, 8);
  return (
    <>
      <section className="lx-hero">
        <div className="in">
          <h1>Websites, brands and games <span className="gold">that bring people in.</span></h1>
          <p className="lead">Bamyon designs websites, graphics and Google presence for businesses, hosts the games where friends play for ranks and prizes, and keeps a full shop open for everyone.</p>
          <div className="row"><Link className="btn go lg" href="/services">Explore our services</Link><Link className="btn alt lg" href="/games">Play a game</Link></div>
        </div>
        <div className="emb" aria-hidden="true"><i /><i /><i /><img src={BRAND.logoLg} alt="" width="256" /><span>Websites</span><span>Games</span><span>Shop</span></div>
      </section>

      <section className="lx-sec"><h2>What Bamyon does</h2>
        <div className="duo">
          <article className="duo-card studio">
            <span className="svc-ic"><Icon n="palette" /></span><h3>Studio</h3>
            <p>Websites, graphic design and Google Business Profile for businesses that want to be found, trusted and chosen.</p>
            <Link className="btn go" href="/services">See services</Link>
          </article>
          <article className="duo-card store">
            <span className="svc-ic"><Icon n="gamepad" /></span><h3>Games</h3>
            <p>Tic-Tac-Toe and Math Duel against the computer or your friends. Win online to climb the ranks, join tournaments and earn prizes.</p>
            <Link className="btn go" href="/games">Play now</Link>
          </article>
          <article className="duo-card studio">
            <span className="svc-ic"><Icon n="bag" /></span><h3>Shop</h3>
            <p>A full online shop with wallet payments, order tracking and delivery. Clothes, food, gadgets and more.</p>
            <Link className="btn alt" href="/shop">Open the shop</Link>
          </article>
        </div>
      </section>

      <section className="lx-sec"><h2>Make your business easy to choose.</h2>
        <div className="lx-grid">{SERVICES.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="lx-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Icon n={s.icon} /><h3>{s.title}</h3><p>{s.hook}</p><span className="svc-more">Learn more <Icon n="arrowr" /></span>
          </Link>))}</div></section>

      <section className="lx-sec"><h2>Play. Rank up. Win.</h2>
        <p className="lead mut" style={{ maxWidth: '44rem', margin: '-.6rem 0 1.2rem' }}>Challenge friends in Tic-Tac-Toe or race them in Math Duel, where the first to type the answer scores. Practise against the computer for free, then take it online.</p>
        <div className="ladder">{RANKS.map((r) => <span className="rankb" key={r.name}>{r.emoji} {r.name}</span>)}</div>
        <div className="duo">
          <article className="duo-card store"><span className="svc-ic"><Icon n="gamepad" /></span><h3>Tic-Tac-Toe</h3><p>Online with friends, or against the computer on easy, medium or hard.</p><div className="tags"><span>Online</span><span>Vs computer</span><span>Invite by link</span></div></article>
          <article className="duo-card studio"><span className="svc-ic"><Icon n="bolt" /></span><h3>Math Duel</h3><p>Ten questions, ten seconds each. Add, subtract, multiply and divide faster than your opponent.</p><div className="tags"><span>Easy</span><span>Medium</span><span>Hard</span></div></article>
        </div>
        <p style={{ marginTop: '1.2rem' }}>Reach <b>Legend</b> with {BRAND.gameRewardWins} online wins and claim a {naira(BRAND.gameReward)} reward. Losing a game never takes your progress away.</p>
        <p style={{ marginTop: '1rem' }}><Link className="btn go lg" href="/games">Start playing</Link></p>
      </section>

      {pick.length > 0 && <section className="lx-sec"><h2>New in the shop</h2><div className="pgrid">{pick.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <p style={{ marginTop: '1.5rem' }}><Link className="btn alt" href="/shop">See everything in the shop</Link></p></section>}

      <section className="lx-cta"><div><h2>Need a website, a logo or a Google listing?</h2><p>Tell us about your business. We will reply with a clear plan and a written quote. Free to ask.</p></div>
        <div className="row"><a className="btn go lg" href={waLink('Hello Bamyon, I would like to talk about your services.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a><a className="btn alt lg" href={`mailto:${BRAND.email}`}>Email us</a></div></section>

      {posts.length > 0 && <section className="lx-sec"><h2>From the blog</h2><div className="jgrid">{posts.slice(0, 3).map((p) => (
        <Link key={p.id} href={`/blog/${p.id}`} className="pc" style={{ textDecoration: 'none' }}>
          {cl(p.cover, 640) ? <img src={cl(p.cover, 640)} alt="" loading="lazy" style={{ width: '100%', height: 'auto' }} /> : <div className="ph"><Icon n="book" /></div>}
          <div className="pb"><h3 className="clamp">{p.title}</h3><p className="mut clamp">{(p.body || '').slice(0, 120)}</p></div></Link>))}</div></section>}

      <footer className="foot">
        <div><b>{BRAND.name}</b><p className="mut">{BRAND.tagline}{BRAND.location ? ' ' + BRAND.location : ''}</p></div>
        <div><a href={waLink('Hello Bamyon')} target="_blank" rel="noopener noreferrer">WhatsApp +{BRAND.whatsapp}</a><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></div>
        <div><Link href="/services">Services</Link><Link href="/games">Games</Link><Link href="/shop">Shop</Link><Link href="/blog">Blog</Link><Link href="/careers">Careers</Link></div>
      </footer>
    </>
  );
}
