// src/components/profile/BudgetEditor.tsx
// 편집/온보딩용 — 듀얼 슬라이더 + 프리셋

import React from 'react';
import { SOFLY_P as T } from './tokens';
import { DualRange } from './DualRange';
import { fmtKRW } from '../../utils/profile';

interface Props {
  budgetMin: number | null;
  budgetMax: number | null;
  onChange: (lo: number, hi: number) => void;
  max?: number;
  step?: number;
  presets?: { label: string; lo: number; hi: number }[];
}

const DEFAULT_PRESETS = [
  { label: '저예산', lo:  300_000, hi:    800_000 },
  { label: '중간',   lo:  800_000, hi:  2_500_000 },
  { label: '럭셔리', lo: 2_500_000, hi:  5_000_000 },
];

export function BudgetEditor({
  budgetMin, budgetMax, onChange,
  max = 5_000_000, step = 100_000,
  presets = DEFAULT_PRESETS,
}: Props) {
  const lo = budgetMin ?? 0;
  const hi = budgetMax ?? max;

  return (
    <div style={{ padding: '10px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, color: T.gray500 }}>최소</div>
          <div style={mono}>{budgetMin != null ? fmtKRW(budgetMin) : '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: T.gray500 }}>최대</div>
          <div style={mono}>{budgetMax != null ? fmtKRW(budgetMax) : '—'}</div>
        </div>
      </div>

      <DualRange
        min={0} max={max} step={step}
        valueMin={lo} valueMax={hi}
        onChange={onChange}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.gray500, marginTop: 4 }}>
        <span>0원</span>
        <span>{Math.round(max / 10000)}만원+</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.lo, p.hi)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 10,
              background: T.white, border: `1.5px solid ${T.gray300}`,
              fontSize: 12, color: T.gray700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const mono: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700, fontSize: 22,
};
