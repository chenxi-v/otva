import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input } from '@heroui/react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import type { VideoApi, VideoItem } from '@/types'
import { useSettingStore } from '@/store/settingStore'

interface CategorySectionProps {
  category: {
    type_id: number
    type_pid: number
    type_name: string
  }
  api: VideoApi
}

function getOptimalColumns(count: number): string {
  if (count === 0) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
  
  const findDivisors = (n: number): number[] => {
    const divisors: number[] = []
    for (let i = 1; i <= n; i++) {
      if (n % i === 0) divisors.push(i)
    }
    return divisors
  }

  const divisors = findDivisors(count)
  
  const getResponsiveCols = (cols: number): string => {
    const colsMap: Record<number, string> = {
      2: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      7: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7',
      8: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8',
    }
    return colsMap[cols] || `grid-cols-2 sm:grid-cols-3 md:grid-cols-${cols}`
  }

  const preferredCols = [4, 5, 6, 3, 2]
  
  for (const cols of preferredCols) {
    if (divisors.includes(cols)) {
      return getResponsiveCols(cols)
    }
  }

  for (const cols of preferredCols) {
    if (count % cols === 0 || cols % count === 0 || Math.ceil(count / cols) * cols - count <= 2) {
      return getResponsiveCols(cols)
    }
  }

  return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
}

export default function CategorySection({ category, api }: CategorySectionProps) {
  const navigate = useNavigate()
  const { home } = useSettingStore()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem(`category_${category.type_id}_page`)
    return savedPage ? parseInt(savedPage) : 1
  })
  const [pageCount, setPageCount] = useState(1)
  const [jumpPage, setJumpPage] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  const gridCols = useMemo(() => getOptimalColumns(videos.length), [videos.length])
  
  const aspectRatioClass = useMemo(() => {
    return home.posterAspectRatio === '16/9' ? 'aspect-video' : 'aspect-[3/4]'
  }, [home.posterAspectRatio])

  const handleVideoClick = (video: VideoItem) => {
    const isMobile = window.innerWidth < 640
    if (isMobile) {
      setSelectedVideo(video)
    } else {
      navigate(`/detail/${video.source_code}/${video.vod_id}`)
    }
  }

  const handlePlayClick = (video: VideoItem) => {
    navigate(`/detail/${video.source_code}/${video.vod_id}`)
    setSelectedVideo(null)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      sessionStorage.setItem(`category_${category.type_id}_page`, newPage.toString())
    }
  }

  const handleNextPage = () => {
    if (currentPage < pageCount) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      sessionStorage.setItem(`category_${category.type_id}_page`, newPage.toString())
    }
  }

  const handleJumpPage = () => {
    const page = parseInt(jumpPage)
    if (!isNaN(page) && page >= 1 && page <= pageCount) {
      setCurrentPage(page)
      sessionStorage.setItem(`category_${category.type_id}_page`, page.toString())
      setJumpPage('')
    }
  }

  const handleJumpPageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpPage()
    }
  }

  useEffect(() => {
    const fetchCategoryVideos = async () => {
      try {
        setLoading(true)

        const isXmlApi = api.url.includes('/xml')

        let apiUrl: string
        let response: Response
        let data: any

        if (isXmlApi) {
          apiUrl = `${api.url}?ac=videolist&t=${category.type_id}&pg=${currentPage}&pagesize=24`
          response = await fetch(`/proxy?url=${encodeURIComponent(apiUrl)}`)

          if (!response.ok) {
            setVideos([])
            return
          }

          const contentType = response.headers.get('content-type') || ''
          const text = await response.text()

          if (contentType.includes('xml') || text.trim().startsWith('<?xml')) {
            data = await parseXmlResponse(text)
          } else {
            data = JSON.parse(text)
          }
        } else {
          apiUrl = `${api.url}?ac=videolist&t=${category.type_id}&pg=${currentPage}&pagesize=24`
          response = await fetch(`/proxy?url=${encodeURIComponent(apiUrl)}`)

          if (!response.ok) {
            setVideos([])
            return
          }

          data = await response.json()
        }

        if (data && Array.isArray(data.list)) {
          if (data.pagecount) {
            setPageCount(data.pagecount)
          }

          const videosWithSource = data.list.map((item: any) => ({
            ...item,
            source_name: api.name,
            source_code: api.id,
            api_url: api.url,
          })) as VideoItem[]

          setVideos(videosWithSource)
        } else {
          setVideos([])
        }
      } catch (error) {
        console.error('获取分类视频失败:', error)
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryVideos()
  }, [category, api, currentPage])

  const parseXmlResponse = async (xmlText: string): Promise<any> => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    const videoElements = xmlDoc.getElementsByTagName('video')
    const videos: any[] = []

    for (let i = 0; i < videoElements.length; i++) {
      const video = videoElements[i]
      const videoData: any = {}

      const fields = [
        { tag: 'id', field: 'vod_id' },
        { tag: 'name', field: 'vod_name' },
        { tag: 'pic', field: 'vod_pic' },
        { tag: 'type', field: 'type_name' },
        { tag: 'year', field: 'vod_year' },
        { tag: 'area', field: 'vod_area' },
        { tag: 'director', field: 'vod_director' },
        { tag: 'actor', field: 'vod_actor' },
        { tag: 'note', field: 'vod_remarks' },
        { tag: 'des', field: 'vod_content' },
      ]

      fields.forEach(({ tag, field }) => {
        const element = video.getElementsByTagName(tag)[0]
        if (element) {
          videoData[field] = element.textContent
        }
      })

      const dlElements = video.getElementsByTagName('dl')
      const playUrls: string[] = []
      const playFroms: string[] = []

      for (let j = 0; j < dlElements.length; j++) {
        const ddElements = dlElements[j].getElementsByTagName('dd')
        for (let k = 0; k < ddElements.length; k++) {
          const dd = ddElements[k]
          const flag = dd.getAttribute('flag') || 'default'
          const urls = dd.textContent || ''

          if (urls) {
            playUrls.push(urls)
            playFroms.push(flag)
          }
        }
      }

      videoData.vod_play_url = playUrls.join('$$$')
      videoData.vod_play_from = playFroms.join('$$$')

      videos.push(videoData)
    }

    const listElement = xmlDoc.getElementsByTagName('list')[0]
    let page = 1
    let pagecount = 1

    if (listElement) {
      page = parseInt(listElement.getAttribute('page') || '1')
      pagecount = parseInt(listElement.getAttribute('pagecount') || '1')
    }

    return {
      code: 1,
      list: videos,
      page,
      pagecount,
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`${aspectRatioClass} animate-pulse rounded-2xl bg-white/20 backdrop-blur-xl`} />
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${gridCols}`}>
        {videos.map((video, index) => (
          <motion.div
            key={`${video.source_code}_${video.vod_id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer overflow-hidden rounded-2xl bg-white/40 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:bg-white/10"
            onClick={() => handleVideoClick(video)}
          >
            <div className={`relative ${aspectRatioClass} overflow-hidden`}>
              <img
                src={video.vod_pic || 'https://via.placeholder.com/300x400?text=暂无封面'}
                alt={video.vod_name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={e => {
                  ;(e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/300x400?text=暂无封面'
                }}
              />
              {video.vod_remarks && (
                <div className="absolute right-2 top-2 hidden rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-xs font-medium text-white shadow-lg sm:block">
                  {video.vod_remarks}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:bg-gradient-to-t sm:from-black/80 sm:via-black/20 sm:to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 hidden p-3 sm:block">
                <h4 className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-lg">
                  {video.vod_name}
                </h4>
                <div className="mt-1.5 flex items-center gap-2">
                  {video.vod_year && (
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white/90 backdrop-blur-sm">
                      {video.vod_year}
                    </span>
                  )}
                  {video.type_name && (
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white/90 backdrop-blur-sm">
                      {video.type_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2 sm:hidden">
              <h4 className="line-clamp-1 text-sm font-bold leading-tight text-gray-800 dark:text-white">
                {video.vod_name}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-gray-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full flex-shrink-0">
                <img
                  src={selectedVideo.vod_pic || 'https://via.placeholder.com/300x400?text=暂无封面'}
                  alt={selectedVideo.vod_name}
                  className="h-full w-full object-cover"
                  onError={e => {
                    ;(e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/300x400?text=暂无封面'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-900" />
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="-mt-8 relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedVideo.vod_name}
                  </h3>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {selectedVideo.vod_remarks && (
                      <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-medium text-white">
                        {selectedVideo.vod_remarks}
                      </span>
                    )}
                    {selectedVideo.vod_year && (
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {selectedVideo.vod_year}
                      </span>
                    )}
                    {selectedVideo.type_name && (
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {selectedVideo.type_name}
                      </span>
                    )}
                    {selectedVideo.vod_area && (
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {selectedVideo.vod_area}
                      </span>
                    )}
                  </div>

                  {(selectedVideo.vod_director || selectedVideo.vod_actor) && (
                    <div className="mt-4 space-y-2">
                      {selectedVideo.vod_director && (
                        <div className="flex gap-2">
                          <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">导演</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{selectedVideo.vod_director}</span>
                        </div>
                      )}
                      {selectedVideo.vod_actor && (
                        <div className="flex gap-2">
                          <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">演员</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{selectedVideo.vod_actor}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedVideo.vod_content && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">简介</h4>
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                        {selectedVideo.vod_content.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700">
                <Button
                  onClick={() => handlePlayClick(selectedVideo)}
                  className="w-full gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-base font-medium text-white shadow-lg"
                >
                  <Play size={20} />
                  立即播放
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pageCount > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-center gap-2 pt-4 sm:gap-3"
        >
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            isDisabled={currentPage <= 1}
            onPress={handlePrevPage}
            className="rounded-xl bg-white/40 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="flex items-center gap-2 rounded-xl bg-white/40 px-3 py-1.5 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-4 sm:py-2 dark:bg-white/10">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {currentPage} / {pageCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              size="sm"
              value={jumpPage}
              onChange={e => setJumpPage(e.target.value)}
              onKeyDown={handleJumpPageKeyDown}
              placeholder="页码"
              min={1}
              max={pageCount}
              className="w-16"
              classNames={{
                input: 'text-center text-sm',
                inputWrapper: 'bg-white/40 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:bg-white/10',
              }}
            />
            <Button
              size="sm"
              variant="flat"
              onPress={handleJumpPage}
              isDisabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > pageCount || parseInt(jumpPage) === currentPage}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-3 text-xs font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              跳转
            </Button>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            isDisabled={currentPage >= pageCount}
            onPress={handleNextPage}
            className="rounded-xl bg-white/40 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <ChevronRight size={18} />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
