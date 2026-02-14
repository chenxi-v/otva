import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import Artplayer from 'artplayer'
import Hls, {
  type LoaderContext,
  type LoaderCallbacks,
  type LoaderResponse,
  type LoaderStats,
  type HlsConfig,
  type LoaderConfiguration,
} from 'hls.js'
import { Button, Chip, Spinner, Tooltip, Select, SelectItem } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DetailResponse } from '@/types'
import { apiService } from '@/services/api.service'
import { useApiStore } from '@/store/apiStore'
import { useViewingHistoryStore } from '@/store/viewingHistoryStore'
import { useSettingStore } from '@/store/settingStore'
import { useDocumentTitle, useTheme } from '@/hooks'
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import MobileNavBar from '@/components/MobileNavBar'
import _ from 'lodash'
import { toast } from 'sonner'
import { Sun, Moon, Monitor } from 'lucide-react'
import { type ThemeMode } from '@/config/settings.config'
import '@/styles/artplayer.css'

// 过滤可疑的广告内容
function filterAdsFromM3U8(m3u8Content: string) {
  if (!m3u8Content) return ''

  // 按行分割M3U8内容
  const lines = m3u8Content.split('\n')
  const filteredLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 只过滤#EXT-X-DISCONTINUITY标识
    if (!line.includes('#EXT-X-DISCONTINUITY')) {
      filteredLines.push(line)
    }
  }

  return filteredLines.join('\n')
}

// 扩展 LoaderContext 类型以包含 type 属性
interface ExtendedLoaderContext extends LoaderContext {
  type: string
}

// 扩展 Artplayer 类型以包含 hls 属性
interface ArtplayerWithHls extends Artplayer {
  hls?: Hls
}

// 自定义M3U8 Loader用于过滤广告
class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
  constructor(config: HlsConfig) {
    super(config)
    const load = this.load.bind(this)
    this.load = function (
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>,
    ) {
      // 拦截manifest和level请求
      const ctx = context as ExtendedLoaderContext
      if (ctx.type === 'manifest' || ctx.type === 'level') {
        const onSuccess = callbacks.onSuccess
        callbacks.onSuccess = function (
          response: LoaderResponse,
          stats: LoaderStats,
          context: LoaderContext,
          networkDetails: unknown,
        ) {
          // 如果是m3u8文件，处理内容以移除广告分段
          if (response.data && typeof response.data === 'string') {
            // 过滤掉广告段 - 实现更精确的广告过滤逻辑
            response.data = filterAdsFromM3U8(response.data)
          }
          return onSuccess(response, stats, context, networkDetails)
        }
      }
      // 执行原始load方法
      load(context, config, callbacks)
    }
  }
}

export default function Video() {
  const navigate = useNavigate()
  const { sourceCode, vodId, episodeIndex } = useParams<{
    sourceCode: string
    vodId: string
    episodeIndex: string
  }>()

  const playerRef = useRef<Artplayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 从 store 获取 API 配置
  const { videoAPIs, adFilteringEnabled } = useApiStore()
  const { addViewingHistory, viewingHistory } = useViewingHistoryStore()
  const { playback, theme, setThemeSettings } = useSettingStore()
  
  useTheme()

  // Use refs to access latest values in main useEffect without triggering re-renders
  const viewingHistoryRef = useRef(viewingHistory)
  const playbackRef = useRef(playback)

  useEffect(() => {
    viewingHistoryRef.current = viewingHistory
    playbackRef.current = playback
  }, [viewingHistory, playback])

  // 状态管理
  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState(() => {
    const index = parseInt(episodeIndex || '0')
    return isNaN(index) ? 0 : index
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReversed, setIsReversed] = useState(playback.defaultEpisodeOrder === 'desc')
  const [currentPageRange, setCurrentPageRange] = useState<string>('')
  const [episodesPerPage, setEpisodesPerPage] = useState(100)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isEpisodePanelCollapsed, setIsEpisodePanelCollapsed] = useState(false)

  // 计算响应式的每页集数 (基于屏幕尺寸和列数)
  useEffect(() => {
    const calculateEpisodesPerPage = () => {
      const width = window.innerWidth
      let cols = 2 // 手机默认2列
      let rows = 8 // 默认行数

      if (width >= 1024) {
        cols = 8 // 桌面端8列
        rows = 5 // 桌面端行数，确保一屏显示完整
      } else if (width >= 768) {
        cols = 6 // 平板横屏6列
        rows = 6 // 平板行数
      } else if (width >= 640) {
        cols = 3 // 平板竖屏3列
        rows = 8
      }

      setEpisodesPerPage(cols * rows)
    }

    calculateEpisodesPerPage()
    window.addEventListener('resize', calculateEpisodesPerPage)
    return () => window.removeEventListener('resize', calculateEpisodesPerPage)
  }, [])

  // 获取显示信息
  const getTitle = () => detail?.videoInfo?.title || '未知视频'
  const sourceName = detail?.videoInfo?.source_name || '未知来源'

  // 动态更新页面标题
  const pageTitle = useMemo(() => {
    const title = detail?.videoInfo?.title
    if (title) {
      return `${title}`
    }
    return '视频播放'
  }, [detail?.videoInfo?.title])

  useDocumentTitle(pageTitle)

  // 获取视频详情
  useEffect(() => {
    const fetchVideoDetail = async () => {
      if (!sourceCode || !vodId) {
        setError('缺少必要的参数')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 根据 sourceCode 找到对应的 API 配置
        const api = videoAPIs.find(api => api.id === sourceCode)
        if (!api) {
          throw new Error('未找到对应的API配置')
        }

        // 获取视频详情
        const response = await apiService.getVideoDetail(vodId, api)

        if (response.code === 200 && response.episodes && response.episodes.length > 0) {
          setDetail(response)
        } else {
          throw new Error(response.msg || '获取视频详情失败')
        }
      } catch (err) {
        console.error('获取视频详情失败:', err)
        setError(err instanceof Error ? err.message : '获取视频详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchVideoDetail()
  }, [sourceCode, vodId, videoAPIs])

  // 监听 selectedEpisode 和 URL 参数变化
  useEffect(() => {
    const urlEpisodeIndex = parseInt(episodeIndex || '0')
    if (!isNaN(urlEpisodeIndex) && urlEpisodeIndex !== selectedEpisode) {
      setSelectedEpisode(urlEpisodeIndex)
    }
  }, [episodeIndex, selectedEpisode])

  useEffect(() => {
    if (!detail?.episodes || !detail.episodes[selectedEpisode] || !containerRef.current) return

    // 销毁旧的播放器实例
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy(false)
    }

    const nextEpisode = () => {
      if (!playbackRef.current.isAutoPlayEnabled) return

      const total = detail.videoInfo?.episodes_names?.length || 0
      if (selectedEpisode < total - 1) {
        const nextIndex = selectedEpisode + 1
        setSelectedEpisode(nextIndex)
        navigate(`/video/${sourceCode}/${vodId}/${nextIndex}`, {
          replace: true,
        })
        toast.info(`即将播放下一集: ${detail.videoInfo?.episodes_names?.[nextIndex]}`)
      }
    }

    // 创建新的播放器实例
    const art = new Artplayer({
      container: containerRef.current,
      url: detail.episodes[selectedEpisode],
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: false,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoOrientation: true,
      airplay: true,
      theme: '#6366f1',
      lang: 'zh-cn',
      lock: true,
      fastForward: true,
      autoPlayback: true,
      icons: {
        loading: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(0 12 12)"><animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>',
      },
      settings: [
        {
          html: '播放速度',
          selector: [
            { html: '0.5x', value: 0.5 },
            { html: '0.75x', value: 0.75 },
            { html: '正常', value: 1, default: true },
            { html: '1.25x', value: 1.25 },
            { html: '1.5x', value: 1.5 },
            { html: '2x', value: 2 },
          ],
          onSelect: function (item) {
            art.playbackRate = item.value as number
            return item.html
          },
        },
      ],
      moreVideoAttr: {
        crossOrigin: 'anonymous',
      },
      customType: {
        m3u8: function (video: HTMLMediaElement, url: string, art: Artplayer) {
          const artWithHls = art as ArtplayerWithHls
          if (Hls.isSupported()) {
            if (artWithHls.hls) artWithHls.hls.destroy()
            const hlsConfig: Partial<HlsConfig> = adFilteringEnabled
              ? { loader: CustomHlsJsLoader as unknown as typeof Hls.DefaultConfig.loader }
              : {}
            const hls = new Hls(hlsConfig)
            hls.loadSource(url)
            hls.attachMedia(video)
            artWithHls.hls = hls
            art.on('destroy', () => hls.destroy())
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          } else {
            art.notice.show = 'Unsupported playback format: m3u8'
          }
        },
      },
    })

    playerRef.current = art

    setIsPlayerReady(false)

    // 自动续播
    art.on('ready', () => {
      setIsPlayerReady(true)
      const existingHistory = viewingHistoryRef.current.find(
        item =>
          item.sourceCode === sourceCode &&
          item.vodId === vodId &&
          item.episodeIndex === selectedEpisode,
      )
      if (existingHistory && existingHistory.playbackPosition > 0) {
        art.seek = existingHistory.playbackPosition
        toast.success('已自动跳转到上次观看位置')
      }
    })

    // 记录观看历史
    const normalAddHistory = () => {
      if (!sourceCode || !vodId || !detail?.videoInfo) return
      addViewingHistory({
        title: detail.videoInfo.title || '未知视频',
        imageUrl: detail.videoInfo.cover || '',
        sourceCode: sourceCode || '',
        sourceName: detail.videoInfo.source_name || '',
        vodId: vodId || '',
        episodeIndex: selectedEpisode,
        episodeName: detail.videoInfo.episodes_names?.[selectedEpisode],
        playbackPosition: art.currentTime || 0,
        duration: art.duration || 0,
        timestamp: Date.now(),
      })
    }

    art.on('video:play', normalAddHistory)
    art.on('video:pause', normalAddHistory)
    art.on('video:ended', () => {
      normalAddHistory()
      nextEpisode()
    })
    art.on('video:error', normalAddHistory)

    let lastTimeUpdate = 0
    const TIME_UPDATE_INTERVAL = 3000

    const timeUpdateHandler = () => {
      if (!sourceCode || !vodId || !detail?.videoInfo) return
      const currentTime = art.currentTime || 0
      const duration = art.duration || 0
      const timeSinceLastUpdate = Date.now() - lastTimeUpdate

      if (timeSinceLastUpdate >= TIME_UPDATE_INTERVAL && currentTime > 0 && duration > 0) {
        lastTimeUpdate = Date.now()
        addViewingHistory({
          title: detail.videoInfo.title || '未知视频',
          imageUrl: detail.videoInfo.cover || '',
          sourceCode: sourceCode || '',
          sourceName: detail.videoInfo.source_name || '',
          vodId: vodId || '',
          episodeIndex: selectedEpisode,
          episodeName: detail.videoInfo.episodes_names?.[selectedEpisode],
          playbackPosition: currentTime,
          duration: duration,
          timestamp: Date.now(),
        })
      }
    }

    art.on('video:timeupdate', _.throttle(timeUpdateHandler, TIME_UPDATE_INTERVAL))

    // 清理函数
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        normalAddHistory()
        playerRef.current.destroy(false)
        playerRef.current = null
      }
    }
  }, [selectedEpisode, detail, sourceCode, vodId, addViewingHistory, navigate, adFilteringEnabled])

  // 处理集数切换
  const handleEpisodeChange = (displayIndex: number) => {
    // displayIndex 是在当前显示列表中的索引（已考虑倒序）
    // 需要转换成原始列表中的实际索引
    const actualIndex = isReversed
      ? (detail?.videoInfo?.episodes_names?.length || 0) - 1 - displayIndex
      : displayIndex
    setSelectedEpisode(actualIndex)
    // 更新 URL，保持路由同步
    navigate(`/video/${sourceCode}/${vodId}/${actualIndex}`, {
      replace: true,
    })
  }

  // 计算分页范围（根据正序倒序调整标签）
  const pageRanges = useMemo(() => {
    const totalEpisodes = detail?.videoInfo?.episodes_names?.length || 0
    if (totalEpisodes === 0) return []

    const ranges: { label: string; value: string; start: number; end: number }[] = []

    if (isReversed) {
      // 倒序：从最后一集开始
      for (let i = 0; i < totalEpisodes; i += episodesPerPage) {
        const start = i
        const end = Math.min(i + episodesPerPage - 1, totalEpisodes - 1)
        // 倒序时，标签应该显示从大到小
        const labelStart = totalEpisodes - start
        const labelEnd = totalEpisodes - end
        ranges.push({
          label: `${labelStart}-${labelEnd}`,
          value: `${start}-${end}`,
          start,
          end,
        })
      }
    } else {
      // 正序：从第一集开始
      for (let i = 0; i < totalEpisodes; i += episodesPerPage) {
        const start = i
        const end = Math.min(i + episodesPerPage - 1, totalEpisodes - 1)
        ranges.push({
          label: `${start + 1}-${end + 1}`,
          value: `${start}-${end}`,
          start,
          end,
        })
      }
    }

    return ranges
  }, [detail?.videoInfo?.episodes_names?.length, episodesPerPage, isReversed])

  // 初始化当前页范围 & 当切换正序倒序时自动调整页码
  useEffect(() => {
    if (pageRanges.length === 0 || !detail?.videoInfo?.episodes_names) return

    const totalEpisodes = detail.videoInfo.episodes_names.length
    const actualSelectedIndex = selectedEpisode

    // 根据实际索引计算显示索引
    const displayIndex = isReversed ? totalEpisodes - 1 - actualSelectedIndex : actualSelectedIndex

    // 找到包含当前选集的页范围
    const rangeContainingSelected = pageRanges.find(
      range => displayIndex >= range.start && displayIndex <= range.end,
    )

    if (rangeContainingSelected) {
      setCurrentPageRange(rangeContainingSelected.value)
    } else {
      // 如果没有找到，设置为第一页
      setCurrentPageRange(pageRanges[0].value)
    }
  }, [pageRanges, selectedEpisode, isReversed, detail?.videoInfo?.episodes_names])

  // 当前页显示的剧集
  const currentPageEpisodes = useMemo(() => {
    if (!currentPageRange || !detail?.videoInfo?.episodes_names) return []

    const [start, end] = currentPageRange.split('-').map(Number)
    const totalEpisodes = detail.videoInfo.episodes_names.length
    const episodes = detail.videoInfo.episodes_names

    if (isReversed) {
      // 倒序：取出对应范围的集数并反转
      const selectedEpisodes = []
      for (let i = start; i <= end; i++) {
        const actualIndex = totalEpisodes - 1 - i
        if (actualIndex >= 0 && actualIndex < totalEpisodes) {
          selectedEpisodes.push({
            name: episodes[actualIndex],
            displayIndex: i,
            actualIndex: actualIndex,
          })
        }
      }
      return selectedEpisodes
    } else {
      // 正序：直接取出对应范围
      return episodes.slice(start, end + 1).map((name, idx) => ({
        name,
        displayIndex: start + idx,
        actualIndex: start + idx,
      }))
    }
  }, [currentPageRange, detail?.videoInfo?.episodes_names, isReversed])

  // 加载状态
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">正在加载视频信息...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white/40 p-6 text-center shadow-xl backdrop-blur-xl dark:bg-white/10">
          <p className="mb-4 text-red-500">{error}</p>
          <Button className="w-full" onPress={() => navigate(-1)} variant="flat">
            返回
          </Button>
        </div>
      </div>
    )
  }

  // 如果没有数据，显示错误信息
  if (!detail || !detail.episodes || detail.episodes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white/40 p-6 text-center shadow-xl backdrop-blur-xl dark:bg-white/10">
          <p className="mb-4 text-gray-500 dark:text-gray-400">无法获取播放信息</p>
          <Button className="w-full" onPress={() => navigate(-1)} variant="flat">
            返回
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-2 pb-20 pt-18 sm:p-4 sm:pt-4">
      <MobileNavBar showSettings={false} />

      <div className="fixed top-5 right-5 z-50 hidden gap-3 sm:flex">
        <Button
          onPress={() => {
            const modes: ThemeMode[] = ['light', 'dark', 'system']
            const currentIndex = modes.indexOf(theme.mode)
            const nextIndex = (currentIndex + 1) % modes.length
            setThemeSettings({ mode: modes[nextIndex] })
          }}
          isIconOnly
          className="bg-white/40 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/20"
        >
          {theme.mode === 'light' ? (
            <Sun size={22} className="text-gray-700 dark:text-gray-200" />
          ) : theme.mode === 'dark' ? (
            <Moon size={22} className="text-gray-700 dark:text-gray-200" />
          ) : (
            <Monitor size={22} className="text-gray-700 dark:text-gray-200" />
          )}
        </Button>
      </div>

      {/* 顶部信息栏 - 手机端两行布局 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:flex-1 sm:justify-start sm:gap-3">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-xs font-medium text-white sm:px-3 sm:py-1">
              {sourceName}
            </span>
            <h4 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg md:text-xl">{getTitle()}</h4>
          </div>
          <Button size="sm" variant="flat" onPress={() => navigate(-1)} className="shrink-0 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 sm:hidden">
            返回
          </Button>
        </div>
        <div className="flex items-center justify-between sm:gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Chip
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 font-medium text-white"
            >
              第 {selectedEpisode + 1} 集
            </Chip>
            <span className="text-sm text-gray-500 dark:text-gray-400">共 {detail.episodes.length} 集</span>
          </div>
          <Button size="sm" variant="flat" onPress={() => navigate(-1)} className="hidden bg-gray-100 dark:bg-gray-700 dark:text-gray-200 sm:flex">
            返回
          </Button>
        </div>
      </div>

      {/* 主内容区域 - 左右分栏布局 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* 播放器区域 */}
        <div
          className={`relative rounded-2xl bg-black shadow-2xl shadow-black/20 transition-all duration-300 lg:col-span-3 ${
            isEpisodePanelCollapsed ? 'lg:col-span-4' : 'lg:col-span-3'
          }`}
        >
          {/* 视频封面和加载状态 */}
          <AnimatePresence>
            {!isPlayerReady && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-2xl bg-black"
              >
                {detail?.videoInfo?.cover ? (
                  <>
                    <img
                      src={detail.videoInfo.cover}
                      alt={getTitle()}
                      className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </>
                ) : null}
                <div className="relative z-20 flex flex-col items-center gap-4">
                  <Spinner size="lg" color="white" />
                  <p className="text-sm text-white/70">正在加载播放器...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            id="player"
            ref={containerRef}
            className="aspect-video w-full overflow-hidden rounded-2xl bg-black"
          />

          {/* 移动端当前集数显示 */}
          <div className="absolute bottom-4 left-4 z-10 sm:hidden">
            <Chip
              size="sm"
              className="bg-black/50 font-medium text-white backdrop-blur-sm"
            >
              第 {selectedEpisode + 1} 集 / 共 {detail.episodes.length} 集
            </Chip>
          </div>

          {/* 折叠按钮 - 桌面端 */}
          {detail.videoInfo?.episodes_names && detail.videoInfo?.episodes_names.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEpisodePanelCollapsed(!isEpisodePanelCollapsed)}
              className="absolute top-1/2 right-0 z-30 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-700 lg:flex"
            >
              {isEpisodePanelCollapsed ? (
                <ChevronLeftIcon size={20} className="text-gray-700 dark:text-gray-200" />
              ) : (
                <ChevronRightIcon size={20} className="text-gray-700 dark:text-gray-200" />
              )}
            </motion.button>
          )}
        </div>

        {/* 选集面板 - 桌面端右侧 */}
        {detail.videoInfo?.episodes_names && detail.videoInfo?.episodes_names.length > 0 && (
          <div
            className={`hidden overflow-hidden rounded-2xl bg-white/40 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 lg:block dark:bg-white/10 ${
              isEpisodePanelCollapsed
                ? 'w-0 opacity-0'
                : 'lg:col-span-1 opacity-100'
            }`}
          >
            <div className="flex h-full flex-col">
              {/* 选集标题 */}
              <div className="border-b border-gray-200/50 p-4 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">选集</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">共 {detail.episodes.length} 集</p>
                  </div>
                </div>
              </div>

              {/* 排序和分页控制 */}
              <div className="flex items-center gap-2 border-b border-gray-200/50 p-3 dark:border-gray-700/50">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setIsReversed(!isReversed)}
                  startContent={
                    isReversed ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />
                  }
                  className="flex-1 bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {isReversed ? '正序' : '倒序'}
                </Button>
                {pageRanges.length > 1 && (
                  <Select
                    size="sm"
                    selectedKeys={[currentPageRange]}
                    onChange={e => setCurrentPageRange(e.target.value)}
                    className="w-24"
                    classNames={{
                      trigger: 'bg-gray-100 border-none text-xs font-medium dark:bg-gray-700',
                      value: 'text-gray-700 text-xs dark:text-gray-200',
                      popoverContent: 'bg-white/90 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-800/90',
                    }}
                    aria-label="选择集数范围"
                  >
                    {pageRanges.map(range => (
                      <SelectItem key={range.value} className="text-xs">
                        {range.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>

              {/* 选集网格 */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2">
                  {currentPageEpisodes.map(({ name, displayIndex, actualIndex }) => {
                    const isSelected = selectedEpisode === actualIndex
                    return (
                      <Tooltip
                        key={`${name}-${displayIndex}`}
                        content={name}
                        placement="top"
                        delay={1000}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEpisodeChange(displayIndex)}
                          className={`relative overflow-hidden rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="relative z-10 block overflow-hidden text-ellipsis whitespace-nowrap">
                            {name}
                          </span>
                        </motion.button>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 选集面板 - 移动端底部 */}
      {detail.videoInfo?.episodes_names && detail.videoInfo?.episodes_names.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-white/40 shadow-xl shadow-black/5 backdrop-blur-xl lg:hidden dark:bg-white/10">
          <div className="border-b border-gray-200/50 p-4 dark:border-gray-700/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">选集</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">共 {detail.episodes.length} 集</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setIsReversed(!isReversed)}
                  startContent={
                    isReversed ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />
                  }
                  className="bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {isReversed ? '正序' : '倒序'}
                </Button>
                {pageRanges.length > 1 && (
                  <Select
                    size="sm"
                    selectedKeys={[currentPageRange]}
                    onChange={e => setCurrentPageRange(e.target.value)}
                    className="w-28"
                    classNames={{
                      trigger: 'bg-gray-100 border-none font-medium dark:bg-gray-700',
                      value: 'text-gray-700 dark:text-gray-200',
                      popoverContent: 'bg-white/90 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-800/90',
                    }}
                    aria-label="选择集数范围"
                  >
                    {pageRanges.map(range => (
                      <SelectItem key={range.value}>{range.label}</SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-6">
            {currentPageEpisodes.map(({ name, displayIndex, actualIndex }) => {
              const isSelected = selectedEpisode === actualIndex
              return (
                <Tooltip
                  key={`${name}-${displayIndex}`}
                  content={name}
                  placement="top"
                  delay={1000}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEpisodeChange(displayIndex)}
                    className={`relative overflow-hidden rounded-xl px-2 py-2 text-xs font-medium transition-all duration-300 sm:text-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="relative z-10 block overflow-hidden text-ellipsis whitespace-nowrap">
                      {name}
                    </span>
                  </motion.button>
                </Tooltip>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
