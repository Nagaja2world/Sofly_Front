// src/components/profile/CompletenessCard.tsx
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';
import { profileCompleteness } from '../../utils/profile';
import type { UserProfile } from '../../types/profile';

export function CompletenessCard({ user }: { user: UserProfile }) {
  const completeness = profileCompleteness(user);
  const items: [string, boolean][] = [
    ['기본 정보',  !!user.nickname],
    ['나이대',     !!user.ageGroup],
    ['거주 도시',  !!user.city],
    ['동행 유형',  !!user.preferCompanionType],
    ['예산 범위',  user.budgetMin != null && user.budgetMax != null],
    ['여행 테마',  user.preferThemes.length > 0],
    ['관심 도시',  user.preferCities.length > 0],
  ];

  return (
    <Card title="프로필 완성도" hint="완성하면 더 잘 맞는 추천을 받을 수 있어요">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Gauge value={completeness} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.gray700, marginBottom: 8 }}>
            총 {items.length}개 항목 중 완료 {items.filter(([, d]) => d).length}개
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {items.map(([label, done]) => (
              <span key={label} style={{
                fontSize: 11, padding: '4px 9px', borderRadius: 99,
                background: done ? T.primarySoft : T.gray200,
                color: done ? T.gray800 : T.gray500,
                border: `1px solid ${done ? T.primary : T.gray300}`,
              }}>
                {done ? '✓' : '·'} {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96}>
        <circle cx={48} cy={48} r={r} fill="none" stroke={T.gray200} strokeWidth={9} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={T.primary} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', placeItems: 'center',
        fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 22,
      }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.gray500 }}>%</span>
      </div>
    </div>
  );
}
