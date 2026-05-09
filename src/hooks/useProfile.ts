// src/hooks/useProfile.ts
// 가장 단순한 fetch 훅. react-query 쓰면 useQuery 로 교체.

import { useEffect, useState, useCallback } from 'react';
import { fetchMyProfile, updateMyProfile } from '../api/profile';
import type { UserProfile, UserProfilePatch } from '../types/profile';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchMyProfile());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const update = useCallback(async (patch: UserProfilePatch) => {
    const next = await updateMyProfile(patch);
    setProfile(next);
    return next;
  }, []);

  return { profile, loading, error, reload, update };
}
