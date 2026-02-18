import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Het Zigeunerweekend 2026',
    template: '%s | Het Zigeunerweekend 2026',
  },
  description:
    'Het Zigeunerweekend 2026 - 6 t/m 8 maart @ Resort Arcen. Plan samen het perfecte weekend!',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    title: 'Het Zigeunerweekend 2026',
    description: 'Het Zigeunerweekend 2026 - 6 t/m 8 maart @ Resort Arcen',
    siteName: 'Het Zigeunerweekend 2026',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
