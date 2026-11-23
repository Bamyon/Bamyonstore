import Link from 'next/link';
export default function NotFound() {
  return <div className="wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}><h1 style={{ fontSize: '3rem' }}>Page not found</h1><p className="mut" style={{ margin: '.6rem 0 1.4rem' }}>That page does not exist or has moved.</p><Link className="btn go" href="/shop">Go to the shop</Link></div>;
}
