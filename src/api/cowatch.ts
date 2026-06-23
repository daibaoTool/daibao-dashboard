import { adminRequest } from '@/utils/request';
import type {
  AdminInfo,
  CoWatchUser,
  CoWatchRoom,
  ApiResponse,
} from '@/types';

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLoginApi(username: string, password: string): Promise<{
  accessToken: string;
  adminInfo: AdminInfo;
}> {
  const res = await adminRequest.post<ApiResponse<{ accessToken: string; adminInfo: AdminInfo }>>(
    '/auth/login',
    { username, password },
  );
  return res.data.data;
}

export async function adminLogoutApi(): Promise<void> {
  await adminRequest.post('/auth/logout');
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function getUsersApi(): Promise<CoWatchUser[]> {
  const res = await adminRequest.get<ApiResponse<{ users: CoWatchUser[] }>>('/cowatch/users');
  return res.data.data.users;
}

export async function setBanApi(userId: string, banned: boolean): Promise<void> {
  await adminRequest.post(`/cowatch/users/${userId}/ban`, { banned });
}

export async function grantPlanApi(userId: string, plan: string, expiresAt?: number): Promise<void> {
  await adminRequest.post(`/cowatch/users/${userId}/plans`, { plan, expiresAt });
}

export async function deleteUserApi(userId: string): Promise<void> {
  await adminRequest.delete(`/cowatch/users/${userId}`);
}

// ─── Rooms ─────────────────────────────────────────────────────────────────────

export async function getRoomsApi(): Promise<CoWatchRoom[]> {
  const res = await adminRequest.get<ApiResponse<{ rooms: CoWatchRoom[] }>>('/cowatch/rooms');
  return res.data.data.rooms;
}

/**
 * 手动设置房间等级
 * @param roomId   目标房间 ID
 * @param planLevel 目标等级：'free' | 'vip:basic' | 'vip:pro'
 */
export async function setRoomPlanLevelApi(roomId: string, planLevel: string): Promise<void> {
  await adminRequest.post(`/cowatch/rooms/${roomId}/plan-level`, { planLevel });
}
