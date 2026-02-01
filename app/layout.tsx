import React from "react"
import type { Metadata } from 'next'
import { Space_Grotesk, Geist_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Jane Doe | CS Undergraduate & ML Enthusiast',
  description: 'Computer Science undergraduate with a strong interest in machine learning and data-driven systems. Focused on building clear, explainable, and well-structured solutions.',
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
