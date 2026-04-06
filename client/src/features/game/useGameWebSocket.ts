import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Card,
  GamePhase,
  RoundResultMessage,
  ServerMessage,
} from './types';

interface GameState {
  phase: GamePhase;
  roomId: string | null;
  playerName: string | null;
  opponent: string | null;
  playerNumber: number | null;
  currentCard: Card | null;
  cardNumber: number;
  scores: Record<string, number>;
  roundResult: RoundResultMessage | null;
  winner: string | null;
  error: string | null;
  /** Per-player reaction history from server (keyed by player name) */
  reactionHistory: Record<string, number[]>;
}

const initialState: GameState = {
  phase: 'home',
  roomId: null,
  playerName: null,
  opponent: null,
  playerNumber: null,
  currentCard: null,
  cardNumber: 0,
  scores: {},
  roundResult: null,
  winner: null,
  error: null,
  reactionHistory: {},
};

export function useGameWebSocket() {
  const [state, setState] = useState<GameState>(initialState);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((roomId: string, playerName: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?room=${roomId}&name=${encodeURIComponent(playerName)}`;

    const socket = new WebSocket(url);
    wsRef.current = socket;

    setState((prev) => ({
      ...prev,
      roomId,
      playerName,
      phase: 'waiting',
      error: null,
    }));

    socket.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'waiting':
          setState((prev) => ({ ...prev, phase: 'waiting' }));
          break;

        case 'game_start':
          setState((prev) => ({
            ...prev,
            phase: 'playing',
            opponent: msg.opponent,
            playerNumber: msg.player_number,
            scores: { [prev.playerName!]: 0, [msg.opponent]: 0 },
            reactionHistory: {
              [prev.playerName!]: [],
              [msg.opponent]: [],
            },
          }));
          break;

        case 'card_flip':
          setState((prev) => ({
            ...prev,
            phase: 'playing',
            currentCard: msg.card,
            cardNumber: msg.card_number,
            roundResult: null,
          }));
          break;

        case 'round_result':
          setState((prev) => {
            // Append server-side reaction times to history
            const newHistory = { ...prev.reactionHistory };
            if (msg.reaction_times) {
              for (const [player, ms] of Object.entries(msg.reaction_times)) {
                newHistory[player] = [...(newHistory[player] || []), ms];
              }
            }
            return {
              ...prev,
              phase: 'round_end',
              roundResult: msg,
              scores: msg.scores,
              reactionHistory: newHistory,
            };
          });
          break;

        case 'game_over':
          setState((prev) => ({
            ...prev,
            phase: 'game_over',
            winner: msg.winner,
            scores: msg.scores,
          }));
          break;

        case 'player_left':
          setState((prev) => ({
            ...prev,
            phase: 'game_over',
            error: `${msg.player} disconnected`,
          }));
          break;

        case 'error':
          setState((prev) => ({ ...prev, error: msg.message }));
          break;
      }
    };

    socket.onclose = () => {
      wsRef.current = null;
    };

    socket.onerror = () => {
      setState((prev) => ({ ...prev, error: 'Connection lost' }));
    };
  }, []);

  const sendClick = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setState((prev) => {
        wsRef.current?.send(
          JSON.stringify({ type: 'click', card_number: prev.cardNumber })
        );
        return prev;
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(initialState);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { ...state, connect, sendClick, disconnect };
}
