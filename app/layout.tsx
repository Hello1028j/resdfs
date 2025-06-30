import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clipper',
  description: 'Clipper – Download YouTube & TikTok videos as MP4 or MP3 instantly.',
  keywords: ['Clipper', 'YouTube downloader', 'TikTok downloader', 'MP4', 'MP3', 'privacy', 'terms'],
  openGraph: {
    title: 'Clipper',
    description: 'Clipper – Download YouTube & TikTok videos as MP4 or MP3 instantly.',
    url: 'https://your-site-url.com',
    siteName: 'Clipper',
    type: 'website',
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Clipper – Download YouTube & TikTok videos as MP4 or MP3 instantly." />
        <meta name="keywords" content="Clipper, YouTube downloader, TikTok downloader, MP4, MP3, privacy, terms" />
        <meta property="og:title" content="Clipper" />
        <meta property="og:description" content="Clipper – Download YouTube & TikTok videos as MP4 or MP3 instantly." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Clipper" />
        <meta property="og:url" content="https://your-site-url.com" />
        <meta property="og:image" content="/favicon.ico" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Clipper" />
        <meta name="twitter:description" content="Clipper – Download YouTube & TikTok videos as MP4 or MP3 instantly." />
        <meta name="twitter:image" content="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="absolute left-1/2 aspect-square w-[350%] -translate-x-1/2 overflow-hidden md:w-[190%] lg:w-[190%] xl:w-[190%] 2xl:mx-auto" style={{ backgroundImage: 'url(/img/background/gradient-optimized.svg)', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center top', mask: 'linear-gradient(transparent 0%, black 5%, black 100%)', backfaceVisibility: 'hidden', perspective: '1000px', willChange: 'transform' }} />
        {children}
        <Toaster />
      </body>
    </html>
  )
} 