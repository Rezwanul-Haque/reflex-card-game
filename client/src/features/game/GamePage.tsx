import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Scoreboard } from './Scoreboard';
import type {
  Card as CardType,
  GamePhase,
  RoundResultMessage,
} from './types';

interface GameProps {
  phase: GamePhase;
  playerName: string;
  opponent: string;
  currentCard: CardType | null;
  cardNumber: number;
  scores: Record<string, number>;
  roundResult: RoundResultMessage | null;
  reactionHistory: Record<string, number[]>;
  triggerRank: string;
  onSlap: () => void;
}

const rankLabels: Record<string, string> = {
  A: 'an Ace',
  K: 'a King',
  Q: 'a Queen',
  J: 'a Jack',
  '10': 'a 10',
  '9': 'a 9',
  '8': 'an 8',
  '7': 'a 7',
  '6': 'a 6',
  '5': 'a 5',
  '4': 'a 4',
  '3': 'a 3',
  '2': 'a 2',
};

function rankLabel(rank: string): string {
  return rankLabels[rank] || rank;
}

function msColor(ms: number): string {
  if (ms < 200) return 'text-primary';
  if (ms < 400) return 'text-tertiary';
  return 'text-secondary';
}

function ReactionPanel({
  label,
  times,
  accent,
}: {
  label: string;
  times: number[];
  accent: 'primary' | 'secondary';
}) {
  // Show last 5, most recent first
  const recent = times.slice(-5).reverse();
  const avg =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;

  return (
    <div className="bg-surface-low p-3 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-headline text-[10px] font-bold uppercase tracking-widest ${
            accent === 'primary' ? 'text-primary' : 'text-secondary'
          }`}
        >
          {label}
        </span>
        {avg !== null && (
          <span className="text-[10px] text-on-surface-variant font-headline">
            AVG{' '}
            <span className={`font-bold ${msColor(avg)}`}>{avg}ms</span>
          </span>
        )}
      </div>
      {recent.length > 0 ? (
        <div className="space-y-1">
          {recent.map((ms, i) => (
            <div
              key={times.length - i}
              className="flex items-center justify-between"
            >
              <span className="text-[10px] text-outline-variant font-headline">
                R{times.length - i}
              </span>
              <span
                className={`font-headline text-sm font-black tabular-nums ${msColor(ms)}`}
              >
                {ms}
                <span className="text-[8px] ml-0.5 font-bold">ms</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-outline-variant text-center py-2">
          —
        </p>
      )}
    </div>
  );
}

export function GamePage({
  phase,
  playerName,
  opponent,
  currentCard,
  cardNumber,
  scores,
  roundResult,
  reactionHistory,
  triggerRank,
  onSlap,
}: GameProps) {
  const canSlap = phase === 'playing' && !!currentCard;

  const handleSlap = useCallback(() => {
    if (canSlap) {
      onSlap();
    }
  }, [canSlap, onSlap]);

  const isMyWin = roundResult?.winner === playerName;
  const isTrigger = currentCard?.rank === triggerRank;

  const playerTimes = reactionHistory[playerName] || [];
  const opponentTimes = reactionHistory[opponent] || [];
  const hasAnyTimes = playerTimes.length > 0 || opponentTimes.length > 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top App Bar */}
      <header className="bg-surface-low shadow-[0_4px_20px_rgba(129,236,255,0.05)] w-full z-50 shrink-0">
        <div className="flex justify-between items-center w-full px-4 md:px-6 py-3">
          <span className="text-xl md:text-2xl font-black tracking-tighter text-primary italic font-headline uppercase">
            ACE REACTION
          </span>
          <span className="font-headline text-primary text-[10px] uppercase tracking-widest border-b border-primary px-2 py-1">
            Arena
          </span>
        </div>
      </header>

      {/* Arena Content */}
      <main className="flex-1 flex flex-col items-center px-4 md:px-8 py-4 md:py-6 overflow-hidden">
        {/* Scoreboard HUD */}
        <div className="w-full max-w-4xl shrink-0">
          <Scoreboard
            playerName={playerName}
            opponent={opponent}
            scores={scores}
          />
        </div>

        {/* Central area: card + reaction panels side by side */}
        <div className="flex-1 flex items-center justify-center w-full max-w-5xl my-4 md:my-6 min-h-0 gap-4">
          {/* Left: Reaction panel (player) — hidden on small screens if no data */}
          {hasAnyTimes && (
            <div className="hidden md:block w-44 shrink-0">
              <ReactionPanel
                label={playerName}
                times={playerTimes}
                accent="primary"
              />
            </div>
          )}

          {/* Center: Card */}
          <div className="relative flex flex-col items-center justify-center flex-1 min-w-0">
            <Card card={currentCard} cardNumber={cardNumber} triggerRank={triggerRank} />

            {/* Round Result Overlay */}
            {phase === 'round_end' && roundResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <div
                  className={`px-8 py-5 font-headline font-black text-xl md:text-2xl uppercase tracking-tight ${
                    isMyWin
                      ? 'bg-primary text-on-primary shadow-[0_0_30px_rgba(129,236,255,0.4)]'
                      : 'bg-secondary text-on-secondary shadow-[0_0_30px_rgba(255,112,115,0.4)]'
                  }`}
                >
                  {isMyWin
                    ? 'ROUND_WON'
                    : roundResult.reason === 'early_click'
                      ? 'EARLY_STRIKE — ROUND_LOST'
                      : 'OUTPACED — ROUND_LOST'}
                </div>
              </motion.div>
            )}

            {/* Waiting for cards */}
            {phase === 'playing' && !currentCard && (
              <p className="text-on-surface-variant mt-4 text-sm font-headline uppercase tracking-widest animate-pulse">
                Deploying cards...
              </p>
            )}
          </div>

          {/* Right: Reaction panel (opponent) */}
          {hasAnyTimes && (
            <div className="hidden md:block w-44 shrink-0">
              <ReactionPanel
                label={opponent}
                times={opponentTimes}
                accent="secondary"
              />
            </div>
          )}
        </div>

        {/* Mobile: Reaction panels below card */}
        {hasAnyTimes && (
          <div className="flex gap-3 w-full max-w-md md:hidden shrink-0 mb-3">
            <ReactionPanel
              label={playerName}
              times={playerTimes}
              accent="primary"
            />
            <ReactionPanel
              label={opponent}
              times={opponentTimes}
              accent="secondary"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="w-full max-w-4xl shrink-0 pb-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-headline text-[10px] text-primary uppercase tracking-widest">
                {isTrigger ? 'TRIGGER_DETECTED' : 'CTRL_PLAYER'}
              </span>
              <span className="text-[10px] text-on-surface-variant font-headline uppercase tracking-widest">
                {isTrigger
                  ? `IT'S ${rankLabel(triggerRank).toUpperCase()} — STRIKE NOW!`
                  : `Wait for ${rankLabel(triggerRank)}...`}
              </span>
            </div>
            <button
              onClick={handleSlap}
              disabled={!canSlap}
              className={`group relative h-16 md:h-20 overflow-hidden transition-all active:scale-[0.97] ${
                canSlap
                  ? isTrigger
                    ? 'bg-gradient-to-r from-primary to-primary-container shadow-[0_0_30px_rgba(129,236,255,0.3)]'
                    : 'bg-gradient-to-r from-primary to-primary-container'
                  : 'bg-surface-highest cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="relative flex items-center justify-center gap-3 md:gap-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={
                    canSlap ? 'text-on-primary' : 'text-outline-variant'
                  }
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span
                  className={`font-headline text-lg md:text-2xl font-black uppercase italic tracking-tighter ${
                    canSlap ? 'text-on-primary' : 'text-outline-variant'
                  }`}
                >
                  STRIKE_NOW
                </span>
              </div>
              <div
                className={`absolute bottom-0 left-0 w-full h-1 ${
                  canSlap ? 'bg-on-primary/20' : 'bg-outline-variant/20'
                }`}
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
