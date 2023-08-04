'use client';
import './globals.css'
import { Inter } from 'next/font/google'
import { PS_contextProvider } from './PS_context'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
	<PS_contextProvider>
    <html lang="en" className="h-full">
      <body className={inter.className + ' h-full'}>{children}</body>
    </html>
	</PS_contextProvider>
  )
}
