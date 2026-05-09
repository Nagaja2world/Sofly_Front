// src/api/profile.ts
import type { ApiResponse, UserProfile, UserProfilePatch } from '../types/profile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: authHeaders(),
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.message ?? 'API error');
  return json.data;
}

/** 내 프로필 조회 */
export function fetchMyProfile(): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me/profile');
}

/** 프로필 수정 (부분) */
export function updateMyProfile(patch: UserProfilePatch): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** 온보딩 완료 — PATCH /api/users/me/profile 로 저장 */
export function completeOnboarding(patch: UserProfilePatch): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
