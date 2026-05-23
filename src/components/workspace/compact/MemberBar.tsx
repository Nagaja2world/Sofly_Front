import { type WorkspaceMember } from "@/components/workspace/MemberSidebar";

/* ══════════════════════════════════════════
   MemberBar
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 "함께하는 사람" 바.
   헤더(NavBar) 바로 아래에 위치하는 가로 바.

   구조 (이미지 3 기준):
   ┌──────────────────────────────────────────────┐
   │ 함께하는 사람 5          [⊙⊙⊙⊙] ⌄            │
   └──────────────────────────────────────────────┘
   - 좌측: "함께하는 사람" 라벨 + 인원수
   - 우측: 겹친 아바타 그룹 (최대 4개 표시, 초과 시 +N) + 펼침 화살표 ⌄
   - 바 전체 또는 ⌄ 버튼을 누르면 멤버 팝업(MemberListPopup)이 열림

   데스크톱 MemberSidebar와의 차이:
   - MemberSidebar는 세로 aside에 멤버 목록을 항상 펼쳐 보여줌.
   - MemberBar는 가로 바 + 아바타 미리보기만, 전체 목록은 팝업으로 분리.
*/

interface MemberBarProps {
  /** 멤버 목록 */
  members: WorkspaceMember[];
  /** 바 클릭(또는 ⌄ 클릭) 시 호출 — 멤버 팝업 열기 */
  onOpen: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* 겹쳐 보여줄 아바타 최대 개수. 초과분은 "+N" 카운터로 처리. */
const MAX_VISIBLE_AVATARS = 4;

/** 이니셜 추출 (이름 첫 글자) — MemberSidebar와 동일 규칙 */
function getInitial(name: string): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

/** 단일 아바타 (이미지 있으면 사진, 없으면 회색 원 + 이니셜) */
function Avatar({
  member,
  zIndex,
}: {
  member: WorkspaceMember;
  zIndex: number;
}) {
  return (
    <div
      className={[
        "w-7 h-7 rounded-full overflow-hidden shrink-0",
        "bg-gray-200 flex items-center justify-center",
        "border-2 border-background",
        "-ml-2 first:ml-0",
      ].join(" ")}
      style={{ zIndex }}
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-pretendard text-body5 font-semibold text-gray-700">
          {getInitial(member.name)}
        </span>
      )}
    </div>
  );
}

/** "+N" 카운터 원 — 표시 한도를 넘는 멤버 수 */
function OverflowCount({ count, zIndex }: { count: number; zIndex: number }) {
  return (
    <div
      className={[
        "w-7 h-7 rounded-full shrink-0",
        "bg-gray-300 flex items-center justify-center",
        "border-2 border-background",
        "-ml-2",
      ].join(" ")}
      style={{ zIndex }}
    >
      <span className="font-pretendard text-body5 font-semibold text-gray-700">
        +{count}
      </span>
    </div>
  );
}

/** 펼침 화살표 (⌄) */
function ChevronDown() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4.5 6.75L9 11.25l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MemberBar({
  members,
  onOpen,
  className = "",
}: MemberBarProps) {
  /* 겹쳐 보일 아바타: 최대 MAX_VISIBLE_AVATARS개.
     단, 한 자리는 +N 카운터가 차지할 수 있으니 초과 시 한 칸을 양보. */
  const total = members.length;
  const overflow = total > MAX_VISIBLE_AVATARS;
  const visibleCount = overflow ? MAX_VISIBLE_AVATARS - 1 : total;
  const visible = members.slice(0, visibleCount);
  const remaining = total - visibleCount;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`함께하는 사람 ${total}명 보기`}
      className={[
        "flex items-center justify-between gap-3",
        "px-5 py-3 min-h-14",
        "bg-background border-b border-gray-300",
        "cursor-pointer select-none",
        "hover:bg-gray-100/60 transition-colors",
        className,
      ].join(" ")}
    >
      {/* 좌측: 라벨 + 인원수 */}
      <span className="flex items-baseline gap-1.5 min-w-0">
        <span className="font-pretendard text-body3 text-gray-700">
          함께하는 사람
        </span>
        <span className="font-pretendard text-body3 font-semibold text-gray-900">
          {total}
        </span>
      </span>

      {/* 우측: 아바타 그룹 + 화살표 */}
      <span className="flex items-center gap-2 shrink-0">
        {total > 0 && (
          <span className="flex items-center">
            {visible.map((m, i) => (
              <Avatar
                key={m.id}
                member={m}
                /* 앞쪽 아바타가 위로 오도록 z-index 역순 */
                zIndex={visible.length - i}
              />
            ))}
            {overflow && remaining > 0 && (
              <OverflowCount count={remaining} zIndex={0} />
            )}
          </span>
        )}
        <span className="text-gray-500">
          <ChevronDown />
        </span>
      </span>
    </div>
  );
}
