import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getData, setData } from '@/lib/store';

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
  let writeTest = 'skipped';
  let storeTest = 'skipped';

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      const ping = await redis.ping();
      redisStatus = `connected (ping: ${ping})`;
      storedData = await redis.get('weekend-data');

      // Test direct write + read
      await redis.set('debug-test', { test: true, ts: Date.now() });
      const readBack = await redis.get('debug-test');
      writeTest = readBack ? 'OK - write+read works' : 'FAIL - wrote but read back null';
      await redis.del('debug-test');
    } catch (err: unknown) {
      redisStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Test via our store abstraction
  try {
    const d = await getData();
    storeTest = `getData OK (${d.participants.length} participants)`;
  } catch (err: unknown) {
    storeTest = `getData FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    envCheck,
    resolvedUrl: url ? `${url.substring(0, 20)}...` : null,
    redisStatus,
    writeTest,
    storeTest,
    hasData: !!storedData,
    dataPreview: storedData
      ? {
          participants: (storedData as Record<string, unknown[]>).participants?.length ?? 0,
          wishes: (storedData as Record<string, unknown[]>).wishes?.length ?? 0,
        }
      : null,
  });
}
