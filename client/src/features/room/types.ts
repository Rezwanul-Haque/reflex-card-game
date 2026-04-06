export interface CreateRoomResponse {
  room_id: string;
}

export interface GetRoomResponse {
  room_id: string;
  players: number;
  status: string;
}

export interface LeaderboardEntry {
  id: number;
  winner: string;
  loser: string;
  winner_score: number;
  loser_score: number;
  played_at: string;
}

export interface ActiveRoom {
  room_id: string;
  players: string[];
  status: string;
}
