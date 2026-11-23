import { Gate } from '@/components/ui';
import Tournament from '@/views/games/Tournament';

export default function TournamentPage({ params }: { params: { id: string } }) { return <Gate><Tournament id={params.id} /></Gate>; }
