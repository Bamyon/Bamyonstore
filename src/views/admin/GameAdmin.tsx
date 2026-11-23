'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { useLive } from '@/lib/hooks';
import { getFb } from '@/lib/firebase';
import { call } from '@/lib/api';
import { Pill, Empty, Loading, Sheet, fd } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { GAME_NAME, type GameKind } from '@/lib/games';
import { standings } from '@/lib/gamesApi';
import { naira, when } from '@/lib/util';

function Standings({ t, onClose }: { t: any; onClose: () => void }) {
  const { toast } = useApp();
  const players = useLive((fb) => fb.query(fb.collection(fb.db, 'tournaments', t.id, 'players'), fb.limit(200)), [t.id]);
  const matches = useLive((fb) => fb.query(fb.collection(fb.db, 'matches'), fb.where('tid', '==', t.id), fb.limit(400)), [t.id]);
  const [busy, setBusy] = useState('');
  const table = standings(matches.docs as any, players.docs.map((p) => ({ id: p.id, name: p.name })));
  const award = async (w: { id: string; name: string }) => {
    if (!confirm(`Pay ${naira(t.prize)} to ${w.name} and finish this tournament?`)) return;
    setBusy(w.id);
    try {
      if (t.prize > 0) await call('adjust', { uid: w.id, amount: t.prize, reason: 'Tournament prize: ' + t.title });
      const fb = getFb(); await fb.updateDoc(t.ref, { status: 'finished', winnerUid: w.id, winnerName: w.name, finishedAt: fb.serverTimestamp() });
      toast('Prize paid and tournament finished.'); onClose();
    } catch (e: any) { toast(e.message || 'Could not pay the prize.'); }
    setBusy('');
  };
  return (
    <Sheet title={'Standings: ' + t.title} onClose={onClose}>
      <p className="mut">Score = different players beaten. Check the games before paying.</p>
      {table.length ? table.map((r, i) => <div className="line" key={r.id}><span><b>{i + 1}.</b> {r.name}<br /><small className="mut">{r.played} played, {r.beaten} beaten</small></span>{t.status !== 'finished' && <button className="go sm" disabled={!!busy} onClick={() => award(r)}>{busy === r.id ? '...' : 'Award prize'}</button>}</div>) : <Empty>No entrants yet.</Empty>}
    </Sheet>
  );
}

export default function GameAdmin() {
  const { pub, toast } = useApp();
  const [view, setView] = useState<any>(null), [busy, setBusy] = useState('');
  const tours = useLive((fb) => fb.query(fb.collection(fb.db, 'tournaments'), fb.limit(50)), []);
  const claims = useLive((fb) => fb.query(fb.collection(fb.db, 'gameClaims'), fb.limit(100)), []);
  const reward = +pub?.gameReward || BRAND.gameReward;
  const create = async (e: any) => {
    const { v, form } = fd(e), fb = getFb();
    try { await fb.addDoc(fb.collection(fb.db, 'tournaments'), { title: v.title.trim(), game: v.game, level: v.level, prize: Math.max(0, Math.round(+v.prize || 0)), note: (v.note || '').trim(), status: 'open', createdAt: fb.serverTimestamp() }); form.reset(); toast('Tournament created.'); }
    catch { toast('Could not create the tournament.'); }
  };
  const setStatus = async (t: any, status: string) => { const fb = getFb(); try { await fb.updateDoc(t.ref, { status }); } catch { toast('Not allowed.'); } };
  const pay = async (c: any) => {
    if (!confirm(`Pay ${naira(reward)} to ${c.name}? They have ${c.wins} online wins. Check their games first.`)) return;
    setBusy(c.id);
    try { await call('adjust', { uid: c.id, amount: reward, reason: 'Legend reward: online games won' }); const fb = getFb(); await fb.updateDoc(c.ref, { status: 'PAID', paidAt: fb.serverTimestamp() }); toast('Reward paid.'); }
    catch (e: any) { toast(e.message || 'Could not pay.'); }
    setBusy('');
  };
  const reject = async (c: any) => { const note = prompt('Reason (optional)') || ''; const fb = getFb(); try { await fb.updateDoc(c.ref, { status: 'REJECTED', note }); } catch { toast('Not allowed.'); } };
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '.8rem' }}>Games and prizes</h1>
      <div className="ord">
        <h3>Host a tournament</h3>
        <form className="f" onSubmit={create}>
          <input name="title" placeholder="Tournament name (e.g. Weekend Math Cup)" required />
          <div className="row"><select name="game" style={{ flex: 1 }}><option value="ttt">{GAME_NAME.ttt}</option><option value="math">{GAME_NAME.math}</option></select><select name="level" style={{ flex: 1 }} defaultValue="medium"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
          <input name="prize" type="number" min={0} placeholder="Prize in NGN (paid into the winner's wallet)" />
          <textarea name="note" rows={2} placeholder="Rules or message (optional)" maxLength={300} />
          <button className="go">Create tournament</button>
        </form>
      </div>
      <h3 className="sec">Tournaments</h3>
      {tours.loading ? <Loading /> : !tours.docs.length ? <Empty>No tournaments yet.</Empty> : tours.docs.map((t) => (
        <div className="ord" key={t.id}>
          <div className="row"><b>{t.title}</b><Pill>{t.status}</Pill><b style={{ marginLeft: 'auto' }}>{naira(t.prize || 0)}</b></div>
          <div className="mut">{GAME_NAME[t.game as GameKind]}{t.game === 'math' ? ` | ${t.level}` : ''}{t.winnerName ? ` | winner ${t.winnerName}` : ''}</div>
          <div className="row"><button className="alt" onClick={() => setView(t)}>Standings{t.status !== 'finished' ? ' and award' : ''}</button>
            {t.status === 'open' && <button className="alt" onClick={() => setStatus(t, 'closed')}>Close entries</button>}{t.status === 'closed' && <button className="alt" onClick={() => setStatus(t, 'open')}>Reopen entries</button>}</div>
        </div>
      ))}
      <h3 className="sec">Legend reward requests</h3>
      <p className="mut">Players who reach the win target can request the reward. Check their games, then pay or reject. The amount and target are set in Store settings.</p>
      {claims.loading ? <Loading /> : !claims.docs.length ? <Empty>No requests yet.</Empty> : claims.docs.map((c) => (
        <div className="ord" key={c.id}>
          <div className="row"><b>{c.name}</b><Pill>{String(c.status).toLowerCase()}</Pill><b style={{ marginLeft: 'auto' }}>{c.wins} wins</b></div><div className="mut">{when(c.createdAt)}{c.note ? ' | ' + c.note : ''}</div>
          {c.status === 'PENDING' && <div className="row"><button className="go" disabled={busy === c.id} onClick={() => pay(c)}>Pay {naira(reward)}</button><button className="alt" onClick={() => reject(c)}>Reject</button></div>}
        </div>
      ))}
      {view && <Standings t={view} onClose={() => setView(null)} />}
    </>
  );
}
