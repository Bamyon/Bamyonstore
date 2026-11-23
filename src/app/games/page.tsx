import type { Metadata } from 'next';
import Hub from '@/views/games/Hub';

export const metadata: Metadata = { title: 'Games', description: 'Play Tic-Tac-Toe and Math Duel against the computer or your friends. Win games, climb the ranks and join tournaments with prizes.' };
export default function GamesPage() { return <Hub />; }
