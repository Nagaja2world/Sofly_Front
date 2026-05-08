import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import PlusIcon from "@/assets/plus.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

export interface WorkspaceMember {
  /** 멤버 고유 id */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 프로필 이미지 URL (없으면 이니셜 표시) */
  avatarUrl?: string;
  /** 호스트 여부 (이름 옆 작은 칩 표시) */
  isHost?: boolean;
}

interface MemberSidebarProps {
  /** 워크스페이스 이름 */
  workspaceName: string;
  /** 멤버 목록 */
  members: WorkspaceMember[];
  /** 사이드바 접기 버튼 클릭 콜백 (워크스페이스명 우측 아이콘) */
  onCollapse?: () => void;
  /** 멤버 추가 버튼 클릭 콜백 */
  onAddMember?: () => void;
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
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="font-pretendard text-body3 text-gray-900 truncate">
          {member.name}
        </span>
        {member.isHost && <HostBadge />}
      </span>
    </li>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지 좌측 멤버 사이드바
 *
 * - 상단: 워크스페이스명 + 사이드바 접기 아이콘(layout-left.svg)
 * - "함께하는 사람" 라벨
 * - 멤버 목록 (아바타 + 이름 + (호스트 칩))
 * - 하단: "Add Member" 아웃라인 버튼 (plus.svg)
 *
 * 폭은 부모에서 제어 (보통 200~240px). 단, 자체적으로 최소/최대 폭 가드.
 */
export default function MemberSidebar({
  workspaceName,
  members,
  onCollapse,
  onAddMember,
  className = "",
}: MemberSidebarProps) {
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
      {/* ── 워크스페이스명 + 접기 ── */}
      <div className="flex items-center justify-between gap-2">
        <h3
          className={[
            "font-pretendard text-body2 font-semibold text-gray-900",
            "m-0 truncate",
          ].join(" ")}
          title={workspaceName}
        >
          {workspaceName}
        </h3>
        {onCollapse && (
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
        )}
      </div>

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
