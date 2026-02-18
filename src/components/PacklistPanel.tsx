'use client';

import { useState } from 'react';
import type { WeekendData } from '@/lib/types';
import { postData, putData, deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

export default function PacklistPanel({ data, currentUser }: PanelProps) {
  const [itemText, setItemText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { packList, participants } = data;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!itemText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await postData('/api/packlist', {
        item: itemText.trim(),
        addedBy: currentUser.name,
        assignedTo: '',
        assignedToId: '',
        checked: false,
      });
      setItemText('');
    } catch {
      setError('Kon item niet toevoegen. Probeer opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(itemId: string, participantId: string) {
    setUpdatingId(itemId);
    setError(null);
    const participant = participants.find((p) => p.id === participantId);
    try {
      await putData('/api/packlist', {
        id: itemId,
        assignedTo: participant?.name ?? '',
        assignedToId: participantId || '',
      });
    } catch {
      setError('Kon toewijzing niet opslaan.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleCheck(itemId: string, currentChecked: boolean) {
    setUpdatingId(itemId);
    setError(null);
    try {
      await putData('/api/packlist', {
        id: itemId,
        checked: !currentChecked,
      });
    } catch {
      setError('Kon status niet bijwerken.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    setError(null);
    try {
      await deleteData('/api/packlist', { id: itemId });
    } catch {
      setError('Kon item niet verwijderen.');
    } finally {
      setDeletingId(null);
    }
  }

  const checkedCount = packList.filter((i) => i.checked).length;
  const totalCount = packList.length;

  function getRowStyle(checked: boolean, assignedToId: string) {
    if (checked) return 'bg-green-900/30 border-green-800';
    if (assignedToId) return 'bg-amber-900/20 border-amber-800/50';
    return 'bg-zinc-900 border-zinc-800';
  }

  function getStatusBadge(checked: boolean, assignedTo: string) {
    if (checked) {
      return (
        <span className="text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
          Ingepakt ✓
        </span>
      );
    }
    if (assignedTo) {
      return (
        <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
          Toegewezen
        </span>
      );
    }
    return (
      <span className="text-xs font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
        Niet toegewezen
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🎒 Paklijst</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Wie neemt wat mee?
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-500">
              {checkedCount}/{totalCount}
            </div>
            <div className="text-xs text-zinc-500">ingepakt</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round((checkedCount / totalCount) * 100)}%` }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add item form */}
      <form
        onSubmit={handleAdd}
        className="bg-zinc-900 rounded-xl border border-zinc-800 p-5"
      >
        <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-widest mb-3">
          Item toevoegen
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={itemText}
            onChange={(e) => setItemText(e.target.value)}
            placeholder="Wat moet er mee? bijv. Slaapzak..."
            maxLength={100}
            className="
              flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 sm:py-2.5 text-sm
              text-white placeholder:text-zinc-500 focus:outline-none
              focus:ring-2 focus:ring-amber-500 focus:border-transparent transition
            "
          />
          <button
            type="submit"
            disabled={submitting || !itemText.trim()}
            className="
              w-full sm:w-auto bg-amber-600 text-black text-sm font-bold rounded-lg
              px-5 py-3 sm:py-2.5 hover:bg-amber-500 active:bg-amber-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap
            "
          >
            {submitting ? '...' : '+ Voeg toe'}
          </button>
        </div>
      </form>

      {/* Packlist table */}
      {packList.length === 0 ? (
        <div className="text-center py-14 text-zinc-500">
          <div className="text-5xl mb-3">🎒</div>
          <p className="font-medium text-lg text-zinc-300">Paklijst is leeg</p>
          <p className="text-sm mt-1">Voeg items toe die jullie willen meenemen!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers (hidden on mobile) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Item</div>
            <div className="col-span-4">Wie neemt mee?</div>
            <div className="col-span-2">Badge</div>
            <div className="col-span-1"></div>
          </div>

          {packList.map((packItem) => {
            const isUpdating = updatingId === packItem.id;
            const isDeleting = deletingId === packItem.id;

            return (
              <div
                key={packItem.id}
                className={`
                  rounded-xl border-2 px-4 py-3 transition-all duration-200
                  hover:brightness-110
                  ${getRowStyle(packItem.checked, packItem.assignedToId)}
                `}
              >
                {/* Mobile layout */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCheck(packItem.id, packItem.checked)}
                        disabled={isUpdating}
                        className="flex-shrink-0"
                        aria-label="Aanvinken"
                      >
                        <span className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm
                          transition-all duration-150
                          ${packItem.checked
                            ? 'bg-green-500 border-green-500 text-black font-bold'
                            : 'border-zinc-600 bg-zinc-800 hover:border-amber-500'
                          }
                        `}>
                          {packItem.checked && '✓'}
                        </span>
                      </button>
                      <span className={`font-medium text-sm ${packItem.checked ? 'line-through text-zinc-500' : 'text-white'}`}>
                        {packItem.item}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(packItem.id)}
                      disabled={isDeleting}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-base"
                    >
                      {isDeleting ? '⏳' : '✕'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    {getStatusBadge(packItem.checked, packItem.assignedTo)}
                    <select
                      value={packItem.assignedToId}
                      onChange={(e) => handleAssign(packItem.id, e.target.value)}
                      disabled={isUpdating || packItem.checked}
                      className="text-xs rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300 disabled:opacity-50"
                    >
                      <option value="">Niemand</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <button
                      onClick={() => handleToggleCheck(packItem.id, packItem.checked)}
                      disabled={isUpdating}
                      aria-label="Aanvinken"
                    >
                      <span className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm
                        transition-all duration-150
                        ${packItem.checked
                          ? 'bg-green-500 border-green-500 text-black font-bold'
                          : 'border-zinc-600 bg-zinc-800 hover:border-amber-500'
                        }
                      `}>
                        {packItem.checked && '✓'}
                      </span>
                    </button>
                  </div>

                  {/* Item name */}
                  <div className="col-span-4">
                    <span className={`text-sm font-medium ${packItem.checked ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {packItem.item}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1.5">door {packItem.addedBy}</span>
                  </div>

                  {/* Assign dropdown */}
                  <div className="col-span-4">
                    <select
                      value={packItem.assignedToId}
                      onChange={(e) => handleAssign(packItem.id, e.target.value)}
                      disabled={isUpdating || packItem.checked}
                      className="
                        w-full text-sm rounded-lg border border-zinc-700 bg-zinc-800
                        px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:ring-2
                        focus:ring-amber-500 focus:border-transparent transition
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <option value="">-- Niemand --</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.emoji} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status badge */}
                  <div className="col-span-2">
                    {getStatusBadge(packItem.checked, packItem.assignedTo)}
                  </div>

                  {/* Delete */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDelete(packItem.id)}
                      disabled={isDeleting}
                      aria-label="Verwijderen"
                      className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? '⏳' : '✕'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          Ingepakt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          Toegewezen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-zinc-600 inline-block"></span>
          Niet toegewezen
        </span>
      </div>
    </div>
  );
}
