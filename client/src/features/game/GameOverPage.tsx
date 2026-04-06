import { motion } from 'framer-motion';

interface GameOverProps {
  winner: string;
  playerName: string;
  scores: Record<string, number>;
  error?: string | null;
  reactionHistory: Record<string, number[]>;
  onPlayAgain: () => void;
}

export function GameOverPage({
  winner,
  playerName,
  scores,
  error,
  reactionHistory,
  onPlayAgain,
}: GameOverProps) {
  const isWinner = winner === playerName;
  const opponent = Object.keys(scores).find((p) => p !== playerName) ?? '???';
  const playerScore = scores[playerName] ?? 0;
  const opponentScore = scores[opponent] ?? 0;

  const playerTimes = reactionHistory[playerName] || [];
  const opponentTimes = reactionHistory[opponent] || [];

  const avgReaction =
    playerTimes.length > 0
      ? Math.round(
          playerTimes.reduce((a, b) => a + b, 0) / playerTimes.length
        )
      : null;
  const bestReaction =
    playerTimes.length > 0 ? Math.min(...playerTimes) : null;

  const oppAvgReaction =
    opponentTimes.length > 0
      ? Math.round(
          opponentTimes.reduce((a, b) => a + b, 0) / opponentTimes.length
        )
      : null;
  const oppBestReaction =
    opponentTimes.length > 0 ? Math.min(...opponentTimes) : null;

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-64 h-1 bg-primary/20 -rotate-45" />
        <div className="absolute top-1/3 right-20 w-96 h-0.5 bg-secondary/10 rotate-12" />
        <div className="absolute bottom-1/4 left-1/4 w-px h-64 bg-tertiary/20" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary shadow-[0_0_15px_#81ecff]" />
        <div className="absolute top-40 left-1/3 w-2 h-8 bg-secondary shadow-[0_0_10px_#ff7073] rotate-45" />
        <div className="absolute top-60 right-1/4 w-6 h-2 bg-tertiary shadow-[0_0_12px_#ac89ff] -rotate-12" />
      </div>

      {/* Top App Bar */}
      <header className="bg-surface-low shadow-[0_4px_20px_rgba(129,236,255,0.05)] w-full z-50 shrink-0">
        <div className="flex justify-between items-center w-full px-6 py-3">
          <span className="text-xl font-black tracking-tighter text-primary italic font-headline uppercase">
            ACE REACTION
          </span>
          <span className="font-headline text-primary text-[10px] uppercase tracking-widest border-b border-primary px-2 py-1">
            Arena
          </span>
        </div>
      </header>

      {/* Main Content — fills remaining height */}
      <main className="flex-1 flex flex-col items-center px-4 py-4 min-h-0">
        {/* Hero Winner Announcement */}
        <motion.section
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center relative shrink-0"
        >
          <div className="absolute -inset-10 bg-primary/5 blur-3xl" />
          <p className="font-headline text-primary tracking-[0.4em] uppercase text-[10px] mb-1 font-bold relative">
            MATCH TERMINATED
          </p>
          <h1
            className={`font-headline font-black text-4xl md:text-6xl italic tracking-tighter mb-1 relative ${
              isWinner
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-white drop-shadow-[0_0_30px_rgba(129,236,255,0.4)]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary to-white drop-shadow-[0_0_30px_rgba(255,112,115,0.4)]'
            }`}
          >
            {isWinner ? 'YOU WIN!' : 'DEFEAT'}
          </h1>
          <div
            className={`h-1 w-20 mx-auto ${isWinner ? 'bg-primary' : 'bg-secondary'}`}
          />
          {error && (
            <p className="text-error text-xs font-headline mt-1">{error}</p>
          )}
        </motion.section>

        {/* Stats Grid — takes available space */}
        <div className="grid grid-cols-1 md:grid-cols-12 w-full max-w-5xl gap-3 mt-4 flex-1 min-h-0 auto-rows-min">
          {/* Player Card */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-6 bg-surface-low p-4 border-l-4 border-primary"
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-highest flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                    {isWinner ? 'Winner' : 'You'}
                  </div>
                  <div className="text-sm font-headline font-bold text-on-surface uppercase">
                    {playerName}
                  </div>
                </div>
              </div>
              <span className="text-3xl font-headline font-black text-primary">
                {playerScore}
              </span>
            </div>
            {avgReaction !== null && (
              <div className="flex gap-4">
                <div className="flex-1 bg-surface-mid p-2">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">Avg Reaction</div>
                  <div className="text-lg font-headline font-black text-primary">{avgReaction}<span className="text-[10px] ml-0.5">ms</span></div>
                </div>
                <div className="flex-1 bg-surface-mid p-2">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">Best Reaction</div>
                  <div className="text-lg font-headline font-black text-primary-container">{bestReaction}<span className="text-[10px] ml-0.5">ms</span></div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Opponent Card */}
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-6 bg-surface-low p-4 border-r-4 border-secondary flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-highest flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-secondary">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  {!isWinner ? 'Winner' : 'Opponent'}
                </div>
                <div className="text-sm font-headline font-bold text-on-surface uppercase">
                  {opponent}
                </div>
              </div>
            </div>
            <span className="text-3xl font-headline font-black text-secondary">
              {opponentScore}
            </span>
            {oppAvgReaction !== null && (
              <div className="flex gap-4 mt-3">
                <div className="flex-1 bg-surface-mid p-2">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">Avg Reaction</div>
                  <div className="text-lg font-headline font-black text-secondary">{oppAvgReaction}<span className="text-[10px] ml-0.5">ms</span></div>
                </div>
                <div className="flex-1 bg-surface-mid p-2">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">Best Reaction</div>
                  <div className="text-lg font-headline font-black text-secondary">{oppBestReaction}<span className="text-[10px] ml-0.5">ms</span></div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Score Comparison */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-12 bg-surface-low p-4 border-t-4 border-tertiary"
          >
            <h3 className="font-headline text-on-surface uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-tertiary" />
              Match_Summary
            </h3>

            {/* Score bars */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-headline text-primary text-xs w-20 truncate uppercase">
                  {playerName}
                </span>
                <div className="flex-1 h-6 bg-surface-sunken relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-1000"
                    style={{
                      width: `${playerScore + opponentScore > 0 ? (playerScore / (playerScore + opponentScore)) * 100 : 50}%`,
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 border-l-2 border-primary" />
                  <div className="flex items-center justify-end h-full px-3 relative z-10">
                    <span className="font-headline font-bold text-primary text-sm">{playerScore}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-headline text-secondary text-xs w-20 truncate uppercase">
                  {opponent}
                </span>
                <div className="flex-1 h-6 bg-surface-sunken relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-secondary/20 transition-all duration-1000"
                    style={{
                      width: `${playerScore + opponentScore > 0 ? (opponentScore / (playerScore + opponentScore)) * 100 : 50}%`,
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 border-l-2 border-secondary" />
                  <div className="flex items-center justify-end h-full px-3 relative z-10">
                    <span className="font-headline font-bold text-secondary text-sm">{opponentScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction history chart — both players */}
            {(playerTimes.length > 0 || opponentTimes.length > 0) && (
              <div>
                <h4 className="font-headline text-on-surface-variant uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-tertiary">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Reaction Times per Round
                </h4>
                <div className="space-y-1">
                  {Array.from({ length: Math.max(playerTimes.length, opponentTimes.length) }).map((_, i) => {
                    const pMs = playerTimes[i];
                    const oMs = opponentTimes[i];
                    const maxMs = Math.max(...playerTimes, ...opponentTimes, 500);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-outline-variant font-headline w-6">R{i + 1}</span>
                        <div className="flex-1 flex items-center gap-1">
                          {/* Player bar */}
                          <div className="flex-1 h-4 bg-surface-sunken relative">
                            {pMs != null && (
                              <div
                                className="absolute inset-y-0 left-0 bg-primary/30"
                                style={{ width: `${(pMs / maxMs) * 100}%` }}
                              />
                            )}
                            <span className="absolute right-1 top-0 h-full flex items-center text-[9px] font-headline font-bold text-primary">
                              {pMs != null ? `${pMs}ms` : '—'}
                            </span>
                          </div>
                          {/* Opponent bar */}
                          <div className="flex-1 h-4 bg-surface-sunken relative">
                            {oMs != null && (
                              <div
                                className="absolute inset-y-0 left-0 bg-secondary/30"
                                style={{ width: `${(oMs / maxMs) * 100}%` }}
                              />
                            )}
                            <span className="absolute right-1 top-0 h-full flex items-center text-[9px] font-headline font-bold text-secondary">
                              {oMs != null ? `${oMs}ms` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-2">
                    <span className="text-[10px] text-primary font-headline uppercase">{playerName}</span>
                    <span className="text-[10px] text-secondary font-headline uppercase">{opponent}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* CTA Actions — pinned to bottom */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 w-full max-w-md mt-4 shrink-0"
        >
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-black uppercase tracking-widest neon-glow-primary transition-all active:scale-95 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              Rematch
            </span>
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 border-2 border-outline-variant hover:border-on-surface-variant hover:bg-surface-highest text-on-surface font-headline font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
              Exit to Lobby
            </span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
