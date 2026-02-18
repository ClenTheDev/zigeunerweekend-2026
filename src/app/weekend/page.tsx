'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeekendData } from '@/lib/hooks';
import ParticipantsPanel from '@/components/ParticipantsPanel';
import WishesPanel from '@/components/WishesPanel';
import ActivitiesPanel from '@/components/ActivitiesPanel';
import PacklistPanel from '@/components/PacklistPanel';
import ExpensesPanel from '@/components/ExpensesPanel';
import SchedulePanel from '@/components/SchedulePanel';

const LOCAL_STORAGE_KEY = 'vriendenweekend_participant';

type TabId =
  | 'deelnemers'
  | 'eten'
  | 'activiteiten'
  | 'paklijst'
  | 'kosten'
  | 'planning';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  /** Returns the badge count given the current data + current user */
  badge?: (
    data: ReturnType<typeof useWeekendData>['data'],
    userId: string
  ) => number;
}

const TABS: TabConfig[] = [
  {
    id: 'deelnemers',
    label: 'Deelnemers',
    icon: '👥',
    badge: (data) => data.participants.length,
  },
  {
    id: 'eten',
    label: 'Eten & Drinken',
    icon: '🍕',
    badge: (data) => data.wishes.length,
  },
  {
    id: 'activiteiten',
    label: 'Activiteiten',
    icon: '🎯',
    badge: (data) => data.activities.length,
  },
  {
    id: 'paklijst',
    label: 'Paklijst',
    icon: '🎒',
    badge: (data) => data.packList.length,
  },
  {
    id: 'kosten',
    label: 'Kosten',
    icon: '💸',
    badge: (data) => data.expenses.length,
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: '📅',
    badge: (data) => data.schedule.length,
  },
];

export default function WeekendPage() {
  const router = useRouter();
  const { data, isLoading } = useWeekendData();

  const [activeTab, setActiveTab] = useState<TabId>('deelnemers');
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    emoji: string;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.name) {
          setCurrentUser(parsed);
        } else {
          router.replace('/');
        }
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    } finally {
      setHydrated(true);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/');
  }

  // Don't render anything until we've checked localStorage
  if (!hydrated) {
    return (
      <div className="bg-hero min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <span className="inline-block w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Even laden…</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // redirect is in-flight
  }

  const panelProps = {
    data,
    currentUser: { id: currentUser.id, name: currentUser.name },
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* ---------------------------------------------------------------- */}
      {/* Top header                                                        */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: 'rgba(255,251,245,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">🏕️</span>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight leading-tight text-gradient truncate">
                Zigeunerweekend
              </h1>
              <p className="text-xs text-stone-400 font-medium hidden sm:block truncate">
                6 t/m 8 maart 2026 &bull; Resort Arcen
              </p>
            </div>
          </div>

          {/* User chip + logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold border"
              style={{
                background: 'var(--color-bg-muted)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <span className="text-base">{currentUser.emoji}</span>
              <span className="hidden xs:inline truncate max-w-[100px]">
                {currentUser.name}
              </span>
            </span>
            <button
              onClick={handleLogout}
              title="Uitloggen"
              aria-label="Uitloggen"
              className="btn btn-outline text-xs px-3 py-1.5 h-auto"
              style={{ borderWidth: '1.5px' }}
            >
              <span className="hidden sm:inline">Uitloggen</span>
              <span className="sm:hidden">↩</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tab bar – scrollable on mobile                                   */}
        {/* ---------------------------------------------------------------- */}
        <nav
          aria-label="Secties"
          className="flex overflow-x-auto no-scrollbar border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex min-w-max px-2 gap-0.5 max-w-4xl mx-auto w-full">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.badge ? tab.badge(data, currentUser.id) : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  role="tab"
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer group"
                  style={{
                    color: isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                    borderBottom: isActive
                      ? '2px solid var(--color-primary)'
                      : '2px solid transparent',
                  }}
                >
                  {/* Icon row with badge */}
                  <span className="relative">
                    <span className="text-base leading-none">{tab.icon}</span>
                    {count > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-white flex items-center justify-center font-bold"
                        style={{
                          background: isActive
                            ? 'var(--color-primary)'
                            : 'var(--color-accent)',
                          fontSize: '9px',
                          padding: '0 3px',
                        }}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  {/* Label */}
                  <span className="leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Main content area                                                 */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {isLoading && (
          <div
            className="w-full rounded-2xl border px-4 py-3 mb-4 flex items-center gap-2 text-sm font-medium"
            style={{
              background: 'var(--color-bg-muted)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="inline-block w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Gegevens worden gesynchroniseerd…
          </div>
        )}

        {/* Tab panels */}
        <div role="tabpanel" aria-labelledby={activeTab}>
          {activeTab === 'deelnemers' && <ParticipantsPanel {...panelProps} />}
          {activeTab === 'eten' && <WishesPanel {...panelProps} />}
          {activeTab === 'activiteiten' && <ActivitiesPanel {...panelProps} />}
          {activeTab === 'paklijst' && <PacklistPanel {...panelProps} />}
          {activeTab === 'kosten' && <ExpensesPanel {...panelProps} />}
          {activeTab === 'planning' && <SchedulePanel {...panelProps} />}
        </div>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* Bottom mobile nav (convenience duplicate for thumb reach)         */}
      {/* ---------------------------------------------------------------- */}
      <nav
        aria-label="Snelnavigatie"
        className="sm:hidden sticky bottom-0 z-20 border-t"
        style={{
          background: 'rgba(255,251,245,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 -4px 16px 0 rgb(249 115 22 / 0.08)',
        }}
      >
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.badge ? tab.badge(data, currentUser.id) : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={isActive}
                className="relative flex flex-col items-center gap-1 px-3 py-2 flex-1 min-w-[60px] text-xs font-semibold transition-all duration-150 cursor-pointer"
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                <span className="relative">
                  <span className="text-xl leading-none">{tab.icon}</span>
                  {count > 0 && !isActive && (
                    <span
                      className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-fuchsia-500 border border-white"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="truncate w-full text-center leading-none" style={{ fontSize: '9px' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="absolute top-0 inset-x-0 h-0.5 rounded-b-full"
                    style={{ background: 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
