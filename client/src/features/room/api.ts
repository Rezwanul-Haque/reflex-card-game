import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../infra/api-client';
import type {
  ActiveRoom,
  CreateRoomResponse,
  GetRoomResponse,
  LeaderboardEntry,
} from './types';

export function useCreateRoom() {
  return useMutation({
    mutationFn: () =>
      apiRequest<CreateRoomResponse>('/rooms', { method: 'POST' }),
  });
}

export function useGetRoom(roomId: string | null) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => apiRequest<GetRoomResponse>(`/rooms/${roomId}`),
    enabled: !!roomId,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiRequest<LeaderboardEntry[]>('/leaderboard'),
    refetchInterval: 10_000,
  });
}

export function useActiveRooms() {
  return useQuery({
    queryKey: ['activeRooms'],
    queryFn: () => apiRequest<ActiveRoom[]>('/rooms/active'),
    refetchInterval: 5_000,
  });
}
