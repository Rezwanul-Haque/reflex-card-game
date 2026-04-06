import { useState } from 'react';
import { useCreateRoom, useActiveRooms, useLeaderboard } from './api';

interface HomeProps {
  onJoin: (roomId: string, playerName: string) => void;
}

function timeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function HomePage({ onJoin }: HomeProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const createRoom = useCreateRoom();
  const { data: activeRooms } = useActiveRooms();
  const { data: leaderboard } = useLeaderboard();

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
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
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

      {/* Main Content — two-column: left actions, right sidebar */}
      <main className="flex-1 px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — Actions */}
          <div className="lg:col-span-8 space-y-6">
            {/* Callsign Input */}
            <section className="bg-surface-low p-6">
              <div className="flex items-center gap-3 mb-4">
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

          {/* Right Column — Active Rooms + Leaderboard */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Nodes */}
            <section className="bg-surface-low p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline text-sm font-bold tracking-tight uppercase flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H2v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-3z" />
                  </svg>
                  Active Nodes
                </h3>
                <span className="text-[10px] font-bold text-primary animate-pulse">
                  {activeRooms && activeRooms.length > 0
                    ? `${activeRooms.length} ONLINE`
                    : 'NONE'}
                </span>
              </div>

              {activeRooms && activeRooms.length > 0 ? (
                <div className="space-y-1">
                  {activeRooms.map((room) => (
                    <div
                      key={room.room_id}
                      className="bg-surface-mid p-3 flex items-center justify-between hover:bg-surface-high transition-colors cursor-pointer group"
                      onClick={() => {
                        if (hasName && room.status === 'waiting') {
                          onJoin(room.room_id, name.trim());
                        }
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-headline text-[10px] font-black italic">
                            #{room.room_id.slice(0, 6).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${room.status === 'waiting' ? 'text-primary' : 'text-secondary'}`}>
                            {room.status === 'waiting' ? 'OPEN' : 'IN_GAME'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface truncate mt-0.5">
                          {room.players.join(' vs ') || 'Waiting...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-on-surface-variant font-headline">
                          {room.players.length}/2
                        </span>
                        {room.status === 'waiting' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-outline-variant group-hover:text-primary transition-colors">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-outline-variant">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-mid p-6 text-center">
                  <p className="text-on-surface-variant text-xs font-headline uppercase tracking-widest">
                    No active sessions
                  </p>
                  <p className="text-outline text-[10px] mt-1">
                    Create an arena to start
                  </p>
                </div>
              )}
            </section>

            {/* Recent Engagements (Leaderboard) */}
            <section className="bg-surface-low p-5">
              <h3 className="font-headline text-sm font-bold tracking-tight uppercase flex items-center gap-2 mb-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-tertiary">
                  <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                </svg>
                Recent Engagements
              </h3>

              {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-1">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface-mid p-3 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {/* Winner indicator */}
                          <div className="w-1 h-4 bg-primary shrink-0" />
                          <span className="text-primary font-headline font-bold text-xs uppercase truncate">
                            {entry.winner}
                          </span>
                          <span className="text-[10px] text-outline-variant">
                            vs
                          </span>
                          <span className="text-secondary font-headline font-bold text-xs uppercase truncate">
                            {entry.loser}
                          </span>
                        </div>
                        <div className="text-[10px] text-outline uppercase tracking-widest mt-0.5 pl-2.5">
                          {entry.winner_score} – {entry.loser_score}
                        </div>
                      </div>
                      <span className="text-[10px] text-outline-variant shrink-0 mt-0.5">
                        {timeAgo(entry.played_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-mid p-6 text-center">
                  <p className="text-on-surface-variant text-xs font-headline uppercase tracking-widest">
                    No matches recorded
                  </p>
                  <p className="text-outline text-[10px] mt-1">
                    Complete a match to appear here
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
