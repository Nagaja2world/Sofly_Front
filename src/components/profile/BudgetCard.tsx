// src/components/profile/BudgetCard.tsx
// 조회용 — 슬라이더 트랙 + 최소/최대 금액 표시

import React from 'react';
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';
import { fmtKRW } from '../../utils/profile';

interface Props {
  budgetMin: number | null;
  budgetMax: number | null;
  max?: number;
  onClickEdit?: () => void;
}

export function BudgetCard({ budgetMin, budgetMax, max = 5_000_000, onClickEdit }: Props) {
  const lo = budgetMin ?? 0;
  const hi = budgetMax ?? max;
  const loPct = (lo / max) * 100;
  const hiPct = (hi / max) * 100;

  return (
    <Card
      title="선호 예산"
      hint="1회 여행당 사용하고픈 금액"
      action={onClickEdit ? <button style={linkBtn} onClick={onClickEdit}>조정 →</button> : undefined}
    >
      <div style={{ padding: '10px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.gray600, marginBottom: 6 }}>
          <span>최소</span><span>최대</span>
        </div>
        <div style={{ position: 'relative', height: 36 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 4, background: T.gray200, borderRadius: 99 }} />
          <div style={{
            position: 'absolute', left: `${loPct}%`, right: `${100 - hiPct}%`,
            top: 16, height: 4, borderRadius: 99,
            background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})`,
          }} />
          <div style={dot(loPct, T.primary)} />
          <div style={dot(hiPct, T.secondary)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gray500 }}>최소</div>
            <div style={mono}>{fmtKRW(budgetMin)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.gray500 }}>최대</div>
            <div style={mono}>{fmtKRW(budgetMax)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function dot(left: number, color: string): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${left}%`,
    top: 8,
    width: 20, height: 20, borderRadius: 99,
    background: 'white',
    border: `3px solid ${color}`,
    transform: 'translateX(-50%)',
  };
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  fontSize: 12, color: T.primaryHover, fontWeight: 600, cursor: 'pointer',
};

const mono: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700, fontSize: 22, color: T.gray900,
};
