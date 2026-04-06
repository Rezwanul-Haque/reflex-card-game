interface ScoreboardProps {
  playerName: string;
  opponent: string;
  scores: Record<string, number>;
}

export function Scoreboard({ playerName, opponent, scores }: ScoreboardProps) {
  return (
    <div className="w-full grid grid-cols-3 items-center gap-4 md:gap-6">
      {/* Player HUD */}
      <div className="flex items-center gap-3 bg-surface-low p-3 md:p-4 border-l-4 border-primary">
        <div className="flex flex-col min-w-0">
          <span className="font-headline text-[10px] text-primary uppercase tracking-widest truncate">
            {playerName}
          </span>
          <span className="font-headline text-2xl md:text-4xl font-black text-on-surface">
            {scores[playerName] ?? 0}
          </span>
        </div>
      </div>

      {/* Center: VS indicator */}
      <div className="flex flex-col items-center justify-center">
        <span className="font-headline text-[10px] text-tertiary uppercase tracking-widest">
          VERSUS
        </span>
        <div className="relative w-24 md:w-36 h-1 bg-surface-highest mt-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-tertiary to-secondary" />
        </div>
      </div>

      {/* Opponent HUD */}
      <div className="flex items-center justify-end gap-3 bg-surface-low p-3 md:p-4 border-r-4 border-secondary">
        <div className="flex flex-col items-end min-w-0">
          <span className="font-headline text-[10px] text-secondary uppercase tracking-widest truncate">
            {opponent}
          </span>
          <span className="font-headline text-2xl md:text-4xl font-black text-on-surface">
            {scores[opponent] ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
