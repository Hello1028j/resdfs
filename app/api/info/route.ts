import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function isTiktokUrl(url: string): boolean {
  return /tiktok\.com\//i.test(url) || /vm\.tiktok\.com\//i.test(url)
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Only TikTok and YouTube supported
    if (isTiktokUrl(url)) {
      // Use tikwm.com API for TikTok info
      try {
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
        const res = await fetch(apiUrl)
        const data = await res.json()
        if (data.code !== 0 || !data.data) {
          return NextResponse.json(
            { error: data.msg || 'Failed to fetch TikTok info' },
            { status: 400 }
          )
        }
        const info = data.data
        const videoInfo = {
          title: info.title || 'TikTok Video',
          author: info.author?.nickname || 'Unknown',
          lengthSeconds: info.duration || 0,
          viewCount: info.play_count || 0,
          thumbnail: info.cover || '',
          description: info.title || '',
          isPrivate: false,
          isLiveContent: false,
          estimatedVideoSize: info.size ? formatFileSize(info.size) : 'Unknown',
          estimatedAudioSize: 'N/A (TikTok)'
        }
        return NextResponse.json(videoInfo)
      } catch (err) {
        return NextResponse.json(
          { error: 'Failed to fetch TikTok info' },
          { status: 500 }
        )
      }
    }

    // YouTube logic
    console.log('Validating URL:', url)

    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    console.log('URL is valid, getting info...')

    // Get video info with better error handling
    const info = await ytdl.getInfo(url).catch((error) => {
      console.error('ytdl.getInfo error:', error)
      throw new Error(`Failed to get video info: ${error.message}`)
    })
    
    console.log('Video info retrieved successfully')

    // Get available formats for size estimation
    const formats = info.formats
    const videoFormats = formats.filter(format => format.hasVideo && format.hasAudio)
    const audioFormats = formats.filter(format => format.hasAudio && !format.hasVideo)

    // Estimate file sizes
    let estimatedVideoSize = 'Unknown'
    let estimatedAudioSize = 'Unknown'

    if (videoFormats.length > 0) {
      // Get the highest quality video format
      const bestVideoFormat = videoFormats.reduce((prev, current) => 
        (current.height || 0) > (prev.height || 0) ? current : prev
      )
      
      if (bestVideoFormat.contentLength) {
        const videoBytes = parseInt(bestVideoFormat.contentLength)
        estimatedVideoSize = formatFileSize(videoBytes)
      }
    }

    if (audioFormats.length > 0) {
      // Get the highest quality audio format
      const bestAudioFormat = audioFormats.reduce((prev, current) => 
        (current.audioBitrate || 0) > (prev.audioBitrate || 0) ? current : prev
      )
      
      if (bestAudioFormat.contentLength) {
        const audioBytes = parseInt(bestAudioFormat.contentLength)
        estimatedAudioSize = formatFileSize(audioBytes)
      }
    }

    const videoInfo = {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      lengthSeconds: parseInt(info.videoDetails.lengthSeconds),
      viewCount: parseInt(info.videoDetails.viewCount),
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      description: info.videoDetails.description,
      isPrivate: info.videoDetails.isPrivate,
      isLiveContent: info.videoDetails.isLiveContent,
      estimatedVideoSize,
      estimatedAudioSize
    }

    console.log('Returning video info:', videoInfo.title)
    console.log('Estimated sizes - Video:', estimatedVideoSize, 'Audio:', estimatedAudioSize)

    return NextResponse.json(videoInfo)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 