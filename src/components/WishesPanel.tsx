'use client';

import { useState } from 'react';
import type { WeekendData, Wish } from '@/lib/types';
import { postData, deleteData } from '@/lib/hooks';

interface PanelProps {
  data: WeekendData;
  currentUser: { id: string; name: string };
}

type Category = 'eten' | 'drinken' | 'overig';

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'eten',    label: 'Eten',    emoji: '🍽️', color: 'amber'  },
  { value: 'drinken', label: 'Drinken', emoji: '🍺', color: 'green'  },
  { value: 'overig',  label: 'Overig',  emoji: '✨', color: 'purple' },
];

const COLOR_MAP: Record<string, { tab: string; badge: string; card: string; border: string }> = {
  amber: {
    tab:    'bg-amber-500 text-black shadow-sm font-bold',
    badge:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    card:   'hover:border-amber-600',
    border: 'border-l-amber-500',
  },
  green: {
    tab:    'bg-green-500 text-black shadow-sm font-bold',
    badge:  'bg-green-500/20 text-green-400 border border-green-500/30',
    card:   'hover:border-green-600',
    border: 'border-l-green-500',
  },
  purple: {
    tab:    'bg-purple-500 text-white shadow-sm font-bold',
    badge:  'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    card:   'hover:border-purple-600',
    border: 'border-l-purple-500',
  },
};

export default function WishesPanel({ data, currentUser }: PanelProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'alle'>('alle');
  const [wishText, setWishText] = useState('');
  const [wishCategory, setWishCategory] = useState<Category>('eten');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { wishes } = data;

  const filtered: Wish[] =
    activeCategory === 'alle'
      ? wishes
      : wishes.filter((w) => w.category === activeCategory);

  async function handleAddWish(e: React.FormEvent) {
    e.preventDefault();
    if (!wishText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await postData('/api/wishes', {
        participantId: currentUser.id,
        participantName: currentUser.name,
        category: wishCategory,
        text: wishText.trim(),
      });
      setWishText('');
    } catch {
      setError('Kon wens niet toevoegen. Probeer opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(wishId: string) {
    setDeletingId(wishId);
    setError(null);
    try {
      await deleteData('/api/wishes', { id: wishId });
    } catch {
      setError('Kon wens niet verwijderen. Probeer opnieuw.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Wensen</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Wat wil jij eten, drinken of doen dit weekend?
        </p>
      </div>

      {/* Add wish form */}
      <form
        onSubmit={handleAddWish}
        className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4"
      >
        <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-widest">
          Wens toevoegen
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={wishCategory}
            onChange={(e) => setWishCategory(e.target.value as Category)}
            className="
              sm:w-36 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm
              text-white focus:outline-none focus:ring-2 focus:ring-amber-500
              focus:border-transparent transition
            "
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            placeholder="Typ hier jouw wens..."
            maxLength={200}
            className="
              flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm
              text-white placeholder:text-zinc-500 focus:outline-none
              focus:ring-2 focus:ring-amber-500 focus:border-transparent transition
            "
          />

          <button
            type="submit"
            disabled={submitting || !wishText.trim()}
            className="
              sm:w-28 bg-amber-600 text-black text-sm font-bold rounded-lg
              px-4 py-2.5 hover:bg-amber-500 active:bg-amber-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            "
          >
            {submitting ? 'Bezig...' : '+ Toevoegen'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
      </form>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('alle')}
          className={`
            px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150
            ${activeCategory === 'alle'
              ? 'bg-white text-black shadow-sm'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          Alle ({wishes.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = wishes.filter((w) => w.category === cat.value).length;
          const colors = COLOR_MAP[cat.color];
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150
                ${activeCategory === cat.value
                  ? colors.tab
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }
              `}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Wishes list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <div className="text-4xl mb-2">🍺</div>
          <p className="font-medium text-zinc-300">Nog geen wensen in deze categorie</p>
          <p className="text-sm mt-1">Voeg hierboven jouw eerste wens toe!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((wish) => {
            const cat = CATEGORIES.find((c) => c.value === wish.category)!;
            const colors = COLOR_MAP[cat.color];
            const isOwn = wish.participantId === currentUser.id;
            const isDeleting = deletingId === wish.id;

            return (
              <div
                key={wish.id}
                className={`
                  bg-zinc-900 rounded-xl border-2 border-zinc-800 border-l-4 p-4
                  hover:bg-zinc-800 transition-all duration-200
                  ${colors.card} ${colors.border}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{cat.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-white font-medium leading-snug break-words">
                        {wish.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}
                        >
                          {cat.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          door {wish.participantName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isOwn && (
                    <button
                      onClick={() => handleDelete(wish.id)}
                      disabled={isDeleting}
                      aria-label="Wens verwijderen"
                      className="
                        flex-shrink-0 text-zinc-600 hover:text-red-400
                        transition-colors duration-150 disabled:opacity-50
                        disabled:cursor-not-allowed text-lg leading-none
                      "
                    >
                      {isDeleting ? '⏳' : '✕'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
