// Server-side reads through the Firestore REST API (public data only, respects your security rules). Cached for 60 seconds.
const PID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bamyon-shop';
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;
const dec = (v: any): any => {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return +v.integerValue;
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return { seconds: Math.floor(Date.parse(v.timestampValue) / 1000) };
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
};
const docOf = (d: any): any => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, dec(v)])) });
async function run(coll: string, field: string, value: boolean, limit = 300): Promise<any[]> {
  try {
    const r = await fetch(BASE + ':runQuery', {
      method: 'POST', headers: { 'content-type': 'application/json' }, next: { revalidate: 60 },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { booleanValue: value } } }, limit } }),
    });
    if (!r.ok) return [];
    return (await r.json()).filter((x) => x.document).map((x) => docOf(x.document));
  } catch { return []; }
}
async function one(coll: string, id: string): Promise<any> {
  try {
    const r = await fetch(`${BASE}/${coll}/${encodeURIComponent(id)}`, { next: { revalidate: 60 } });
    return r.ok ? docOf(await r.json()) : null;
  } catch { return null; }
}
const bySecs = (k: string) => (a: any, b: any) => (b[k]?.seconds || 0) - (a[k]?.seconds || 0);
export const getProducts = async () => (await run('products', 'active', true)).sort(bySecs('createdAt'));
export const getProduct = async (id: string): Promise<any> => { const p = await one('products', id); return p && p.active ? p : null; };
export const getSections = async (): Promise<any[]> => (await run('sections', 'active', true)).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
export const getPosts = async () => (await run('posts', 'published', true, 30)).sort(bySecs('at'));
export const getPost = async (id: string): Promise<any> => { const p = await one('posts', id); return p && p.published ? p : null; };
