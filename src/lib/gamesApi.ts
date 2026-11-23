import { getFb } from './firebase';
import { tttResult, winnerOfScores, type GameKind, type Level } from './games';

export interface Match {
  id: string; game: GameKind; a: string; b: string; an: string; bn: string; players: string[];
  status: 'invited' | 'open' | 'live' | 'finished' | 'declined'; online: boolean; level: Level | ''; tid: string;
  board?: string[]; turn?: string; seed?: number; round?: number; total?: number; sa?: number; sb?: number;
  roundStart?: any; winner: string; createdAt?: any; updatedAt?: any;
}
export interface Me { id: string; name: string }

const ptr = (fb: any, uid: string, mid: string) => fb.doc(fb.db, 'players', uid, 'games', mid);
/** Each player has a small pointer to every match. It drives "my games", invites and the notification dot. */
function setPtr(fb: any, b: any, uid: string, m: Partial<Match> & { game: GameKind }, opp: string, oppName: string, from: string, patch: { status: string; turnMe: boolean }) {
  b.set(ptr(fb, uid, m.id as string), { game: m.game, opp, oppName, from, updatedAt: fb.serverTimestamp(), ...patch }, { merge: true });
}

export async function ensurePlayer(uid: string, p: { name?: string; photo?: string; ruthId?: string }): Promise<void> {
  const fb = getFb(), ref = fb.doc(fb.db, 'players', uid), s = await fb.getDoc(ref);
  const name = (p.name || 'Player').slice(0, 40), photo = p.photo || '';
  if (!s.exists()) {
    await fb.setDoc(ref, { name, nameLower: name.toLowerCase(), photo, code: p.ruthId || '', wins: 0, losses: 0, draws: 0, tttWins: 0, mathWins: 0, createdAt: fb.serverTimestamp(), lastSeen: fb.serverTimestamp() });
    return;
  }
  const d = s.data();
  if (d.name !== name || (d.photo || '') !== photo) await fb.updateDoc(ref, { name, nameLower: name.toLowerCase(), photo, lastSeen: fb.serverTimestamp() });
}

export async function searchPlayers(q: string, meId: string): Promise<any[]> {
  const fb = getFb(), s = q.trim();
  if (!s) return [];
  const col = fb.collection(fb.db, 'players');
  const snap = /^\d{10}$/.test(s)
    ? await fb.getDocs(fb.query(col, fb.where('code', '==', s), fb.limit(5)))
    : await fb.getDocs(fb.query(col, fb.where('nameLower', '>=', s.toLowerCase()), fb.where('nameLower', '<=', s.toLowerCase() + '\uf8ff'), fb.limit(12)));
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((p: any) => p.id !== meId);
}

/** Creates a challenge for a friend (invited) or an open link anyone can join (open). Returns the match id. */
export async function createMatch(p: { game: GameKind; me: Me; friend?: { id: string; name: string } | null; level?: Level; tid?: string }): Promise<string> {
  const fb = getFb(), ref = fb.doc(fb.collection(fb.db, 'matches')), b = fb.writeBatch(fb.db), { me, friend, game } = p;
  const base: any = {
    game, a: me.id, b: friend ? friend.id : '', an: me.name, bn: friend ? friend.name : '', players: friend ? [me.id, friend.id] : [me.id],
    status: friend ? 'invited' : 'open', online: true, level: game === 'math' ? p.level || 'medium' : '', tid: p.tid || '', winner: '',
    createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp(),
  };
  if (game === 'ttt') { base.board = Array(9).fill(''); base.turn = me.id; } else { base.seed = Math.floor(Math.random() * 1e9); base.round = 0; base.total = 10; base.sa = 0; base.sb = 0; }
  b.set(ref, base);
  const m = { id: ref.id, game };
  setPtr(fb, b, me.id, m, friend ? friend.id : '', friend ? friend.name : 'Open invite', me.id, { status: base.status, turnMe: false });
  if (friend) setPtr(fb, b, friend.id, m, me.id, me.name, me.id, { status: 'invited', turnMe: false });
  await b.commit();
  return ref.id;
}

export async function acceptMatch(m: Match): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db);
  b.update(fb.doc(fb.db, 'matches', m.id), { status: 'live', updatedAt: fb.serverTimestamp(), ...(m.game === 'math' ? { roundStart: fb.serverTimestamp() } : {}) });
  setPtr(fb, b, m.a, m, m.b, m.bn, m.a, { status: 'live', turnMe: m.game === 'ttt' });
  setPtr(fb, b, m.b, m, m.a, m.an, m.a, { status: 'live', turnMe: false });
  await b.commit();
}
export async function joinOpen(m: Match, me: Me): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db);
  b.update(fb.doc(fb.db, 'matches', m.id), { b: me.id, bn: me.name, players: [m.a, me.id], status: 'live', updatedAt: fb.serverTimestamp(), ...(m.game === 'math' ? { roundStart: fb.serverTimestamp() } : {}) });
  setPtr(fb, b, me.id, m, m.a, m.an, m.a, { status: 'live', turnMe: false });
  setPtr(fb, b, m.a, m, me.id, me.name, m.a, { status: 'live', turnMe: m.game === 'ttt' });
  await b.commit();
}
/** The challenged player declines, or the creator withdraws the challenge. */
export async function closeMatch(m: Match, me: Me): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db);
  b.update(fb.doc(fb.db, 'matches', m.id), { status: 'declined', updatedAt: fb.serverTimestamp() });
  setPtr(fb, b, m.a, m, m.b, m.bn, m.a, { status: 'declined', turnMe: false });
  if (m.b) setPtr(fb, b, m.b, m, m.a, m.an, m.a, { status: 'declined', turnMe: false });
  await b.commit();
}

function finishPtrs(fb: any, b: any, m: Match) {
  setPtr(fb, b, m.a, m, m.b, m.bn, m.a, { status: 'finished', turnMe: false });
  setPtr(fb, b, m.b, m, m.a, m.an, m.a, { status: 'finished', turnMe: false });
}

export async function tttMove(m: Match, i: number, meId: string): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db), board = [...(m.board || [])], sym = meId === m.a ? 'X' : 'O', opp = meId === m.a ? m.b : m.a;
  if (board[i]) throw new Error('taken');
  board[i] = sym;
  const r = tttResult(board), patch: any = { board, updatedAt: fb.serverTimestamp() };
  if (r.winner === sym) { patch.status = 'finished'; patch.winner = meId; }
  else if (r.winner === 'draw') { patch.status = 'finished'; patch.winner = 'draw'; }
  else patch.turn = opp;
  b.update(fb.doc(fb.db, 'matches', m.id), patch);
  if (patch.status === 'finished') finishPtrs(fb, b, m);
  else {
    setPtr(fb, b, meId, m, opp, opp === m.a ? m.an : m.bn, m.a, { status: 'live', turnMe: false });
    setPtr(fb, b, opp, m, meId, meId === m.a ? m.an : m.bn, m.a, { status: 'live', turnMe: true });
  }
  await b.commit();
}
/** Resign (opponent wins) or claim the win when the opponent has been away too long (me wins). */
export async function endMatch(m: Match, winner: string): Promise<void> {
  const fb = getFb(), b = fb.writeBatch(fb.db);
  b.update(fb.doc(fb.db, 'matches', m.id), { status: 'finished', winner, updatedAt: fb.serverTimestamp() });
  finishPtrs(fb, b, m);
  await b.commit();
}
/** Math Duel: move to the next question. scored = this player answered correctly first. */
export async function mathAdvance(m: Match, meId: string, scored: boolean): Promise<void> {
  const fb = getFb(), isA = meId === m.a, sa = (m.sa || 0) + (scored && isA ? 1 : 0), sb = (m.sb || 0) + (scored && !isA ? 1 : 0), round = (m.round || 0) + 1, fin = round >= (m.total || 10);
  const patch: any = { round, sa, sb, roundStart: fb.serverTimestamp(), updatedAt: fb.serverTimestamp() };
  if (fin) { patch.status = 'finished'; patch.winner = winnerOfScores(sa, sb, m.a, m.b); }
  const b = fb.writeBatch(fb.db);
  b.update(fb.doc(fb.db, 'matches', m.id), patch);
  if (fin) finishPtrs(fb, b, m);
  await b.commit();
}

/** Counts a finished online match once for this player (wins, losses, draws). Safe to call repeatedly. */
export async function settle(m: Match, meId: string): Promise<{ win: boolean; draw: boolean; wins: number } | null> {
  const fb = getFb(), cref = fb.doc(fb.db, 'matches', m.id, 'counted', meId), pref = fb.doc(fb.db, 'players', meId);
  return fb.runTransaction(fb.db, async (t: any) => {
    const [cs, ps] = await Promise.all([t.get(cref), t.get(pref)]);
    if (cs.exists() || !ps.exists()) return null;
    const p = ps.data(), win = m.winner === meId, draw = m.winner === 'draw', wins = (p.wins || 0) + (win ? 1 : 0);
    t.set(cref, { at: fb.serverTimestamp() });
    t.update(pref, { wins, draws: (p.draws || 0) + (draw ? 1 : 0), losses: (p.losses || 0) + (!win && !draw ? 1 : 0), tttWins: (p.tttWins || 0) + (win && m.game === 'ttt' ? 1 : 0), mathWins: (p.mathWins || 0) + (win && m.game === 'math' ? 1 : 0), lastMatch: m.id });
    return { win, draw, wins };
  });
}

export async function requestReward(me: Me, wins: number): Promise<void> {
  const fb = getFb();
  await fb.setDoc(fb.doc(fb.db, 'gameClaims', me.id), { uid: me.id, name: me.name, wins, status: 'PENDING', createdAt: fb.serverTimestamp() });
}
export async function joinTournament(tid: string, me: Me): Promise<void> {
  const fb = getFb();
  await fb.setDoc(fb.doc(fb.db, 'tournaments', tid, 'players', me.id), { name: me.name, at: fb.serverTimestamp() });
}

/** Tournament score = number of different players beaten (so repeat wins against one friend do not count twice). */
export function standings(matches: Match[], entrants: { id: string; name: string }[]): { id: string; name: string; beaten: number; played: number }[] {
  const out = entrants.map((e) => {
    const mine = matches.filter((m) => m.status === 'finished' && (m.a === e.id || m.b === e.id));
    const beaten = new Set(mine.filter((m) => m.winner === e.id).map((m) => (m.a === e.id ? m.b : m.a)));
    return { id: e.id, name: e.name, beaten: beaten.size, played: mine.length };
  });
  return out.sort((x, y) => y.beaten - x.beaten || x.played - y.played);
}
