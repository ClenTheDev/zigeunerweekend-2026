import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { Wish } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, participantName, category, text } = body as {
      participantId: string;
      participantName: string;
      category: 'eten' | 'drinken' | 'overig';
      text: string;
    };

    if (!participantId || !participantName || !category || !text) {
      return NextResponse.json(
        { error: 'participantId, participantName, category and text are required' },
        { status: 400 }
      );
    }

    const validCategories = ['eten', 'drinken', 'overig'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'category must be one of: eten, drinken, overig' },
        { status: 400 }
      );
    }

    const data = await getData();

    const newWish: Wish = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      category,
      text,
      createdAt: Date.now(),
    };

    data.wishes = [...data.wishes, newWish];
    await setData(data);

    return NextResponse.json(newWish, { status: 201 });
  } catch (error) {
    console.error('POST /api/wishes error:', error);
    return NextResponse.json({ error: 'Failed to add wish' }, { status: 500 });
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
    data.wishes = data.wishes.filter((w) => w.id !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/wishes error:', error);
    return NextResponse.json({ error: 'Failed to remove wish' }, { status: 500 });
  }
}
