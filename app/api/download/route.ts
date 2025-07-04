import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'
import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

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

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const url = body.url;
    const format = body.format;
    const quality = body.quality;

    if (!url || !format) {
      return NextResponse.json(
        { error: 'URL and format are required' },
        { status: 400 }
      )
    }

    if (isTiktokUrl(url)) {
      if (format !== 'mp4') {
        return NextResponse.json(
          { error: 'Only MP4 download is supported for TikTok.' },
          { status: 400 }
        )
      }
      try {
        // Use tikwm.com API to get download link
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
        const res = await fetch(apiUrl)
        const data = await res.json()
        if (data.code !== 0 || !data.data) {
          return NextResponse.json(
            { error: data.msg || 'Failed to fetch TikTok video' },
            { status: 400 }
          )
        }
        const info = data.data
        const videoUrl = info.play || info.url || info.wmplay || info.hdplay
        if (!videoUrl) {
          return NextResponse.json(
            { error: 'No downloadable video found.' },
            { status: 400 }
          )
        }
        // Download the TikTok video to a buffer
        const response = await fetch(videoUrl)
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch TikTok video file.' },
            { status: 500 }
          )
        }
        const fileBuffer = Buffer.from(await response.arrayBuffer())
        const fileSize = fileBuffer.length
        const formattedSize = formatFileSize(fileSize)
        const videoTitle = (info.title || 'tiktok-video').replace(/[^\w\s-]/g, '')
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${videoTitle}.mp4"`,
            'Content-Length': fileSize.toString(),
            'X-File-Size': formattedSize,
            'Cache-Control': 'no-cache'
          }
        })
      } catch (err: unknown) {
        return NextResponse.json(
          { error: 'Failed to download TikTok video' },
          { status: 500 }
        )
      }
    }

    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Get video info
    const info = await ytdl.getInfo(url)
    const videoTitle = info.videoDetails.title.replace(/[^\w\s-]/g, '')
    const tempDir = path.join(process.cwd(), 'temp')
    await fs.ensureDir(tempDir)

    if (format === 'mp4') {
      // Download as MP4
      const videoPath = path.join(tempDir, `${videoTitle}.mp4`)
      const videoStream = ytdl(url, {
        quality: quality || 'highest',
        filter: 'audioandvideo'
      })
      const writeStream = fs.createWriteStream(videoPath)
      await new Promise<void>((resolve, reject) => {
        videoStream.pipe(writeStream)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        videoStream.on('error', reject)
      })
      const fileBuffer = await fs.readFile(videoPath)
      await unlink(videoPath)
      const fileSize = fileBuffer.length
      const formattedSize = formatFileSize(fileSize)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${videoTitle}.mp4"`,
          'Content-Length': fileSize.toString(),
          'X-File-Size': formattedSize,
          'Cache-Control': 'no-cache'
        }
      })
    } else if (format === 'mp3') {
      // Download as MP3 (audio only)
      const audioPath = path.join(tempDir, `${videoTitle}.mp3`)
      const audioStream = ytdl(url, {
        quality: quality || 'highestaudio',
        filter: 'audioonly'
      })
      const writeStream = fs.createWriteStream(audioPath)
      await new Promise<void>((resolve, reject) => {
        audioStream.pipe(writeStream)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        audioStream.on('error', reject)
      })
      const fileBuffer = await fs.readFile(audioPath)
      await unlink(audioPath)
      const fileSize = fileBuffer.length
      const formattedSize = formatFileSize(fileSize)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${videoTitle}.mp3"`,
          'Content-Length': fileSize.toString(),
          'X-File-Size': formattedSize,
          'Cache-Control': 'no-cache'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 