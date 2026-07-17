import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { WarningModal } from './components/WarningModal';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';

function App() {
  const { is18PlusAccepted, room, initSocket, socket, isDarkMode } = useGameStore();

  useEffect(() => {
    if (is18PlusAccepted && !socket) {
      initSocket();
    }
  }, [is18PlusAccepted, socket, initSocket]);

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
      <div className="dark:bg-neutral-900 bg-neutral-100 min-h-screen text-black dark:text-white transition-colors duration-300">
        {!is18PlusAccepted && <WarningModal />}
        
        {/* The main app rendered underneath the warning modal if not accepted */}
        <div className={!is18PlusAccepted ? "pointer-events-none filter blur-sm select-none" : ""}>
          {!room ? <Lobby /> : <GameBoard />}
        </div>
      </div>
    </div>
  );
}

export default App;
