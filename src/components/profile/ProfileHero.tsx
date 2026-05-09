// src/components/profile/ProfileHero.tsx
// 상단 히어로 카드: 아바타 + 이름 + 칩 + 버튼

import { useNavigate } from 'react-router-dom';
import { SOFLY_P as T } from './tokens';
import { Chip, SoflyButton } from './ui';
import type { UserProfile } from '../../types/profile';
import { AGE_GROUPS, COMPANION_TYPES } from '../../types/profile';

interface Props {
  user: UserProfile;
  onLogout?: () => void;
}

export function ProfileHero({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const ageLabel = AGE_GROUPS.find((a) => a.v === user.ageGroup)?.label;
  const compLabel = COMPANION_TYPES.find((c) => c.v === user.preferCompanionType);

  return (
    <div style={{
      background: 'linear-gradient(180deg, #fef4cc 0%, #fcf9ef 100%)',
      borderRadius: 24,
      padding: '36px 40px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: 28,
      alignItems: 'center',
      border: `1px solid ${T.gray200}`,
      boxShadow: '0 4px 20px rgba(245,209,90,0.12)',
      position: 'relative',
    }}>
      {/* avatar */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 110, height: 110, borderRadius: 99, background: 'white',
          padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <img
            src={user.profileImageUrl}
            alt={user.nickname}
            style={{ width: '100%', height: '100%', borderRadius: 99 }}
          />
        </div>
        <div style={{
          position: 'absolute', bottom: 4, right: 4,
          width: 28, height: 28, borderRadius: 99, background: T.primary,
          display: 'grid', placeItems: 'center',
          border: `3px solid ${T.background}`,
          fontSize: 11,
        }}>✈️</div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: T.gray600, marginBottom: 4 }}>Welcome back,</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.6 }}>
          {user.nickname}{' '}
          <span style={{ fontSize: 18, color: T.gray500, fontWeight: 500 }}>님</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Chip>📧 {user.email}</Chip>
          {ageLabel && <Chip>🎂 {ageLabel}</Chip>}
          {user.city && <Chip>📍 {user.city}</Chip>}
          {compLabel && <Chip accent>{compLabel.emoji} {compLabel.label}와 함께</Chip>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
        <SoflyButton primary onClick={() => navigate('/mypage/edit')}>프로필 수정</SoflyButton>
        {onLogout && <SoflyButton onClick={onLogout}>로그아웃</SoflyButton>}
      </div>
    </div>
  );
}
