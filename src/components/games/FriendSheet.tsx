'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Sheet } from '@/components/ui';
import Icon from '@/components/Icon';
import { PlayerDot, RankBadge, LevelPicker } from './Parts';
import { createMatch, searchPlayers, ensurePlayer } from '@/lib/gamesApi';
import { GAME_NAME, type GameKind, type Level } from '@/lib/games';
import { safeImg } from '@/lib/util';

// Find a friend by name or Bamyon ID and challenge them. Math Duel lets you pick the level first.
export default function FriendSheet({ game, tid, onClose }: { game: GameKind; tid?: string; onClose: () => void }) {
  const { user, profile, toast } = useApp();
  const router = useRouter();
  const [q, setQ] = useState(''), [list, setList] = useState<any[]>([]), [level, setLevel] = useState<Level>('medium'), [busy, setBusy] = useState(''), [searched, setSearched] = useState(false);
  useEffect(() => { ensurePlayer(user.uid, { name: profile.name, photo: safeImg(profile.photo), ruthId: profile.ruthId }).catch(() => {}); }, [user.uid, profile.name, profile.photo, profile.ruthId]);
  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setList([]); setSearched(false); return; }
      try { setList(await searchPlayers(q, user.uid)); } catch { toast('Search failed. Please try again.'); }
      setSearched(true);
    }, 350);
    return () => clearTimeout(t);
  }, [q, user.uid, toast]);
  const challenge = async (f: any) => {
    setBusy(f.id);
    try { const id = await createMatch({ game, me: { id: user.uid, name: profile.name || 'Player' }, friend: { id: f.id, name: f.name }, level, tid }); toast(`Challenge sent to ${f.name}.`); router.push('/games/play/' + id); }
    catch { toast('Could not send the challenge.'); }
    setBusy('');
  };
  return (
    <Sheet title={`Challenge a friend: ${GAME_NAME[game]}`} onClose={onClose}>
      {game === 'math' && <><p className="mut">Choose the level for this match.</p><LevelPicker value={level} onChange={setLevel} /></>}
      <label className="nd-search" style={{ margin: 0 }}><Icon n="search" /><input autoFocus placeholder="Search by name or Bamyon ID" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {list.map((p) => (
        <div className="ord inbox" key={p.id} style={{ cursor: 'default' }}>
          <PlayerDot name={p.name} photo={safeImg(p.photo)} />
          <span style={{ minWidth: 0 }}><b>{p.name}</b><span style={{ display: 'block' }}><RankBadge wins={p.wins || 0} /></span></span>
          <button className="go" disabled={busy === p.id} onClick={() => challenge(p)}>{busy === p.id ? '...' : 'Challenge'}</button>
        </div>
      ))}
      {searched && !list.length && <p className="mut">No player found. They need to open the Games page once to appear here. You can also share an invite link instead.</p>}
    </Sheet>
  );
}
