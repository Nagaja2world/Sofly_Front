// src/pages/ProfileEditPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import {
  SOFLY_P as T,
  ProfilePageBackground,
  Card, Field, Segmented, SoflyButton,
  inputStyle,
  CompanionPicker,
  CityPicker,
  ThemeTagCloud,
  BudgetEditor,
} from '../components/profile';
import { AGE_GROUPS } from '../types/profile';
import type { UserProfile, UserProfilePatch } from '../types/profile';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { profile, loading, update } = useProfile();
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setDraft(profile); }, [profile]);

  if (loading || !draft) {
    return (
      <ProfilePageBackground>
        <div style={{ padding: 60 }}>불러오는 중...</div>
      </ProfilePageBackground>
    );
  }

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setDraft({ ...draft, [k]: v });

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch: UserProfilePatch = {
        nickname: draft.nickname,
        ageGroup: draft.ageGroup,
        city: draft.city,
        preferCompanionType: draft.preferCompanionType,
        budgetMin: draft.budgetMin,
        budgetMax: draft.budgetMax,
        preferThemes: draft.preferThemes,
        preferCities: draft.preferCities,
      };
      await update(patch);
      navigate('/profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageBackground>
      <section style={{ padding: '32px 60px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 14, color: T.gray600, cursor: 'pointer' }}
        >
          ← 마이페이지
        </button>
        <h1 style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>
          프로필 수정
        </h1>
        <div style={{ fontSize: 14, color: T.gray600 }}>여행 추천이 더 정확해져요</div>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* 기본 정보 */}
          <Card title="기본 정보">
            <Field label="닉네임">
              <input
                style={inputStyle}
                value={draft.nickname}
                onChange={(e) => set('nickname', e.target.value)}
              />
            </Field>
            <Field label="이메일" sub="(연동 계정)">
              <input
                style={{ ...inputStyle, background: T.gray100, color: T.gray500 }}
                value={draft.email}
                readOnly
              />
            </Field>
            <Field label="나이대">
              <Segmented
                value={draft.ageGroup}
                options={AGE_GROUPS}
                onChange={(v) => set('ageGroup', v)}
              />
            </Field>
            <Field label="거주 도시">
              <input
                style={inputStyle}
                value={draft.city ?? ''}
                placeholder="예: 서울"
                onChange={(e) => set('city', e.target.value || null)}
              />
            </Field>
          </Card>

          {/* 동행 유형 */}
          <Card title="누구와 떠나요?" hint="가장 자주 함께하는 분을 골라주세요">
            <CompanionPicker
              value={draft.preferCompanionType}
              onChange={(v) => set('preferCompanionType', v)}
            />
          </Card>

          {/* 테마 — 편집 모드 */}
          <ThemeTagCloud
            selected={draft.preferThemes}
            editable
            onChange={(next) => set('preferThemes', next)}
          />

          {/* 예산 */}
          <Card title="여행 1회당 예산">
            <BudgetEditor
              budgetMin={draft.budgetMin}
              budgetMax={draft.budgetMax}
              onChange={(lo, hi) => setDraft({ ...draft, budgetMin: lo, budgetMax: hi })}
            />
          </Card>

          {/* 도시 — full width */}
          <div style={{ gridColumn: 'span 2' }}>
            <Card title="가보고 싶은 도시" hint="자주 가는 도시 / 다음에 가고 싶은 도시 모두 OK">
              <CityPicker
                value={draft.preferCities}
                onChange={(next) => set('preferCities', next)}
              />
            </Card>
          </div>
        </div>

        {/* footer */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <SoflyButton onClick={() => navigate(-1)}>취소</SoflyButton>
          <SoflyButton primary onClick={handleSave}>
            {saving ? '저장 중...' : '저장하기'}
          </SoflyButton>
        </div>
      </section>
    </ProfilePageBackground>
  );
}
