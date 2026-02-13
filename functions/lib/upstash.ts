import { Redis } from '@upstash/redis/cloudflare'
import type { Bindings } from '../worker-configuration'

export function getRedisClient(env: Bindings) {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export type { Redis }
