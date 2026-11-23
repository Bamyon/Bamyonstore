'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './Providers';
import { safeImg } from '@/lib/util';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheetbox">
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>{title}</h3><button className="alt ibtn" aria-label="Close" onClick={onClose}><Icon n="close" /></button></div>
        {children}
      </div>
    </div>
  );
}
export const Pill = ({ children }: { children: ReactNode }) => <span className="pill">{children}</span>;
export const Loading = () => <p className="mut empty">Loading...</p>;
export const Empty = ({ children }: { children: ReactNode }) => <p className="mut empty">{children}</p>;
export function Avatar({ u = {}, big }: { u?: any; big?: boolean }) {
  const s = safeImg(u.photo);
  return s ? <img className={'av' + (big ? ' big' : '')} src={s} alt="" /> : <i className={'av' + (big ? ' big' : '')}>{(u.name || '?')[0].toUpperCase()}</i>;
}
// Wraps a page that needs sign-in and, optionally, a permission ("admin" means the admin role only).
export function Gate({ perm, children }: { perm?: string; children: ReactNode }) {
  const { user, profile, ready, can } = useApp();
  const r = useRouter();
  useEffect(() => { if (ready && !user) r.replace('/login?next=' + encodeURIComponent(location.pathname)); }, [ready, user, r]);
  if (!ready || !user || !profile) return <Loading />;
  if (perm && !(perm === 'admin' ? profile.role === 'admin' : can(perm))) return <Empty>You do not have access to this section.</Empty>;
  return children;
}
export const fd = (e: any): { form: HTMLFormElement; v: Record<string, any> } => { e.preventDefault(); return { form: e.currentTarget, v: Object.fromEntries(new FormData(e.currentTarget)) as Record<string, any> }; };
