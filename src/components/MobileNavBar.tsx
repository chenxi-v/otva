import { Sun, Moon, Monitor, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingStore } from '@/store/settingStore'
import { useNavigate } from 'react-router'
import { type ThemeMode } from '@/config/settings.config'
import RecentHistory from '@/components/RecentHistory'

interface MobileNavBarProps {
  showHistory?: boolean
  showSettings?: boolean
  showTheme?: boolean
}

export default function MobileNavBar({ 
  showHistory = true, 
  showSettings = true, 
  showTheme = true 
}: MobileNavBarProps) {
  const { theme, setThemeSettings } = useSettingStore()
  const navigate = useNavigate()

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(theme.mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemeSettings({ mode: modes[nextIndex] })
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/90 sm:hidden">
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-gray-900 dark:text-white">OUONNKI TV</span>
      </div>
      <div className="flex items-center gap-1">
        {showHistory && (
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RecentHistory />
          </Button>
        )}
        {showTheme && (
          <Button
            size="icon"
            variant="ghost"
            onClick={cycleTheme}
            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme.mode === 'light' ? (
              <Sun size={20} className="text-gray-700 dark:text-gray-200" />
            ) : theme.mode === 'dark' ? (
              <Moon size={20} className="text-gray-700 dark:text-gray-200" />
            ) : (
              <Monitor size={20} className="text-gray-700 dark:text-gray-200" />
            )}
          </Button>
        )}
        {showSettings && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings size={20} className="text-gray-700 dark:text-gray-200" />
          </Button>
        )}
      </div>
    </div>
  )
}
