import type { ReactNode } from 'react'

export type Tab = 'play' | 'duel' | 'ranks' | 'wallet'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'play',
    label: 'Play',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="7" height="7" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'duel',
    label: 'Duel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4l10 10M20 4L10 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 18l-2 2M18 18l2 2M5 14l5 5M19 14l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ranks',
    label: 'Ranks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 20v-6M12 20V4M19 20v-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 3 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M15 11h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1.5 1.5 0 0 1 0-3Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
]

export function TabBar({ active, onSelect }: Props) {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab ${active === tab.id ? 'active' : ''}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
