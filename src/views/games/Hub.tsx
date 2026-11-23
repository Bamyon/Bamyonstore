'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { useDocLive, useLive } from '@/lib/hooks';
import Icon from '@/components/Icon';
import FriendSheet from '@/components/games/FriendSheet';
import { LevelPicker, PlayerDot, RankBadge, RankCard } from '@/components/games/Parts';
import { Pill } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { GAME_NAME, LEVELS, type GameKind, type Level } from '@/lib/games';
import { createMatch, ensurePlayer, requestReward } from '@/lib/gamesApi';
import { naira, safeImg } from '@/lib/util';

const BLURB: Record<GameKind, string> = { ttt: 'The classic. Get three in a row before your opponent does.', math: 'Ten questions, ten seconds each. The first to type the right answer scores the point.' };

export default function Hub() {
  const { user, profile, pub, toast } = useApp();
  const router = useRouter();
  const signed = !!user && !!profile;
  const player = useDocLive((fb) => (user ? fb.doc(fb.db, 'players', user.uid) : null), [user?.uid]);
  const mine = useLive((fb) => (user ? fb.query(fb.collection(fb.db, 'players', user.uid, 'games'), fb.orderBy('updatedAt', 'desc'), fb.limit(20)) : null), [user?.uid]);
  const tours = useLive((fb) => fb.query(fb.collection(fb.db, 'tournaments'), fb.limit(20)), []);
  const top = useLive((fb) => fb.query(fb.collection(fb.db, 'players'), fb.orderBy('wins', 'desc'), fb.limit(10)), []);
  const claim = useDocLive((fb) => (user ? fb.doc(fb.db, 'gameClaims', user.uid) : null), [user?.uid]);
  const [friendFor, setFriendFor] = useState<GameKind | null>(null), [busy, setBusy] = useState(''), [linkLevel, setLinkLevel] = useState<Level>('medium');
  useEffect(() => { if (signed) ensurePlayer(user.uid, { name: profile.name, photo: safeImg(profile.photo), ruthId: profile.ruthId }).catch(() => {}); }, [signed, user?.uid, profile?.name, profile?.photo, profile?.ruthId]); // eslint-disable-line
  const wins = player.data?.wins || 0, needWins = +pub?.gameRewardWins || BRAND.gameRewardWins, reward = +pub?.gameReward || BRAND.gameReward;
  const invite = async (g: GameKind) => {
    setBusy(g);
    try { const id = await createMatch({ game: g, me: { id: user.uid, name: profile.name || 'Player' }, level: linkLevel }); router.push('/games/play/' + id); }
    catch { toast('Could not create the invite link. Please try again.'); }
    setBusy('');
  };
  const askReward = async () => { setBusy('reward'); try { await requestReward({ id: user.uid, name: profile.name || 'Player' }, wins); toast('Reward requested. We will review it soon.'); } catch { toast('Could not request the reward yet.'); } setBusy(''); };
  const waiting = mine.docs.filter((g) => (g.status === 'invited' && g.from !== user?.uid) || (g.status === 'live' && g.turnMe)).length;

  return (
    <div className="wrap">
      <h1 style={{ fontSize: '2rem' }}>Games</h1>
      <p className="mut" style={{ margin: '.3rem 0 1rem' }}>Play the computer for free, or challenge friends online. Win to climb the ranks.</p>

      {signed ? <RankCard wins={wins} /> : (
        <div className="ord"><h3>Play free, or sign in to compete</h3><p className="mut">Practice against the computer without an account. Sign in to challenge friends, climb the ranks and join tournaments.</p>
          <div className="row"><Link className="btn go" href="/login?next=/games">Sign in</Link><Link className="btn alt" href="/login?mode=up&next=/games">Create an account</Link></div></div>
      )}

      <h3 className="sec">Pick a game</h3>
      <div className="duo">
        {(['ttt', 'math'] as GameKind[]).map((g) => (
          <article className="duo-card gcard" key={g}>
            <span className="svc-ic"><Icon n={g === 'ttt' ? 'gamepad' : 'bolt'} /></span><h3>{GAME_NAME[g]}</h3><p>{BLURB[g]}</p>
            <div className="tags">{LEVELS.map((l) => <Link key={l} href={`/games/vs/${g}?l=${l}`}>Computer: {l}</Link>)}</div>
            {signed ? (
              <>
                {g === 'math' && <div><small className="mut">Level for online matches</small><LevelPicker value={linkLevel} onChange={setLinkLevel} /></div>}
                <div className="row"><button className="go" onClick={() => setFriendFor(g)}>Challenge a friend</button><button className="alt" disabled={busy === g} onClick={() => invite(g)}>{busy === g ? '...' : 'Invite by link'}</button></div>
              </>
            ) : <Link className="btn go" href="/login?next=/games">Sign in to play friends</Link>}
          </article>
        ))}
      </div>

      {signed && (
        <>
          <h3 className="sec">My games {waiting > 0 && <span className="pill" style={{ marginLeft: '.4rem' }}>{waiting} waiting for you</span>}</h3>
          {mine.docs.length ? mine.docs.map((g) => {
            const invited = g.status === 'invited' && g.from !== user.uid, yourTurn = g.status === 'live' && g.turnMe;
            return (
              <div className={'ord inbox' + (invited || yourTurn ? ' unread' : '')} key={g.id} style={{ cursor: 'default' }}>
                <span className="inb-av"><Icon n={g.game === 'ttt' ? 'gamepad' : 'bolt'} /></span>
                <span style={{ minWidth: 0 }}><b>{GAME_NAME[g.game as GameKind]}</b><span className="mut" style={{ display: 'block' }}>{g.oppName || 'Open invite'} | {invited ? 'challenged you' : yourTurn ? 'your turn' : g.status}</span></span>
                <Link className={invited || yourTurn ? 'btn go sm' : 'btn alt sm'} href={'/games/play/' + g.id}>{invited ? 'Respond' : yourTurn ? 'Play' : 'Open'}</Link>
              </div>
            );
          }) : <p className="mut">No games yet. Challenge a friend or share an invite link.</p>}
        </>
      )}

      <h3 className="sec">Tournaments</h3>
      {tours.docs.length ? tours.docs.map((t) => (
        <div className="ord inbox" key={t.id} style={{ cursor: 'default' }}>
          <span className="inb-av"><Icon n="trophy" /></span>
          <span style={{ minWidth: 0 }}><b>{t.title}</b><span className="mut" style={{ display: 'block' }}>{GAME_NAME[t.game as GameKind]} | Prize {naira(t.prize || 0)} | {t.status === 'finished' ? `won by ${t.winnerName || 'a player'}` : t.status}</span></span>
          <Link className="btn alt sm" href={'/games/tournament/' + t.id}>{t.status === 'open' ? 'Join' : 'View'}</Link>
        </div>
      )) : <p className="mut">No tournaments right now. Watch this space for prizes.</p>}

      <h3 className="sec">Leaderboard</h3>
      {top.docs.filter((p) => (p.wins || 0) > 0).length ? top.docs.filter((p) => (p.wins || 0) > 0).map((p, i) => (
        <div className="line" key={p.id}><span className="row" style={{ flexWrap: 'nowrap' }}><b style={{ width: '1.6rem' }}>{i + 1}</b><PlayerDot name={p.name} photo={safeImg(p.photo)} /><span>{p.name}<br /><RankBadge wins={p.wins} /></span></span><b>{p.wins} wins</b></div>
      )) : <p className="mut">Nobody has won an online game yet. Be the first.</p>}

      {signed && (
        <>
          <h3 className="sec">Legend reward</h3>
          <div className="ord">
            <div className="row"><Icon n="trophy" /><b>Win {needWins} online games, earn {naira(reward)}</b></div>
            <div className="rank-bar"><i style={{ width: Math.min(100, (wins / needWins) * 100) + '%' }} /></div>
            <p className="mut">{wins >= needWins ? 'You made it. Losing never removes your progress.' : `${needWins - wins} more online win${needWins - wins === 1 ? '' : 's'} to go. Losing a game never removes your progress.`}</p>
            {claim.data ? <Pill>{claim.data.status === 'PAID' ? 'Reward paid into your wallet' : claim.data.status === 'REJECTED' ? 'Request not approved' : 'Reward requested, waiting for approval'}</Pill>
              : wins >= needWins && <button className="go" disabled={busy === 'reward'} onClick={askReward}>Claim {naira(reward)}</button>}
          </div>
        </>
      )}
      {friendFor && <FriendSheet game={friendFor} onClose={() => setFriendFor(null)} />}
    </div>
  );
}
