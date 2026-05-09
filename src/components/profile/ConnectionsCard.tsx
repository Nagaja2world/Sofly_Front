// src/components/profile/ConnectionsCard.tsx
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';

interface Connection {
  provider: 'google' | 'kakao' | 'apple';
  label: string;
  email: string | null;
  connected: boolean;
}

export function ConnectionsCard({ connections }: { connections: Connection[] }) {
  const meta = {
    google: { icon: 'G', iconBg: '#fff', iconColor: '#4285f4' },
    kakao:  { icon: 'K', iconBg: '#fee500', iconColor: '#191919' },
    apple:  { icon: '🍎', iconBg: '#000', iconColor: '#fff' },
  } as const;

  return (
    <Card title="계정 연동" hint="더 많은 서비스와 연결할 수 있어요">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {connections.map((c) => {
          const m = meta[c.provider];
          return (
            <div key={c.provider} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 10, borderRadius: 12,
              background: T.background, border: `1px solid ${T.gray200}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: m.iconBg, color: m.iconColor,
                display: 'grid', placeItems: 'center',
                fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: T.gray500 }}>{c.email ?? '—'}</div>
              </div>
              <button style={{
                padding: '5px 10px', fontSize: 11, fontWeight: 600,
                background: c.connected ? T.primarySoft : 'transparent',
                color: c.connected ? T.gray900 : T.gray700,
                border: `1px solid ${c.connected ? T.primary : T.gray300}`,
                borderRadius: 99, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>{c.connected ? '연결됨' : '연결'}</button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
