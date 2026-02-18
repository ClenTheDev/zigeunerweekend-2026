'use client';

import { useState } from 'react';
import type { WeekendData } from '@/lib/types';
import { postData, putData, deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

export default function ActivitiesPanel({ data, currentUser }: PanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { activities, participants } = data;

  // Sort by vote count descending, then by creation date
  const sorted = [...activities].sort((a, b) => {
    if (b.votes.length !== a.votes.length) return b.votes.length - a.votes.length;
    return a.createdAt - b.createdAt;
  });

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await postData('/api/activities', {
        participantId: currentUser.id,
        participantName: currentUser.name,
        title: title.trim(),
        description: description.trim(),
      });
      setTitle('');
      setDescription('');
    } catch {
      setError('Kon activiteit niet toevoegen. Probeer opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(activityId: string) {
    setVoting(activityId);
    setError(null);
    try {
      await putData('/api/activities', {
        activityId,
        participantId: currentUser.id,
      });
    } catch {
      setError('Kon stem niet verwerken. Probeer opnieuw.');
    } finally {
      setVoting(null);
    }
  }

  async function handleDelete(activityId: string) {
    setDeletingId(activityId);
    setError(null);
    try {
      await deleteData('/api/activities', { id: activityId });
    } catch {
      setError('Kon activiteit niet verwijderen. Probeer opnieuw.');
    } finally {
      setDeletingId(null);
    }
  }

  function getParticipantName(id: string) {
    return participants.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">🎯 Activiteiten</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Stel activiteiten voor en stem op jouw favorieten!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Propose form */}
      <form
        onSubmit={handlePropose}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-4"
      >
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Activiteit voorstellen
        </h3>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Naam van de activiteit..."
          maxLength={100}
          className="
            w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
            text-gray-700 placeholder:text-gray-400 focus:outline-none
            focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
          "
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionele beschrijving..."
          maxLength={300}
          rows={2}
          className="
            w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
            text-gray-700 placeholder:text-gray-400 focus:outline-none
            focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none
          "
        />

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="
            bg-indigo-600 text-white text-sm font-semibold rounded-lg
            px-5 py-2.5 hover:bg-indigo-700 active:bg-indigo-800
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          {submitting ? 'Bezig...' : '🎯 Voorstel indienen'}
        </button>
      </form>

      {/* Activities list */}
      {sorted.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <div className="text-5xl mb-3">🎯</div>
          <p className="font-medium text-lg">Nog geen activiteiten voorgesteld</p>
          <p className="text-sm mt-1">Wees de eerste en stel iets leuks voor!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((activity, index) => {
            const hasVoted = activity.votes.includes(currentUser.id);
            const isVoting = voting === activity.id;
            const isDeleting = deletingId === activity.id;
            const isOwn = activity.participantId === currentUser.id;
            const isTopActivity = index === 0 && activity.votes.length > 0;

            return (
              <div
                key={activity.id}
                className={`
                  bg-white rounded-xl border-2 shadow-sm p-5
                  hover:shadow-lg transition-all duration-200
                  ${isTopActivity ? 'border-yellow-300' : 'border-gray-100'}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Vote button */}
                  <button
                    onClick={() => handleVote(activity.id)}
                    disabled={isVoting}
                    className={`
                      flex-shrink-0 flex flex-col items-center justify-center
                      w-16 rounded-xl py-2.5 px-1
                      transition-all duration-200 font-bold text-xl
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${hasVoted
                        ? 'bg-rose-100 text-rose-500 border-2 border-rose-300 hover:bg-rose-200'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-200 hover:text-gray-600'
                      }
                    `}
                    aria-label={hasVoted ? 'Stem verwijderen' : 'Stem toevoegen'}
                  >
                    <span>{isVoting ? '⏳' : hasVoted ? '❤️' : '🤍'}</span>
                    <span className="text-sm mt-0.5">{activity.votes.length}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isTopActivity && (
                          <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                            🏆 Favoriet
                          </span>
                        )}
                        <h3 className="font-bold text-gray-800 text-base">
                          {activity.title}
                        </h3>
                      </div>

                      {isOwn && (
                        <button
                          onClick={() => handleDelete(activity.id)}
                          disabled={isDeleting}
                          aria-label="Activiteit verwijderen"
                          className="
                            flex-shrink-0 text-gray-300 hover:text-red-400
                            transition-colors duration-150 disabled:opacity-50
                            disabled:cursor-not-allowed text-lg leading-none
                          "
                        >
                          {isDeleting ? '⏳' : '✕'}
                        </button>
                      )}
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span>Voorgesteld door <strong className="text-gray-600">{activity.participantName}</strong></span>

                      {activity.votes.length > 0 && (
                        <span className="flex items-center gap-1">
                          &#x2022; Gestemd door{' '}
                          <span className="text-gray-600 font-medium">
                            {activity.votes
                              .map((id) => getParticipantName(id))
                              .join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
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
