// src/components/profile/ThemeTagCloud.tsx
// 조회 모드: 선택된 테마 강조 / 편집 모드: onChange 토글

import React from 'react';
import { SOFLY_P as T } from './tokens';
import { Card } from './ui';
import { THEMES } from '../../types/profile';
import type { ThemeKey } from '../../types/profile';

interface Props {
  selected: ThemeKey[];
  editable?: boolean;
  onChange?: (next: ThemeKey[]) => void;
  onClickEdit?: () => void;
}

export function ThemeTagCloud({ selected, editable, onChange, onClickEdit }: Props) {
  return (
    <Card
      title="여행 취향"
      hint="이런 여행을 좋아해요"
      action={!editable && onClickEdit ? (
        <button style={linkBtn} onClick={onClickEdit}>수정 →</button>
      ) : undefined}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {THEMES.map((th) => {
          const sel = selected.includes(th.v);
          const handleToggle = () => {
            if (!editable || !onChange) return;
            onChange(sel ? selected.filter((x) => x !== th.v) : [...selected, th.v]);
          };
          return (
            <button
              key={th.v}
              type="button"
              onClick={handleToggle}
              disabled={!editable}
              style={{
                padding: editable ? '9px 14px' : '8px 14px',
                borderRadius: 99,
                background: sel ? (editable ? T.primary : T.primarySoft) : T.white,
                border: `1.5px solid ${sel ? T.primary : T.gray300}`,
                color: sel ? T.gray900 : T.gray500,
                fontSize: 13,
                fontWeight: sel ? 700 : 500,
                cursor: editable ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              {th.emoji} {th.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  fontSize: 12, color: T.primaryHover, fontWeight: 600,
  cursor: 'pointer',
};
