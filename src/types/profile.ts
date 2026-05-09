// src/types/profile.ts
// API 응답에서 unwrap된 사용자 프로필 타입

export type AgeGroup = '10s' | '20s' | '30s' | '40s' | '50s';
export type CompanionType = 'ALONE' | 'PARTNER' | 'FRIENDS' | 'FAMILY' | 'COWORK';

export type ThemeKey =
  | 'nature' | 'food' | 'city' | 'culture'
  | 'activity' | 'healing' | 'shopping' | 'festival' | 'photo';

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string;
  ageGroup: AgeGroup | null;
  city: string | null;
  preferCompanionType: CompanionType | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferThemes: ThemeKey[];
  preferCities: string[];
  profileCompleted: boolean;
}

/* 편집/온보딩에서 PATCH 로 보낼 부분 필드 */
export type UserProfilePatch = Partial<
  Pick<
    UserProfile,
    'nickname' | 'ageGroup' | 'city' | 'preferCompanionType'
    | 'budgetMin' | 'budgetMax' | 'preferThemes' | 'preferCities'
  >
>;

/* API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* ─── 옵션 상수 ─────────────────────────────────────── */
export const AGE_GROUPS: { v: AgeGroup; label: string }[] = [
  { v: '10s', label: '10대' },
  { v: '20s', label: '20대' },
  { v: '30s', label: '30대' },
  { v: '40s', label: '40대' },
  { v: '50s', label: '50대 이상' },
];

export const COMPANION_TYPES: {
  v: CompanionType; label: string; emoji: string;
}[] = [
  { v: 'ALONE',   label: '혼자',     emoji: '🚶' },
  { v: 'PARTNER', label: '연인',     emoji: '💞' },
  { v: 'FRIENDS', label: '친구',     emoji: '👫' },
  { v: 'FAMILY',  label: '가족',     emoji: '👨‍👩‍👧' },
  { v: 'COWORK',  label: '회사 동료', emoji: '💼' },
];

export const THEMES: { v: ThemeKey; label: string; emoji: string }[] = [
  { v: 'nature',    label: '자연/풍경',   emoji: '🏞️' },
  { v: 'food',      label: '미식',        emoji: '🍜' },
  { v: 'city',      label: '도시 탐방',   emoji: '🏙️' },
  { v: 'culture',   label: '문화/역사',   emoji: '🏛️' },
  { v: 'activity',  label: '액티비티',    emoji: '🚣' },
  { v: 'healing',   label: '힐링/휴양',   emoji: '🌴' },
  { v: 'shopping',  label: '쇼핑',        emoji: '🛍️' },
  { v: 'festival',  label: '축제/이벤트', emoji: '🎉' },
  { v: 'photo',     label: '사진 명소',   emoji: '📸' },
];

export const CITY_SUGGESTIONS = [
  '도쿄', '오사카', '교토', '삿포로',
  '파리', '런던', '로마', '바르셀로나',
  '뉴욕', 'LA', '샌프란시스코',
  '방콕', '발리', '싱가포르', '타이베이',
  '시드니', '오클랜드', '두바이',
];
