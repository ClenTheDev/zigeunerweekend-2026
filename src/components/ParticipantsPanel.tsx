'use client';

import { useState } from 'react';
import type { WeekendData } from '@/lib/types';
import { deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

export default function ParticipantsPanel({ data, currentUser }: PanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { participants } = data;

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async function handleLeave(participantId: string) {
    setLoading(participantId);
    setError(null);
    try {
      await deleteData('/api/participants', { id: participantId });
    } catch {
      setError('Kon deelnemer niet verwijderen. Probeer opnieuw.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Deelnemers</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {participants.length} {participants.length === 1 ? 'persoon' : 'personen'} doen mee
          </p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full">
          {participants.length} / &#x221e;
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-lg font-medium">Nog geen deelnemers</p>
          <p className="text-sm mt-1">Log in om deel te nemen aan het weekend!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => {
            const isCurrentUser = participant.id === currentUser.id;
            const isLeaving = loading === participant.id;

            return (
              <div
                key={participant.id}
                className={`
                  relative bg-white rounded-xl shadow-md p-5 border-2 transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  ${isCurrentUser
                    ? 'border-indigo-300 bg-indigo-50/40'
                    : 'border-transparent'
                  }
                `}
              >
                {isCurrentUser && (
                  <span className="absolute top-3 right-3 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Jij
                  </span>
                )}

                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
                    {participant.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lid sinds {formatDate(participant.joinedAt)}
                    </p>
                  </div>
                </div>

                {/* Leave button — only for current user */}
                {isCurrentUser && (
                  <button
                    onClick={() => handleLeave(participant.id)}
                    disabled={isLeaving}
                    className="
                      mt-4 w-full text-sm font-medium text-red-500 border border-red-200
                      rounded-lg py-1.5 px-3 hover:bg-red-50 hover:border-red-300
                      transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isLeaving ? 'Bezig...' : 'Verlaat weekend'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fun stats footer */}
      {participants.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-sm text-indigo-700 font-medium text-center">
            🎉 Met z&#39;n {participants.length}en wordt het een geweldig weekend!
          </p>
        </div>
      )}
    </div>
  );
}
