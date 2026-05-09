// src/utils/profile.ts

import type { UserProfile } from '../types/profile';

/** 프로필 완성도 % (0-100, 7개 항목 기준) */
export function profileCompleteness(u: Pick<
  UserProfile,
  'nickname' | 'ageGroup' | 'city' | 'preferCompanionType'
  | 'budgetMin' | 'budgetMax' | 'preferThemes' | 'preferCities'
>): number {
  const checks = [
    !!u.nickname,
    !!u.ageGroup,
    !!u.city,
    !!u.preferCompanionType,
    u.budgetMin != null && u.budgetMax != null,
    Array.isArray(u.preferThemes) && u.preferThemes.length > 0,
    Array.isArray(u.preferCities) && u.preferCities.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/** 한국 원화 포맷 ("80만원" / "1,000원") */
export function fmtKRW(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}
