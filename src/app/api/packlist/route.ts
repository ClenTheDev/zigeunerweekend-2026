import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { PackItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, addedBy } = body as { item: string; addedBy: string };

    if (!item || !addedBy) {
      return NextResponse.json({ error: 'item and addedBy are required' }, { status: 400 });
    }

    const data = await getData();

    const newPackItem: PackItem = {
      id: crypto.randomUUID(),
      item,
      addedBy,
      assignedTo: '',
      assignedToId: '',
      checked: false,
    };

    data.packList = [...data.packList, newPackItem];
    await setData(data);

    return NextResponse.json(newPackItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/packlist error:', error);
    return NextResponse.json({ error: 'Failed to add pack item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assignedTo, assignedToId, checked } = body as {
      id: string;
      assignedTo?: string;
      assignedToId?: string;
      checked?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data = await getData();

    const itemIndex = data.packList.findIndex((p) => p.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Pack item not found' }, { status: 404 });
    }

    const existingItem = data.packList[itemIndex];
    const updatedItem: PackItem = {
      ...existingItem,
      ...(assignedTo !== undefined && { assignedTo }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(checked !== undefined && { checked }),
    };

    data.packList = [
      ...data.packList.slice(0, itemIndex),
      updatedItem,
      ...data.packList.slice(itemIndex + 1),
    ];

    await setData(data);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT /api/packlist error:', error);
    return NextResponse.json({ error: 'Failed to update pack item' }, { status: 500 });
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
    data.packList = data.packList.filter((p) => p.id !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/packlist error:', error);
    return NextResponse.json({ error: 'Failed to remove pack item' }, { status: 500 });
  }
}
