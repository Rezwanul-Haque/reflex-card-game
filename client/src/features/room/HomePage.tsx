import { useState } from 'react';
import { useCreateRoom } from './api';

interface HomeProps {
  onJoin: (roomId: string, playerName: string) => void;
}

export function HomePage({ onJoin }: HomeProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const createRoom = useCreateRoom();

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createRoom.mutateAsync();
    onJoin(result.room_id, name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    onJoin(roomCode.trim(), name.trim());
  };

  const hasName = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top App Bar */}
      <header className="bg-surface-low shadow-[0_4px_20px_rgba(129,236,255,0.05)] w-full z-50">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-5xl mx-auto">
          <span className="text-2xl font-black tracking-tighter text-primary italic font-headline uppercase">
            ACE REACTION
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant tracking-widest font-headline">
              REFLEX CARD GAME
            </span>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-8">
          {/* Callsign Input */}
          <section className="bg-surface-low p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-tertiary/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-tertiary">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black font-headline tracking-tighter uppercase">
                  Operator Callsign
                </h2>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  IDENTITY_REQUIRED_FOR_SESSION
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="ENTER_CALLSIGN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-sunken text-primary font-headline font-bold text-center tracking-[0.15em] py-4 border-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant placeholder:tracking-[0.15em] uppercase"
              maxLength={20}
            />
          </section>

          {/* Hero Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Arena */}
            <div className="bg-surface-low p-8 flex flex-col justify-between group transition-colors hover:bg-surface-mid">
              <div>
                <div className="inline-block p-4 bg-primary/10 mb-6 transition-transform group-hover:scale-110">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black font-headline tracking-tighter mb-2 uppercase">
                  Create Arena
                </h2>
                <p className="text-on-surface-variant text-sm mb-8">
                  Host a private match. Share your room code and challenge a
                  friend to a reflex duel.
                </p>
              </div>
              <button
                onClick={handleCreate}
                disabled={!hasName || createRoom.isPending}
                className="w-full bg-gradient-to-r from-primary to-primary-container py-4 text-on-primary font-headline font-bold uppercase tracking-widest neon-glow-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {createRoom.isPending
                  ? 'INITIALIZING...'
                  : 'Initiate Broadcast'}
              </button>
              {createRoom.isError && (
                <p className="text-error text-center text-sm mt-3 font-headline">
                  {createRoom.error.message}
                </p>
              )}
            </div>

            {/* Join / Direct Access */}
            <div className="bg-surface-low p-8 flex flex-col justify-between group transition-colors hover:bg-surface-mid">
              <div>
                <div className="inline-block p-4 bg-secondary/10 mb-6 transition-transform group-hover:scale-110">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-secondary">
                    <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black font-headline tracking-tighter mb-2 uppercase">
                  Direct Access
                </h2>
                <p className="text-on-surface-variant text-sm mb-8">
                  Enter a room code to bypass the lobby and join a secure
                  session directly.
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="ROOM_CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toLowerCase())}
                  className="w-full bg-surface-sunken text-primary font-mono font-bold text-center tracking-[0.5em] py-3 border-none focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant placeholder:tracking-[0.3em]"
                  maxLength={8}
                />
                <button
                  onClick={handleJoin}
                  disabled={!hasName || !roomCode.trim()}
                  className="w-full bg-secondary py-4 text-on-secondary font-headline font-bold uppercase tracking-widest neon-glow-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Establish Link
                </button>
              </div>
            </div>
          </section>

          {/* Status Bar */}
          <section className="bg-surface-low p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span className="text-[10px] font-bold text-on-surface-variant tracking-widest font-headline uppercase">
                Wait for the Ace. Be the first to slap. Fastest reflex wins.
              </span>
            </div>
            <span className="text-[10px] font-bold text-primary animate-pulse tracking-widest">
              SYSTEM_ONLINE
            </span>
          </section>
        </div>
      </main>
    </div>
  );
}
