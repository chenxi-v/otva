export interface VideoApi {
  id: string
  name: string
  url: string
  detailUrl?: string
  timeout?: number
  retry?: number
  isEnabled: boolean
  updatedAt: Date
}

export interface ViewingHistoryItem {
  title: string
  imageUrl: string
  episodeIndex: number
  episodeName?: string
  sourceCode: string
  sourceName: string
  vodId: string
  timestamp: number
  playbackPosition: number
  duration: number
}
