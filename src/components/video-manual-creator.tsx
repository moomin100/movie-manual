'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip } from "@/components/ui/tooltip"
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// YouTube Data APIのキーを設定してください
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

interface Video {
  id: string
  title: string
  viewCount: string
  duration: string
  thumbnail: string
}

export function VideoManualCreatorComponent() {
  const [keyword, setKeyword] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)

  const searchVideos = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${keyword}&type=video&key=${API_KEY}&maxResults=50&relevanceLanguage=ja`
      )
      const data = await response.json()
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      )
      const statsData = await statsResponse.json()

      const videoList = data.items.map((item: any, index: number) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        viewCount: statsData.items[index].statistics.viewCount,
        duration: formatDuration(statsData.items[index].contentDetails.duration),
        thumbnail: item.snippet.thumbnails.medium.url
      }))

      setVideos(videoList.sort((a: Video, b: Video) => parseInt(b.viewCount) - parseInt(a.viewCount)))
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
    setLoading(false)
  }

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    const hours = (match[1] && match[1].slice(0, -1)) || 0
    const minutes = (match[2] && match[2].slice(0, -1)) || 0
    const seconds = (match[3] && match[3].slice(0, -1)) || 0
    return `${hours ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const generateHtml = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>動画マニュアル</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          a { color: #1a73e8; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>動画マニュアル</h1>
        <table>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>視聴回数</th>
              <th>再生時間</th>
            </tr>
          </thead>
          <tbody>
            ${videos.map(video => `
              <tr>
                <td><a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">${video.title}</a></td>
                <td>${parseInt(video.viewCount).toLocaleString()}</td>
                <td>${video.duration}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '動画マニュアル.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">動画マニュアル作成ツール</h1>
      <div className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="キーワードを入力"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={searchVideos} disabled={loading}>
          {loading ? '検索中...' : '検索'}
        </Button>
      </div>
      {videos.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>視聴回数</TableHead>
                <TableHead>再生時間</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {video.title}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <img src={video.thumbnail} alt={video.title} className="max-w-xs" />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{parseInt(video.viewCount).toLocaleString()}</TableCell>
                  <TableCell>{video.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-6 text-center">
            <Button onClick={generateHtml}>HTMLでダウンロード</Button>
          </div>
        </>
      )}
    </div>
  )
}