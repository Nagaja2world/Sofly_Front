// src/components/profile/CityPicker.tsx
// 검색 + 자동완성 + 선택된 도시 칩

import { useState } from 'react';
import { SOFLY_P as T } from './tokens';
import { inputStyle } from './ui';
import { CITY_SUGGESTIONS } from '../../types/profile';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  maxResults?: number;
}

export function CityPicker({
  value, onChange,
  suggestions = CITY_SUGGESTIONS,
  maxResults = 6,
}: Props) {
  const [query, setQuery] = useState('');

  const add = (c: string) => {
    if (!value.includes(c)) onChange([...value, c]);
    setQuery('');
  };
  const remove = (c: string) => onChange(value.filter((x) => x !== c));

  const matches = query
    ? suggestions.filter((c) => c.includes(query)).slice(0, maxResults)
    : [];

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          style={inputStyle}
          placeholder="도시 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            marginTop: 4, background: T.white,
            border: `1px solid ${T.gray300}`, borderRadius: 10,
            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            zIndex: 10, maxHeight: 200, overflowY: 'auto',
          }}>
            {matches.map((c) => (
              <div
                key={c}
                onClick={() => add(c)}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.background)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                📍 {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {value.map((c) => (
          <span key={c} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 99,
            background: T.primarySoft, border: `1.5px solid ${T.primary}`,
            fontSize: 13, fontWeight: 600,
          }}>
            {c}
            <button
              type="button"
              onClick={() => remove(c)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.gray700, padding: 0, lineHeight: 1, fontSize: 14,
              }}
              aria-label={`${c} 제거`}
            >
              ×
            </button>
          </span>
        ))}
        {value.length === 0 && (
          <span style={{ fontSize: 13, color: T.gray500 }}>아직 추가된 도시가 없어요</span>
        )}
      </div>
    </div>
  );
}
