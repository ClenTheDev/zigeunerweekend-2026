import { NextResponse } from 'next/server';
import { getData } from '@/lib/store';

export async function GET() {
  try {
    const data = await getData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/data error:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
