import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Providers from '@/components/providers'
import './globals.css'
import './phantmon.css'

export const metadata: Metadata = {
  title: 'Phantmon — Phantom Monad Yield Vault',
  description: 'Deposit USDC, receive pUSD, and earn real yield on Monad. A dual-token DeFi protocol with simulated compounding.',
}

export const viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <div className="page-wrapper">
            {children}
          </div>
          <Footer />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
