// Bamyon Studio services. Pages under /services are generated from this file.
export interface Service {
  slug: string; title: string; icon: string; short: string; hook: string; intro: string;
  includes: string[];
  why: { principle: string; title: string; text: string }[];
  process: { t: string; d: string }[];
  faqs: { q: string; a: string }[];
  ask: string; // pre-written WhatsApp message
}

export const SERVICES: Service[] = [
  {
    slug: 'website-design',
    title: 'Website design & development',
    icon: 'globe',
    short: 'A fast, beautiful website that earns trust and turns visitors into customers.',
    hook: 'Your website is a shop window that never closes.',
    intro: 'We plan, design and build a website around how your customers actually think and decide. That means a clear message, a layout that is easy to scan on a phone, pages that load quickly, and an obvious next step on every screen: call, order, book or message you on WhatsApp. You get a finished, live website, not a template with your name pasted on it.',
    includes: [
      'Custom design that matches your brand, not a generic template',
      'Mobile-first layout, because most visitors browse on their phones',
      'Fast loading pages and clean, professional structure',
      'Clear calls to action: WhatsApp, phone, contact form or checkout',
      'On-page search engine setup so people can find you on Google',
      'Online store, booking or catalogue if your business needs one',
      'Domain and hosting set up and connected for you',
      'Handover training, so you know how to keep it fresh',
    ],
    why: [
      { principle: 'First impressions', title: 'People judge in a blink', text: 'Studies on web credibility have repeatedly found that visitors form an opinion of a site almost instantly, and that visual design is one of the biggest reasons people decide to trust it or leave. A polished site makes the right first impression before you say a word.' },
      { principle: 'The halo effect', title: 'Looking professional makes you seem reliable', text: 'When one thing about a business looks excellent, people tend to assume the rest is excellent too. A well-built website lifts how customers see your products, your prices and your service.' },
      { principle: 'Processing fluency', title: 'Easy to read feels easy to trust', text: 'People tend to trust what feels effortless to understand. Clear headings, generous spacing and simple wording reduce mental effort, and that comfort quietly turns into confidence in you.' },
      { principle: 'Social proof', title: 'Show others already trust you', text: 'We place reviews, past work and real photos where hesitant buyers look. Seeing that other people chose you lowers the perceived risk of being the first to try.' },
      { principle: 'Fewer choices, clearer action', title: 'Confused visitors do nothing', text: 'When there are too many options, people freeze or leave. We guide each page toward one main action so more visitors become enquiries and sales.' },
      { principle: 'Always-on selling', title: 'Customers research before they buy', text: 'Most people look a business up before they message or visit. Your website answers their questions at any hour, so you are available even when you are asleep.' },
    ],
    process: [
      { t: 'Discovery chat', d: 'We learn about your business, your customers and what you want the site to achieve.' },
      { t: 'Plan and content', d: 'We map the pages and the message, and tell you exactly what we need from you.' },
      { t: 'Design preview', d: 'You see the design before we build, and we adjust it with you.' },
      { t: 'Build and test', d: 'We build it, then test on phones, tablets and computers.' },
      { t: 'Launch', d: 'We connect your domain, go live and check everything works.' },
      { t: 'Support', d: 'We train you and stay available for updates and questions.' },
    ],
    faqs: [
      { q: 'How long does a website take?', a: 'Most business websites take one to three weeks, depending on the number of pages and how quickly your photos and text are ready.' },
      { q: 'How much does it cost?', a: 'It depends on the pages and features you need. After a short chat we give you a clear written quote, so there are no surprises.' },
      { q: 'Do I need my own domain name?', a: 'A domain such as yourbusiness.com makes you look established. We help you choose, buy and connect one.' },
      { q: 'Can I change things later?', a: 'Yes. We show you how to update it yourself, or you can ask us to make changes for you.' },
    ],
    ask: 'Hello Bamyon, I would like a website for my business. Can we talk about it?',
  },
  {
    slug: 'graphic-design',
    title: 'Graphic design & branding',
    icon: 'palette',
    short: 'Logos, flyers and social media designs that make people remember you.',
    hook: 'People remember what they see. Make sure they remember you.',
    intro: 'Your brand is the feeling people get when they see your name. We design a consistent look, from your logo and colours to flyers, posts and packaging, so every place customers meet you says the same thing: this business is serious, reliable and worth choosing.',
    includes: [
      'Logo design with versions for light, dark and small spaces',
      'Brand colours and fonts chosen for your audience',
      'Business cards, letterheads and invoices',
      'Flyers, posters, banners and roll-ups',
      'Social media post and story templates you can reuse',
      'Product labels, packaging and price lists or menus',
      'A simple brand guide so your look stays consistent',
      'Print-ready and web-ready files',
    ],
    why: [
      { principle: 'The mere-exposure effect', title: 'Familiar feels preferable', text: 'People tend to prefer what they have seen before. A consistent logo and colour scheme, repeated everywhere, makes your business feel familiar, and familiar feels safe to buy from.' },
      { principle: 'Picture superiority', title: 'Images are remembered better than words', text: 'Research on memory shows people recall pictures better than text alone. A strong visual identity helps customers remember you the next time they need what you sell.' },
      { principle: 'Colour associations', title: 'Colour sets the mood', text: 'Colours carry associations, though they vary by culture and context. We choose a palette that fits your market and then use it consistently, so it becomes a signal people recognise.' },
      { principle: 'Perceived value', title: 'Better presentation, higher perceived worth', text: 'Customers judge quality by how things look. Professional design supports fair, confident pricing, because the product looks as good as it is.' },
      { principle: 'Consistency builds trust', title: 'Matching materials look reliable', text: 'When your flyer, page and packaging all match, it signals a business that is organised and dependable. Mismatched visuals do the opposite.' },
      { principle: 'The scroll test', title: 'You have a moment on social media', text: 'Feeds move fast. A clean, bold design is what makes a thumb stop on your post long enough to read it.' },
    ],
    process: [
      { t: 'Brief', d: 'You tell us about your business, your customers and the style you like.' },
      { t: 'Research and mood board', d: 'We look at your market and show a direction before designing.' },
      { t: 'Concepts', d: 'You receive design options to react to.' },
      { t: 'Revisions', d: 'We refine your favourite until it feels right.' },
      { t: 'Final files and guide', d: 'You receive all the files you need, plus a short guide on using them.' },
    ],
    faqs: [
      { q: 'What files will I receive?', a: 'Print-ready and web-ready files such as PNG, JPG and PDF. Editable source files can be included and are agreed in your quote.' },
      { q: 'How many revisions do I get?', a: 'Reasonable rounds of revisions are included. We agree the details in your quote so everything is clear from the start.' },
      { q: 'I already have a logo. Can you improve it?', a: 'Yes. We can refresh it, rebuild it in clean formats, or design a full set of materials around it.' },
      { q: 'Can you design for print as well as social media?', a: 'Yes. We design for both and can guide you on printing.' },
    ],
    ask: 'Hello Bamyon, I need graphic design help (logo / flyers / social media). Can we talk?',
  },
  {
    slug: 'google-business-profile',
    title: 'Google Business Profile setup',
    icon: 'pin',
    short: 'Get found on Google and Maps by people nearby who are ready to buy.',
    hook: 'Be found at the exact moment people are ready to buy.',
    intro: 'Google Business Profile (formerly Google My Business) is the free listing that appears when people search for your business or for what you sell nearby. We create or claim it, verify it, and fill it in properly with the right category, photos, services, hours and links, so you look complete, credible and easy to contact.',
    includes: [
      'Create or claim your listing and guide you through verification',
      'The right business category and service list',
      'Opening hours, phone, WhatsApp and website links',
      'Logo, cover photo and a gallery of strong images',
      'A clear, keyword-aware business description',
      'Products or services added with prices where suitable',
      'A simple way for happy customers to leave reviews, including a link or QR code',
      'Guidance on replying to reviews and posting updates',
    ],
    why: [
      { principle: 'Intent', title: 'Local searchers are ready to act', text: 'People who search for something near them are usually close to a decision, such as buying, visiting or calling. Being visible at that moment puts you in front of ready customers.' },
      { principle: 'Social proof', title: 'Reviews guide choices', text: 'Most people read reviews before choosing a local business. A profile with genuine reviews and photos looks safer than a blank one.' },
      { principle: 'Completeness signals credibility', title: 'A full profile looks real', text: 'Missing hours, no photos and no description make a business look abandoned. A complete profile shows you are active and open for business.' },
      { principle: 'The consideration set', title: 'If you are not seen, you are not chosen', text: 'Customers compare only the options they find. If you do not appear, you are not even in the running, however good you are.' },
      { principle: 'Less effort, more action', title: 'One tap to call or get directions', text: 'People act when the next step is easy. Call, message and directions buttons remove friction between interest and a visit.' },
      { principle: 'Authority', title: 'A verified listing builds confidence', text: 'A verified, accurate profile tells Google and customers that the business is real and trustworthy.' },
    ],
    process: [
      { t: 'Quick call', d: 'We confirm your business details and what you want to be found for.' },
      { t: 'Create and verify', d: 'We set up the listing and guide you through Google verification.' },
      { t: 'Optimise', d: 'We complete every section with the right information.' },
      { t: 'Photos and posts', d: 'We add images and your first updates.' },
      { t: 'Review link', d: 'We give you a link and QR code to collect reviews easily.' },
      { t: 'Handover', d: 'We show you how to keep it active and answer reviews.' },
    ],
    faqs: [
      { q: 'Is a Google Business Profile free?', a: 'Yes, the listing itself is free from Google. Our fee covers setting it up properly and saving you the time and guesswork.' },
      { q: 'How long does verification take?', a: 'Google decides the method and timing, which can be a quick video check, a phone code or a postcard. We guide you through whichever one Google asks for.' },
      { q: 'Can you make me number one on Google?', a: 'No one can honestly promise a ranking. We build a complete, accurate, well-optimised profile, which gives you the best possible chance to be seen.' },
      { q: 'I already have a listing. Can you fix it?', a: 'Yes. We can claim, correct and improve an existing listing, including duplicate or wrong information.' },
    ],
    ask: 'Hello Bamyon, I need help setting up my Google Business Profile. Can we talk?',
  },
];

export const getService = (slug: string): Service | undefined => SERVICES.find((s) => s.slug === slug);
