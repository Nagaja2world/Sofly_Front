// src/components/profile/DualRange.tsx

import React from 'react';
import { SOFLY_P as T } from './tokens';
import './shared.css';

interface Props {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
}

export function DualRange({ min, max, step, valueMin, valueMax, onChange }: Props) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div style={{ position: 'relative', height: 32 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 4, background: T.gray200, borderRadius: 99 }} />
      <div
        style={{
          position: 'absolute',
          left: `${pct(valueMin)}%`,
          right: `${100 - pct(valueMax)}%`,
          top: 14, height: 4,
          background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})`,
          borderRadius: 99,
        }}
      />
      <input
        type="range" className="sofly-range"
        min={min} max={max} step={step} value={valueMin}
        onChange={(e) => onChange(Math.min(+e.target.value, valueMax - step), valueMax)}
        style={rangeStyle}
      />
      <input
        type="range" className="sofly-range sofly-range--max"
        min={min} max={max} step={step} value={valueMax}
        onChange={(e) => onChange(valueMin, Math.max(+e.target.value, valueMin + step))}
        style={rangeStyle}
      />
    </div>
  );
}

const rangeStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: 32,
  appearance: 'none' as const,
  background: 'transparent',
  pointerEvents: 'none',
};
