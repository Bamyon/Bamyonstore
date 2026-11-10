import Link from 'next/link';
import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import { SERVICES } from '@/config/services';
import { BRAND, waLink } from '@/config/brand';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Bamyon Studio builds websites, designs brands and sets up Google Business Profiles for businesses that want to be trusted and found.',
};

export default function ServicesPage() {
  return (
    <div className="wrap">
      <section className="svc-hero">
        <h1>Bamyon Studio</h1>
        <p className="lead">Websites, graphics and Google presence that make people notice you, trust you and choose you.</p>
        <div className="row"><a className="btn go lg" href={waLink('Hello Bamyon, I would like to talk about your services.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a><a className="btn alt lg" href={`mailto:${BRAND.email}`}>Email us</a></div>
      </section>
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="svc-card">
            <span className="svc-ic"><Icon n={s.icon} /></span>
            <h3>{s.title}</h3>
            <p className="mut">{s.short}</p>
            <span className="svc-more">Learn more <Icon n="arrowr" /></span>
          </Link>
        ))}
      </div>
      <section className="lx-sec" style={{ padding: '3rem 0 0' }}>
        <h2>Why businesses need this.</h2>
        <p className="lead mut" style={{ maxWidth: '44rem', marginTop: '.8rem' }}>Customers decide quickly, and mostly on feeling. They look you up, compare how you look, and check whether others trust you before they ever message you. Each of our services works on one part of that journey: being found, looking credible, and being remembered.</p>
      </section>
      <section className="lx-cta" style={{ margin: '3rem 0 0' }}>
        <div><h2>Not sure what you need?</h2><p>Tell us about your business and we will point you to the simplest next step. No pressure.</p></div>
        <a className="btn go lg" href={waLink('Hello Bamyon, I am not sure which service I need. Can you advise me?')} target="_blank" rel="noopener noreferrer">Talk to us</a>
      </section>
    </div>
  );
}
