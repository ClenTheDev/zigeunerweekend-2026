import { Redis } from '@upstash/redis';
import type { WeekendData } from './types';

const STORE_KEY = 'weekend-data';

// Default empty data
const defaultData: WeekendData = {
  participants: [],
  wishes: [],
  activities: [],
  packList: [],
  expenses: [],
  schedule: [],
};

// In-memory fallback for development
const memoryStore = new Map<string, WeekendData>();

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export async function getData(): Promise<WeekendData> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<WeekendData>(STORE_KEY);
    return data || { ...defaultData };
  }
  return memoryStore.get(STORE_KEY) || { ...defaultData };
}

export async function setData(data: WeekendData): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, data);
  } else {
    memoryStore.set(STORE_KEY, data);
  }
}
