'use client';
import { useState } from 'react';
import { call } from '@/lib/api';
import { naira } from '@/lib/util';
import { useApp } from './Providers';
import Icon from './Icon';

// Enter a reward code to add the benefit the admin attached to it straight into the wallet.
export default function ClaimCode({ onDone }: { onDone?: () => void }) {
  const { toast } = useApp();
  const [c, setC] = useState(''), [busy, setBusy] = useState(false);
  const go = async () => {
    if (c.trim().length < 3) return toast('Enter your code.');
    setBusy(true);
    try { const r = await call('claimReward', { code: c }); toast(`${naira(r.amount)} added to your wallet.`); setC(''); onDone && onDone(); }
    catch (e: any) { toast(e.message || 'Could not claim that code.'); }
    setBusy(false);
  };
  return (
    <div className="ord">
      <div className="row"><Icon n="gift" /><b>Have a reward code?</b></div>
      <p className="mut">Enter it to add the reward to your wallet.</p>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input placeholder="Enter code" aria-label="Reward code" value={c} maxLength={30} autoCapitalize="characters" onChange={(e) => setC(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') go(); }} />
        <button className="go" disabled={busy || !c} onClick={go}>{busy ? '...' : 'Claim'}</button>
      </div>
    </div>
  );
}
