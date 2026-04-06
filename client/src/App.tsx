import { useGameWebSocket } from './features/game/useGameWebSocket';
import { HomePage } from './features/room/HomePage';
import { LobbyPage } from './features/room/LobbyPage';
import { GamePage } from './features/game/GamePage';
import { GameOverPage } from './features/game/GameOverPage';

function App() {
  const game = useGameWebSocket();

  if (game.phase === 'home') {
    return <HomePage onJoin={game.connect} />;
  }

  if (game.phase === 'waiting') {
    return (
      <LobbyPage
        roomId={game.roomId!}
        playerName={game.playerName!}
        onLeave={game.disconnect}
      />
    );
  }

  if (game.phase === 'game_over') {
    return (
      <GameOverPage
        winner={game.winner!}
        playerName={game.playerName!}
        scores={game.scores}
        error={game.error}
        reactionHistory={game.reactionHistory}
        onPlayAgain={game.disconnect}
      />
    );
  }

  // playing or round_end
  if (game.opponent && game.playerName) {
    return (
      <GamePage
        phase={game.phase}
        playerName={game.playerName}
        opponent={game.opponent}
        currentCard={game.currentCard}
        cardNumber={game.cardNumber}
        scores={game.scores}
        roundResult={game.roundResult}
        reactionHistory={game.reactionHistory}
        triggerRank={game.triggerRank}
        onSlap={game.sendClick}
      />
    );
  }

  return null;
}

export default App;
