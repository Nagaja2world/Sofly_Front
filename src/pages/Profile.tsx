// src/pages/ProfilePage.tsx
// 마이페이지 진입점.
// profileCompleted=false 면 /onboarding 으로 보냅니다.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import Header from '@/components/common/Header';
import useAuthStore from '@/store/useAuthStore';
import { getConquestStats, type ConquestStats } from '@/api/conquestApi';
import {
  SOFLY_P as T,
  ProfilePageBackground,
  ProfileHero,
  StatCard,
  CompletenessCard,
  UpcomingTripsCard,
  PastTripsCard,
  ThemeTagCloud,
  BudgetCard,
} from '../components/profile';

const MOCK_UPCOMING = [
  { id: 1, title: '교토 단풍 여행', dest: '교토, 일본',
    start: '2026.11.12', end: '2026.11.18', days: 7, members: 3, color: '#f0c2bf' },
  { id: 2, title: '발리 휴양', dest: '발리, 인도네시아',
    start: '2026.12.20', end: '2026.12.27', days: 8, members: 2, color: '#c6dccb' },
];
const MOCK_PAST = [
  { id: 11, title: '도쿄 봄마중',     dest: '도쿄, 일본',   date: '2024.03', rating: 5 },
  { id: 12, title: '오사카 미식 투어', dest: '오사카, 일본', date: '2024.10', rating: 5 },
  { id: 13, title: '파리 한 바퀴',    dest: '파리, 프랑스', date: '2023.06', rating: 4 },
  { id: 14, title: '뉴욕 도시여행',   dest: '뉴욕, 미국',   date: '2025.05', rating: 5 },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, fetchUserProfile } = useAuthStore();
  const { profile, loading, error } = useProfile();
  const [stats, setStats] = useState<ConquestStats | null>(null);

  // useAuthStore.user가 없으면 fetchUserProfile 호출 → Header 아바타 동기화
  useEffect(() => {
    if (!user) {
      fetchUserProfile().catch(() => {});
    }
  }, [user, fetchUserProfile]);

  // conquest stats API 호출
  useEffect(() => {
    getConquestStats().then(setStats).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <CenterMessage>불러오는 중...</CenterMessage>;
  if (error || !profile) return <CenterMessage>프로필을 불러오지 못했어요</CenterMessage>;


  return (
    <ProfilePageBackground>
      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: `1px solid #e5e7eb` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <Header variant="login" onLogout={handleLogout} />
        </div>
      </div>

      {/* HERO */}
      <section style={{ padding: '40px 60px 30px' }}>
        <ProfileHero user={profile} />
      </section>

      {/* STATS ROW */}
      <section style={{ padding: '0 60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard bg="#fef4cc" label="방문 국가"   big={stats?.visitedCountryCount ?? '-'} sub={`/ ${stats?.totalCountryCount ?? 195}`} icon="🌍" />
          <StatCard bg="#e3eef5" label="방문 도시"   big={stats?.visitedCityCount ?? '-'}    sub="곳"  icon="📍" />
          <StatCard bg="#e8f0e9" label="총 여행일"   big={stats?.totalTravelDays ?? '-'}     sub="일"  icon="🧳" />
          <StatCard bg="#fbe6e3" label="총 이동거리" big={stats ? Math.round(stats.totalDistanceKm / 1000) : '-'} sub="천km" icon="✈️" />
        </div>
      </section>

      {/* MAIN GRID */}
      <section style={{ padding: '0 60px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <CompletenessCard user={profile} />
          </div>
          <UpcomingTripsCard trips={MOCK_UPCOMING} />
          <PastTripsCard     trips={MOCK_PAST} />
          <ThemeTagCloud     selected={profile.preferThemes} />
          <BudgetCard
            budgetMin={profile.budgetMin}
            budgetMax={profile.budgetMax}
          />
        </div>
      </section>
    </ProfilePageBackground>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: T.background, color: T.gray700,
    }}>
      {children}
    </div>
  );
}
