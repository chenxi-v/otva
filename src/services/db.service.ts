import type { ViewingHistoryItem, VideoApi } from '@/types'

interface UserSettings {
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

interface UserData {
  settings: UserSettings
  viewingHistory: ViewingHistoryItem[]
  videoApis: VideoApi[]
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  latency: number
  timestamp: string
  error?: string
}

class DbService {
  private baseUrl = '/api/db'
  private userId: string

  constructor() {
    this.userId = this.getOrCreateUserId()
  }

  private getOrCreateUserId(): string {
    const storedUserId = localStorage.getItem('ouonnki-tv-user-id')
    if (storedUserId) {
      return storedUserId
    }
    const newUserId = crypto.randomUUID()
    localStorage.setItem('ouonnki-tv-user-id', newUserId)
    return newUserId
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  async getUserData(): Promise<UserData> {
    return this.request<UserData>('user-data')
  }

  async getSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('settings')
  }

  async setSettings(settings: Partial<UserSettings>): Promise<void> {
    await this.request('settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getViewingHistory(): Promise<ViewingHistoryItem[]> {
    return this.request<ViewingHistoryItem[]>('viewing-history')
  }

  async addViewingHistory(item: ViewingHistoryItem): Promise<ViewingHistoryItem[]> {
    return this.request<ViewingHistoryItem[]>('viewing-history', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  async removeViewingHistory(item: ViewingHistoryItem): Promise<ViewingHistoryItem[]> {
    return this.request<ViewingHistoryItem[]>('viewing-history', {
      method: 'DELETE',
      body: JSON.stringify(item),
    })
  }

  async clearViewingHistory(): Promise<void> {
    await this.request('viewing-history/clear', {
      method: 'POST',
    })
  }

  async getVideoApis(): Promise<VideoApi[]> {
    return this.request<VideoApi[]>('video-apis')
  }

  async setVideoApis(apis: VideoApi[]): Promise<void> {
    await this.request('video-apis', {
      method: 'PUT',
      body: JSON.stringify(apis),
    })
  }

  async addVideoApi(api: VideoApi): Promise<VideoApi[]> {
    return this.request<VideoApi[]>('video-apis/add', {
      method: 'POST',
      body: JSON.stringify(api),
    })
  }

  async removeVideoApi(apiId: string): Promise<VideoApi[]> {
    return this.request<VideoApi[]>('video-apis/remove', {
      method: 'POST',
      body: JSON.stringify({ apiId }),
    })
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      return await this.request<HealthStatus>('health')
    } catch {
      return {
        status: 'unhealthy',
        latency: 0,
        timestamp: new Date().toISOString(),
        error: 'Failed to connect to database API',
      }
    }
  }
}

export const dbService = new DbService()
export type { UserSettings, UserData, HealthStatus }
