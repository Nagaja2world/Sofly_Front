// src/components/profile/PastTripsCard.tsx
import React from 'react';
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';

export interface PastTrip {
  id: number;
  title: string;
  dest: string;
  date: string;
  rating: number;
}

export function PastTripsCard({ trips }: { trips: PastTrip[] }) {
  return (
    <Card
      title="여행 기록"
      hint="당신이 다녀온 곳들"
      action={<button style={linkBtn}>전체 →</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trips.length === 0 && (
          <div style={{ fontSize: 13, color: T.gray500, padding: 20, textAlign: 'center' }}>
            아직 여행 기록이 없어요
          </div>
        )}
        {trips.slice(0, 4).map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 4px', borderBottom: `1px dashed ${T.gray200}`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: T.primary }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</span>
              <span style={{ fontSize: 12, color: T.gray500, marginLeft: 8 }}>{p.dest}</span>
            </div>
            <div style={{ fontSize: 11, color: T.gray500 }}>{p.date}</div>
            <div style={{ fontSize: 11, color: T.primary }}>{'★'.repeat(p.rating)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  fontSize: 12, color: T.primaryHover, fontWeight: 600,
  cursor: 'pointer',
};
