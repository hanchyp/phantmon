'use client';

import { useState, useEffect, useRef } from 'react';
import { useVault } from '@/hooks/use-vault';
import { useVaultActions } from '@/hooks/use-vault-actions';
import { formatUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtLong(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 }).format(n);
}

export default function EarnPage() {
  const { authenticated, login } = usePrivy();
  const { userDeposits, claimableYield: onChainClaimableYield, refetchAll } = useVault();
  
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { claimYield, isPending, isConfirming, error, resetState } = useVaultActions(() => {
    setClaimSuccess(true);
    resetState();
    refetchAll();
    setTimeout(() => setClaimSuccess(false), 4000);
  });

  const parsedDeposits = parseFloat(formatUnits(userDeposits, 18));
  const parsedClaimable = parseFloat(formatUnits(onChainClaimableYield, 18));
  
  const apy = 12.5; // Fixed for now

  // Calculate yield per second based on APY and deposit
  // yieldPerSecond = (deposit * apy) / (365.25 * 24 * 3600 * 100)
  const yieldPerSecond = (parsedDeposits * apy) / (365.25 * 24 * 3600 * 100);

  const [accumulatedYield, setAccumulatedYield] = useState(parsedClaimable);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Sync with on-chain data
  useEffect(() => {
    setAccumulatedYield(parsedClaimable);
    startRef.current = Date.now();
    setElapsed(0);
  }, [parsedClaimable]);

  // Live ticker — updates every 100ms
  useEffect(() => {
    if (!authenticated || parsedDeposits <= 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - startRef.current) / 1000; // seconds elapsed
      setElapsed(dt);
      setAccumulatedYield(parsedClaimable + (yieldPerSecond * dt));
    }, 100);

    return () => clearInterval(interval);
  }, [parsedClaimable, yieldPerSecond, authenticated, parsedDeposits]);

  const handleClaim = () => {
    claimYield();
  };

  // Projected earnings
  const daily = parsedDeposits * apy / 100 / 365.25;
  const monthly = daily * 30;
  const yearly = parsedDeposits * apy / 100;

  return (
    <>
      {/* Header */}
      <section style={{ paddingBottom: 20 }}>
        <div className="section-tag">Live Yield Tracker</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem' }}>Your Money is Growing</h1>
        <p className="section-desc">Watch your earnings increase in real time. Every second counts.</p>
      </section>

      {/* Big Live Counter */}
      <section style={{ paddingTop: 0, paddingBottom: 40, textAlign: 'center' }}>
        <div className="card-glow" style={{ padding: '60px 32px', maxWidth: 720, margin: '0 auto' }}>
          <div className="stat-label" style={{ marginBottom: 16 }}>Total Yield Earned</div>
          <div className="yield-counter">
            ${fmtLong(accumulatedYield)}
          </div>
          <div style={{ marginTop: 16, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--success)' }}>+${yieldPerSecond.toFixed(10)}</span> per second
          </div>

          <div className="divider" />
          
          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: 16 }}>
              {(error as any)?.shortMessage || error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!authenticated ? (
              <button className="btn btn-primary btn-lg" onClick={login}>
                Connect Wallet to Claim
              </button>
            ) : (
              <button
                className="btn btn-green btn-lg"
                onClick={handleClaim}
                disabled={accumulatedYield <= 0 || isPending}
              >
                {isPending ? (
                  <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> {isConfirming ? 'Confirming...' : 'Claiming...'}</>
                ) : (
                  `Claim $${fmt(accumulatedYield)}`
                )}
              </button>
            )}
          </div>

          {claimSuccess && (
            <div className="toast toast-success" style={{ marginTop: 20, justifyContent: 'center' }}>
              ✓ Yield claimed and sent to your wallet
            </div>
          )}
        </div>
      </section>

      {/* Projections */}
      <section style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 16 }}>Projected Earnings</div>
          <div className="grid-3">
            <div className="card">
              <div className="stat-label">Daily</div>
              <div className="stat-md c-green">${fmt(daily)}</div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>≈ ${(daily / 24).toFixed(4)}/hr</div>
            </div>
            <div className="card">
              <div className="stat-label">Monthly</div>
              <div className="stat-md c-green">${fmt(monthly)}</div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>30 days projected</div>
            </div>
            <div className="card">
              <div className="stat-label">Yearly</div>
              <div className="stat-md c-green">${fmt(yearly)}</div>
              <div style={{ marginTop: 6 }}><span className="badge badge-green">{apy}% APY</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Position */}
      <section style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 16 }}>Your Position</div>
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>pUSD Deposited</span>
                <span style={{ fontWeight: 600 }}>{fmt(parsedDeposits)} pUSD</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>APY</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{apy}%</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Yield per second</span>
                <span style={{ fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>${yieldPerSecond.toFixed(10)}</span>
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Time active on this page</span>
                <span style={{ fontWeight: 600 }}>{Math.floor(elapsed)}s</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Earned since page load</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+${(yieldPerSecond * elapsed).toFixed(8)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
