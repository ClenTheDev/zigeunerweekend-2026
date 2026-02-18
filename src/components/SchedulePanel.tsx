'use client';

import { useState } from 'react';
import type { WeekendData, ScheduleItem } from '@/lib/types';
import { postData, deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

const DAYS = ['Vrijdag', 'Zaterdag', 'Zondag'] as const;

const DAY_CONFIG: Record<string, { bg: string; badge: string; dot: string; header: string; border: string }> = {
  Vrijdag: {
    bg:     'bg-zinc-900',
    badge:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dot:    'bg-amber-500',
    header: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  Zaterdag: {
    bg:     'bg-zinc-900',
    badge:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dot:    'bg-amber-500',
    header: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  Zondag: {
    bg:     'bg-zinc-900',
    badge:  'bg-green-500/20 text-green-400 border-green-500/30',
    dot:    'bg-amber-500',
    header: 'text-green-400',
    border: 'border-green-500/30',
  },
};

const DAY_EMOJI: Record<string, string> = {
  Vrijdag:  '🌆',
  Zaterdag: '🍺',
  Zondag:   '🌅',
};

export default function SchedulePanel({ data, currentUser }: PanelProps) {
  const [selectedDay, setSelectedDay] = useState<string>('Zaterdag');
  const [time, setTime] = useState('12:00');
  const [activity, setActivity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { schedule } = data;

  function getItemsForDay(day: string): ScheduleItem[] {
    return schedule
      .filter((item) => item.day === day)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activity.trim() || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      await postData('/api/schedule', {
        day: selectedDay,
        time,
        activity: activity.trim(),
        addedBy: currentUser.name,
      });
      setActivity('');
    } catch {
      setError('Kon item niet toevoegen. Probeer opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    setError(null);
    try {
      await deleteData('/api/schedule', { id: itemId });
    } catch {
      setError('Kon item niet verwijderen.');
    } finally {
      setDeletingId(null);
    }
  }

  function formatTime(t: string) {
    return t; // Already HH:MM
  }

  const totalItems = schedule.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📅 Planning</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Het programma voor het weekend
          </p>
        </div>
        {totalItems > 0 && (
          <div className="bg-amber-500/20 text-amber-400 text-sm font-bold px-3 py-1.5 rounded-full border border-amber-500/30">
            {totalItems} activiteit{totalItems !== 1 ? 'en' : ''}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4"
      >
        <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-widest">
          Activiteit toevoegen
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Day picker */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="
              rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm
              text-white focus:outline-none focus:ring-2 focus:ring-amber-500
              focus:border-transparent transition
            "
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{DAY_EMOJI[d]} {d}</option>
            ))}
          </select>

          {/* Time picker */}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="
              rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm
              text-white focus:outline-none focus:ring-2 focus:ring-amber-500
              focus:border-transparent transition
            "
          />

          {/* Activity input */}
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="Wat gaan jullie doen?"
            maxLength={150}
            className="
              sm:col-span-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm
              text-white placeholder:text-zinc-500 focus:outline-none
              focus:ring-2 focus:ring-amber-500 focus:border-transparent transition
            "
          />
        </div>

        {/* Activity input on its own row */}
        <div className="sm:hidden">
          {/* Already rendered in grid above for desktop — handled via col-span-3 */}
        </div>

        <button
          type="submit"
          disabled={submitting || !activity.trim() || !time}
          className="
            bg-amber-600 text-black text-sm font-bold rounded-lg
            px-5 py-2.5 hover:bg-amber-500 active:bg-amber-700
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          {submitting ? 'Bezig...' : '📅 Toevoegen aan planning'}
        </button>
      </form>

      {/* Day columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const items = getItemsForDay(day);
          const config = DAY_CONFIG[day];

          return (
            <div
              key={day}
              className={`${config.bg} rounded-2xl border-2 ${config.border} overflow-hidden`}
            >
              {/* Day header */}
              <div className="px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{DAY_EMOJI[day]}</span>
                    <h3 className={`font-bold text-lg ${config.header}`}>{day}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="px-4 py-4 space-y-1 min-h-32">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600">
                    <p className="text-3xl mb-2">🍺</p>
                    <p className="text-sm">Nog niets gepland</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[26px] top-2 bottom-2 w-0.5 bg-zinc-700 rounded-full" />

                    <div className="space-y-3">
                      {items.map((item: ScheduleItem, index) => {
                        const isOwn = item.addedBy === currentUser.name;
                        const isDeleting = deletingId === item.id;
                        const isFirst = index === 0;

                        return (
                          <div key={item.id} className="flex items-start gap-3 relative">
                            {/* Time dot */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                              <div className={`
                                w-[14px] h-[14px] rounded-full border-2 border-zinc-900 shadow-sm mt-1
                                ${config.dot}
                                ${isFirst ? 'w-4 h-4' : ''}
                              `} />
                            </div>

                            {/* Card */}
                            <div className="
                              flex-1 bg-zinc-800 rounded-xl px-3.5 py-2.5
                              border border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600
                              transition-all duration-200 min-w-0
                            ">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold ${config.header} tabular-nums`}>
                                      {formatTime(item.time)}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-white mt-0.5 leading-snug break-words">
                                    {item.activity}
                                  </p>
                                  <p className="text-xs text-zinc-500 mt-0.5">
                                    door {item.addedBy}
                                  </p>
                                </div>
                                {isOwn && (
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isDeleting}
                                    aria-label="Verwijderen"
                                    className="
                                      flex-shrink-0 text-zinc-600 hover:text-red-400
                                      transition-colors duration-150 disabled:opacity-50
                                      text-base leading-none
                                    "
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
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick day navigator on mobile */}
      <div className="lg:hidden flex gap-2">
        {DAYS.map((day) => {
          const config = DAY_CONFIG[day];
          const count = getItemsForDay(day).length;
          return (
            <div
              key={day}
              className={`flex-1 text-center rounded-xl py-2 border bg-zinc-900 ${config.border}`}
            >
              <div className="text-lg">{DAY_EMOJI[day]}</div>
              <div className={`text-xs font-bold mt-0.5 ${config.header}`}>{day}</div>
              <div className="text-xs text-zinc-500">{count} items</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
