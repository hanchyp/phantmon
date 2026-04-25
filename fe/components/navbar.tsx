'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/mint', label: 'Mint & Exchange' },
  { href: '/earn', label: 'Earn' },
];

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();
  const chainId = useChainId();

  const isWrongNetwork = chainId !== 10143;

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <div className="nav-logo-icon">👻</div>
        <span className="nav-logo-text">Phantmon</span>
      </Link>

      <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        <div className="nav-network">
          <div className={`nav-dot`} style={{ background: authenticated && isWrongNetwork ? 'var(--error)' : 'var(--success)' }} />
          {authenticated && isWrongNetwork ? 'Wrong Network' : 'Monad Testnet'}
        </div>
        
        {authenticated && user?.wallet ? (
          <button className="nav-wallet-btn" onClick={logout} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            {truncateAddress(user.wallet.address)}
          </button>
        ) : (
          <button className="nav-wallet-btn" onClick={login}>Connect Wallet</button>
        )}
      </div>

      <button
        className="nav-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
    </nav>
  );
}
