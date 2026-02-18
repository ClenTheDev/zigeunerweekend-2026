'use client';
import useSWR, { mutate } from 'swr';
import type { WeekendData } from './types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useWeekendData() {
  const { data, error, isLoading } = useSWR<WeekendData>('/api/data', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  return {
    data: data || {
      participants: [],
      wishes: [],
      activities: [],
      packList: [],
      expenses: [],
      schedule: [],
    },
    isLoading,
    error,
    refresh: () => mutate('/api/data'),
  };
}

// Helper to post data and revalidate
export async function postData(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Request failed');
  mutate('/api/data');
  return res.json();
}

export async function putData(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Request failed');
  mutate('/api/data');
  return res.json();
}

export async function deleteData(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Request failed');
  mutate('/api/data');
  return res.json();
}
