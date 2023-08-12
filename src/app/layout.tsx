'use client';
import './globals.css'
import { Inter } from 'next/font/google'
import PS_contextProvider from './PS_context'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <PS_contextProvider>
          <body className={inter.className + ' h-full'}>{children}</body>
      </PS_contextProvider>
    </html>
  )
}
