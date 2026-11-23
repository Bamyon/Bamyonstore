'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Board, LevelPicker } from '@/components/games/Parts';
import Icon from '@/components/Icon';
import { GAME_NAME, MATH_SECONDS, MATH_TOTAL, aiPlan, mathQuestion, tttAI, tttResult, type GameKind, type Level } from '@/lib/games';

// Practice against the computer. Free for everyone, no account needed, and it does not count toward online wins.
function TttVs({ level, change }: { level: Level; change: () => void }) {
  const [board, setBoard] = useState<string[]>(Array(9).fill('')), [game, setGame] = useState(0), [tally, setTally] = useState({ you: 0, cpu: 0, draw: 0 });
  const mine = game % 2 === 0 ? 'X' : 'O', cpu = mine === 'X' ? 'O' : 'X';
  const r = tttResult(board), xs = board.filter((c) => c === 'X').length, os = board.filter((c) => c === 'O').length, turn = xs === os ? 'X' : 'O';
  const counted = useRef(-1);
  useEffect(() => {
    if (r.winner || turn !== cpu) return;
    const t = setTimeout(() => setBoard((b) => { const n = [...b]; n[tttAI(b, cpu, level)] = cpu; return n; }), 500);
    return () => clearTimeout(t);
  }, [board, turn, cpu, level, r.winner]);
  useEffect(() => {
    if (!r.winner || counted.current === game) return;
    counted.current = game;
    setTally((t) => (r.winner === 'draw' ? { ...t, draw: t.draw + 1 } : r.winner === mine ? { ...t, you: t.you + 1 } : { ...t, cpu: t.cpu + 1 }));
  }, [r.winner, game, mine]);
  const again = () => { setBoard(Array(9).fill('')); setGame((g) => g + 1); };
  const msg = r.winner ? (r.winner === 'draw' ? 'It is a draw.' : r.winner === mine ? 'You win!' : 'Computer wins.') : turn === mine ? 'Your turn' : 'Computer is thinking...';
  return (
    <>
      <div className="scoreline"><span>You ({mine}) <b>{tally.you}</b></span><span>Draws <b>{tally.draw}</b></span><span>Computer ({cpu}) <b>{tally.cpu}</b></span></div>
      <p className="gstatus">{msg}</p>
      <Board board={board} line={r.line} disabled={!!r.winner || turn !== mine} onPick={(i) => setBoard((b) => { if (b[i]) return b; const n = [...b]; n[i] = mine; return n; })} />
      <div className="row" style={{ justifyContent: 'center' }}>{r.winner && <button className="go" onClick={again}>Play again</button>}<button className="alt" onClick={change}>Change level</button></div>
    </>
  );
}

function MathVs({ level, change }: { level: Level; change: () => void }) {
  const [round, setRound] = useState(0), [you, setYou] = useState(0), [cpu, setCpu] = useState(0), [input, setInput] = useState(''), [phase, setPhase] = useState<'ask' | 'between' | 'done'>('ask');
  const [left, setLeft] = useState(MATH_SECONDS), [note, setNote] = useState(''), [game, setGame] = useState(0);
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), [game]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = useMemo(() => mathQuestion(seed, round, level), [seed, round, level]);
  const ph = useRef<'ask' | 'between' | 'done'>('ask'), timers = useRef<any[]>([]);
  const clear = () => { timers.current.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers.current = []; };
  const finish = (who: 'you' | 'cpu' | 'none') => {
    if (ph.current !== 'ask') return;
    ph.current = 'between'; setPhase('between'); clear();
    if (who === 'you') setYou((s) => s + 1);
    if (who === 'cpu') setCpu((s) => s + 1);
    setNote(who === 'you' ? 'You got it first!' : who === 'cpu' ? 'The computer was faster.' : `Time is up. The answer was ${q.answer}.`);
    timers.current.push(setTimeout(() => { if (round + 1 >= MATH_TOTAL) { ph.current = 'done'; setPhase('done'); } else setRound((r) => r + 1); }, 1200));
  };
  useEffect(() => {
    ph.current = 'ask'; setPhase('ask'); setInput(''); setNote(''); setLeft(MATH_SECONDS);
    const start = Date.now(), plan = aiPlan(level);
    const tick = setInterval(() => setLeft(Math.max(0, MATH_SECONDS - (Date.now() - start) / 1000)), 100);
    const cp = plan.correct ? setTimeout(() => finish('cpu'), plan.delay) : null, to = setTimeout(() => finish('none'), MATH_SECONDS * 1000);
    timers.current = [tick, cp, to].filter(Boolean);
    return clear;
    // eslint-disable-next-line
  }, [round, seed, level]);
  const type = (e: any) => { const v = e.target.value.replace(/[^0-9]/g, ''); setInput(v); if (ph.current === 'ask' && v === String(q.answer)) finish('you'); };
  const restart = () => { setGame((g) => g + 1); setRound(0); setYou(0); setCpu(0); };
  if (phase === 'done') return (
    <div className="ord" style={{ textAlign: 'center' }}>
      <h2>{you > cpu ? 'You win!' : you < cpu ? 'Computer wins' : 'A draw'}</h2><p className="gstatus">Final score: You {you} - {cpu} Computer</p>
      <div className="row" style={{ justifyContent: 'center' }}><button className="go" onClick={restart}>Play again</button><button className="alt" onClick={change}>Change level</button></div>
    </div>
  );
  return (
    <>
      <div className="scoreline"><span>You <b>{you}</b></span><span>Question <b>{round + 1}/{MATH_TOTAL}</b></span><span>Computer <b>{cpu}</b></span></div>
      <div className="mq"><div className="mq-text">{q.text}</div><div className="tbar2"><i style={{ width: (left / MATH_SECONDS) * 100 + '%' }} /></div><small className="mut">{Math.ceil(left)}s left</small></div>
      <input className="mans" inputMode="numeric" pattern="[0-9]*" autoFocus placeholder="Type the answer" value={input} onChange={type} disabled={phase !== 'ask'} aria-label="Your answer" />
      <p className="gstatus">{note || 'First to type the right answer scores.'}</p>
      <div className="row" style={{ justifyContent: 'center' }}><button className="alt" onClick={change}>Change level</button></div>
    </>
  );
}

export default function VsComputer({ game, initial }: { game: GameKind; initial: Level | '' }) {
  const [level, setLevel] = useState<Level | ''>(initial);
  return (
    <div className="wrap" style={{ maxWidth: '30rem' }}>
      <Link className="back" href="/games"><Icon n="back" />All games</Link>
      <h1 style={{ fontSize: '2rem', marginBottom: '.3rem' }}>{GAME_NAME[game]}</h1>
      <p className="mut" style={{ marginBottom: '1rem' }}>Practice against the computer. These games do not count toward your online wins.</p>
      {!level ? (
        <div className="ord"><h3>Choose a level</h3><LevelPicker value="medium" onChange={setLevel} />
          <p className="mut">{game === 'ttt' ? 'Easy plays randomly. Medium is sensible. Hard never loses, so aim for a draw.' : 'Ten questions, ten seconds each. The harder the level, the faster and more accurate the computer.'}</p></div>
      ) : game === 'ttt' ? <TttVs level={level} change={() => setLevel('')} /> : <MathVs level={level} change={() => setLevel('')} />}
    </div>
  );
}
