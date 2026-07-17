import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { WarningModal } from './components/WarningModal';
import { BootScreen } from './components/BootScreen';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';

function App() {
  const { is18PlusAccepted, room, initSocket, socket, isDarkMode, connectionStatus } = useGameStore();

  useEffect(() => {
    if (is18PlusAccepted && !socket) {
      initSocket();
    }
  }, [is18PlusAccepted, socket, initSocket]);

  const isConnected = connectionStatus === 'connected';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="app-surface min-h-screen font-sans transition-colors duration-300">
        {!is18PlusAccepted && <WarningModal />}

        {/* Lobby sits blurred behind the warning until it's accepted. */}
        <div className={!is18PlusAccepted ? 'pointer-events-none filter blur-sm select-none' : ''}>
          {!is18PlusAccepted || isConnected ? (
            !room ? <Lobby /> : <GameBoard />
          ) : (
            <BootScreen />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
