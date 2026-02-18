import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { Participant } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji } = body as { name: string; emoji: string };

    if (!name || !emoji) {
      return NextResponse.json({ error: 'name and emoji are required' }, { status: 400 });
    }

    const data = await getData();

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      emoji,
      joinedAt: Date.now(),
    };

    data.participants = [...data.participants, newParticipant];
    await setData(data);

    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    console.error('POST /api/participants error:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
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

    // Remove participant
    data.participants = data.participants.filter((p) => p.id !== id);

    // Clean up wishes belonging to this participant
    data.wishes = data.wishes.filter((w) => w.participantId !== id);

    // Clean up activities belonging to this participant
    data.activities = data.activities.filter((a) => a.participantId !== id);

    // Clean up pack list assignments for this participant
    data.packList = data.packList.map((item) =>
      item.assignedToId === id
        ? { ...item, assignedTo: '', assignedToId: '' }
        : item
    );

    // Clean up expenses belonging to this participant
    data.expenses = data.expenses.filter((e) => e.participantId !== id);

    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/participants error:', error);
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
