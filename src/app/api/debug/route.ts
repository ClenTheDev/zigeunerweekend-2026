import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    KV_URL: !!process.env.KV_URL,
    REDIS_URL: !!process.env.REDIS_URL,
  };

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  let redisStatus = 'no credentials';
  let storedData = null;

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      const ping = await redis.ping();
      redisStatus = `connected (ping: ${ping})`;
      storedData = await redis.get('weekend-data');
    } catch (err: unknown) {
      redisStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({
    envCheck,
    resolvedUrl: url ? `${url.substring(0, 20)}...` : null,
    redisStatus,
    hasData: !!storedData,
    dataKeys: storedData ? Object.keys(storedData as object) : [],
  });
}
