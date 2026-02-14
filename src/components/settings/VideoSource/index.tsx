import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CircleX, CircleCheckBig, ChevronRight, Home, RectangleHorizontal, RectangleVertical } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/utils'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useApiStore } from '@/store/apiStore'
import { useSettingStore } from '@/store/settingStore'
import dayjs from 'dayjs'
import ActionDropdown from '@/components/common/ActionDropdown'
import VideoSourceForm from './VideoSourceForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { v4 as uuidv4 } from 'uuid'
import { URLSourceModal, TextSourceModal } from './ImportSourceModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PosterAspectRatio } from '@/config/settings.config'

export default function VideoSource() {
  const {
    selectAllAPIs,
    deselectAllAPIs,
    videoAPIs,
    setApiEnabled,
    getSelectedAPIs,
    importVideoAPIs,
  } = useApiStore()
  const { home, setHomeSettings } = useSettingStore()
  const [showVideoAPIs, setShowVideoAPIs] = useState(videoAPIs)
  useEffect(() => {
    setShowVideoAPIs(videoAPIs)
  }, [videoAPIs])
  const isAllSelected = getSelectedAPIs().length === showVideoAPIs.length
  const handleToggleAll = () => {
    if (isAllSelected) {
      deselectAllAPIs()
    } else {
      selectAllAPIs()
    }
  }
  const [selectedIndex, setSelectedIndex] = useState(0)

  const safeIndex = Math.min(selectedIndex, Math.max(0, showVideoAPIs.length - 1))
  const selectedSource = showVideoAPIs[safeIndex]

  useEffect(() => {
    if (selectedIndex !== safeIndex) {
      setSelectedIndex(safeIndex)
    }
  }, [selectedIndex, safeIndex])

  const addVideoSource = () => {
    setShowVideoAPIs([
      ...showVideoAPIs,
      {
        id: uuidv4(),
        name: '新增源',
        url: '',
        detailUrl: '',
        timeout: useSettingStore.getState().network.defaultTimeout || 3000,
        retry: useSettingStore.getState().network.defaultRetry || 3,
        isEnabled: true,
        updatedAt: new Date(),
      },
    ])
    setSelectedIndex(showVideoAPIs.length)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addVideoSourceFromJSONFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const content = e.target?.result as string
        const sources = JSON.parse(content)
        if (Array.isArray(sources)) {
          importVideoAPIs(sources)
          toast.success(`成功导入 ${sources.length} 个视频源`)
        } else {
          toast.error('导入失败：文件格式错误，应为数组格式')
        }
      } catch (error) {
        console.error('Import error:', error)
        toast.error('导入失败：JSON 解析错误')
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const [urlSourceModalOpen, setUrlSourceModalOpen] = useState(false)
  const addVideoSourceFromURL = () => {
    setUrlSourceModalOpen(true)
  }

  const [textSourceModalOpen, setTextSourceModalOpen] = useState(false)
  const addVideoSourceFromText = () => {
    setTextSourceModalOpen(true)
  }

  const handleExportToFile = () => {
    try {
      const data = JSON.stringify(videoAPIs, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ouonnki-tv-sources-${dayjs().format('YYYY-MM-DD')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    }
  }

  const handleExportToText = async () => {
    try {
      const data = JSON.stringify(videoAPIs, null, 2)
      await navigator.clipboard.writeText(data)
      toast.success('已复制到剪贴板')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <>
      <URLSourceModal open={urlSourceModalOpen} onOpenChange={setUrlSourceModalOpen} />
      <TextSourceModal open={textSourceModalOpen} onOpenChange={setTextSourceModalOpen} />
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-gray-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg dark:from-red-600 dark:to-red-500">
                <Home size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">主页默认数据源</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">设置主页分类导航默认显示的视频源</p>
              </div>
            </div>
            <Select
              value={home.defaultDataSourceId || 'auto'}
              onValueChange={value => {
                setHomeSettings({ defaultDataSourceId: value === 'auto' ? '' : value })
              }}
            >
              <SelectTrigger className="w-full rounded-xl bg-white/60 backdrop-blur-xl sm:w-48 dark:bg-gray-800 dark:text-gray-100">
                <SelectValue placeholder="自动选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动选择（第一个启用的源）</SelectItem>
                {videoAPIs
                  .filter(api => api.isEnabled)
                  .map(api => (
                    <SelectItem key={api.id} value={api.id}>
                      {api.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-gray-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg dark:from-red-600 dark:to-red-500">
                <RectangleVertical size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">海报图片比例</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">设置首页视频列表的海报显示比例</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={home.posterAspectRatio === '3/4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHomeSettings({ posterAspectRatio: '3/4' as PosterAspectRatio })}
                className="flex-1 gap-2 rounded-xl sm:flex-none dark:bg-gray-800 dark:text-gray-100"
              >
                <RectangleVertical size={16} />
                <span>3:4 竖版</span>
              </Button>
              <Button
                variant={home.posterAspectRatio === '16/9' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHomeSettings({ posterAspectRatio: '16/9' as PosterAspectRatio })}
                className="flex-1 gap-2 rounded-xl sm:flex-none dark:bg-gray-800 dark:text-gray-100"
              >
                <RectangleHorizontal size={16} />
                <span>16:9 横版</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white/40 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-gray-900/80">
          <div className="flex flex-col gap-3 border-b border-gray-200/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">视频源列表</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                已启用 {getSelectedAPIs().length}/{videoAPIs.length} 个源
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleToggleAll}
                variant="ghost"
                size="sm"
                disabled={showVideoAPIs.length === 0}
                className="rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {isAllSelected ? <CircleX size={16} /> : <CircleCheckBig size={16} />}
                <span className="ml-1 hidden sm:inline">{isAllSelected ? '全部停用' : '全部启用'}</span>
              </Button>
              <ActionDropdown
                label="添加源"
                items={[
                  {
                    label: '手动添加',
                    onClick: addVideoSource,
                  },
                  {
                    label: '导入视频源',
                    type: 'sub',
                    children: [
                      {
                        label: '从文件导入',
                        onClick: addVideoSourceFromJSONFile,
                      },
                      {
                        label: '从URL导入',
                        onClick: addVideoSourceFromURL,
                      },
                      {
                        label: '从文本导入',
                        onClick: addVideoSourceFromText,
                      },
                    ],
                  },
                  {
                    label: '导出视频源',
                    type: 'sub',
                    children: [
                      {
                        label: '导出为文件',
                        onClick: handleExportToFile,
                      },
                      {
                        label: '导出为文本',
                        onClick: handleExportToText,
                      },
                    ],
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Desktop: Sidebar List */}
            <div className="hidden w-60 flex-col md:flex">
              <ScrollArea className="py-2">
                <div className="flex flex-col gap-1 px-2 text-gray-700 dark:text-gray-200">
                  {showVideoAPIs.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-gray-400 dark:text-gray-500">
                      <p>暂无视频源</p>
                    </div>
                  )}
                  {showVideoAPIs.map((source, index) => (
                    <div
                      className={cn(
                        'flex h-11 items-center justify-between rounded-xl px-3 transition-all hover:cursor-pointer',
                        selectedSource?.id === source.id
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-sm dark:from-red-600/20 dark:to-red-500/20'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50',
                      )}
                      key={source.id}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            source.isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
                          )}
                        />
                        <p className="text-sm font-medium">{source.name}</p>
                      </div>
                      <Switch
                        onClick={e => e.stopPropagation()}
                        onCheckedChange={() => setApiEnabled(source.id, !source.isEnabled)}
                        checked={source.isEnabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Mobile: Source Selector */}
            <div className="border-t border-gray-200/50 p-4 md:hidden dark:border-gray-800">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          selectedSource?.isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
                        )}
                      />
                      <span className="font-medium text-gray-800 dark:text-white">{selectedSource?.name || '选择视频源'}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-red-400" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] w-[95vw] max-w-md dark:bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">选择视频源</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      已启用 {getSelectedAPIs().length}/{videoAPIs.length}
                    </p>
                    <Button
                      onClick={handleToggleAll}
                      variant="ghost"
                      size="sm"
                      disabled={showVideoAPIs.length === 0}
                    >
                      {isAllSelected ? '全部停用' : '全部启用'}
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 -mx-4 px-4">
                    <div className="flex flex-col gap-1 pb-4">
                      {showVideoAPIs.map((source, index) => (
                        <div
                          className={cn(
                            'flex h-12 items-center justify-between rounded-xl px-3 transition-all hover:cursor-pointer',
                            selectedSource?.id === source.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md dark:from-red-600 dark:to-red-500'
                              : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
                          )}
                          key={source.id}
                          onClick={() => setSelectedIndex(index)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                source.isEnabled
                                  ? selectedSource?.id === source.id
                                    ? 'bg-white'
                                    : 'bg-green-500'
                                  : 'bg-gray-300',
                              )}
                            />
                            <span className="font-medium">{source.name}</span>
                          </div>
                          <Switch
                            onClick={e => e.stopPropagation()}
                            onCheckedChange={() => setApiEnabled(source.id, !source.isEnabled)}
                            checked={source.isEnabled}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Content Area */}
            <div className="flex-1 border-t border-gray-200/50 p-4 md:border-t-0 md:border-l dark:border-gray-800">
              {selectedSource ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{selectedSource.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      最后更新：{dayjs(selectedSource.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </p>
                  </div>
                  <VideoSourceForm sourceInfo={selectedSource} />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-gray-400 dark:text-gray-500">
                  <p>请选择或添加视频源</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
    </>
  )
}
