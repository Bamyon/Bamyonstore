'use client';
import { useApp } from '@/components/Providers';
import { useDocLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { Loading, Pill, fd } from '@/components/ui';

export default function Partner() {
  const { user, profile, toast } = useApp();
  const { data, loading } = useDocLive((fb) => fb.doc(fb.db, 'partners', user.uid), [user.uid]);
  if (loading) return <Loading />;
  const apply = async (e: any) => {
    const { v } = fd(e), fb = getFb();
    try { await fb.setDoc(fb.doc(fb.db, 'partners', user.uid), { uid: user.uid, name: profile.name || '', business: v.biz.trim(), phone: profile.phone || '', about: v.about.trim().slice(0, 600), status: 'PENDING', at: fb.serverTimestamp() }); toast('Application sent.'); } catch { toast('Could not send your application.'); }
  };
  return (
    <div className="wrap" style={{ maxWidth: '40rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '.6rem' }}>Become a partner</h1>
      {data ? <div className="ord"><div className="row"><b>{data.business}</b><Pill>{String(data.status).toLowerCase()}</Pill></div><p className="mut">{data.status === 'PENDING' ? 'We are reviewing your application.' : data.status === 'APPROVED' ? 'You are approved. Sign out and in again, then open My products.' : 'This application was not approved.'}{data.note ? ' ' + data.note : ''}</p></div> : (
        <form className="ord" onSubmit={apply}><p className="mut">Sell your products to Bamyon customers. Tell us about your business.</p>
          <input name="biz" placeholder="Business name" required /><textarea name="about" rows={4} placeholder="What do you sell?" maxLength={600} required /><button className="go">Send application</button></form>
      )}
    </div>
  );
}
