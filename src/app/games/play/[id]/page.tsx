import { Gate } from '@/components/ui';
import Match from '@/views/games/Match';

export default function PlayPage({ params }: { params: { id: string } }) { return <Gate><Match id={params.id} /></Gate>; }
