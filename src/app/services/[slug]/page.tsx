import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import { SERVICES, getService } from '@/config/services';
import { BRAND, waLink } from '@/config/brand';

export function generateStaticParams() { return SERVICES.map((s) => ({ slug: s.slug })); }

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getService(params.slug);
  return s ? { title: s.title, description: s.short } : { title: 'Services' };
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const s = getService(params.slug);
  if (!s) notFound();
  const others = SERVICES.filter((x) => x.slug !== s.slug);
  return (
    <div className="wrap">
      <Link className="back" href="/services"><Icon n="back" />All services</Link>
      <section className="svc-hero">
        <span className="svc-ic big"><Icon n={s.icon} /></span>
        <h1>{s.title}</h1>
        <p className="lead">{s.hook}</p>
        <div className="row"><a className="btn go lg" href={waLink(s.ask)} target="_blank" rel="noopener noreferrer">Get a free quote on WhatsApp</a><a className="btn alt lg" href={`mailto:${BRAND.email}?subject=${encodeURIComponent(s.title)}`}>Email us</a></div>
      </section>

      <section className="svc-sec"><h2>What it is</h2><p className="svc-p">{s.intro}</p></section>

      <section className="svc-sec"><h2>What is included</h2>
        <ul className="chk">{s.includes.map((i) => <li key={i}><span><Icon n="check" /></span>{i}</li>)}</ul></section>

      <section className="svc-sec"><h2>Why you need it</h2>
        <p className="mut" style={{ maxWidth: '42rem', marginBottom: '1.2rem' }}>This is not about decoration. It is about how people actually think and decide.</p>
        <div className="psy-grid">{s.why.map((w, i) => (
          <article className="psy" key={w.title} style={{ ['--i' as any]: i }}>
            <span className="psy-tag">{w.principle}</span><h3>{w.title}</h3><p>{w.text}</p>
          </article>))}</div></section>

      <section className="svc-sec"><h2>How we work</h2>
        <ol className="steps2">{s.process.map((p, i) => <li key={p.t}><b>{i + 1}</b><div><h3>{p.t}</h3><p className="mut">{p.d}</p></div></li>)}</ol></section>

      <section className="svc-sec"><h2>Questions people ask</h2>
        <div className="faq">{s.faqs.map((f) => <details key={f.q}><summary>{f.q}<Icon n="chevron" /></summary><p>{f.a}</p></details>)}</div></section>

      <section className="lx-cta" style={{ margin: '2.5rem 0' }}>
        <div><h2>Ready when you are.</h2><p>Send us a message and we will reply with a clear plan and a written quote. Free to ask, no pressure.</p></div>
        <a className="btn go lg" href={waLink(s.ask)} target="_blank" rel="noopener noreferrer">Start on WhatsApp</a>
      </section>

      <h3 style={{ margin: '0 0 .8rem' }}>More from Bamyon Studio</h3>
      <div className="svc-grid">{others.map((o) => (
        <Link key={o.slug} href={`/services/${o.slug}`} className="svc-card"><span className="svc-ic"><Icon n={o.icon} /></span><h3>{o.title}</h3><p className="mut">{o.short}</p><span className="svc-more">Learn more <Icon n="arrowr" /></span></Link>))}</div>
    </div>
  );
}
