'use client';

import Link from 'next/link';
import { useVault } from '@/hooks/use-vault';
import { formatUnits } from 'viem';

export default function HomePage() {
  const { totalDeposits, totalYield } = useVault();

  // Fallback to static data if not loaded or not connected
  const displayTVL = totalDeposits > 0n ? formatUnits(totalDeposits, 18) : '2,400,000';
  const displaySupply = totalDeposits > 0n ? formatUnits(totalDeposits, 18) : '1,800,000';
  
  // Format large numbers
  const formatStat = (val: string) => {
    const num = parseFloat(val);
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero-badge">
          <div className="nav-dot" />
          Live on Monad Testnet
        </div>
        <h1 className="hero-title">
          Your Stablecoin.<br />
          <span className="hero-title-accent">Earning Yield.</span>
        </h1>
        <p className="hero-subtitle">
          Deposit USDC and receive pUSD — a 1:1 stablecoin that earns real yield.
          Your balance stays stable. Your earnings grow every second.
        </p>
        <div className="hero-actions">
          <Link href="/mint" className="btn btn-primary btn-lg">Start Minting pUSD</Link>
          <Link href="/earn" className="btn btn-secondary btn-lg">Watch Yield Grow →</Link>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section style={{ paddingTop: 0, paddingBottom: 60 }}>
        <div className="stats-strip">
          <div className="stats-strip-item">
            <div className="stat-label">Total Value Locked</div>
            <div className="stat-lg c-purple">${formatStat(displayTVL)}</div>
          </div>
          <div className="stats-strip-item">
            <div className="stat-label">Current APY</div>
            <div className="stat-lg c-green">12.5%</div>
          </div>
          <div className="stats-strip-item">
            <div className="stat-label">pUSD Supply</div>
            <div className="stat-lg">{formatStat(displaySupply)}</div>
          </div>
          <div className="stats-strip-item">
            <div className="stat-label">Total Yield Generated</div>
            <div className="stat-lg">${formatStat(totalYield > 0n ? formatUnits(totalYield, 18) : '342,100')}</div>
          </div>
        </div>
      </section>

      {/* ============ DUAL TOKEN EXPLANATION ============ */}
      <section>
        <div className="section-header-center">
          <div className="section-tag">Dual-Token Architecture</div>
          <h2 className="section-title">How Phantmo Works</h2>
          <p className="section-desc">
            Phantmo separates your stable balance from your yield earnings.
            Simple, transparent, and always 1:1 redeemable.
          </p>
        </div>

        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-icon feature-icon-purple">💵</div>
            <div className="feature-title">Deposit USDC</div>
            <div className="feature-desc">
              Send USDC to the Phantmo vault. Your funds join a shared liquidity pool
              that is put to work generating yield across DeFi strategies.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-purple">🪙</div>
            <div className="feature-title">Receive pUSD</div>
            <div className="feature-desc">
              For every 1 USDC deposited, you receive exactly 1 pUSD.
              This token always stays pegged at $1 — your principal never fluctuates.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-green">📈</div>
            <div className="feature-title">Earn Yield</div>
            <div className="feature-desc">
              Yield accumulates separately in the vault. You can claim it anytime
              and it never affects your pUSD balance or price.
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY PHANTMO ============ */}
      <section style={{ paddingTop: 40 }}>
        <div className="grid-2" style={{ alignItems: 'center', gap: 60 }}>
          <div>
            <div className="section-tag">Why Phantmo?</div>
            <h2 className="section-title">Built Different</h2>
            <p className="section-desc" style={{ marginBottom: 28 }}>
              Most yield vaults change your token balance or price, making it confusing.
              Phantmo keeps your money at exactly $1 and tracks yield separately.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '🛡️', title: 'Always $1', desc: 'pUSD is always redeemable for exactly 1 USDC. No price fluctuation.' },
                { icon: '⚡', title: 'Built on Monad', desc: '400ms blocks, 10,000 TPS. Fast, cheap, and Ethereum-compatible.' },
                { icon: '💎', title: 'Transparent Yield', desc: 'Yield and deposits tracked separately. You know exactly what you earned.' },
                { icon: '🔓', title: 'Fully Liquid', desc: 'No lock-ups, no waiting. Deposit and withdraw anytime.' },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.2rem', marginTop: 2 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side card */}
          <div className="card-glow" style={{ padding: 36 }}>
            <div className="stat-label">Example Scenario</div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>You deposit</div>
                <div className="stat-lg">1,000 USDC</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>You receive</div>
                <div className="stat-lg c-purple">1,000 pUSD</div>
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>After 1 year (12.5% APY)</div>
                <div className="stat-lg c-green">+125 USDC yield</div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--success-dim)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 10, fontSize: '0.825rem', color: 'var(--success)' }}>
                Your pUSD is still exactly 1,000 — yield is separate & claimable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ textAlign: 'center', paddingBottom: 100 }}>
        <h2 className="section-title" style={{ marginBottom: 12 }}>Ready to Earn?</h2>
        <p className="section-desc" style={{ maxWidth: 400, margin: '0 auto 32px' }}>
          Start minting pUSD and watch your yield accumulate in real time.
        </p>
        <div className="hero-actions">
          <Link href="/mint" className="btn btn-primary btn-lg">Mint pUSD Now</Link>
          <Link href="/earn" className="btn btn-ghost btn-lg">See Live Yield →</Link>
        </div>
      </section>
    </>
  );
}
