'use client';

import { useState } from 'react';
import type { WeekendData, Expense } from '@/lib/types';
import { postData, deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

interface Settlement {
  from: string;
  to: string;
  amount: number; // in cents
}

function calculateSettlements(expenses: Expense[], participantIds: string[]): Settlement[] {
  // For each participant, calculate net balance (paid - owed)
  const balances: Record<string, number> = {};
  participantIds.forEach((id) => { balances[id] = 0; });

  expenses.forEach((expense) => {
    const splitWith = expense.splitBetween.length > 0
      ? expense.splitBetween
      : participantIds;

    if (splitWith.length === 0) return;

    const share = Math.round(expense.amount / splitWith.length);

    // Payer gets credited
    balances[expense.participantId] = (balances[expense.participantId] ?? 0) + expense.amount;

    // Each person in the split owes their share
    splitWith.forEach((id) => {
      balances[id] = (balances[id] ?? 0) - share;
    });
  });

  // Build settlements greedily
  const settlements: Settlement[] = [];
  const debtors  = Object.entries(balances).filter(([, v]) => v < -1).map(([id, v]) => ({ id, amount: -v }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 1).map(([id, v]) => ({ id, amount: v }));

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const debtor   = debtors[di];
    const creditor = creditors[ci];
    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0) {
      settlements.push({ from: debtor.id, to: creditor.id, amount: transfer });
    }

    debtor.amount   -= transfer;
    creditor.amount -= transfer;

    if (debtor.amount   < 2) di++;
    if (creditor.amount < 2) ci++;
  }

  return settlements;
}

function formatEuros(cents: number) {
  return `€ ${(cents / 100).toFixed(2)}`;
}

export default function ExpensesPanel({ data, currentUser }: PanelProps) {
  const { expenses, participants } = data;
  const participantIds = participants.map((p) => p.id);

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>(participantIds);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep splitWith in sync when participants change (add new)
  // We deliberately don't auto-update so the user controls it.

  function toggleSplit(id: string) {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSplitWith(participantIds);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amountStr) * 100);
    if (!description.trim() || isNaN(amountCents) || amountCents <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await postData('/api/expenses', {
        participantId: currentUser.id,
        participantName: currentUser.name,
        description: description.trim(),
        amount: amountCents,
        splitBetween: splitWith,
      });
      setDescription('');
      setAmountStr('');
      setSplitWith(participantIds);
    } catch {
      setError('Kon uitgave niet toevoegen. Probeer opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(expenseId: string) {
    setDeletingId(expenseId);
    setError(null);
    try {
      await deleteData('/api/expenses', { id: expenseId });
    } catch {
      setError('Kon uitgave niet verwijderen.');
    } finally {
      setDeletingId(null);
    }
  }

  function getParticipantName(id: string) {
    return participants.find((p) => p.id === id)?.name ?? id;
  }

  function getParticipantEmoji(id: string) {
    return participants.find((p) => p.id === id)?.emoji ?? '👤';
  }

  const totalCents = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgCents   = participants.length > 0 ? Math.round(totalCents / participants.length) : 0;

  const settlements = calculateSettlements(expenses, participantIds);

  const amountValid = !isNaN(parseFloat(amountStr)) && parseFloat(amountStr) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">💰 Uitgaven</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Bijhouden wie wat betaalt en wie wat schuldig is.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats row */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
            <div className="text-2xl font-bold text-indigo-700">{formatEuros(totalCents)}</div>
            <div className="text-xs text-indigo-500 mt-0.5">Totale uitgaven</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">{formatEuros(avgCents)}</div>
            <div className="text-xs text-purple-500 mt-0.5">Gemiddeld per persoon</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-700">{expenses.length}</div>
            <div className="text-xs text-green-500 mt-0.5">Aantal uitgaven</div>
          </div>
        </div>
      )}

      {/* Add expense form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-4"
      >
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Uitgave toevoegen
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Omschrijving, bijv. Boodschappen..."
            maxLength={100}
            className="
              rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
              text-gray-700 placeholder:text-gray-400 focus:outline-none
              focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
            "
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">€</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="
                w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-4 py-2.5 text-sm
                text-gray-700 placeholder:text-gray-400 focus:outline-none
                focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
              "
            />
          </div>
        </div>

        {/* Split between */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-600">Verdelen over:</label>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Selecteer iedereen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const checked = splitWith.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSplit(p.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    border-2 transition-all duration-150
                    ${checked
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }
                  `}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                  {checked && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          {splitWith.length === 0 && (
            <p className="text-xs text-red-400 mt-1.5">Selecteer minimaal één persoon</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !description.trim() || !amountValid || splitWith.length === 0}
          className="
            bg-indigo-600 text-white text-sm font-semibold rounded-lg
            px-5 py-2.5 hover:bg-indigo-700 active:bg-indigo-800
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          {submitting ? 'Bezig...' : '💰 Uitgave toevoegen'}
        </button>
      </form>

      {/* Settlement summary */}
      {settlements.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-3">
          <h3 className="font-bold text-amber-800 flex items-center gap-2">
            <span>🤝</span>
            <span>Afrekening</span>
          </h3>
          <p className="text-xs text-amber-600">
            Minimaal aantal overboekingen om alles te vereffenen:
          </p>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>{getParticipantEmoji(s.from)}</span>
                  <span>{getParticipantName(s.from)}</span>
                  <span className="text-gray-400">&#8594;</span>
                  <span>{getParticipantEmoji(s.to)}</span>
                  <span>{getParticipantName(s.to)}</span>
                </div>
                <span className="font-bold text-green-700 text-sm">{formatEuros(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 && expenses.length > 0 && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-green-700 font-semibold text-sm">
            ✅ Alles is al verrekend! Niemand hoeft iets te betalen.
          </p>
        </div>
      )}

      {/* Expense list */}
      {expenses.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <div className="text-5xl mb-3">💰</div>
          <p className="font-medium text-lg">Nog geen uitgaven</p>
          <p className="text-sm mt-1">Voeg de eerste uitgave toe om bij te houden wie wat betaalt.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Alle uitgaven
          </h3>
          {[...expenses]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((expense: Expense) => {
              const isOwn = expense.participantId === currentUser.id;
              const isDeleting = deletingId === expense.id;
              const splitNames =
                expense.splitBetween.length > 0
                  ? expense.splitBetween.map(getParticipantName).join(', ')
                  : 'Iedereen';

              return (
                <div
                  key={expense.id}
                  className="
                    bg-white rounded-xl border border-gray-100 shadow-sm p-4
                    hover:shadow-md transition-shadow duration-200
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {getParticipantEmoji(expense.participantId)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{expense.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Betaald door{' '}
                          <strong className="text-gray-600">{expense.participantName}</strong>
                          {' '}&#x2022;{' '}
                          Verdeeld over: <span className="text-gray-600">{splitNames}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-indigo-700 text-base">
                        {formatEuros(expense.amount)}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={isDeleting}
                          aria-label="Verwijderen"
                          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? '⏳' : '✕'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
