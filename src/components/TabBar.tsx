import type { ReactNode } from 'react'

export type Tab = 'play' | 'duel' | 'ranks' | 'wallet'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

// Icons per the final design, drawn bold enough to stay crisp at 26px:
// play = 2x2 dot grid, duel = two overlapping circles, ranks = staggered
// bars, wallet = outline wallet.
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'play',
    label: 'Play',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.2" fill="currentColor" />
        <rect x="13" y="3.5" width="7.5" height="7.5" rx="2.2" fill="currentColor" />
        <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.2" fill="currentColor" />
        <rect x="13" y="13" width="7.5" height="7.5" rx="2.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'duel',
    label: 'Duel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="15.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    id: 'ranks',
    label: 'Ranks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="11.5" width="4.6" height="9" rx="1.4" fill="currentColor" />
        <rect x="9.7" y="3.5" width="4.6" height="17" rx="1.4" fill="currentColor" />
        <rect x="15.9" y="7.5" width="4.6" height="13" rx="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="3.2" stroke="currentColor" strokeWidth="2.2" />
        <path d="M15 10.5h6.5v3H15a1.5 1.5 0 0 1 0-3Z" fill="currentColor" />
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
