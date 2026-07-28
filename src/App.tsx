import { useState } from 'react'
import { Header } from './components/Header'
import { PlayScreen } from './components/PlayScreen'
import { DuelScreen, RanksScreen, WalletScreen } from './components/Placeholder'
import { TabBar, type Tab } from './components/TabBar'
import { useGame } from './game/useGame'
import { NimiqProvider } from './nimiq/NimiqContext'

export default function App() {
  const [tab, setTab] = useState<Tab>('play')
  const game = useGame()

  return (
    <NimiqProvider>
      <div className="bg" aria-hidden="true" />
      <div className="app">
        <Header streak={game.streak} />
        <main className="content">
          {tab === 'play' && <PlayScreen api={game} />}
          {tab === 'duel' && <DuelScreen />}
          {tab === 'ranks' && <RanksScreen />}
          {tab === 'wallet' && <WalletScreen />}
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
