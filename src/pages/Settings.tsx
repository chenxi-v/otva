import SideBar from '@/components/settings/layouts/SideBar'
import ModuleContent from '@/components/settings/layouts/ModuleContent'
import { useState } from 'react'
import { type SettingModuleList } from '@/types'
import { ListVideo, Info, ArrowLeft, Globe, Search, Play, X, Palette, Sun, Moon, Monitor } from 'lucide-react'
import VideoSource from '@/components/settings/VideoSource'
import NetworkSettings from '@/components/settings/NetworkSettings'
import SearchSettings from '@/components/settings/SearchSettings'
import PlaybackSettings from '@/components/settings/PlaybackSettings'
import ThemeSettings from '@/components/settings/ThemeSettings'
import AboutProject from '@/components/settings/AboutProject'
import MobileNavBar from '@/components/MobileNavBar'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingStore } from '@/store/settingStore'
import { type ThemeMode } from '@/config/settings.config'
import { useTheme } from '@/hooks'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setThemeSettings } = useSettingStore()
  
  useTheme()

  const SideBarModules: SettingModuleList = [
    {
      id: 'video_source',
      name: '视频源管理',
      icon: <ListVideo size={18} />,
      component: <VideoSource />,
    },
    {
      id: 'network_settings',
      name: '网络设置',
      icon: <Globe size={18} />,
      component: <NetworkSettings />,
    },
    {
      id: 'search_settings',
      name: '搜索设置',
      icon: <Search size={18} />,
      component: <SearchSettings />,
    },
    {
      id: 'playback_settings',
      name: '播放设置',
      icon: <Play size={18} />,
      component: <PlaybackSettings />,
    },
    {
      id: 'theme_settings',
      name: '外观设置',
      icon: <Palette size={18} />,
      component: <ThemeSettings />,
    },
    {
      id: 'about_project',
      name: '关于',
      icon: <Info size={18} />,
      component: <AboutProject />,
    },
  ]

  const [activeId, setActiveId] = useState(SideBarModules[0].id)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const currentModule = SideBarModules.find(module => module.id === activeId) || SideBarModules[0]

  const handleModuleSelect = (id: string) => {
    setActiveId(id)
    setIsSidebarOpen(false)
  }

  return (
    <div className="container mx-auto max-w-6xl min-h-[90vh] p-2 pb-20 pt-18 sm:p-4 sm:pt-4 md:pt-6">
      <MobileNavBar showSettings={false} />

      <div className="fixed top-5 right-5 z-50 hidden gap-3 sm:flex">
        <Button
          onClick={() => {
            const modes: ThemeMode[] = ['light', 'dark', 'system']
            const currentIndex = modes.indexOf(theme.mode)
            const nextIndex = (currentIndex + 1) % modes.length
            setThemeSettings({ mode: modes[nextIndex] })
          }}
          size="icon"
          className="bg-white/40 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 dark:bg-gray-900/80 dark:hover:bg-gray-800"
        >
          {theme.mode === 'light' ? (
            <Sun size={22} className="text-gray-700 dark:text-red-400" />
          ) : theme.mode === 'dark' ? (
            <Moon size={22} className="text-gray-700 dark:text-red-400" />
          ) : (
            <Monitor size={22} className="text-gray-700 dark:text-red-400" />
          )}
        </Button>
      </div>

      {/* 顶部导航栏 */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            className="gap-2 rounded-xl bg-white/40 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 dark:bg-gray-900/80 dark:text-gray-100 dark:hover:bg-gray-800"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} className="dark:text-red-400" />
            <span className="font-medium">返回</span>
          </Button>
        </motion.div>
      </div>

      {/* 移动端：模块切换按钮 */}
      <div className="mb-4 md:hidden">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsSidebarOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-gray-900/80"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white dark:from-red-600 dark:to-red-500">
              {currentModule.icon}
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">当前模块</p>
              <p className="font-semibold text-gray-800 dark:text-white">{currentModule.name}</p>
            </div>
          </div>
          <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-500 dark:text-red-400"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </motion.button>
      </div>

      {/* 移动端：侧边栏抽屉 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-72 bg-white/95 p-4 shadow-2xl backdrop-blur-xl md:hidden dark:bg-gray-950/95"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">设置</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} className="text-gray-500 dark:text-red-400" />
                </button>
              </div>
              <div className="space-y-2">
                {SideBarModules.map(module => (
                  <motion.button
                    key={module.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleModuleSelect(module.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 transition-all ${
                      activeId === module.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg dark:from-red-600 dark:to-red-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        activeId === module.id ? 'bg-white/20' : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      {module.icon}
                    </div>
                    <span className="font-medium">{module.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* 桌面端：侧边栏 */}
        <div className="hidden w-56 shrink-0 md:block lg:w-64">
          <div className="overflow-hidden rounded-2xl bg-white/40 p-3 shadow-xl shadow-black/5 backdrop-blur-xl md:p-4 dark:bg-gray-900/80">
            <SideBar
              className="w-full"
              activeId={activeId}
              modules={SideBarModules}
              onSelect={handleModuleSelect}
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          <ModuleContent module={currentModule} />
        </div>
      </div>
    </div>
  )
}
