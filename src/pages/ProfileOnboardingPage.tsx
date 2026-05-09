// src/pages/ProfileOnboardingPage.tsx
// profileCompleted=false 일 때 진입.
// 한 페이지짜리 폼: 스크롤하면서 5개 섹션 채우기 + 진행바.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { completeOnboarding } from '../api/profile';
import {
  SOFLY_P as T,
  ProfilePageBackground,
  Field, SectionStep, SoflyButton,
  inputStyle,
  CompanionPicker,
  BudgetEditor,
} from '../components/profile';
import {
  AGE_GROUPS,
  THEMES,
  CITY_SUGGESTIONS,
} from '../types/profile';
import type { UserProfile, ThemeKey, UserProfilePatch } from '../types/profile';
import { profileCompleteness } from '../utils/profile';

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
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

  const completeness = profileCompleteness(draft);

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setDraft({ ...draft, [k]: v });

  const toggleTheme = (v: ThemeKey) => {
    const has = draft.preferThemes.includes(v);
    set(
      'preferThemes',
      has ? draft.preferThemes.filter((x) => x !== v) : [...draft.preferThemes, v]
    );
  };
  const toggleCity = (c: string) => {
    const has = draft.preferCities.includes(c);
    set(
      'preferCities',
      has ? draft.preferCities.filter((x) => x !== c) : [...draft.preferCities, c]
    );
  };

  const handleComplete = async () => {
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
      await completeOnboarding(patch);
      navigate('/mypage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageBackground>
      {/* hero */}
      <section style={{ padding: '60px 60px 30px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.16em',
          color: T.primaryHover, marginBottom: 10,
        }}>WELCOME TO SOFLY</div>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -0.8 }}>
          {draft.nickname}님, 어떤 여행을 좋아하세요?
        </h1>
        <p style={{ fontSize: 15, color: T.gray600, marginTop: 8 }}>
          몇 가지만 알려주시면 더 잘 맞는 여행을 추천해드릴게요. 1분이면 끝나요 🌿
        </p>

        {/* progress */}
        <div style={{ maxWidth: 480, margin: '24px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.gray600, marginBottom: 6 }}>
            <span>진행 중</span>
            <span style={{ fontWeight: 700, color: T.primaryHover }}>{completeness}%</span>
          </div>
          <div style={{ height: 8, background: T.gray200, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${completeness}%`, height: '100%',
              background: `linear-gradient(90deg, ${T.primary}, #ffd966)`,
              borderRadius: 99, transition: 'width .3s',
            }} />
          </div>
        </div>
      </section>

      {/* form */}
      <section style={{ padding: '20px 60px 60px', display: 'grid', gap: 16 }}>
        <SectionStep num="01" title="기본 정보" sub="간단히 알려주세요">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="닉네임">
              <input
                style={inputStyle}
                value={draft.nickname}
                onChange={(e) => set('nickname', e.target.value)}
              />
            </Field>
            <Field label="거주 도시">
              <input
                style={inputStyle}
                placeholder="예: 서울"
                value={draft.city ?? ''}
                onChange={(e) => set('city', e.target.value || null)}
              />
            </Field>
          </div>
          <Field label="나이대">
            <div style={{ display: 'flex' }}>
              {/* Segmented imported */}
              <SegmentedInline
                value={draft.ageGroup}
                options={AGE_GROUPS}
                onChange={(v) => set('ageGroup', v)}
              />
            </div>
          </Field>
        </SectionStep>

        <SectionStep num="02" title="누구와 떠나요?" sub="가장 자주 함께하는 분">
          <CompanionPicker
            layout="row"
            value={draft.preferCompanionType}
            onChange={(v) => set('preferCompanionType', v)}
          />
        </SectionStep>

        <SectionStep num="03" title="여행 테마" sub="좋아하는 모든 걸 골라주세요">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {THEMES.map((th) => {
              const sel = draft.preferThemes.includes(th.v);
              return (
                <button
                  key={th.v}
                  type="button"
                  onClick={() => toggleTheme(th.v)}
                  style={{
                    padding: '10px 16px', borderRadius: 99,
                    background: sel ? T.primary : T.white,
                    border: `1.5px solid ${sel ? T.primary : T.gray300}`,
                    fontSize: 14, fontWeight: sel ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {th.emoji} {th.label}
                </button>
              );
            })}
          </div>
        </SectionStep>

        <SectionStep num="04" title="여행 1회당 예산" sub="대략적인 범위면 충분해요">
          <BudgetEditor
            budgetMin={draft.budgetMin}
            budgetMax={draft.budgetMax}
            onChange={(lo, hi) => setDraft({ ...draft, budgetMin: lo, budgetMax: hi })}
          />
        </SectionStep>

        <SectionStep num="05" title="가보고 싶은 도시" sub="다음 여행지를 위해 알려주세요">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CITY_SUGGESTIONS.slice(0, 12).map((c) => {
              const sel = draft.preferCities.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCity(c)}
                  style={{
                    padding: '8px 14px', borderRadius: 99,
                    background: sel ? T.secondarySoft : T.white,
                    border: `1.5px solid ${sel ? T.secondary : T.gray300}`,
                    fontSize: 13, fontWeight: sel ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  📍 {c}
                </button>
              );
            })}
          </div>
        </SectionStep>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <SoflyButton onClick={() => navigate('/mypage')}>나중에 하기</SoflyButton>
          <SoflyButton primary onClick={handleComplete}>
            {saving ? '저장 중...' : '완료하고 시작하기 →'}
          </SoflyButton>
        </div>
      </section>
    </ProfilePageBackground>
  );
}

/* 작은 인라인 Segmented — Field 안에서 width 자유롭게 */
function SegmentedInline<V extends string>({
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
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              padding: '8px 14px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: sel ? T.white : 'transparent',
              color: sel ? T.gray900 : T.gray600,
              fontWeight: sel ? 700 : 500, fontSize: 13,
              boxShadow: sel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
