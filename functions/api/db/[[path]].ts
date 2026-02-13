import { getRedisClient } from '../../lib/upstash'
import { DatabaseService, type UserSettings } from '../../lib/db.service'
import type { Bindings } from '../../worker-configuration'
import type { ViewingHistoryItem, VideoApi } from '../../types/video'

interface Context {
  request: Request
  env: Bindings
  params: Record<string, string>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
}

function getUserId(request: Request): string {
  const userId = request.headers.get('X-User-Id')
  if (!userId) {
    throw new Error('X-User-Id header is required')
  }
  return userId
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  const text = await request.text()
  return JSON.parse(text) as T
}

export const onRequest = async (context: Context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const redis = getRedisClient(context.env)
    const db = new DatabaseService(redis)
    const userId = getUserId(context.request)
    const url = new URL(context.request.url)
    const path = url.pathname.replace('/api/db/', '')

    let response: unknown

    switch (path) {
      case 'settings':
        if (context.request.method === 'GET') {
          response = await db.getSettings(userId)
        } else if (context.request.method === 'PUT') {
          const settings = await parseJsonBody<Partial<UserSettings>>(context.request)
          await db.setSettings(userId, settings)
          response = { success: true }
        }
        break

      case 'viewing-history':
        if (context.request.method === 'GET') {
          response = await db.getViewingHistory(userId)
        } else if (context.request.method === 'POST') {
          const item = await parseJsonBody<ViewingHistoryItem>(context.request)
          response = await db.addViewingHistory(userId, item)
        } else if (context.request.method === 'DELETE') {
          const item = await parseJsonBody<ViewingHistoryItem>(context.request)
          response = await db.removeViewingHistory(userId, item)
        }
        break

      case 'viewing-history/clear':
        if (context.request.method === 'POST') {
          await db.clearViewingHistory(userId)
          response = { success: true }
        }
        break

      case 'video-apis':
        if (context.request.method === 'GET') {
          response = await db.getVideoApis(userId)
        } else if (context.request.method === 'PUT') {
          const apis = await parseJsonBody<VideoApi[]>(context.request)
          await db.setVideoApis(userId, apis)
          response = { success: true }
        }
        break

      case 'video-apis/add':
        if (context.request.method === 'POST') {
          const api = await parseJsonBody<VideoApi>(context.request)
          response = await db.addVideoApi(userId, api)
        }
        break

      case 'video-apis/remove':
        if (context.request.method === 'POST') {
          const { apiId } = await parseJsonBody<{ apiId: string }>(context.request)
          response = await db.removeVideoApi(userId, apiId)
        }
        break

      case 'user-data':
        if (context.request.method === 'GET') {
          response = await db.getUserData(userId)
        }
        break

      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('X-User-Id') ? 401 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
