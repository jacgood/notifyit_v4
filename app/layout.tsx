import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider'
import { SessionProvider } from '@/components/SessionProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NotifyIT - OnCall Alert Manager',
  description: 'Never miss critical voicemails with persistent alerts',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <SessionProvider>
          <QueryProvider>
            <ServiceWorkerProvider>
              {children}
            </ServiceWorkerProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}