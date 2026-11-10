import { CFG } from './firebase';
import { BRAND } from '@/config/brand';

export const naira = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
export const K = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k' : String(Math.round(n)));
export const off = (p) => (p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0);
export const left = (p) => (typeof p.qty === 'number' ? p.qty : Infinity);
export const soldOut = (p) => p.stock === false || left(p) <= 0;
export const low = (p) => typeof p.qty === 'number' && p.qty > 0 && p.qty <= (p.lowAt ?? 5);
export const safeImg = (u) => (typeof u === 'string' && u.startsWith('https://res.cloudinary.com/') ? u : '');
export const cl = (u, w = 640) => { const s = safeImg(u); return s ? s.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`) : ''; };
export const ms = (t) => (t?.toMillis ? t.toMillis() : t?.seconds ? t.seconds * 1000 : 0);
export const when = (t) => { const m = ms(t); return m ? new Date(m).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''; };
export const ago = (t) => {
  const s = Math.max(0, (Date.now() - (ms(t) || Date.now())) / 1e3);
  return s < 60 ? 'Just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : new Date(Date.now() - s * 1e3).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const short = (t) => { const s = Math.max(0, (Date.now() - (ms(t) || Date.now())) / 1e3); return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : s < 604800 ? Math.floor(s / 86400) + 'd' : Math.floor(s / 604800) + 'w'; };

export async function shrink(file: File, S = 1400): Promise<File> {
  // Never blocks an upload: if the browser cannot decode or resize the picture, the original is sent as it is.
  try {
    if ((file.type && !file.type.startsWith('image/')) || file.type === 'image/gif') return file;
    const bm = await createImageBitmap(file), k = Math.min(1, S / Math.max(bm.width, bm.height));
    if (k === 1 && file.size < 9e5) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
    c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height);
    const out: File = await new Promise((r) => c.toBlob((b) => r(b ? new File([b], `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`, { type: b.type }) : file), 'image/webp', 0.9));
    return out;
  } catch { return file; }
}
export async function uploadImg(file, folder = 'blog') {
  if (!CFG.cloudName) throw new Error('Cloudinary is not set up.');
  const d = new FormData();
  d.append('file', await shrink(file)); d.append('upload_preset', CFG.preset); d.append('folder', BRAND.cloudFolder + '/' + folder);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CFG.cloudName}/image/upload`, { method: 'POST', body: d }), j = await r.json();
  if (!j.secure_url) throw new Error('Upload failed.');
  return j.secure_url;
}

/** Uploads to Cloudinary and reports progress (0-100). The picture is resized in the browser first. */
export async function uploadImgProgress(file: File, folder: string, onProgress: (pct: number) => void): Promise<string> {
  if (!CFG.cloudName) throw new Error('Image uploads are not set up.');
  const body = new FormData();
  body.append('file', await shrink(file)); body.append('upload_preset', CFG.preset); body.append('folder', BRAND.cloudFolder + '/' + folder);
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${CFG.cloudName}/image/upload`);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => { try { const j = JSON.parse(x.responseText); j.secure_url ? resolve(j.secure_url) : reject(new Error('Upload failed.')); } catch { reject(new Error('Upload failed.')); } };
    x.onerror = () => reject(new Error('Network error. Check your connection.'));
    x.send(body);
  });
}
export const isImageUrl = (t: string) => /^https:\/\/res\.cloudinary\.com\/\S+$/.test(t || '');
