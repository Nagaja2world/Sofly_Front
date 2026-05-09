// src/components/profile/CompanionPicker.tsx
import { SOFLY_P as T } from './tokens';
import { COMPANION_TYPES } from '../../types/profile';
import type { CompanionType } from '../../types/profile';

interface Props {
  value: CompanionType | null;
  onChange: (v: CompanionType) => void;
  layout?: 'grid' | 'row';
}

export function CompanionPicker({ value, onChange, layout = 'grid' }: Props) {
  const cols = layout === 'row' ? 'repeat(5, 1fr)' : '1fr 1fr';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: layout === 'row' ? 10 : 8 }}>
      {COMPANION_TYPES.map((c) => {
        const sel = value === c.v;
        return (
          <button
            key={c.v}
            type="button"
            onClick={() => onChange(c.v)}
            style={{
              padding: layout === 'row' ? '18px 8px' : '14px 12px',
              textAlign: layout === 'row' ? 'center' : 'left',
              background: sel ? T.primarySoft : T.white,
              border: `1.5px solid ${sel ? T.primary : T.gray300}`,
              borderRadius: 14,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: layout === 'row' ? 'column' : 'row',
              alignItems: 'center',
              gap: layout === 'row' ? 6 : 10,
              justifyContent: layout === 'row' ? 'center' : 'flex-start',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: layout === 'row' ? 28 : 22 }}>{c.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: T.gray900 }}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
