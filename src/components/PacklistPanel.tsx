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
    if (checked) return 'bg-green-50 border-green-200';
    if (assignedToId) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-100';
  }

  function getStatusBadge(checked: boolean, assignedTo: string) {
    if (checked) {
      return (
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Ingepakt ✓
        </span>
      );
    }
    if (assignedTo) {
      return (
        <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          Toegewezen
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
        Niet toegewezen
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🎒 Paklijst</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Wie neemt wat mee?
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {checkedCount}/{totalCount}
            </div>
            <div className="text-xs text-gray-400">ingepakt</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round((checkedCount / totalCount) * 100)}%` }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add item form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-5"
      >
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
          Item toevoegen
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={itemText}
            onChange={(e) => setItemText(e.target.value)}
            placeholder="Wat moet er mee? bijv. Slaapzak..."
            maxLength={100}
            className="
              flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
              text-gray-700 placeholder:text-gray-400 focus:outline-none
              focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
            "
          />
          <button
            type="submit"
            disabled={submitting || !itemText.trim()}
            className="
              bg-indigo-600 text-white text-sm font-semibold rounded-lg
              px-5 py-2.5 hover:bg-indigo-700 active:bg-indigo-800
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap
            "
          >
            {submitting ? '...' : '+ Voeg toe'}
          </button>
        </div>
      </form>

      {/* Packlist table */}
      {packList.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <div className="text-5xl mb-3">🎒</div>
          <p className="font-medium text-lg">Paklijst is leeg</p>
          <p className="text-sm mt-1">Voeg items toe die jullie willen meenemen!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers (hidden on mobile) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
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
                  hover:shadow-md
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
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 bg-white'
                          }
                        `}>
                          {packItem.checked && '✓'}
                        </span>
                      </button>
                      <span className={`font-medium text-sm ${packItem.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {packItem.item}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(packItem.id)}
                      disabled={isDeleting}
                      className="text-gray-300 hover:text-red-400 transition-colors text-base"
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
                      className="text-xs rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-600 disabled:opacity-50"
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
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}>
                        {packItem.checked && '✓'}
                      </span>
                    </button>
                  </div>

                  {/* Item name */}
                  <div className="col-span-4">
                    <span className={`text-sm font-medium ${packItem.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {packItem.item}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5">door {packItem.addedBy}</span>
                  </div>

                  {/* Assign dropdown */}
                  <div className="col-span-4">
                    <select
                      value={packItem.assignedToId}
                      onChange={(e) => handleAssign(packItem.id, e.target.value)}
                      disabled={isUpdating || packItem.checked}
                      className="
                        w-full text-sm rounded-lg border border-gray-200 bg-white
                        px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2
                        focus:ring-indigo-400 focus:border-transparent transition
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
                      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
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
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
          Ingepakt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
          Toegewezen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
          Niet toegewezen
        </span>
      </div>
    </div>
  );
}
