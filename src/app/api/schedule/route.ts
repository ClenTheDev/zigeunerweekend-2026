import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { ScheduleItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { day, time, activity, addedBy } = body as {
      day: string;
      time: string;
      activity: string;
      addedBy: string;
    };

    if (!day || !time || !activity || !addedBy) {
      return NextResponse.json(
        { error: 'day, time, activity and addedBy are required' },
        { status: 400 }
      );
    }

    const data = await getData();

    const newScheduleItem: ScheduleItem = {
      id: crypto.randomUUID(),
      day,
      time,
      activity,
      addedBy,
    };

    data.schedule = [...data.schedule, newScheduleItem];
    await setData(data);

    return NextResponse.json(newScheduleItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/schedule error:', error);
    return NextResponse.json({ error: 'Failed to add schedule item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data = await getData();
    data.schedule = data.schedule.filter((s) => s.id !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/schedule error:', error);
    return NextResponse.json({ error: 'Failed to remove schedule item' }, { status: 500 });
  }
}
