import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import type { WorkspaceVisibility } from "@/api/workspaceApi";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

export interface WorkspaceMember {
  /** memberId (API) */
  id: number;
  /** userId (API) */
  userId: number;
  /** 표시 이름 */
  name: string;
  /** 이메일 */
  email?: string;
  /** 프로필 이미지 URL (없으면 이니셜 표시) */
  avatarUrl?: string;
  /** 호스트 여부 */
  isHost?: boolean;
}

interface MemberSidebarProps {
  /** 워크스페이스 이름 */
  workspaceName: string;
  /** 멤버 목록 */
  members: WorkspaceMember[];
  /**
   * 워크스페이스 커버 이미지 URL (없으면 placeholder 표시).
   * 부모에서 resolveCoverImage(workspace.coverImageUrl, workspace.id) 등으로
   * 미리 해석된 절대 URL을 넘기는 것을 권장.
   */
  coverImageUrl?: string | null;
  /**
   * 여행 나라/도시 텍스트 (워크스페이스명 아래 작은 글씨로 표시).
   * 부모에서 destination 우선, 없으면 항공편 arrivalCity에서 도출해 넘김.
   * 빈 문자열이어도 onChangeCountry가 있으면 "도시/나라 입력" placeholder가 렌더됨.
   */
  country?: string;
  /** 사이드바 접기 버튼 클릭 콜백 */
  onCollapse?: () => void;
  /** 멤버 추가 버튼 클릭 콜백 */
  onAddMember?: () => void;
  /**
   * 워크스페이스 이름 변경 콜백 (인라인 편집 저장 시 호출).
   * 미지정이면 이름 편집 버튼이 렌더되지 않음.
   */
  onRenameWorkspace?: (newName: string) => void | Promise<void>;
  /**
   * 도시/나라 텍스트 변경 콜백 (인라인 편집 저장 시 호출).
   * 미지정이면 도시 편집 버튼이 렌더되지 않고, country가 비어 있으면 라인 자체가 사라짐.
   * 빈 문자열을 저장하는 것도 허용 (사용자가 일부러 지운 경우).
   */
  onChangeCountry?: (newCountry: string) => void | Promise<void>;
  /**
   * 커버 이미지 변경 콜백 (파일 선택 시 호출).
   * 미지정이면 커버 이미지 영역이 렌더되지 않음.
   */
  onChangeCoverImage?: (file: File) => void | Promise<void>;
  /** 현재 공개 범위 (미지정이면 섹션 렌더 안 함) */
  visibility?: WorkspaceVisibility;
  /** 공개 범위 변경 콜백 (OWNER에게만 prop 전달) */
  onVisibilityChange?: (v: WorkspaceVisibility) => void | Promise<void>;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/** 호스트 칩 (멤버명 옆 작은 표시) */
function HostBadge() {
  return (
    <span
      className={[
        "px-1.5 py-0.5 rounded",
        "bg-primary text-gray-900",
        "font-pretendard text-body5 font-medium",
        "shrink-0",
      ].join(" ")}
    >
      호스트
    </span>
  );
}

/** 이니셜 추출 (이름의 첫 글자) */
function getInitial(name: string): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

/** 단일 멤버 row */
function MemberRow({ member }: { member: WorkspaceMember }) {
  return (
    <li className="flex items-center gap-2.5 py-1">
      {/* 아바타 */}
      <div
        className={[
          "w-8 h-8 rounded-full overflow-hidden shrink-0",
          "bg-gray-200 flex items-center justify-center",
          "border border-gray-300",
        ].join(" ")}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-pretendard text-body4 font-semibold text-gray-700">
            {getInitial(member.name)}
          </span>
        )}
      </div>

      {/* 이름 + 호스트 칩 */}
      <div className="flex flex-col min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="font-pretendard text-body3 text-gray-900 truncate">
            {member.name}
          </span>
          {member.isHost && <HostBadge />}
        </span>
        {member.email && (
          <span className="font-pretendard text-body5 text-gray-400 truncate">
            {member.email}
          </span>
        )}
      </div>
    </li>
  );
}

/* ──────────────────────────────────────────
   커버 이미지 영역
   ──────────────────────────────────────────
   - 16:9 비율
   - 이미지가 있으면: 이미지 + hover 시 어두운 오버레이 + "이미지 변경" 텍스트
   - 이미지가 없으면: 점선 placeholder + 가운데 "+" 아이콘 + 안내 텍스트
   - 영역 전체가 하나의 큰 클릭 영역 → 파일 선택 다이얼로그 오픈
*/
function CoverImageBox({
  coverImageUrl,
  onChangeCoverImage,
}: {
  coverImageUrl?: string | null;
  onChangeCoverImage: (file: File) => void | Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /* 업로드 진행 상태 — 진행 중에는 클릭/키보드 입력을 막고 시각적 피드백 표시 */
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    /* 같은 파일을 다시 선택해도 onChange가 동작하도록 input value를 미리 reset.
       업로드 실패/성공 모두 동일하게 적용되어야 하므로 await 전에 처리. */
    e.target.value = "";
    if (!file) return;
    if (isUploading) return; /* 동시 업로드 방지 (이중 클릭 가드) */

    setIsUploading(true);
    try {
      await onChangeCoverImage(file);
    } catch (err) {
      console.warn("[MemberSidebar] 커버 이미지 업로드 실패:", err);
      /* 사용자에게 토스트를 띄우는 책임은 부모 핸들러에 있음.
         이 컴포넌트는 자체적으로 더 띄우지 않고 상태만 정리. */
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={isUploading ? -1 : 0}
      aria-disabled={isUploading}
      aria-busy={isUploading}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isUploading) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={
        isUploading
          ? "커버 이미지 업로드 중"
          : coverImageUrl
            ? "커버 이미지 변경"
            : "커버 이미지 추가"
      }
      className={[
        "group relative w-full aspect-[16/9] rounded-lg overflow-hidden",
        "transition-colors",
        isUploading ? "cursor-wait" : "cursor-pointer",
        coverImageUrl
          ? "border border-gray-300"
          : "border-2 border-dashed border-gray-300 bg-gray-100 hover:bg-gray-200 hover:border-gray-400",
      ].join(" ")}
    >
      {coverImageUrl ? (
        <>
          <img
            src={coverImageUrl}
            alt="워크스페이스 커버"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* hover 오버레이 (업로드 중이 아닐 때만) */}
          {!isUploading && (
            <div
              className={[
                "absolute inset-0",
                "bg-black/0 group-hover:bg-black/40",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100",
                "transition-all duration-150",
              ].join(" ")}
            >
              <span className="font-pretendard text-body4 font-medium text-white">
                이미지 변경
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500">
          <PlusIcon className="w-5 h-5" />
          <span className="font-pretendard text-body5">커버 이미지 추가</span>
        </div>
      )}

      {/* 업로드 중 오버레이: 영역 전체 어둡게 + 가운데 스피너 + "업로드 중..." */}
      {isUploading && (
        <div
          className={[
            "absolute inset-0 z-10",
            "bg-black/50",
            "flex flex-col items-center justify-center gap-2",
          ].join(" ")}
        >
          <span
            className={[
              "w-6 h-6 rounded-full",
              "border-2 border-white/30 border-t-white",
              "animate-spin",
            ].join(" ")}
            aria-hidden="true"
          />
          <span className="font-pretendard text-body5 font-medium text-white">
            업로드 중...
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}

/* ──────────────────────────────────────────
   인라인 편집 텍스트 (보기 / 인라인 편집 공용 컴포넌트)
   ──────────────────────────────────────────
   워크스페이스명과 도시/나라 둘 다 동일한 인터랙션을 가지므로 하나로 통합.

   동작:
   - 기본: 텍스트 + 우측에 edit2 아이콘 버튼
   - edit2 클릭 → 그 자리에 input 등장 (자동 포커스 + 전체 선택)
   - Enter / blur → 저장 (변경 없으면 그냥 닫힘)
   - Escape → 취소
   - allowEmpty가 true면 빈 값 저장도 허용 (도시명을 일부러 지우는 케이스)
   - allowEmpty가 false면 빈 값 저장 시 취소로 처리 (워크스페이스명은 비울 수 없음)

   prefix는 표시 시 텍스트 앞에 붙는 작은 요소 (예: 📍 이모지). 편집 시에는 사라짐.
*/
function InlineEditableText({
  value,
  onChange,
  placeholder,
  textClassName,
  containerClassName = "",
  iconSize = "w-3.5 h-3.5",
  maxLength = 50,
  allowEmpty = false,
  prefix,
  ariaLabel,
  as = "span",
}: {
  /** 현재 값 (빈 문자열 가능) */
  value: string;
  /** 변경 콜백 (미지정 시 편집 버튼 자체가 렌더되지 않음 → 읽기 전용) */
  onChange?: (newValue: string) => void | Promise<void>;
  /** 값이 빈 문자열일 때 표시할 placeholder (회색 텍스트) */
  placeholder?: string;
  /** 표시 텍스트(또는 input)에 적용할 클래스 (font/color/size) */
  textClassName: string;
  /** 행 컨테이너에 적용할 추가 클래스 */
  containerClassName?: string;
  /** edit2 아이콘 크기 */
  iconSize?: string;
  /** 최대 글자 수 */
  maxLength?: number;
  /** 빈 값 저장 허용 여부 */
  allowEmpty?: boolean;
  /** 값 앞에 표시할 요소 (예: "📍 " 이모지). 편집 모드에서는 숨김. */
  prefix?: ReactNode;
  /** 접근성 라벨 ("워크스페이스 이름 편집" 등) */
  ariaLabel: string;
  /** 표시용 태그 (h3 / span 등). 기본 span */
  as?: "span" | "h3";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* 외부에서 값이 바뀌면 draft 동기화 (편집 중이 아닐 때만) */
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  /* 편집 진입 시 input 포커스 + 전체 선택 */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const enterEdit = () => {
    if (!onChange) return;
    setDraft(value);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const commitEdit = async () => {
    /* 이미 저장 진행 중이면 중복 호출 방지
       (예: Enter 직후 onBlur가 발생하거나 Enter를 빠르게 두 번 누른 경우) */
    if (isSaving) return;

    const trimmed = draft.trim();
    /* 변경사항이 없으면 그냥 닫기 */
    if (trimmed === value) {
      cancelEdit();
      return;
    }
    /* 빈 값 처리: allowEmpty=false면 취소, true면 저장 */
    if (!trimmed && !allowEmpty) {
      cancelEdit();
      return;
    }
    if (!onChange) {
      cancelEdit();
      return;
    }
    setIsSaving(true);
    try {
      await onChange(trimmed);
      setIsEditing(false);
    } catch (err) {
      console.warn("[MemberSidebar] 인라인 편집 저장 실패:", err);
      /* 실패해도 편집 모드 유지 (재시도 가능) */
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  /* ── 편집 모드 ── */
  if (isEditing) {
    return (
      <div
        className={["flex items-center min-w-0", containerClassName].join(" ")}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          maxLength={maxLength}
          placeholder={placeholder}
          className={[
            "flex-1 min-w-0",
            textClassName,
            "px-1.5 py-0.5 -mx-1.5 -my-0.5",
            "rounded border border-primary bg-white",
            "outline-none",
            isSaving ? "opacity-60" : "",
          ].join(" ")}
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  /* ── 보기 모드 ── */
  const Tag = as;
  const hasValue = value && value.trim().length > 0;
  const displayText = hasValue ? value : (placeholder ?? "");
  const isPlaceholder = !hasValue;

  return (
    <div
      className={["flex items-center gap-1 min-w-0", containerClassName].join(
        " ",
      )}
    >
      <Tag
        className={[
          "flex-1 min-w-0",
          textClassName,
          "m-0 truncate",
          isPlaceholder ? "text-gray-400 italic" : "",
        ].join(" ")}
        title={hasValue ? value : undefined}
      >
        {prefix}
        {displayText}
      </Tag>
      {onChange && (
        <button
          type="button"
          onClick={enterEdit}
          aria-label={ariaLabel}
          className={[
            "p-1 rounded shrink-0",
            "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
            "transition-colors cursor-pointer",
            "border-none bg-transparent",
            "inline-flex items-center justify-center",
          ].join(" ")}
        >
          <Edit2Icon className={iconSize} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지 좌측 멤버 사이드바
 *
 * 구조 (위→아래)
 *  - 상단 헤더: (사이드바 접기 아이콘 only, 오른쪽 정렬)
 *  - 커버 이미지 영역 (16:9, 클릭하면 파일 선택)
 *  - 워크스페이스명 행 (이름 + edit2 인라인 편집)
 *  - 여행 도시/나라 행 (📍 + 도시명 + edit2 인라인 편집, 빈 값이어도 편집 가능하면 placeholder 표시)
 *  - "함께하는 사람" 라벨
 *  - 멤버 목록 (아바타 + 이름 + (호스트 칩))
 *  - 하단: "Add Member" 아웃라인 버튼 (plus.svg)
 *
 * 편집 권한 분기는 부모에서 콜백 prop을 넘기지 않음으로 처리.
 * (예: 호스트만 편집 가능 → onRenameWorkspace={myRole === "HOST" ? handler : undefined})
 *
 * 폭은 부모에서 제어 (보통 200~240px). 단, 자체적으로 최소/최대 폭 가드.
 */
const VISIBILITY_OPTIONS: { value: WorkspaceVisibility; label: string; desc: string }[] = [
  { value: 'PUBLIC', label: '전체 공개', desc: '누구나 SNS에서 볼 수 있어요' },
  { value: 'FOLLOWERS_ONLY', label: '팔로워만', desc: '팔로워에게만 공개돼요' },
  { value: 'PRIVATE', label: '나만 보기', desc: '나만 볼 수 있어요' },
];

export default function MemberSidebar({
  workspaceName,
  members,
  coverImageUrl,
  country,
  onCollapse,
  onAddMember,
  onRenameWorkspace,
  onChangeCountry,
  onChangeCoverImage,
  visibility,
  onVisibilityChange,
  className = "",
}: MemberSidebarProps) {
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  const handleVisibilityChange = async (v: WorkspaceVisibility) => {
    if (!onVisibilityChange || visibilityLoading) return;
    setVisibilityLoading(true);
    try {
      await onVisibilityChange(v);
    } finally {
      setVisibilityLoading(false);
    }
  };
  return (
    <aside
      className={[
        "flex flex-col gap-4",
        "min-w-[180px] max-w-[260px]",
        "px-4 py-5",
        className,
      ].join(" ")}
      aria-label="워크스페이스 멤버"
    >
      {/* ── 상단 헤더: 접기 버튼만 (이름은 커버 이미지 아래로 이동) ── */}
      {onCollapse && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onCollapse}
            aria-label="사이드바 접기"
            className={[
              "p-1 rounded",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
              "transition-colors cursor-pointer",
              "border-none bg-transparent shrink-0",
              "inline-flex items-center justify-center",
            ].join(" ")}
          >
            <LayoutLeftIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 커버 이미지 영역 ── */}
      {onChangeCoverImage && (
        <CoverImageBox
          coverImageUrl={coverImageUrl}
          onChangeCoverImage={onChangeCoverImage}
        />
      )}

      {/* ── 워크스페이스명 + (인라인 편집) ── */}
      <InlineEditableText
        value={workspaceName}
        onChange={onRenameWorkspace}
        textClassName="font-pretendard text-body2 font-semibold text-gray-900"
        ariaLabel="워크스페이스 이름 편집"
        as="h3"
        maxLength={50}
      />

      {/* ── 여행 도시/나라 ──
          편집 가능(onChangeCountry 있음)하면 빈 값이어도 placeholder로 표시,
          편집 불가하고 country도 비어 있으면 라인 자체를 생략. */}
      {(onChangeCountry || (country && country.trim())) && (
        <div className="-mt-3">
          <InlineEditableText
            value={country ?? ""}
            onChange={onChangeCountry}
            placeholder="도시 또는 나라 입력"
            textClassName="font-pretendard text-body4 text-gray-500"
            ariaLabel="여행 도시 편집"
            iconSize="w-3 h-3"
            maxLength={40}
            allowEmpty
            prefix={<span className="mr-1">📍</span>}
          />
        </div>
      )}

      {/* ── 공개 범위 (OWNER에게만 보임) ── */}
      {onVisibilityChange && visibility !== undefined && (
        <div className="flex flex-col gap-2">
          <span className="font-pretendard text-body4 text-gray-600">공개 범위</span>
          <div className="flex flex-col gap-1">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={visibilityLoading}
                onClick={() => handleVisibilityChange(opt.value)}
                className={[
                  "flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer",
                  visibilityLoading ? "opacity-50 cursor-not-allowed" : "",
                  visibility === opt.value
                    ? "border-gray-700 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-400",
                ].join(" ")}
              >
                <span className={[
                  "font-pretendard text-body4 font-medium",
                  visibility === opt.value ? "text-gray-900" : "text-gray-600",
                ].join(" ")}>
                  {opt.label}
                </span>
                <span className="font-pretendard text-[10px] text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 함께하는 사람 라벨 ── */}
      <span className="font-pretendard text-body4 text-gray-600">
        함께하는 사람
      </span>

      {/* ── 멤버 목록 ── */}
      <ul className="list-none p-0 m-0 flex flex-col">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </ul>

      {/* ── 멤버 추가 버튼 ── */}
      <button
        type="button"
        onClick={onAddMember}
        className={[
          "inline-flex items-center justify-center gap-1.5",
          "px-3 py-2 rounded-lg",
          "bg-white border border-gray-300",
          "font-pretendard text-body4 font-medium text-gray-700",
          "hover:border-gray-700 active:border-gray-700",
          "transition-colors cursor-pointer",
          "self-start",
        ].join(" ")}
      >
        <PlusIcon className="w-4 h-4" />
        Add Member
      </button>
    </aside>
  );
}
