import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { PlayScreen } from './components/PlayScreen'
import { DuelScreen } from './components/DuelScreen'
import { RanksScreen, WalletScreen } from './components/Placeholder'
import { TabBar, type Tab } from './components/TabBar'
import { useGame } from './game/useGame'
import { useDuels } from './duel/useDuels'
import { NimiqProvider } from './nimiq/NimiqContext'

export default function App() {
  const [tab, setTab] = useState<Tab>('play')
  const game = useGame()
  const duels = useDuels({ game: game.game, notify: game.notify })

  // A challenge deeplink (?duel=<id>) lands on the Duel tab.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('duel')) setTab('duel')
  }, [])

  const playedToday = game.game !== null && game.game.status !== 'playing'

  return (
    <NimiqProvider>
      <div className="bg" aria-hidden="true" />
      <div className="app">
        <Header
          streak={game.streak}
          showBack={tab === 'play' && (game.phase === 'playing' || game.phase === 'won' || game.phase === 'lost')}
          onBack={game.goHome}
        />
        <main className="content">
          {tab === 'play' && <PlayScreen api={game} />}
          {tab === 'duel' && <DuelScreen duels={duels} playedToday={playedToday} onGoPlay={() => setTab('play')} />}
          {tab === 'ranks' && <RanksScreen />}
          {tab === 'wallet' && <WalletScreen unsettled={duels.unsettled} />}
        </main>
        <TabBar active={tab} onSelect={setTab} />
        {game.toast && (
          <div className="toast" role="status">
            {game.toast}
          </div>
        )}
      </div>
    </NimiqProvider>
  )
}
