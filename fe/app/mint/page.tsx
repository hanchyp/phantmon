'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/hooks/use-vault';
import { useVaultActions } from '@/hooks/use-vault-actions';
import { formatUnits, parseUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function MintPage() {
  const { authenticated, login } = usePrivy();
  const { address } = useAccount();
  const { pUsdBalance, usdcBalance, refetchAll } = useVault();
  
  const {
    approveAndDeposit,
    deposit,
    withdraw,
    mintMockUSDC,
    isPending,
    isApproving,
    isConfirming,
    isConfirmed,
    error,
    resetState
  } = useVaultActions(() => {
    // On success
    if (tab === 'mint') {
      setMintAmount('');
      setMintSuccess(true);
      setTimeout(() => setMintSuccess(false), 4000);
    } else {
      setRedeemAmount('');
      setRedeemSuccess(true);
      setTimeout(() => setRedeemSuccess(false), 4000);
    }
    refetchAll();
  });

  const parsedPUsdBalance = parseFloat(formatUnits(pUsdBalance, 18));
  const parsedUsdcBalance = parseFloat(formatUnits(usdcBalance, 18));

  // Tab
  const [tab, setTab] = useState<'mint' | 'redeem'>('mint');

  // Mint (Deposit)
  const [mintAmount, setMintAmount] = useState('');
  const [mintSuccess, setMintSuccess] = useState(false);

  // Redeem (Withdraw)
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleMint = async () => {
    if (!mintAmount) return;
    const amountWei = parseUnits(mintAmount, 18);
    // 1. Approve MockUSDC for Vault
    // 2. The hook handles the flow, wait for user tx
    approveAndDeposit(amountWei);
  };

  const handleRedeem = async () => {
    if (!redeemAmount) return;
    const amountWei = parseUnits(redeemAmount, 18);
    withdraw(amountWei);
  };

  const handleGetMockUSDC = async () => {
    if (!address) return;
    const amountWei = parseUnits('1000', 18); // Mint 1000 USDC
    mintMockUSDC(address, amountWei);
  };

  // Switch tabs reset states
  useEffect(() => {
    resetState();
    setMintAmount('');
    setRedeemAmount('');
    setMintSuccess(false);
    setRedeemSuccess(false);
  }, [tab, resetState]);


  return (
    <>
      {/* Header */}
      <section style={{ paddingBottom: 0 }}>
        <div className="section-tag">Vault Actions</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem' }}>Mint & Exchange</h1>
        <p className="section-desc">Mint pUSD by depositing USDC, or redeem pUSD back to USDC. Always 1:1.</p>
        
        {authenticated && (
          <button 
            onClick={handleGetMockUSDC}
            className="badge badge-purple" 
            style={{ marginTop: 16, cursor: 'pointer', display: 'inline-flex', padding: '6px 12px' }}
          >
            🚰 Faucet: Get 1,000 MockUSDC
          </button>
        )}
      </section>

      {/* Balance Overview */}
      <section style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div className="grid-3">
          <div className="card">
            <div className="stat-label">Your pUSD Balance</div>
            <div className="stat-lg c-purple">{authenticated ? fmt(parsedPUsdBalance) : '0.00'}</div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>= {authenticated ? fmt(parsedPUsdBalance) : '0.00'} USDC</div>
          </div>
          <div className="card">
            <div className="stat-label">Wallet USDC</div>
            <div className="stat-lg">{authenticated ? fmt(parsedUsdcBalance) : '0.00'}</div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available to deposit</div>
          </div>
          <div className="card">
            <div className="stat-label">Exchange Rate</div>
            <div className="stat-lg c-green">1 : 1</div>
            <div style={{ marginTop: 8 }}><span className="badge badge-green">Stable Peg</span></div>
          </div>
        </div>
      </section>

      {/* Main Action Card */}
      <section style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card-glow" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setTab('mint')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: tab === 'mint' ? 'rgba(131,110,249,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: tab === 'mint' ? '2px solid var(--monad-purple)' : '2px solid transparent',
                  color: tab === 'mint' ? 'var(--monad-purple-bright)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                }}
              >
                Mint pUSD
              </button>
              <button
                onClick={() => setTab('redeem')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: tab === 'redeem' ? 'rgba(131,110,249,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: tab === 'redeem' ? '2px solid var(--monad-purple)' : '2px solid transparent',
                  color: tab === 'redeem' ? 'var(--monad-purple-bright)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                }}
              >
                Redeem USDC
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: 32 }}>
              {tab === 'mint' ? (
                <>
                  {/* Mint Form */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Deposit USDC and receive pUSD at a 1:1 ratio.
                    </div>

                    <label className="input-label">You pay</label>
                    <div className="input-group" style={{ marginBottom: 4 }}>
                      <input
                        type="number"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field"
                        min="0"
                        disabled={isPending}
                      />
                      <span className="input-suffix">USDC</span>
                    </div>
                    {authenticated && (
                      <button className="input-max-btn" onClick={() => setMintAmount(parsedUsdcBalance.toString())}>
                        Max: {fmt(parsedUsdcBalance)} USDC
                      </button>
                    )}
                  </div>

                  {/* Arrow */}
                  <div style={{ textAlign: 'center', margin: '8px 0', color: 'var(--text-muted)' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="input-label">You receive</label>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: mintAmount ? 'var(--monad-purple-bright)' : 'var(--text-muted)' }}>
                        {mintAmount && parseFloat(mintAmount) > 0 ? fmt(parseFloat(mintAmount)) : '0.00'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>pUSD</span>
                    </div>
                  </div>
                  
                  {error && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: 16 }}>
                      {(error as any)?.shortMessage || error.message}
                    </div>
                  )}

                  {!authenticated ? (
                     <button className="btn btn-primary w-full" onClick={login}>Connect Wallet</button>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleMint}
                      disabled={!mintAmount || parseFloat(mintAmount) <= 0 || parseFloat(mintAmount) > parsedUsdcBalance || isPending}
                    >
                      {isPending ? (
                        <><span className="spinner" /> {isApproving ? 'Approving...' : isConfirming ? 'Confirming...' : 'Minting...'}</>
                      ) : parseFloat(mintAmount) > parsedUsdcBalance ? (
                        'Insufficient Balance'
                      ) : (
                        'Approve & Mint pUSD'
                      )}
                    </button>
                  )}

                  {mintSuccess && (
                    <div className="toast toast-success" style={{ marginTop: 16 }}>
                      ✓ pUSD minted successfully — added to your balance
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Redeem Form */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Burn pUSD and receive USDC back at a 1:1 ratio.
                    </div>

                    <label className="input-label">You burn</label>
                    <div className="input-group" style={{ marginBottom: 4 }}>
                      <input
                        type="number"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field"
                        min="0"
                        max={parsedPUsdBalance}
                        disabled={isPending}
                      />
                      <span className="input-suffix">pUSD</span>
                    </div>
                    {authenticated && (
                      <button className="input-max-btn" onClick={() => setRedeemAmount(parsedPUsdBalance.toString())}>
                        Max: {fmt(parsedPUsdBalance)} pUSD
                      </button>
                    )}
                  </div>

                  {/* Arrow */}
                  <div style={{ textAlign: 'center', margin: '8px 0', color: 'var(--text-muted)' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="input-label">You receive</label>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: redeemAmount ? 'var(--success)' : 'var(--text-muted)' }}>
                        {redeemAmount && parseFloat(redeemAmount) > 0 ? fmt(parseFloat(redeemAmount)) : '0.00'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>USDC</span>
                    </div>
                  </div>

                  {error && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: 16 }}>
                      {(error as any)?.shortMessage || error.message}
                    </div>
                  )}

                  {!authenticated ? (
                     <button className="btn btn-primary w-full" onClick={login}>Connect Wallet</button>
                  ) : (
                    <button
                      className="btn btn-ghost w-full"
                      onClick={handleRedeem}
                      disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > parsedPUsdBalance || isPending}
                      style={{ borderColor: 'var(--border-accent)', color: 'var(--monad-purple)' }}
                    >
                      {isPending ? (
                        <><span className="spinner" style={{ borderColor: 'rgba(131,110,249,0.3)', borderTopColor: 'var(--monad-purple)' }} /> {isConfirming ? 'Confirming...' : 'Redeeming...'}</>
                      ) : parseFloat(redeemAmount) > parsedPUsdBalance ? (
                        'Insufficient Balance'
                      ) : (
                        'Redeem USDC'
                      )}
                    </button>
                  )}

                  {redeemSuccess && (
                    <div className="toast toast-success" style={{ marginTop: 16 }}>
                      ✓ USDC redeemed successfully — returned to wallet
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section style={{ paddingTop: 20 }}>
        <div className="grid-2" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>Minting pUSD</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Instant processing', 'Earn yield immediately', 'No fees'].map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--success)">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>Redeeming USDC</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['No lock-up period', 'Always 1:1 ratio', 'Yield stays claimable'].map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--success)">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
