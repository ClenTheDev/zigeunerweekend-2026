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
  { value: 'eten',    label: 'Eten',    emoji: '🍽️', color: 'orange' },
  { value: 'drinken', label: 'Drinken', emoji: '🍺', color: 'amber'  },
  { value: 'overig',  label: 'Overig',  emoji: '✨', color: 'purple' },
];

const COLOR_MAP: Record<string, { tab: string; badge: string; card: string }> = {
  orange: {
    tab:   'bg-orange-500 text-white shadow-sm',
    badge: 'bg-orange-100 text-orange-700',
    card:  'border-orange-200 hover:border-orange-300',
  },
  amber: {
    tab:   'bg-amber-500 text-white shadow-sm',
    badge: 'bg-amber-100 text-amber-700',
    card:  'border-amber-200 hover:border-amber-300',
  },
  purple: {
    tab:   'bg-purple-500 text-white shadow-sm',
    badge: 'bg-purple-100 text-purple-700',
    card:  'border-purple-200 hover:border-purple-300',
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
        <h2 className="text-2xl font-bold text-gray-800">Wensen</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Wat wil jij eten, drinken of doen dit weekend?
        </p>
      </div>

      {/* Add wish form */}
      <form
        onSubmit={handleAddWish}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-4"
      >
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Wens toevoegen
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={wishCategory}
            onChange={(e) => setWishCategory(e.target.value as Category)}
            className="
              sm:w-36 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
              text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
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
              flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
              text-gray-700 placeholder:text-gray-400 focus:outline-none
              focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
            "
          />

          <button
            type="submit"
            disabled={submitting || !wishText.trim()}
            className="
              sm:w-28 bg-indigo-600 text-white text-sm font-semibold rounded-lg
              px-4 py-2.5 hover:bg-indigo-700 active:bg-indigo-800
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            "
          >
            {submitting ? 'Bezig...' : '+ Toevoegen'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}
      </form>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('alle')}
          className={`
            px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150
            ${activeCategory === 'alle'
              ? 'bg-gray-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150
                ${activeCategory === cat.value
                  ? colors.tab
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🌟</div>
          <p className="font-medium">Nog geen wensen in deze categorie</p>
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
                  bg-white rounded-xl border-2 p-4 shadow-sm
                  hover:shadow-md transition-all duration-200
                  ${colors.card}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{cat.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-gray-800 font-medium leading-snug break-words">
                        {wish.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
                        >
                          {cat.label}
                        </span>
                        <span className="text-xs text-gray-400">
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
                        flex-shrink-0 text-gray-300 hover:text-red-400
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
