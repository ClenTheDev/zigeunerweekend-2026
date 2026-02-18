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
          <h2 className="text-2xl font-bold text-white">Deelnemers</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {participants.length} {participants.length === 1 ? 'persoon' : 'personen'} doen mee
          </p>
        </div>
        <div className="bg-amber-500/20 text-amber-400 text-sm font-bold px-3 py-1.5 rounded-full border border-amber-500/30">
          {participants.length} / &#x221e;
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <div className="text-5xl mb-3">🍺</div>
          <p className="text-lg font-medium text-zinc-300">Nog geen deelnemers</p>
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
                  relative bg-zinc-900 rounded-xl p-5 border-2 transition-all duration-200
                  hover:bg-zinc-800 hover:-translate-y-0.5
                  ${isCurrentUser
                    ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'border-zinc-800 hover:border-zinc-700'
                  }
                `}
              >
                {isCurrentUser && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    Jij
                  </span>
                )}

                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center text-3xl border border-amber-500/20 flex-shrink-0">
                    {participant.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-lg truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
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
                      mt-4 w-full text-sm font-medium text-red-400 border border-red-800
                      rounded-lg py-1.5 px-3 hover:bg-red-900/40 hover:border-red-700
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
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <p className="text-sm text-amber-400 font-medium text-center">
            🍻 Met z&#39;n {participants.length}en wordt het een legendarisch weekend!
          </p>
        </div>
      )}
    </div>
  );
}
