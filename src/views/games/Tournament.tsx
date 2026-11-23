'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { useDocLive, useLive } from '@/lib/hooks';
import Icon from '@/components/Icon';
import { Loading, Pill } from '@/components/ui';
import { GAME_NAME, type GameKind, type Level } from '@/lib/games';
import { createMatch, ensurePlayer, joinTournament, standings } from '@/lib/gamesApi';
import { naira, safeImg } from '@/lib/util';

export default function Tournament({ id }: { id: string }) {
  const { user, profile, toast } = useApp();
  const router = useRouter();
  const t = useDocLive((fb) => fb.doc(fb.db, 'tournaments', id), [id]);
  const players = useLive((fb) => fb.query(fb.collection(fb.db, 'tournaments', id, 'players'), fb.limit(200)), [id]);
  const matches = useLive((fb) => fb.query(fb.collection(fb.db, 'matches'), fb.where('tid', '==', id), fb.limit(400)), [id]);
  const [busy, setBusy] = useState('');
  if (t.loading) return <div className="wrap"><Loading /></div>;
  if (!t.data) return <div className="wrap"><p className="mut empty">This tournament could not be found.</p><Link className="btn go" href="/games">Back to games</Link></div>;
  const T = t.data, me = { id: user.uid, name: profile.name || 'Player' }, joined = players.docs.some((p) => p.id === user.uid);
  const table = standings(matches.docs as any, players.docs.map((p) => ({ id: p.id, name: p.name })));
  const join = async () => { setBusy('join'); try { await ensurePlayer(user.uid, { name: profile.name, photo: safeImg(profile.photo), ruthId: profile.ruthId }); await joinTournament(id, me); toast('You are in. Good luck!'); } catch { toast('Could not join. Entries may be closed.'); } setBusy(''); };
  const challenge = async (p: any) => { setBusy(p.id); try { const mid = await createMatch({ game: T.game as GameKind, me, friend: { id: p.id, name: p.name }, level: (T.level || 'medium') as Level, tid: id }); router.push('/games/play/' + mid); } catch { toast('Could not send the challenge.'); } setBusy(''); };
  return (
    <div className="wrap" style={{ maxWidth: '40rem' }}>
      <Link className="back" href="/games"><Icon n="back" />All games</Link>
      <section className="acct"><span className="sub">Tournament</span><div className="bal" style={{ fontSize: '1.9rem' }}>{T.title}</div>
        <div className="row"><Pill>{T.status}</Pill><span className="sub">{GAME_NAME[T.game as GameKind]}{T.game === 'math' ? ` | ${T.level} level` : ''} | Prize {naira(T.prize || 0)}</span></div>
        {T.status === 'finished' && <p className="sub">Winner: <b>{T.winnerName || 'to be announced'}</b></p>}</section>
      {T.note && <p className="mut" style={{ margin: '.8rem 0' }}>{T.note}</p>}
      <p className="mut" style={{ margin: '.8rem 0' }}>How it works: challenge other entrants. Your score is the number of <b>different players</b> you beat, so beating the same friend again does not count twice. The admin awards the prize when the tournament ends.</p>
      {T.status === 'open' && !joined && <button className="go" disabled={busy === 'join'} onClick={join}>{busy === 'join' ? '...' : 'Join this tournament'}</button>}
      {joined && <Pill>You are entered</Pill>}
      <h3 className="sec">Standings</h3>
      {table.length ? table.map((r, i) => <div className="line" key={r.id}><span><b>{i + 1}.</b> {r.name}{r.id === user.uid ? ' (you)' : ''}<br /><small className="mut">{r.played} game{r.played === 1 ? '' : 's'} played</small></span><b>{r.beaten} beaten</b></div>) : <p className="mut">No entrants yet.</p>}
      {joined && T.status === 'open' && players.docs.filter((p) => p.id !== user.uid).length > 0 && (
        <>
          <h3 className="sec">Challenge an entrant</h3>
          {players.docs.filter((p) => p.id !== user.uid).map((p) => <div className="line" key={p.id}><span>{p.name}</span><button className="go sm" disabled={busy === p.id} onClick={() => challenge(p)}>{busy === p.id ? '...' : 'Challenge'}</button></div>)}
        </>
      )}
    </div>
  );
}
