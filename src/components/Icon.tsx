import { ICONS } from '@/lib/icons';
export default function Icon({ n }: { n: string }) {
  return <span className="ic"><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[n] || ICONS.grid }} /></span>;
}
