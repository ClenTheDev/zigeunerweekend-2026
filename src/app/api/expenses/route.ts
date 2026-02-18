import { NextRequest, NextResponse } from 'next/server';
import { getData, setData } from '@/lib/store';
import { Expense } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, participantName, description, amount, splitBetween } = body as {
      participantId: string;
      participantName: string;
      description: string;
      amount: number;
      splitBetween: string[];
    };

    if (!participantId || !participantName || !description || amount === undefined || !splitBetween) {
      return NextResponse.json(
        { error: 'participantId, participantName, description, amount and splitBetween are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'amount must be a non-negative number (in cents)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
      return NextResponse.json(
        { error: 'splitBetween must be a non-empty array' },
        { status: 400 }
      );
    }

    const data = await getData();

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      description,
      amount,
      splitBetween,
      createdAt: Date.now(),
    };

    data.expenses = [...data.expenses, newExpense];
    await setData(data);

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
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
    data.expenses = data.expenses.filter((e) => e.id !== id);
    await setData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/expenses error:', error);
    return NextResponse.json({ error: 'Failed to remove expense' }, { status: 500 });
  }
}
