// src/components/profile/UpcomingTripsCard.tsx
import React from 'react';
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';

export interface UpcomingTrip {
  id: number;
  title: string;
  dest: string;
  start: string;
  end: string;
  days: number;
  members: number;
  color: string;
}

export function UpcomingTripsCard({ trips }: { trips: UpcomingTrip[] }) {
  return (
    <Card
      title="다가오는 여행"
      hint={`${trips.length}건의 여행이 기다려요`}
      action={<button style={linkBtn}>모두 보기 →</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trips.length === 0 && (
          <div style={{ fontSize: 13, color: T.gray500, padding: 20, textAlign: 'center' }}>
            예정된 여행이 없어요
          </div>
        )}
        {trips.map((t) => (
          <div key={t.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
            padding: 12, borderRadius: 14,
            background: T.background, border: `1px solid ${T.gray200}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: t.color, display: 'grid', placeItems: 'center', fontSize: 20,
            }}>✈️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: T.gray600, marginTop: 2 }}>
                {t.dest} · {t.start} ~ {t.end}
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.gray500 }}>
              {t.days}박 · 멤버 {t.members}
            </div>
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
