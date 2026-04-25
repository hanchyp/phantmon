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

// ── Mock constants ──────────────────────────────────────────
// A fixed past timestamp so mock yield is never 0 on load.
// "Deposit" supposedly started 7 days ago.
const MOCK_DEPOSIT = 25_000;        // 25,000 pUSD
const MOCK_APY = 12.5;
const MOCK_START = Date.now() - 7 * 24 * 3600 * 1000; // 7 days ago
const MOCK_YIELD_PER_SEC = (MOCK_DEPOSIT * MOCK_APY) / (365.25 * 24 * 3600 * 100);

export default function EarnPage() {
  const { authenticated, login } = usePrivy();
  const { userDeposits, claimableYield: onChainClaimableYield, refetchAll } = useVault();
  
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { claimYield, isPending, isConfirming, error } = useVaultActions(() => {
    setClaimSuccess(true);
    refetchAll();
    setTimeout(() => setClaimSuccess(false), 4000);
  });

  const parsedDeposits = parseFloat(formatUnits(userDeposits, 18));
  const parsedClaimable = parseFloat(formatUnits(onChainClaimableYield, 18));
  
  // Decide whether we have real on-chain data
  const hasRealData = parsedDeposits > 0;

  const apy = MOCK_APY;

  // Use real values when available, otherwise mock
  const displayDeposit = hasRealData ? parsedDeposits : MOCK_DEPOSIT;
  const yieldPerSecond = (displayDeposit * apy) / (365.25 * 24 * 3600 * 100);

  // Base claimable: real on-chain value, or the time-based mock amount
  const baseClaimable = hasRealData
    ? parsedClaimable
    : MOCK_YIELD_PER_SEC * ((Date.now() - MOCK_START) / 1000);

  const [accumulatedYield, setAccumulatedYield] = useState(baseClaimable);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Sync base when on-chain data or mock baseline changes
  useEffect(() => {
    const newBase = hasRealData
      ? parsedClaimable
      : MOCK_YIELD_PER_SEC * ((Date.now() - MOCK_START) / 1000);
    setAccumulatedYield(newBase);
    startRef.current = Date.now();
    setElapsed(0);
  }, [parsedClaimable, hasRealData]);

  // Live ticker — updates every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - startRef.current) / 1000;
      setElapsed(dt);

      if (hasRealData) {
        setAccumulatedYield(parsedClaimable + (yieldPerSecond * dt));
      } else {
        // Mock: total seconds since mock start
        const totalSec = (now - MOCK_START) / 1000;
        setAccumulatedYield(MOCK_YIELD_PER_SEC * totalSec);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [parsedClaimable, yieldPerSecond, hasRealData]);

  const handleClaim = () => {
    claimYield();
  };

  // Projected earnings
  const daily = displayDeposit * apy / 100 / 365.25;
  const monthly = daily * 30;
  const yearly = displayDeposit * apy / 100;

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

          {!hasRealData && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>
              Demo mode — connect wallet for live data
            </div>
          )}

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
                disabled={accumulatedYield <= 0 || isPending || !hasRealData}
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
                <span style={{ fontWeight: 600 }}>{fmt(displayDeposit)} pUSD</span>
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

