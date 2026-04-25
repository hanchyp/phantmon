'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-copy">
          Phantmon © 2026 · Built on Monad · Demo with simulated yield
        </div>
        <div className="footer-links">
          <Link href="/" className="footer-link">Home</Link>
          <Link href="/mint" className="footer-link">Mint</Link>
          <Link href="/earn" className="footer-link">Earn</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
