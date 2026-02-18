import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { Participant } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, emoji } = body as { name: string; email: string; emoji: string };

    if (!name || !email || !emoji) {
      return NextResponse.json({ error: 'name, email and emoji are required' }, { status: 400 });
    }

    const data = await getData();

    // Check if email already exists — return existing participant (login)
    const existing = data.participants.find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
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
    data.participants = data.participants.filter((p) => p.id !== id);
    data.wishes = data.wishes.filter((w) => w.participantId !== id);
    data.activities = data.activities.filter((a) => a.participantId !== id);
    data.packList = data.packList.map((item) =>
      item.assignedToId === id ? { ...item, assignedTo: '', assignedToId: '' } : item
    );
    data.expenses = data.expenses.filter((e) => e.participantId !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/participants error:', error);
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
