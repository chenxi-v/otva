import type { ViewingHistoryItem, VideoApi } from './video'

export interface DbUserSettings {
  network: {
    defaultTimeout: number
    defaultRetry: number
  }
  search: {
    isSearchHistoryEnabled: boolean
    isSearchHistoryVisible: boolean
    searchCacheExpiryHours: number
  }
  playback: {
    isViewingHistoryEnabled: boolean
    isViewingHistoryVisible: boolean
    isAutoPlayEnabled: boolean
    defaultEpisodeOrder: 'asc' | 'desc'
    adFilteringEnabled: boolean
  }
  system: {
    isUpdateLogEnabled: boolean
  }
}

export interface DbUserData {
  settings: DbUserSettings
  viewingHistory: ViewingHistoryItem[]
  videoApis: VideoApi[]
}
