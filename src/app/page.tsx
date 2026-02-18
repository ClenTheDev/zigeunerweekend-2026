'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeekendData, postData } from '@/lib/hooks';

const AVATARS = ['🎉', '🍕', '🎸', '🏄', '🎲', '🍻', '🎯', '🌮', '🎪', '🏕️', '🎨', '🚀'];

const LOCAL_STORAGE_KEY = 'vriendenweekend_participant';

const WEEKEND_START = new Date('2026-03-06T15:00:00');

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, passed: false };
}

export default function LandingPage() {
  const router = useRouter();
  const { data, isLoading } = useWeekendData();
  const countdown = useCountdown(WEEKEND_START);

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.name) {
          setExistingUser(parsed);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Vul je naam in om mee te doen!');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await postData('/api/participants', {
        name: trimmed,
        emoji: selectedEmoji,
      });
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ id: result.id, name: trimmed, emoji: selectedEmoji })
      );
      router.push('/weekend');
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw!');
      setIsSubmitting(false);
    }
  }

  if (!hydrated) return null;

  // --- Returning user ---
  if (existingUser) {
    return (
      <main className="bg-hero min-h-dvh flex flex-col items-center justify-center p-4">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #d946ef 0%, transparent 70%)' }}
        />

        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-3 animate-bounce">{existingUser.emoji}</div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              <span className="text-gradient">Welkom terug!</span>
            </h1>
            <p className="text-xl text-stone-600 font-medium">
              Hoi{' '}
              <span className="font-bold text-orange-600">{existingUser.name}</span>
              , fijn dat je er bent! 👋
            </p>
          </div>

          {/* Countdown */}
          {!countdown.passed && (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 shadow-lg p-5 text-center">
              <p className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wide">Nog even wachten...</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: countdown.days, label: 'dagen' },
                  { value: countdown.hours, label: 'uur' },
                  { value: countdown.minutes, label: 'min' },
                  { value: countdown.seconds, label: 'sec' },
                ].map((unit) => (
                  <div key={unit.label} className="bg-gradient-to-b from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                    <div className="text-3xl font-black text-orange-600 tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-stone-500 font-medium mt-0.5">{unit.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card shadow-lg text-center">
            <button
              onClick={() => router.push('/weekend')}
              className="btn btn-primary w-full text-lg py-3"
            >
              Naar het weekend! 🎉
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setExistingUser(null);
              }}
              className="mt-3 text-sm text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2 cursor-pointer"
            >
              Andere deelnemer? Opnieuw aanmelden
            </button>
          </div>

          {!isLoading && data.participants.length > 0 && (
            <div className="mt-4">
              <p className="text-center text-stone-500 text-sm font-medium mb-3">
                Al aangemeld ({data.participants.length})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {data.participants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-orange-100 rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                  >
                    <span>{p.emoji}</span>
                    <span className="text-stone-700">{p.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --- New user / join ---
  return (
    <main className="bg-hero min-h-dvh flex flex-col items-center justify-center p-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #d946ef 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-[-40px] w-48 h-48 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-lg space-y-6">
        {/* Hero */}
        <div className="text-center">
          <div className="text-6xl mb-4">🏕️</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 text-balance">
            <span className="text-gradient">Het Zigeunerweekend</span>
          </h1>
          <p className="text-2xl font-bold text-orange-600 mb-3">2026</p>
          <p className="text-stone-500 text-lg font-medium text-balance">
            6 t/m 8 maart &bull; Resort Arcen
          </p>
        </div>

        {/* Countdown */}
        {!countdown.passed && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-orange-100 shadow-lg p-5 text-center">
            <p className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wide">Countdown</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: countdown.days, label: 'dagen' },
                { value: countdown.hours, label: 'uur' },
                { value: countdown.minutes, label: 'min' },
                { value: countdown.seconds, label: 'sec' },
              ].map((unit) => (
                <div key={unit.label} className="bg-gradient-to-b from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                  <div className="text-3xl font-black text-orange-600 tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">{unit.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accommodation card */}
        <a
          href="https://www.roompot.nl/parken/resort-arcen/accommodaties/wellness-zwembadvilla-8"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow-md p-4 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🏡
            </div>
            <div className="min-w-0">
              <p className="font-bold text-stone-800 text-sm group-hover:text-orange-600 transition-colors">
                Wellness Zwembadvilla 8
              </p>
              <p className="text-xs text-stone-500">Roompot Resort Arcen</p>
              <p className="text-xs text-orange-500 font-medium mt-0.5">Bekijk de accommodatie &rarr;</p>
            </div>
          </div>
        </a>

        {/* Join card */}
        <div className="card shadow-xl">
          <h2 className="text-xl font-bold text-stone-800 mb-5">
            Doe je mee? Meld je aan! 👇
          </h2>

          <form onSubmit={handleJoin} noValidate>
            <div className="mb-5">
              <label htmlFor="name-input" className="block text-sm font-semibold text-stone-700 mb-1.5">
                Jouw naam
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Bijv. Sanne, Tim, ..."
                maxLength={40}
                autoComplete="given-name"
                className="w-full border-2 rounded-xl px-4 py-3 text-base font-medium text-stone-800 placeholder:text-stone-300 transition-colors outline-none focus:border-orange-400"
                style={{
                  borderColor: error ? '#ef4444' : '#fed7aa',
                  background: '#fff7ed',
                }}
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-500 font-medium" role="alert">{error}</p>
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-stone-700 mb-2">Kies je avatar</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    aria-label={`Kies avatar ${emoji}`}
                    aria-pressed={selectedEmoji === emoji}
                    className={`
                      relative flex items-center justify-center text-2xl h-12 w-full rounded-xl
                      transition-all duration-150 select-none cursor-pointer border-2
                      ${selectedEmoji === emoji
                        ? 'bg-orange-50 border-orange-400 scale-110 shadow-md'
                        : 'bg-stone-50 border-transparent hover:bg-orange-50'
                      }
                    `}
                  >
                    {emoji}
                    {selectedEmoji === emoji && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-orange-500">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full text-base py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Even wachten...
                </>
              ) : (
                <>{selectedEmoji} Meedoen aan het weekend!</>
              )}
            </button>
          </form>
        </div>

        {/* Who's already here */}
        {!isLoading && data.participants.length > 0 && (
          <div>
            <hr className="divider" />
            <p className="text-center text-stone-500 text-sm font-semibold mb-3 uppercase tracking-wide">
              Al aangemeld ({data.participants.length})
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {data.participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 bg-white border border-orange-100 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm"
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="text-stone-700">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-stone-400 text-sm">
            <span className="inline-block w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
            Laden...
          </div>
        )}
      </div>
    </main>
  );
}
