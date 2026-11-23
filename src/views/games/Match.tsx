'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { useDocLive, useNow } from '@/lib/hooks';
import { Board } from '@/components/games/Parts';
import Icon from '@/components/Icon';
import { Loading, Pill } from '@/components/ui';
import { GAME_NAME, MATH_SECONDS, mathQuestion, tttResult, type Level } from '@/lib/games';
import { acceptMatch, closeMatch, createMatch, endMatch, ensurePlayer, joinOpen, mathAdvance, settle, tttMove, type Match as M, type Me } from '@/lib/gamesApi';
import { ms, safeImg } from '@/lib/util';

function TttLive({ m, me }: { m: M; me: Me }) {
  const { toast } = useApp();
  const now = useNow(1000), myTurn = m.turn === me.id, sym = me.id === m.a ? 'X' : 'O', opp = me.id === m.a ? m.bn : m.an, oppId = me.id === m.a ? m.b : m.a;
  const idle = (now - (ms(m.updatedAt) || now)) / 1000, board = m.board || Array(9).fill(''), r = tttResult(board);
  return (
    <>
      <div className="scoreline"><span>You ({sym})</span><span>vs</span><span>{opp} ({sym === 'X' ? 'O' : 'X'})</span></div>
      <p className="gstatus">{myTurn ? 'Your turn' : `Waiting for ${opp}...`}</p>
      <Board board={board} line={r.line} disabled={!myTurn} onPick={(i) => tttMove(m, i, me.id).catch(() => toast('That move was not accepted. Please try again.'))} />
      <div className="row" style={{ justifyContent: 'center' }}>
        {!myTurn && idle > 90 && <button className="go" onClick={() => endMatch(m, me.id).catch(() => toast('Could not claim the win yet.'))}>{opp} is away. Claim the win</button>}
        <button className="alt" onClick={() => { if (confirm('Resign this game? Your opponent will win.')) endMatch(m, oppId).catch(() => toast('Could not resign.')); }}>Resign</button>
      </div>
      {!myTurn && idle <= 90 && <p className="mut" style={{ textAlign: 'center' }}>If {opp} is away for 90 seconds you can claim the win.</p>}
    </>
  );
}

function MathLive({ m, me }: { m: M; me: Me }) {
  const now = useNow(100), isA = me.id === m.a, round = m.round || 0, total = m.total || 10;
  const q = useMemo(() => mathQuestion(m.seed || 0, round, (m.level || 'medium') as Level), [m.seed, round, m.level]);
  const start = ms(m.roundStart) || now, left = Math.max(0, MATH_SECONDS - (now - start) / 1000), ready = round === 0 && now - start < 1800;
  const [input, setInput] = useState(''), [flash, setFlash] = useState(''), [bump, setBump] = useState(0);
  const sent = useRef(-1), prev = useRef({ round, sa: m.sa || 0, sb: m.sb || 0 });
  const mine = isA ? m.sa || 0 : m.sb || 0, theirs = isA ? m.sb || 0 : m.sa || 0, opp = isA ? m.bn : m.an;
  useEffect(() => {
    setInput('');
    const p = prev.current;
    if (round > p.round) { const a = (m.sa || 0) > p.sa, b = (m.sb || 0) > p.sb; setFlash(a || b ? ((a && isA) || (b && !isA) ? 'You scored!' : `${opp} scored`) : 'Nobody got it'); }
    prev.current = { round, sa: m.sa || 0, sb: m.sb || 0 };
    // eslint-disable-next-line
  }, [round]);
  useEffect(() => { // nobody answered in time: either player can move the game on
    if (m.status !== 'live') return;
    const wait = Math.max(0, MATH_SECONDS * 1000 + (isA ? 500 : 1800) - (Date.now() - start));
    const t = setTimeout(() => {
      if (sent.current === round) return;
      sent.current = round;
      mathAdvance(m, me.id, false).catch(() => setTimeout(() => { if (sent.current === round) { sent.current = -1; setBump((n) => n + 1); } }, 900));
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [round, m.status, start, bump]);
  const type = (e: any) => {
    const v = e.target.value.replace(/[^0-9]/g, ''); setInput(v);
    if (!ready && m.status === 'live' && v === String(q.answer) && sent.current !== round) { sent.current = round; mathAdvance(m, me.id, true).catch(() => { sent.current = -1; }); }
  };
  return (
    <>
      <div className="scoreline"><span>You <b>{mine}</b></span><span>Question <b>{Math.min(round + 1, total)}/{total}</b></span><span>{opp} <b>{theirs}</b></span></div>
      <div className="mq">{ready ? <div className="mq-text">Get ready...</div> : <div className="mq-text">{q.text}</div>}<div className="tbar2"><i style={{ width: (left / MATH_SECONDS) * 100 + '%' }} /></div><small className="mut">{Math.ceil(left)}s left | {(m.level || 'medium')} level</small></div>
      <input className="mans" inputMode="numeric" pattern="[0-9]*" autoFocus placeholder="Type the answer" value={input} onChange={type} disabled={ready} aria-label="Your answer" />
      <p className="gstatus">{flash || 'First to type the right answer scores.'}</p>
    </>
  );
}

export default function Match({ id }: { id: string }) {
  const { user, profile, toast } = useApp();
  const router = useRouter();
  const { data, loading } = useDocLive((fb) => fb.doc(fb.db, 'matches', id), [id]);
  const m = data as M | null, me: Me = { id: user.uid, name: profile.name || 'Player' };
  const [busy, setBusy] = useState(false), [recorded, setRecorded] = useState<'' | 'done' | 'error'>(''), [again, setAgain] = useState(0), settled = useRef(false);
  useEffect(() => { ensurePlayer(user.uid, { name: profile.name, photo: safeImg(profile.photo), ruthId: profile.ruthId }).catch(() => {}); }, [user.uid, profile.name, profile.photo, profile.ruthId]);
  useEffect(() => {
    if (!m || m.status !== 'finished' || settled.current || !m.players.includes(me.id)) return;
    settled.current = true;
    (async () => {
      try { await ensurePlayer(user.uid, { name: profile.name, photo: safeImg(profile.photo), ruthId: profile.ruthId }); const r = await settle(m, me.id); setRecorded('done'); if (r) toast(r.win ? `Win counted. You now have ${r.wins} online win${r.wins === 1 ? '' : 's'}.` : r.draw ? 'Draw recorded.' : 'Result recorded.'); }
      catch { setRecorded('error'); settled.current = false; }
    })();
    // eslint-disable-next-line
  }, [m?.status, again]);
  if (loading) return <div className="wrap"><Loading /></div>;
  if (!m) return <div className="wrap"><p className="mut empty">This game could not be found.</p><Link className="btn go" href="/games">Back to games</Link></div>;
  const isMine = m.players.includes(me.id), oppName = me.id === m.a ? m.bn : m.an, link = typeof window === 'undefined' ? '' : `${location.origin}/games/play/${m.id}`;
  const run = async (f: () => Promise<any>, msg: string) => { setBusy(true); try { await f(); } catch { toast(msg); } setBusy(false); };
  const win = m.winner === me.id, draw = m.winner === 'draw';
  const rematch = () => run(async () => { const f = me.id === m.a ? { id: m.b, name: m.bn } : { id: m.a, name: m.an }; const nid = await createMatch({ game: m.game, me, friend: f, level: (m.level || 'medium') as Level, tid: m.tid }); router.push('/games/play/' + nid); }, 'Could not start a rematch.');
  return (
    <div className="wrap" style={{ maxWidth: '30rem' }}>
      <Link className="back" href="/games"><Icon n="back" />All games</Link>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '.8rem' }}><h1 style={{ fontSize: '1.7rem' }}>{GAME_NAME[m.game]}</h1><Pill>{m.status}</Pill></div>

      {m.status === 'open' && (me.id === m.a ? (
        <div className="ord"><h3>Waiting for someone to join</h3><p className="mut">Share this link. The first person to open it joins your game.</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <div className="row"><button className="alt" onClick={() => navigator.clipboard?.writeText(link).then(() => toast('Link copied'))}><Icon n="copy" />Copy link</button>
            <a className="btn go" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Let's play ${GAME_NAME[m.game]} on Bamyon: ${link}`)}`}><Icon n="send" />WhatsApp</a>
            <button className="alt" disabled={busy} onClick={() => run(() => closeMatch(m, me), 'Could not cancel.')}>Cancel</button></div></div>
      ) : (
        <div className="ord"><h3>{m.an} invites you to play</h3><p className="mut">{GAME_NAME[m.game]}{m.game === 'math' ? ` | ${m.level} level` : ''}. Wins in online games count toward your rank.</p>
          <button className="go" disabled={busy} onClick={() => run(() => joinOpen(m, me), 'Could not join this game.')}>Join the game</button></div>
      ))}

      {m.status === 'invited' && (me.id === m.b ? (
        <div className="ord"><h3>{m.an} challenged you</h3><p className="mut">{GAME_NAME[m.game]}{m.game === 'math' ? ` | ${m.level} level` : ''}</p>
          <div className="row"><button className="go" disabled={busy} onClick={() => run(() => acceptMatch(m), 'Could not accept.')}>Accept</button><button className="alt" disabled={busy} onClick={() => run(() => closeMatch(m, me), 'Could not decline.')}>Decline</button></div></div>
      ) : (
        <div className="ord"><h3>Waiting for {m.bn} to accept</h3><p className="mut">They will see a notification. You can leave this page and come back from Games.</p>
          <button className="alt" disabled={busy} onClick={() => run(() => closeMatch(m, me), 'Could not cancel.')}>Withdraw the challenge</button></div>
      ))}

      {m.status === 'declined' && <div className="ord"><h3>This game was cancelled</h3><Link className="btn go" href="/games">Back to games</Link></div>}

      {m.status === 'live' && (isMine ? (m.game === 'ttt' ? <TttLive m={m} me={me} /> : <MathLive m={m} me={me} />) : <div className="ord"><p className="mut">This game is already being played.</p></div>)}

      {m.status === 'finished' && (
        <div className="ord" style={{ textAlign: 'center' }}>
          <h2>{!isMine ? 'Game over' : win ? 'You win! 🎉' : draw ? 'A draw' : `${oppName} wins`}</h2>
          {m.game === 'math' && <p className="gstatus">Final score: {m.an} {m.sa} - {m.sb} {m.bn}</p>}
          {isMine && <p className="mut">{recorded === 'done' ? 'Your result is recorded.' : recorded === 'error' ? 'We could not record your result yet.' : 'Recording your result...'}</p>}
          {recorded === 'error' && <button className="alt" onClick={() => { settled.current = false; setRecorded(''); setAgain((n) => n + 1); }}>Try again</button>}
          <div className="row" style={{ justifyContent: 'center' }}>{isMine && <button className="go" disabled={busy} onClick={rematch}>Rematch</button>}<Link className="btn alt" href="/games">Back to games</Link></div>
        </div>
      )}
    </div>
  );
}
