'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useApp } from './Providers';
import { cl, uploadImgProgress } from '@/lib/util';

interface Props { value?: string; onChange: (url: string) => void | Promise<void>; folder?: string; shape?: 'square' | 'circle'; label?: string; hint?: string }

// A friendly picture picker: tap or drop, live preview, progress ring, replace or remove.
export default function ImageUpload({ value = '', onChange, folder = 'uploads', shape = 'square', label = 'Add a photo', hint = 'Tap, or drop a picture here' }: Props) {
  const { toast } = useApp();
  const [preview, setPreview] = useState(''), [pct, setPct] = useState(0), [busy, setBusy] = useState(false), [drag, setDrag] = useState(false);
  const pick = useRef<HTMLInputElement>(null), cam = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const take = async (file?: File | null) => {
    if (!file) return;
    if (file.type ? !file.type.startsWith('image/') : !/\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i.test(file.name)) return toast('Please choose a picture.');
    if (file.size > 25e6) return toast('That picture is too large. Try one under 25 MB.');
    setPreview(URL.createObjectURL(file)); setPct(0); setBusy(true);
    try { const url = await uploadImgProgress(file, folder, setPct); await onChange(url); }
    catch (e: any) { setPreview(''); toast(e?.message || 'Upload failed. Please try again.'); }
    setBusy(false);
  };
  const shown = preview || (value ? cl(value, 700) : '');
  const ring = { background: `conic-gradient(var(--acc) ${pct * 3.6}deg, rgba(255,255,255,.18) 0)` };
  return (
    <div className={'upl ' + shape}>
      <div className={'upl-tile' + (drag ? ' drag' : '') + (shown ? ' has' : '')} role="button" tabIndex={0} aria-label={label}
        onClick={() => !busy && pick.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}>
        {shown ? <img src={shown} alt="" /> : <><span className="upl-plus"><Icon n="plus" /></span><b>{label}</b><small>{hint}</small></>}
        {shown && !busy && <span className="upl-badge"><Icon n="camera" /></span>}
        {busy && <span className="upl-busy"><span className="upl-ring" style={ring}><i>{pct}%</i></span></span>}
      </div>
      {shown && !busy && (
        <div className="row upl-actions">
          <button type="button" className="alt" onClick={() => pick.current?.click()}><Icon n="upload" />Replace</button>
          <button type="button" className="alt" onClick={() => cam.current?.click()}><Icon n="camera" />Camera</button>
          <button type="button" className="alt" onClick={() => { setPreview(''); onChange(''); }}><Icon n="trash" />Remove</button>
        </div>
      )}
      <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}
