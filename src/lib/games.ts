// Pure game logic: ranks, tic-tac-toe, computer opponents and the math question generator. No Firebase in here.
export type Level = 'easy' | 'medium' | 'hard';
export type GameKind = 'ttt' | 'math';
export const LEVELS: Level[] = ['easy', 'medium', 'hard'];
export const MATH_TOTAL = 10; // questions per match
export const MATH_SECONDS = 10; // seconds per question
export const GAME_NAME: Record<GameKind, string> = { ttt: 'Tic-Tac-Toe', math: 'Math Duel' };

// Online wins only. Losing never removes progress.
export const RANKS = [
  { min: 0, name: 'Stub', emoji: '🌱' },
  { min: 10, name: 'Rookie', emoji: '🎯' },
  { min: 25, name: 'Challenger', emoji: '⚡' },
  { min: 50, name: 'Contender', emoji: '🔥' },
  { min: 100, name: 'Tactician', emoji: '🧠' },
  { min: 150, name: 'Strategist', emoji: '♟️' },
  { min: 200, name: 'Veteran', emoji: '🛡️' },
  { min: 300, name: 'Champion', emoji: '🏅' },
  { min: 400, name: 'Grandmaster', emoji: '👑' },
  { min: 500, name: 'Legend', emoji: '🏆' },
];
export function rankOf(wins: number) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (wins >= RANKS[k].min) i = k;
  const cur = RANKS[i], next = RANKS[i + 1] || null;
  const pct = next ? Math.round(((wins - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { cur, next, pct, toNext: next ? next.min - wins : 0 };
}

// ---------- tic-tac-toe
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function tttResult(b: string[]): { winner: 'X' | 'O' | 'draw' | ''; line: number[] | null } {
  for (const l of LINES) { const [x, y, z] = l; if (b[x] && b[x] === b[y] && b[y] === b[z]) return { winner: b[x] as 'X' | 'O', line: l }; }
  return { winner: b.every((c) => c) ? 'draw' : '', line: null };
}
const empties = (b: string[]) => b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
function minimax(b: string[], turn: 'X' | 'O', me: 'X' | 'O', depth: number): number {
  const r = tttResult(b);
  if (r.winner === me) return 10 - depth;
  if (r.winner === 'draw') return 0;
  if (r.winner) return depth - 10;
  const sc = empties(b).map((i) => { const n = [...b]; n[i] = turn; return minimax(n, turn === 'X' ? 'O' : 'X', me, depth + 1); });
  return turn === me ? Math.max(...sc) : Math.min(...sc);
}
/** Chooses a cell for the computer. Easy is random, medium mostly sensible, hard never loses. */
export function tttAI(b: string[], me: 'X' | 'O', level: Level): number {
  const em = empties(b), opp = me === 'X' ? 'O' : 'X';
  const rand = () => em[Math.floor(Math.random() * em.length)];
  if (level === 'easy') return rand();
  const finish = (s: 'X' | 'O') => em.find((i) => { const n = [...b]; n[i] = s; return tttResult(n).winner === s; });
  if (level === 'medium') {
    if (Math.random() < 0.25) return rand();
    const w = finish(me); if (w !== undefined) return w;
    const bl = finish(opp); if (bl !== undefined) return bl;
    if (b[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter((i) => b[i] === '');
    return corners.length ? corners[Math.floor(Math.random() * corners.length)] : rand();
  }
  if (em.length === 9) return [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
  let best = -Infinity, pick = em[0];
  for (const i of em) { const n = [...b]; n[i] = me; const s = minimax(n, opp, me, 1); if (s > best) { best = s; pick = i; } }
  return pick;
}

// ---------- math duel
function rng32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** The same (seed, round, level) always gives the same question, so both players see it without any server. */
export function mathQuestion(seed: number, round: number, level: Level): { text: string; answer: number } {
  const r = rng32(seed * 31 + round * 977 + LEVELS.indexOf(level) * 13 + 7);
  const ri = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  let a = 0, b = 0, op = '+', ans = 0;
  if (level === 'easy') {
    op = pick(['+', '-']); a = ri(8, 60); b = ri(5, 40);
    if (op === '-' && b > a) [a, b] = [b, a];
  } else if (level === 'medium') {
    op = pick(['+', '+', '-', '×']);
    if (op === '+') { a = ri(100, 900); b = ri(100, 900); }
    else if (op === '-') { a = ri(300, 999); b = ri(100, a - 50); }
    else { a = ri(11, 35); b = ri(3, 9); }
  } else {
    op = pick(['+', '-', '×', '÷']);
    if (op === '+') { a = ri(1000, 9999); b = ri(1000, 9999); }
    else if (op === '-') { a = ri(2000, 9999); b = ri(100, a - 100); }
    else if (op === '×') { a = ri(12, 99); b = ri(6, 19); }
    else { b = ri(6, 25); const q = ri(6, 40); a = b * q; }
  }
  ans = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
  return { text: `${a} ${op} ${b}`, answer: ans };
}
/** How the computer behaves on each question: when it answers, and whether it gets it right. */
export function aiPlan(level: Level): { delay: number; correct: boolean } {
  const span = level === 'easy' ? [5500, 9500, 0.55] : level === 'medium' ? [3500, 7000, 0.8] : [2200, 5000, 0.95];
  return { delay: span[0] + Math.random() * (span[1] - span[0]), correct: Math.random() < span[2] };
}
export const winnerOfScores = (sa: number, sb: number, a: string, b: string) => (sa > sb ? a : sb > sa ? b : 'draw');
