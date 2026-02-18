'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeekendData, postData } from '@/lib/hooks';

// Party-themed avatars — no cute stuff
const AVATARS = ['🍺', '🎸', '🔥', '🎪', '🎶', '🏕️', '🎲', '🃏', '🥃', '🍻', '🎯', '🚀'];

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

// Reusable glow blobs for the dark background atmosphere
function GlowBlobs() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[-120px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #b45309 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-5"
        style={{ background: 'radial-gradient(ellipse, #fbbf24 0%, transparent 70%)' }}
      />
    </>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data, isLoading } = useWeekendData();
  const countdown = useCountdown(WEEKEND_START);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍺');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState<{
    id: string;
    name: string;
    email: string;
    emoji: string;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.name && parsed?.email) {
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
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Je naam invullen, broer. Kan niet zonder.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Een geldig e-mailadres is vereist.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await postData('/api/participants', {
        name: trimmedName,
        email: trimmedEmail,
        emoji: selectedEmoji,
      });
      const stored = {
        id: result.id,
        name: result.name,
        email: result.email,
        emoji: result.emoji,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
      router.push('/weekend');
    } catch {
      setError('Server liegt. Probeer het nog eens.');
      setIsSubmitting(false);
    }
  }

  if (!hydrated) return null;

  // -------------------------------------------------------------------------
  // RETURNING USER — welcome back screen
  // -------------------------------------------------------------------------
  if (existingUser) {
    return (
      <main
        className="min-h-dvh flex flex-col items-center justify-center p-4 py-12"
        style={{ background: '#0a0a0a' }}
      >
        <GlowBlobs />

        <div className="relative w-full max-w-md space-y-5 z-10">
          {/* Welcome back hero */}
          <div className="text-center space-y-3">
            <div
              className="text-7xl mb-2 inline-block"
              style={{ filter: 'drop-shadow(0 0 20px rgba(217,119,6,0.8))' }}
            >
              {existingUser.emoji}
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">
              Welkom terug,{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {existingUser.name}
              </span>
            </h1>
            <p className="text-zinc-400 text-lg font-medium tracking-wide">
              Je staat op de lijst. 🤘
            </p>
          </div>

          {/* Countdown */}
          {!countdown.passed && (
            <div
              className="rounded-2xl border p-5 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(217,119,6,0.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-xs font-bold text-amber-500 mb-4 uppercase tracking-[0.2em]">
                T-minus
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: countdown.days, label: 'DAGEN' },
                  { value: countdown.hours, label: 'UUR' },
                  { value: countdown.minutes, label: 'MIN' },
                  { value: countdown.seconds, label: 'SEC' },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(217,119,6,0.08)',
                      border: '1px solid rgba(217,119,6,0.25)',
                    }}
                  >
                    <div
                      className="text-3xl font-black tabular-nums"
                      style={{
                        color: '#fbbf24',
                        textShadow: '0 0 16px rgba(251,191,36,0.5)',
                      }}
                    >
                      {String(unit.value).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 mt-0.5 tracking-widest">
                      {unit.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA card */}
          <div
            className="rounded-2xl border p-5 text-center space-y-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(217,119,6,0.25)',
            }}
          >
            <button
              onClick={() => router.push('/weekend')}
              className="w-full py-3.5 rounded-xl font-black text-base uppercase tracking-widest text-black transition-all duration-150 active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
                boxShadow: '0 0 24px rgba(217,119,6,0.5)',
              }}
            >
              Naar het weekend 🔥
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setExistingUser(null);
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2 cursor-pointer"
            >
              Ander account? Opnieuw aanmelden
            </button>
          </div>

          {/* Participants */}
          {!isLoading && data.participants.length > 0 && (
            <div>
              <div
                className="h-px w-full mb-4"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(217,119,6,0.4), transparent)',
                }}
              />
              <p className="text-center text-zinc-500 text-xs font-bold mb-3 uppercase tracking-[0.15em]">
                Al op de lijst ({data.participants.length})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {data.participants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      background: 'rgba(217,119,6,0.1)',
                      border: '1px solid rgba(217,119,6,0.25)',
                      color: '#d4d4d8',
                    }}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // NEW USER — join / landing page
  // -------------------------------------------------------------------------
  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center p-4 py-14"
      style={{ background: '#0a0a0a' }}
    >
      <GlowBlobs />

      <div className="relative w-full max-w-lg space-y-6 z-10">

        {/* ---- HERO ---- */}
        <div className="text-center space-y-2">
          {/* Decorative top label */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-2"
            style={{
              background: 'rgba(217,119,6,0.12)',
              border: '1px solid rgba(217,119,6,0.35)',
            }}
          >
            <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em]">
              Officieel Evenement
            </span>
            <span className="text-amber-400">🍺</span>
          </div>

          {/* Main title */}
          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none tracking-tight"
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #fbbf24 50%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 30px rgba(217,119,6,0.4))',
            }}
          >
            HET ZIGEUNER
            <br />
            WEEKEND
          </h1>

          {/* Year badge */}
          <div
            className="inline-block text-6xl font-black tracking-tighter mt-1"
            style={{
              color: '#f59e0b',
              textShadow: '0 0 40px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.3)',
            }}
          >
            2026
          </div>

          {/* Date & location */}
          <div className="flex flex-col items-center gap-1.5 mt-3">
            <p
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: '#e5e5e5' }}
            >
              6 T/M 8 MAART
            </p>
            <a
              href="https://www.roompot.nl/parken/resort-arcen/accommodaties/wellness-zwembadvilla-8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: '#a3a3a3' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#fbbf24')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#a3a3a3')}
            >
              <span>🏕️</span>
              <span className="underline underline-offset-4">Resort Arcen</span>
              <span className="no-underline text-zinc-600">→</span>
            </a>
          </div>

          {/* Vibe strip */}
          <div
            className="flex justify-center gap-3 text-xl mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            aria-hidden="true"
          >
            {['🍺', '🎸', '🔥', '🎶', '🎪', '🥃', '🎯'].map((e) => (
              <span
                key={e}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* ---- COUNTDOWN ---- */}
        {!countdown.passed && (
          <div
            className="rounded-2xl border p-5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(217,119,6,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-xs font-bold text-amber-500 mb-4 text-center uppercase tracking-[0.2em]">
              Countdown 🔥
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: countdown.days, label: 'DAGEN' },
                { value: countdown.hours, label: 'UUR' },
                { value: countdown.minutes, label: 'MIN' },
                { value: countdown.seconds, label: 'SEC' },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: 'rgba(217,119,6,0.07)',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}
                >
                  <div
                    className="text-4xl font-black tabular-nums leading-none"
                    style={{
                      color: '#fbbf24',
                      textShadow: '0 0 20px rgba(251,191,36,0.55)',
                    }}
                  >
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600 mt-1.5 tracking-widest">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- ACCOMMODATION ---- */}
        <a
          href="https://www.roompot.nl/parken/resort-arcen/accommodaties/wellness-zwembadvilla-8"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border p-4 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(217,119,6,0.2)',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(217,119,6,0.5)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(217,119,6,0.06)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(217,119,6,0.2)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(217,119,6,0.1)' }}
            >
              🏡
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm">
                Wellness Zwembadvilla 8
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Roompot Resort Arcen</p>
            </div>
            <span
              className="text-xs font-bold uppercase tracking-widest flex-shrink-0"
              style={{ color: '#d97706' }}
            >
              Bekijk →
            </span>
          </div>
        </a>

        {/* ---- JOIN FORM ---- */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(217,119,6,0.3)',
          }}
        >
          <h2
            className="text-xl font-black uppercase tracking-widest mb-1"
            style={{ color: '#fbbf24' }}
          >
            Ben jij erbij?
          </h2>
          <p className="text-zinc-500 text-sm mb-6 font-medium">
            Meld je aan en sta op de lijst.
          </p>

          <form onSubmit={handleJoin} noValidate className="space-y-4">
            {/* Name field */}
            <div>
              <label
                htmlFor="name-input"
                className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-widest"
              >
                Naam
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Bijv. Tim, Joris, ..."
                maxLength={40}
                autoComplete="given-name"
                className="w-full rounded-xl px-4 py-3 text-base font-semibold text-white placeholder-zinc-700 outline-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${error && !name.trim() ? '#ef4444' : 'rgba(217,119,6,0.3)'}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1.5px solid rgba(245,158,11,0.7)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1.5px solid rgba(217,119,6,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-widest"
              >
                E-mail
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="jouw@mail.nl"
                maxLength={100}
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-xl px-4 py-3 text-base font-semibold text-white placeholder-zinc-700 outline-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${error && !email.trim() ? '#ef4444' : 'rgba(217,119,6,0.3)'}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1.5px solid rgba(245,158,11,0.7)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1.5px solid rgba(217,119,6,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p className="mt-1 text-[11px] text-zinc-600 font-medium">
                Wordt gebruikt als inlog — niet gedeeld.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <p
                className="text-sm font-semibold px-3 py-2 rounded-lg"
                role="alert"
                style={{
                  color: '#fca5a5',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {error}
              </p>
            )}

            {/* Avatar picker */}
            <div>
              <p className="text-xs font-bold text-zinc-400 mb-2.5 uppercase tracking-widest">
                Kies je avatar
              </p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    aria-label={`Kies avatar ${emoji}`}
                    aria-pressed={selectedEmoji === emoji}
                    className="relative flex items-center justify-center text-2xl h-12 w-full rounded-xl transition-all duration-150 select-none cursor-pointer"
                    style={{
                      background:
                        selectedEmoji === emoji
                          ? 'rgba(217,119,6,0.2)'
                          : 'rgba(255,255,255,0.04)',
                      border:
                        selectedEmoji === emoji
                          ? '2px solid rgba(245,158,11,0.7)'
                          : '2px solid rgba(255,255,255,0.06)',
                      boxShadow:
                        selectedEmoji === emoji
                          ? '0 0 12px rgba(217,119,6,0.35)'
                          : 'none',
                      transform: selectedEmoji === emoji ? 'scale(1.08)' : 'scale(1)',
                      filter:
                        selectedEmoji === emoji
                          ? 'drop-shadow(0 0 6px rgba(251,191,36,0.6))'
                          : 'none',
                    }}
                  >
                    {emoji}
                    {selectedEmoji === emoji && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-black text-[9px] font-black"
                        style={{ background: '#f59e0b' }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-black text-base uppercase tracking-widest text-black transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: isSubmitting
                  ? '#78716c'
                  : 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
                boxShadow: isSubmitting ? 'none' : '0 0 28px rgba(217,119,6,0.5)',
              }}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Even wachten...
                </span>
              ) : (
                <>{selectedEmoji} Ik doe mee</>
              )}
            </button>
          </form>
        </div>

        {/* ---- WHO IS COMING ---- */}
        {!isLoading && data.participants.length > 0 && (
          <div>
            <div
              className="h-px w-full mb-5"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(217,119,6,0.4), transparent)',
              }}
            />
            <p className="text-center text-zinc-600 text-xs font-bold mb-3 uppercase tracking-[0.18em]">
              Al op de lijst — {data.participants.length}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {data.participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                  style={{
                    background: 'rgba(217,119,6,0.08)',
                    border: '1px solid rgba(217,119,6,0.2)',
                    color: '#d4d4d8',
                  }}
                >
                  <span className="text-base">{p.emoji}</span>
                  <span>{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-zinc-700 text-sm flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
            Laden...
          </div>
        )}

        {/* Bottom noise texture vibe */}
        <div className="pb-4" />
      </div>
    </main>
  );
}
