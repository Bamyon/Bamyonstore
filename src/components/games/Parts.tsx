'use client';
import { rankOf, LEVELS, type Level } from '@/lib/games';

export function Board({ board, onPick, disabled, line }: { board: string[]; onPick: (i: number) => void; disabled?: boolean; line?: number[] | null }) {
  return (
    <div className="ttt" role="grid" aria-label="Tic-Tac-Toe board">
      {board.map((c, i) => (
        <button key={i} className={'cell' + (c === 'X' ? ' x' : c === 'O' ? ' o' : '') + (line && line.includes(i) ? ' win' : '')} disabled={disabled || !!c} onClick={() => onPick(i)} aria-label={`Square ${i + 1}: ${c || 'empty'}`}>{c}</button>
      ))}
    </div>
  );
}

export function RankBadge({ wins, big }: { wins: number; big?: boolean }) {
  const r = rankOf(wins || 0);
  return <span className={'rankb' + (big ? ' big' : '')}><span>{r.cur.emoji}</span>{r.cur.name}</span>;
}

export function RankCard({ wins }: { wins: number }) {
  const r = rankOf(wins || 0);
  return (
    <section className="acct">
      <span className="sub">Your rank</span>
      <div className="rank-title"><span>{r.cur.emoji}</span> {r.cur.name}</div>
      <div className="sub">{wins || 0} online win{wins === 1 ? '' : 's'}{r.next ? ` | ${r.toNext} more to reach ${r.next.emoji} ${r.next.name}` : ' | top rank reached'}</div>
      <div className="rank-bar"><i style={{ width: r.pct + '%' }} /></div>
    </section>
  );
}

export function LevelPicker({ value, onChange }: { value: Level; onChange: (l: Level) => void }) {
  return <div className="chips">{LEVELS.map((l) => <button key={l} className={value === l ? 'on' : ''} onClick={() => onChange(l)} style={{ textTransform: 'capitalize' }}>{l}</button>)}</div>;
}

export const PlayerDot = ({ name, photo }: { name?: string; photo?: string }) => (
  photo ? <img className="av" src={photo} alt="" /> : <i className="av">{(name || '?')[0].toUpperCase()}</i>
);
