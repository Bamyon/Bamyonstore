'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}><h1 style={{ fontSize: '2.2rem' }}>Something went wrong</h1><p className="mut" style={{ margin: '.6rem 0 1.4rem' }}>Please try again.</p><button className="go" onClick={reset}>Try again</button></div>;
}
