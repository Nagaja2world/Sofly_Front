// src/components/profile/ProfilePageBackground.tsx
// 페이지 배경 + 일러스트 데코레이션 (조회/편집/온보딩 공용)

import React from 'react';
import { SOFLY_P as T } from './tokens';
import { PlaneIllo, ButterflyIllo, FlowersIllo, TreesIllo } from './illustrations';

interface Props {
  children: React.ReactNode;
  showIllustrations?: boolean;
}

export function ProfilePageBackground({ children, showIllustrations = true }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: T.background,
      fontFamily: '"Pretendard", -apple-system, sans-serif',
      color: T.gray900,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {showIllustrations && (
        <>
          <PlaneIllo size={160} style={illoStyle({ top: 80, left: -10 })} />
          <ButterflyIllo size={50} style={illoStyle({ top: 130, right: 80 })} />
          <FlowersIllo size={90} style={illoStyle({ top: 210, left: 30, opacity: 0.7 })} />
          <TreesIllo size={110} style={illoStyle({ top: 180, right: 20, opacity: 0.7 })} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

function illoStyle(p: {
  top?: number; left?: number; right?: number;
  bottom?: number; opacity?: number;
}): React.CSSProperties {
  return {
    position: 'absolute',
    top: p.top, left: p.left, right: p.right, bottom: p.bottom,
    opacity: p.opacity ?? 0.85,
    pointerEvents: 'none',
  };
}
