import { notFound } from 'next/navigation';
import VsComputer from '@/views/games/VsComputer';
import type { GameKind, Level } from '@/lib/games';

export function generateStaticParams() { return [{ game: 'ttt' }, { game: 'math' }]; }
export default function VsPage({ params, searchParams }: { params: { game: string }; searchParams: { l?: string } }) {
  if (params.game !== 'ttt' && params.game !== 'math') notFound();
  const l = searchParams?.l;
  return <VsComputer game={params.game as GameKind} initial={(l === 'easy' || l === 'medium' || l === 'hard' ? l : '') as Level | ''} />;
}
