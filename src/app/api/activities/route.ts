import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { Activity } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, participantName, title, description } = body as {
      participantId: string;
      participantName: string;
      title: string;
      description: string;
    };

    if (!participantId || !participantName || !title) {
      return NextResponse.json(
        { error: 'participantId, participantName and title are required' },
        { status: 400 }
      );
    }

    const data = await getData();

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      title,
      description,
      votes: [],
      createdAt: Date.now(),
    };

    data.activities = [...data.activities, newActivity];
    await setData(data);

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error('POST /api/activities error:', error);
    return NextResponse.json({ error: 'Failed to add activity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityId, participantId } = body as {
      activityId: string;
      participantId: string;
    };

    if (!activityId || !participantId) {
      return NextResponse.json(
        { error: 'activityId and participantId are required' },
        { status: 400 }
      );
    }

    const data = await getData();

    const activityIndex = data.activities.findIndex((a) => a.id === activityId);
    if (activityIndex === -1) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const activity = data.activities[activityIndex];
    const hasVoted = activity.votes.includes(participantId);

    const updatedActivity: Activity = {
      ...activity,
      votes: hasVoted
        ? activity.votes.filter((v) => v !== participantId)
        : [...activity.votes, participantId],
    };

    data.activities = [
      ...data.activities.slice(0, activityIndex),
      updatedActivity,
      ...data.activities.slice(activityIndex + 1),
    ];

    await setData(data);

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('PUT /api/activities error:', error);
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 });
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
    data.activities = data.activities.filter((a) => a.id !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/activities error:', error);
    return NextResponse.json({ error: 'Failed to remove activity' }, { status: 500 });
  }
}
