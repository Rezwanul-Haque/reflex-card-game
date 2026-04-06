import { useState } from 'react';
import { motion } from 'framer-motion';

interface LobbyProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
}

export function LobbyPage({ roomId, playerName, onLeave }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top App Bar */}
      <header className="bg-surface-low shadow-[0_4px_20px_rgba(129,236,255,0.05)] w-full z-50">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-5xl mx-auto">
          <span className="text-2xl font-black tracking-tighter text-primary italic font-headline uppercase">
            ACE REACTION
          </span>
          <button
            onClick={onLeave}
            className="text-on-surface-variant hover:text-secondary font-headline text-sm uppercase tracking-widest transition-colors"
          >
            Disconnect
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Waiting Card */}
          <section className="bg-surface-low p-10 text-center space-y-8">
            {/* Scanning Animation */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-primary/20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-primary absolute"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                  </motion.svg>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-[10px] font-bold text-tertiary tracking-widest mb-2 animate-pulse font-headline">
                SCANNING FOR OPPONENT...
              </p>
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">
                Awaiting Link
              </h2>
            </div>

            {/* Operator Info */}
            <div className="bg-surface-high p-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  Operator
                </div>
                <div className="text-primary font-headline font-bold text-lg uppercase tracking-tight">
                  {playerName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  Status
                </div>
                <div className="text-tertiary font-headline font-bold text-sm uppercase">
                  Standing By
                </div>
              </div>
            </div>

            {/* Room Code */}
            <div className="space-y-3">
              <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                Share this access code with your opponent
              </p>
              <button
                onClick={copyCode}
                className="w-full bg-surface-sunken p-5 group neon-glow-primary transition-all cursor-pointer relative"
              >
                <span className="text-4xl font-mono font-bold text-primary tracking-[0.4em] select-all">
                  {roomId}
                </span>
                <p className="text-[10px] text-outline mt-2 font-headline uppercase tracking-widest group-hover:text-primary transition-colors flex items-center justify-center gap-2">
                  {/* Copy icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                    <rect x="9" y="9" width="13" height="13" rx="0" />
                    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                  </svg>
                  {copied ? 'Copied!' : 'Click to copy'}
                </p>
              </button>
            </div>

            {/* Info */}
            <div className="bg-surface-mid p-4 flex items-center gap-3">
              {/* Info icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span className="text-[10px] font-bold text-on-surface-variant tracking-widest font-headline uppercase">
                Game starts automatically when opponent connects
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
