import type { ReactNode } from 'react'

export type Tab = 'play' | 'duel' | 'ranks' | 'wallet'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

// Icons per the final design: play = 2x2 dot grid, duel = two overlapping
// circles, ranks = staggered bars, wallet = outline wallet.
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'play',
    label: 'Play',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="2" fill="currentColor" />
        <rect x="13" y="4" width="7" height="7" rx="2" fill="currentColor" />
        <rect x="4" y="13" width="7" height="7" rx="2" fill="currentColor" />
        <rect x="13" y="13" width="7" height="7" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'duel',
    label: 'Duel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="15" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: 'ranks',
    label: 'Ranks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.5" y="12" width="3.4" height="8" rx="1" fill="currentColor" />
        <rect x="10.3" y="4" width="3.4" height="16" rx="1" fill="currentColor" />
        <rect x="16.1" y="8" width="3.4" height="12" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14.5 10.75h6v2.5h-6a1.25 1.25 0 0 1 0-2.5Z" fill="currentColor" />
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
