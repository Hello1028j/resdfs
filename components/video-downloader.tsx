"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Download, Copy, Play, Music, Loader2, Clock } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

interface VideoInfo {
  title: string
  duration: string
  thumbnail: string
  formats: Array<{
    quality: string
    size: string
    url: string
  }>
}

interface DownloadHistoryItem {
  title: string
  url: string
  format: string
  date: string
  thumbnail: string
}

function getHistory(): DownloadHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('clipper-history') || '[]')
  } catch {
    return []
  }
}

function setHistory(items: DownloadHistoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('clipper-history', JSON.stringify(items))
}

export function VideoDownloader() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState('')
  const [downloadETA, setDownloadETA] = useState('')
  const [error, setError] = useState('')
  const [recentDownloads, setRecentDownloads] = useState<DownloadHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [startTime, setStartTime] = useState('00:00:00')
  const [endTime, setEndTime] = useState('')

  // Load history on mount
  useEffect(() => {
    setRecentDownloads(getHistory())
  }, [])

  function getEstimatedSize(): string {
    if (!videoInfo || !videoInfo.formats || videoInfo.formats.length === 0) {
      return format === 'mp4' ? '~168.5 MB' : '~45.0 MB'
    }

    // For MP4, look for video formats
    if (format === 'mp4') {
      const videoFormats = videoInfo.formats.filter(f => f.quality && !f.quality.includes('audio'))
      if (videoFormats.length > 0) {
        // Get the best quality format
        const bestFormat = videoFormats.reduce((best, current) => {
          const bestQuality = parseInt(best.quality.replace(/\D/g, '')) || 0
          const currentQuality = parseInt(current.quality.replace(/\D/g, '')) || 0
          return currentQuality > bestQuality ? current : best
        })
        return bestFormat.size || '~168.5 MB'
      }
    }

    // For MP3, look for audio formats
    if (format === 'mp3') {
      const audioFormats = videoInfo.formats.filter(f => f.quality && f.quality.includes('audio'))
      if (audioFormats.length > 0) {
        const bestFormat = audioFormats[0] // Usually the first audio format is the best
        return bestFormat.size || '~45.0 MB'
      }
    }

    // Fallback to first available format
    const firstFormat = videoInfo.formats[0]
    return firstFormat.size || (format === 'mp4' ? '~168.5 MB' : '~45.0 MB')
  }

  function getEstimatedSizeNumber(): number {
    if (!videoInfo || !videoInfo.formats || videoInfo.formats.length === 0) {
      return format === 'mp4' ? 168.54 : 44.95
    }

    // For MP4, look for video formats
    if (format === 'mp4') {
      const videoFormats = videoInfo.formats.filter(f => f.quality && !f.quality.includes('audio'))
      if (videoFormats.length > 0) {
        // Get the best quality format
        const bestFormat = videoFormats.reduce((best, current) => {
          const bestQuality = parseInt(best.quality.replace(/\D/g, '')) || 0
          const currentQuality = parseInt(current.quality.replace(/\D/g, '')) || 0
          return currentQuality > bestQuality ? current : best
        })
        // Extract number from size string (e.g., "168.5 MB" -> 168.5)
        const sizeMatch = bestFormat.size?.match(/(\d+\.?\d*)/)
        return sizeMatch ? parseFloat(sizeMatch[1]) : 168.54
      }
    }

    // For MP3, look for audio formats
    if (format === 'mp3') {
      const audioFormats = videoInfo.formats.filter(f => f.quality && f.quality.includes('audio'))
      if (audioFormats.length > 0) {
        const bestFormat = audioFormats[0]
        const sizeMatch = bestFormat.size?.match(/(\d+\.?\d*)/)
        return sizeMatch ? parseFloat(sizeMatch[1]) : 44.95
      }
    }

    // Fallback to first available format
    const firstFormat = videoInfo.formats[0]
    const sizeMatch = firstFormat.size?.match(/(\d+\.?\d*)/)
    return sizeMatch ? parseFloat(sizeMatch[1]) : (format === 'mp4' ? 168.54 : 44.95)
  }

  function addToHistory(item: DownloadHistoryItem) {
    const updated = [item, ...getHistory().filter(i => i.url !== item.url || i.format !== item.format)]
      .slice(0, 10) // keep max 10
    setHistory(updated)
    setRecentDownloads(updated)
  }

  function handleCopyLink(url: string) {
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  function handleRedownload(item: DownloadHistoryItem) {
    setUrl(item.url)
    setFormat(item.format)
    setTimeout(() => handleFetchInfo(), 100)
  }

  function handleClearHistory() {
    setHistory([])
    setRecentDownloads([])
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      // Auto-fetch info after pasting
      if (text.trim()) {
        setTimeout(() => handleFetchInfo(), 100)
      }
    } catch (err) {
      toast.error('Failed to paste from clipboard')
    }
  }

  // Auto-fetch when URL changes (debounced)
  useEffect(() => {
    if (!url.trim()) return
    
    const timer = setTimeout(() => {
      handleFetchInfo()
    }, 1000) // Wait 1 second after user stops typing
    
    return () => clearTimeout(timer)
  }, [url])

  async function handleFetchInfo() {
    if (!url.trim()) {
      return
    }

    setIsLoading(true)
    setError('')
    setVideoInfo(null)

    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch video info')
      }

      const data = await response.json()
      setVideoInfo(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownload() {
    if (!videoInfo) return

    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadSpeed('')
    setDownloadETA('')

    // Estimate file size based on format
    const estimatedSize = getEstimatedSizeNumber()

    // Show Sonner download toast
    toast("Download in progress", {
      description: (
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="font-medium truncate whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-[220px]">{videoInfo.title}</span>
        </div>
      ),
      duration: Infinity,
      id: "download-toast",
    })

    // Simulate progress updates (no longer update toast)
    const progressInterval = setInterval(() => {
      setDownloadProgress(prevProgress => {
        if (prevProgress < 90) {
          const increment = Math.random() * 10 + 5 // 5-15% increments
          const newProgress = Math.min(prevProgress + increment, 90)
          // Calculate simulated speed and downloaded MB
          const elapsed = 1 // Rough estimate for simulation
          const downloadedMB = (newProgress / 100) * estimatedSize
          const speed = (downloadedMB / elapsed).toFixed(1)
          setDownloadSpeed(`${speed} MB/s`)
          return newProgress
        }
        return prevProgress
      })
    }, 500)

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url.trim(), 
          format,
          title: videoInfo.title,
          startTime,
          endTime,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Download failed')
      }

      // Complete the progress
      setDownloadProgress(100)
      clearInterval(progressInterval)
      toast("Download finished", {
        description: (
          <div className="flex items-center gap-2 pr-3 w-full overflow-hidden">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0">✓</span>
            <span className="font-medium truncate whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-[220px]">Download finished!</span>
          </div>
        ),
        id: "download-toast",
        duration: 2000,
      })

      // Add to history
      addToHistory({
        title: videoInfo.title,
        url: url.trim(),
        format,
        date: new Date().toISOString(),
        thumbnail: videoInfo.thumbnail
      })

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${videoInfo.title}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      clearInterval(progressInterval)
      toast("Download failed", {
        description: (
          <div className="flex items-center gap-2 pr-3 w-full overflow-hidden">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="font-medium truncate whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-[220px]">{err.message}</span>
          </div>
        ),
        id: "download-toast",
        duration: 3000,
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      setDownloadSpeed('')
      setDownloadETA('')
    }
  }

  function formatToHHMMSS(value: string): string {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '').slice(0, 6)
    const padded = digits.padStart(6, '0')
    const h = padded.slice(0, 2)
    const m = padded.slice(2, 4)
    const s = padded.slice(4, 6)
    return `${h}:${m}:${s}`
  }

  return (
    <div className="w-full space-y-6">
      {/* Top bar: logo left, history right */}
      <div className="fixed top-4 left-0 w-full flex items-center justify-between px-4 z-50 pointer-events-none">
        <div className="text-xl font-bold tracking-tight select-none text-foreground pointer-events-auto">Clipper</div>
        <Sheet open={showHistory} onOpenChange={setShowHistory}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto"
              onClick={() => setShowHistory(true)}
              aria-label="Show download history"
            >
              <Clock className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 max-w-full">
            <SheetHeader>
              <SheetTitle>Recent Downloads</SheetTitle>
              {recentDownloads.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearHistory} className="ml-auto">Clear</Button>
              )}
            </SheetHeader>
            <div className="mt-4">
              {recentDownloads.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center mt-8">No downloads yet.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentDownloads.map((item) => (
                    <div key={item.url + item.format} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                      <img src={item.thumbnail} alt="thumb" className="w-12 h-8 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate max-w-xs">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.format.toUpperCase()} • {new Date(item.date).toLocaleString()}</div>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleRedownload(item)} title="Re-download">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleCopyLink(item.url)} title="Copy link">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Mascot */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Clipper</h1>
        <p className="text-muted-foreground mb-4">Download videos from YouTube & TikTok</p>
        
        {/* Supported Services */}
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="outline" className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            TikTok
          </Badge>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube or TikTok URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handlePaste} variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Format Toggle */}
        <ToggleGroup
          type="single"
          value={format}
          onValueChange={value => {
            if (typeof value === 'string') setFormat(value)
          }}
          className="w-full justify-center my-2"
        >
          <ToggleGroupItem value="mp4" aria-label="MP4" className="flex items-center gap-2 w-1/2 justify-center">
            <Play className="h-4 w-4" /> MP4
          </ToggleGroupItem>
          <ToggleGroupItem value="mp3" aria-label="MP3" className="flex items-center gap-2 w-1/2 justify-center">
            <Music className="h-4 w-4" /> MP3
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-start">
              <Skeleton className="w-32 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Video Info */}
      {videoInfo && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-4">
            <div className="flex gap-4 items-start">
              <div className="flex flex-1 justify-center items-center w-full md:w-auto h-full min-h-[10rem]">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-44 h-28 object-cover rounded-lg flex-shrink-0 mb-2"
                  style={{ minWidth: '11rem', minHeight: '7rem' }}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <CardTitle className="text-base line-clamp-2 mb-3">{videoInfo.title}</CardTitle>
                <div className="flex gap-2 mb-3">
                  <div>
                    <label htmlFor="start-time" className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input
                      id="start-time"
                      type="text"
                      pattern="^\\d{2}:\\d{2}:\\d{2}$"
                      placeholder="00:00:00"
                      value={startTime}
                      onChange={e => setStartTime(formatToHHMMSS(e.target.value))}
                      className="border rounded px-2 py-1 text-xs w-24"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-time" className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input
                      id="end-time"
                      type="text"
                      pattern="^\\d{2}:\\d{2}:\\d{2}$"
                      placeholder={videoInfo.duration || '00:00:00'}
                      value={endTime}
                      onChange={e => setEndTime(formatToHHMMSS(e.target.value))}
                      className="border rounded px-2 py-1 text-xs w-24"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleDownload} 
                  disabled={isDownloading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : `Download as ${format.toUpperCase()}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 