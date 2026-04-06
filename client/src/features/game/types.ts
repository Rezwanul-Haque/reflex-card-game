export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

// WebSocket message types from server
export interface WaitingMessage {
  type: 'waiting';
  room_id: string;
}

export interface GameStartMessage {
  type: 'game_start';
  opponent: string;
  player_number: number;
}

export interface CardFlipMessage {
  type: 'card_flip';
  card: Card;
  card_number: number;
}

export interface RoundResultMessage {
  type: 'round_result';
  winner: string;
  loser?: string;
  reason: 'ace_click' | 'early_click';
  scores: Record<string, number>;
  reaction_times?: Record<string, number>;
}

export interface GameOverMessage {
  type: 'game_over';
  winner: string;
  scores: Record<string, number>;
}

export interface PlayerLeftMessage {
  type: 'player_left';
  player: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ServerMessage =
  | WaitingMessage
  | GameStartMessage
  | CardFlipMessage
  | RoundResultMessage
  | GameOverMessage
  | PlayerLeftMessage
  | ErrorMessage;

export type GamePhase = 'home' | 'waiting' | 'playing' | 'round_end' | 'game_over';
