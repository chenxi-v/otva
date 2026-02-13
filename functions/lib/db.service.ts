import type { Redis } from '@upstash/redis/cloudflare'
import type { ViewingHistoryItem, VideoApi } from '@/types'

const USER_DATA_PREFIX = 'user:'

export interface UserSettings {
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

export interface UserData {
  settings: UserSettings
  viewingHistory: ViewingHistoryItem[]
  videoApis: VideoApi[]
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  network: {
    defaultTimeout: 10000,
    defaultRetry: 3,
  },
  search: {
    isSearchHistoryEnabled: true,
    isSearchHistoryVisible: true,
    searchCacheExpiryHours: 24,
  },
  playback: {
    isViewingHistoryEnabled: true,
    isViewingHistoryVisible: true,
    isAutoPlayEnabled: true,
    defaultEpisodeOrder: 'asc',
    adFilteringEnabled: true,
  },
  system: {
    isUpdateLogEnabled: true,
  },
}

export class DatabaseService {
  constructor(private redis: Redis) {}

  private getKey(userId: string, key: string): string {
    return `${USER_DATA_PREFIX}${userId}:${key}`
  }

  async getUserData(userId: string): Promise<UserData> {
    const [settings, viewingHistory, videoApis] = await Promise.all([
      this.getSettings(userId),
      this.getViewingHistory(userId),
      this.getVideoApis(userId),
    ])

    return { settings, viewingHistory, videoApis }
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const key = this.getKey(userId, 'settings')
    const data = await this.redis.get<UserSettings>(key)
    return data ?? DEFAULT_USER_SETTINGS
  }

  async setSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const key = this.getKey(userId, 'settings')
    const current = await this.getSettings(userId)
    const updated = { ...current, ...settings }
    await this.redis.set(key, JSON.stringify(updated))
  }

  async getViewingHistory(userId: string): Promise<ViewingHistoryItem[]> {
    const key = this.getKey(userId, 'viewingHistory')
    const data = await this.redis.get<ViewingHistoryItem[]>(key)
    return data ?? []
  }

  async addViewingHistory(userId: string, item: ViewingHistoryItem): Promise<ViewingHistoryItem[]> {
    const key = this.getKey(userId, 'viewingHistory')
    const history = await this.getViewingHistory(userId)

    const existingIndex = history.findIndex(
      h => h.sourceCode === item.sourceCode && h.vodId === item.vodId && h.episodeIndex === item.episodeIndex,
    )

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1)
    }

    const newItem = { ...item, timestamp: Date.now() }
    history.unshift(newItem)

    const trimmedHistory = history.slice(0, 50)
    await this.redis.set(key, JSON.stringify(trimmedHistory))
    return trimmedHistory
  }

  async removeViewingHistory(userId: string, item: ViewingHistoryItem): Promise<ViewingHistoryItem[]> {
    const key = this.getKey(userId, 'viewingHistory')
    const history = await this.getViewingHistory(userId)
    const filtered = history.filter(h => !(h.sourceCode === item.sourceCode && h.vodId === item.vodId))
    await this.redis.set(key, JSON.stringify(filtered))
    return filtered
  }

  async clearViewingHistory(userId: string): Promise<void> {
    const key = this.getKey(userId, 'viewingHistory')
    await this.redis.set(key, JSON.stringify([]))
  }

  async getVideoApis(userId: string): Promise<VideoApi[]> {
    const key = this.getKey(userId, 'videoApis')
    const data = await this.redis.get<VideoApi[]>(key)
    return data ?? []
  }

  async setVideoApis(userId: string, apis: VideoApi[]): Promise<void> {
    const key = this.getKey(userId, 'videoApis')
    await this.redis.set(key, JSON.stringify(apis))
  }

  async addVideoApi(userId: string, api: VideoApi): Promise<VideoApi[]> {
    const apis = await this.getVideoApis(userId)
    const existingIndex = apis.findIndex(a => a.id === api.id)
    if (existingIndex !== -1) {
      apis[existingIndex] = api
    } else {
      apis.push(api)
    }
    await this.setVideoApis(userId, apis)
    return apis
  }

  async removeVideoApi(userId: string, apiId: string): Promise<VideoApi[]> {
    const apis = await this.getVideoApis(userId)
    const filtered = apis.filter(a => a.id !== apiId)
    await this.setVideoApis(userId, filtered)
    return filtered
  }
}
