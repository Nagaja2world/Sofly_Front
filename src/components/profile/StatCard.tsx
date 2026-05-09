// src/components/profile/StatCard.tsx
import { SOFLY_P as T } from './tokens';

export function StatCard({
  bg, label, big, sub, icon,
}: {
  bg: string;
  label: string;
  big: number | string;
  sub?: string;
  icon: string;
}) {
  return (
    <div style={{
      background: bg, borderRadius: 18, padding: 18,
      position: 'relative', overflow: 'hidden',
      border: '1px solid rgba(43,43,43,0.04)',
    }}>
      <div style={{ fontSize: 12, color: T.gray700, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <div style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 32, fontWeight: 800,
          color: T.gray900, letterSpacing: -1,
        }}>{big}</div>
        {sub && <div style={{ fontSize: 13, color: T.gray600 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 22, opacity: 0.7 }}>{icon}</div>
    </div>
  );
}
