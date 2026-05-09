// src/components/profile/ProfilePageBackground.tsx
// 페이지 배경 + 일러스트 데코레이션 (조회/편집/온보딩 공용)

import React from 'react';
import { SOFLY_P as T } from './tokens';
import heroSvg from '@/assets/profile_hero.svg';

interface Props {
  children: React.ReactNode;
}

export function ProfilePageBackground({ children }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${heroSvg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
      fontFamily: '"Pretendard", -apple-system, sans-serif',
      color: T.gray900,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}
