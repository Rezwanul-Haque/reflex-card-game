import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from './types';

interface CardProps {
  card: CardType | null;
  cardNumber: number;
  triggerRank?: string;
}

const suitSymbols: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const suitColors: Record<string, string> = {
  hearts: 'text-secondary',
  diamonds: 'text-secondary',
  clubs: 'text-surface',
  spades: 'text-surface',
};

export function Card({ card, cardNumber, triggerRank = 'A' }: CardProps) {
  const isTrigger = card?.rank === triggerRank;

  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-[-80px] opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#81ecff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Card stack shadows */}
      <div className="absolute w-44 h-64 md:w-56 md:h-80 bg-surface-highest translate-x-2 translate-y-2 opacity-20" />
      <div className="absolute w-44 h-64 md:w-56 md:h-80 bg-surface-highest translate-x-1 translate-y-1 opacity-40" />

      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={cardNumber}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -180, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="relative w-44 h-64 md:w-56 md:h-80 bg-on-surface z-10"
          >
            {/* Inner border frame */}
            <div
              className={`absolute inset-0 border-[6px] md:border-[8px] border-surface ${
                isTrigger
                  ? 'shadow-[0_0_40px_rgba(129,236,255,0.3)]'
                  : 'shadow-[0_0_20px_rgba(0,0,0,0.4)]'
              }`}
            />

            <div className="h-full w-full p-4 md:p-5 flex flex-col justify-between text-surface">
              {/* Top-left rank + suit */}
              <div className="flex flex-col items-start">
                <span
                  className={`font-headline text-2xl md:text-3xl font-black leading-none ${suitColors[card.suit]}`}
                >
                  {card.rank}
                </span>
                <span className={`text-lg md:text-xl ${suitColors[card.suit]}`}>
                  {suitSymbols[card.suit]}
                </span>
              </div>

              {/* Center */}
              <div className="flex flex-col items-center justify-center">
                <span
                  className={`text-5xl md:text-7xl font-headline font-black ${suitColors[card.suit]}`}
                >
                  {suitSymbols[card.suit]}
                </span>
                {isTrigger && (
                  <span className="font-headline text-[10px] md:text-xs uppercase font-black tracking-widest text-surface mt-2">
                    STRIKE_NOW
                  </span>
                )}
              </div>

              {/* Bottom-right rank + suit (inverted) */}
              <div className="flex flex-col items-end rotate-180">
                <span
                  className={`font-headline text-2xl md:text-3xl font-black leading-none ${suitColors[card.suit]}`}
                >
                  {card.rank}
                </span>
                <span className={`text-lg md:text-xl ${suitColors[card.suit]}`}>
                  {suitSymbols[card.suit]}
                </span>
              </div>
            </div>

            {/* Ace pulse effect */}
            {isTrigger && (
              <div className="absolute -inset-2 border border-primary/50 opacity-30 animate-pulse" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-44 h-64 md:w-56 md:h-80 bg-surface-high z-10 flex items-center justify-center"
          >
            <div className="absolute inset-0 border-[6px] md:border-[8px] border-surface-low" />
            <div className="flex flex-col items-center gap-2">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-outline-variant"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="font-headline text-[10px] text-outline-variant uppercase tracking-widest">
                STANDBY
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
