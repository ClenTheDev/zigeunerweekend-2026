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
  shortLabel: string;
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
    shortLabel: 'Groep',
    icon: '👥',
    badge: (data) => data.participants.length,
  },
  {
    id: 'eten',
    label: 'Eten & Drinken',
    shortLabel: 'Eten',
    icon: '🍕',
    badge: (data) => data.wishes.length,
  },
  {
    id: 'activiteiten',
    label: 'Activiteiten',
    shortLabel: 'Actie',
    icon: '🎯',
    badge: (data) => data.activities.length,
  },
  {
    id: 'paklijst',
    label: 'Paklijst',
    shortLabel: 'Pak',
    icon: '🎒',
    badge: (data) => data.packList.length,
  },
  {
    id: 'kosten',
    label: 'Kosten',
    shortLabel: 'Geld',
    icon: '💸',
    badge: (data) => data.expenses.length,
  },
  {
    id: 'planning',
    label: 'Planning',
    shortLabel: 'Plan',
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
    email: string;
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
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: '#0a0a0a' }}
      >
        <div className="flex flex-col items-center gap-3">
          <span
            className="inline-block w-9 h-9 rounded-full animate-spin"
            style={{
              border: '3px solid rgba(251,191,36,0.2)',
              borderTopColor: '#f59e0b',
            }}
          />
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: '#a16207' }}
          >
            Laden…
          </span>
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
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#0a0a0a' }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Top header                                                        */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(251,191,36,0.15)',
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.6)',
        }}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">🍺</span>
            <div className="min-w-0">
              <h1
                className="text-sm sm:text-lg font-black tracking-wide sm:tracking-widest leading-tight uppercase truncate"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b 0%, #84cc16 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ZIGEUNERWEEKEND
              </h1>
              <p
                className="text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest truncate uppercase"
                style={{ color: '#57534e' }}
              >
                6-8 MAART 2026
              </p>
            </div>
          </div>

          {/* User chip + logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold"
              style={{
                background: 'rgba(251,191,36,0.08)',
                border: '1.5px solid rgba(251,191,36,0.4)',
                color: '#fbbf24',
              }}
            >
              <span className="text-sm sm:text-base">{currentUser.emoji}</span>
              <span className="truncate max-w-[70px] sm:max-w-[100px]">
                {currentUser.name}
              </span>
            </span>
            <button
              onClick={handleLogout}
              title="Uitloggen"
              aria-label="Uitloggen"
              className="text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-150 cursor-pointer"
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(120,113,108,0.4)',
                color: '#78716c',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fbbf24';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(120,113,108,0.4)';
                (e.currentTarget as HTMLButtonElement).style.color = '#78716c';
              }}
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
          className="hidden sm:flex overflow-x-auto no-scrollbar"
          style={{ borderTop: '1px solid rgba(251,191,36,0.08)' }}
        >
          <div className="flex min-w-max px-2 gap-0 max-w-4xl mx-auto w-full">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.badge ? tab.badge(data, currentUser.id) : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  role="tab"
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-bold transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer uppercase tracking-wider"
                  style={{
                    color: isActive ? '#f59e0b' : '#57534e',
                    borderBottom: isActive
                      ? '2px solid #f59e0b'
                      : '2px solid transparent',
                    letterSpacing: '0.06em',
                  }}
                >
                  <span className="relative">
                    <span className="text-base leading-none">{tab.icon}</span>
                    {count > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center font-black"
                        style={{
                          background: isActive ? '#f59e0b' : '#dc2626',
                          color: isActive ? '#0a0a0a' : '#fff',
                          fontSize: '9px',
                          padding: '0 3px',
                        }}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 sm:pb-6">
        {isLoading && (
          <div
            className="w-full rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm font-bold"
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
              color: '#a16207',
            }}
          >
            <span
              className="inline-block w-4 h-4 rounded-full animate-spin flex-shrink-0"
              style={{
                border: '2px solid rgba(251,191,36,0.2)',
                borderTopColor: '#f59e0b',
              }}
            />
            <span className="uppercase tracking-widest text-xs">
              Gegevens worden gesynchroniseerd…
            </span>
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
        className="sm:hidden fixed bottom-0 inset-x-0 z-20"
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(251,191,36,0.15)',
          boxShadow: '0 -8px 32px 0 rgba(0,0,0,0.7)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="grid grid-cols-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.badge ? tab.badge(data, currentUser.id) : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={isActive}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95"
                style={{
                  color: isActive ? '#f59e0b' : '#44403c',
                }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 inset-x-2 h-0.5 rounded-b-full"
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #84cc16)',
                      boxShadow: '0 0 8px 1px rgba(245,158,11,0.6)',
                    }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative">
                  <span className="text-xl leading-none">{tab.icon}</span>
                  {count > 0 && !isActive && (
                    <span
                      className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full"
                      style={{
                        background: '#dc2626',
                        border: '1.5px solid #0a0a0a',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span
                  className="leading-none uppercase"
                  style={{ fontSize: '9px', letterSpacing: '0.04em' }}
                >
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
