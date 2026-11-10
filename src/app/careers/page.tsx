'use client';
import { useEffect, useState } from 'react';
import { getFb } from '@/lib/firebase';
import { useApp } from '@/components/Providers';
import { Loading, Empty, Sheet, fd } from '@/components/ui';

export default function Careers() {
  const { toast } = useApp();
  const [L, setL] = useState<any[] | null>(null), [job, setJob] = useState<any>(null);
  useEffect(() => { const fb = getFb(); fb.getDocs(fb.query(fb.collection(fb.db, 'jobs'), fb.where('active', '==', true))).then((s) => setL(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => setL([])); }, []);
  const apply = async (e) => {
    const { v } = fd(e), fb = getFb();
    try {
      await fb.addDoc(fb.collection(fb.db, 'applications'), { jobId: job.id, jobTitle: job.title, name: v.name.trim().slice(0, 100), email: v.email.trim(), phone: v.phone.trim(), cv: v.cv.trim(), note: (v.note || '').slice(0, 1500), status: 'SUBMITTED', createdAt: fb.serverTimestamp() });
      setJob(null); toast('Application sent. Thank you.');
    } catch { toast('Could not send. Check the CV link starts with https://'); }
  };
  return (
    <div className="wrap">
      <h1 style={{ fontSize: '2rem' }}>Careers</h1>
      <p className="mut" style={{ margin: '.4rem 0 1rem' }}>Join the Bamyon team.</p>
      {L === null ? <Loading /> : !L.length ? <Empty>No openings right now. Please check back soon.</Empty> : L.map((j) => (
        <div className="ord" key={j.id}><h3>{j.title}</h3>{j.location && <div className="mut">{j.location}</div>}<p>{j.desc}</p><button className="go" onClick={() => setJob(j)}>Apply</button></div>
      ))}
      {job && <Sheet title={'Apply: ' + job.title} onClose={() => setJob(null)}>
        <form className="f" onSubmit={apply}><input name="name" placeholder="Full name" required maxLength={100} /><input name="email" type="email" placeholder="Email" required /><input name="phone" type="tel" placeholder="Phone number" required />
          <input name="cv" type="url" placeholder="Link to your CV (https://...)" required pattern="https://.*" /><textarea name="note" rows={3} placeholder="Tell us about yourself" maxLength={1500} /><button className="go">Send application</button></form></Sheet>}
    </div>
  );
}
