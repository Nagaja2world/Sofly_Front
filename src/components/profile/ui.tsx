// src/components/profile/ui.tsx
// 카드/칩/버튼/필드/세그먼트 등 작은 공용 UI 컴포넌트.

import React from 'react';
import { SOFLY_P as T } from './tokens';

/* ── Card ─────────────────────────────────────────── */
export function Card({
  title, hint, action, children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: T.white, borderRadius: 18, padding: 22,
      border: `1px solid ${T.gray200}`,
      boxShadow: '0 2px 8px rgba(43,43,43,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>{title}</div>
          {hint && <div style={{ fontSize: 12, color: T.gray500, marginTop: 2 }}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Chip ─────────────────────────────────────────── */
export function Chip({ accent, children }: { accent?: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 12px', borderRadius: 99,
      background: accent ? T.primarySoft : T.white,
      border: `1px solid ${accent ? T.primary : T.gray300}`,
      fontSize: 12, fontWeight: 500, color: T.gray800,
    }}>{children}</span>
  );
}

/* ── Button ───────────────────────────────────────── */
export function SoflyButton({
  primary = false, children, onClick, type = 'button',
}: {
  primary?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '11px 22px',
        fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        background: primary ? T.primary : T.white,
        color: primary ? T.gray900 : T.gray700,
        border: primary ? `1.5px solid ${T.primary}` : `1.5px solid ${T.gray300}`,
        borderRadius: 12,
        cursor: 'pointer',
        boxShadow: primary ? '0 2px 8px rgba(245,209,90,0.35)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── Field ────────────────────────────────────────── */
export function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.gray700, marginBottom: 6 }}>
        {label} {sub && <span style={{ color: T.gray500, fontWeight: 400 }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: T.white, border: `1.5px solid ${T.gray300}`,
  borderRadius: 12, fontSize: 14, color: T.gray900,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

/* ── Segmented ────────────────────────────────────── */
export function Segmented<V extends string>({
  value, options, onChange,
}: {
  value: V | null;
  options: { v: V; label: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', padding: 4, background: T.gray200, borderRadius: 12 }}>
      {options.map((o) => {
        const sel = value === o.v;
        return (
          <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{
            padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: sel ? T.white : 'transparent',
            color: sel ? T.gray900 : T.gray600,
            fontWeight: sel ? 700 : 500, fontSize: 13,
            boxShadow: sel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ── Section header for stepped form (onboarding) ── */
export function SectionStep({
  num, title, sub, children,
}: {
  num: string; title: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: T.white, borderRadius: 20, padding: '26px 28px',
      border: `1px solid ${T.gray200}`,
      boxShadow: '0 2px 8px rgba(43,43,43,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.primarySoft, color: T.primaryHover,
          display: 'grid', placeItems: 'center',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 14,
        }}>{num}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{title}</div>
          <div style={{ fontSize: 12, color: T.gray500 }}>{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
