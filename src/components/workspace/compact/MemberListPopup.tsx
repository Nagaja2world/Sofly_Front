import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type WorkspaceMember } from "@/components/workspace/MemberSidebar";

/* ══════════════════════════════════════════
   MemberListPopup
   ══════════════════════════════════════════
   "함께하는 사람" 바(MemberBar)의 ⌄를 누르면 열리는 멤버 목록 팝업.

   구조 (이미지 3~7 기준):
   ┌────────────────────────────┐
   │ 함께하는 사람               │  ← 헤더
   ├────────────────────────────┤
   │ ⊙ 홍길동 👑                │  ┐
   │ ⊙ 이대파                   │  │ 멤버 리스트
   │ ⊙ 김감자                   │  │ (5명 초과 시 이 영역만 스크롤)
   │ ⊙ 박조랭                   │  │
   │ ⊙ 조파마                   │  ┘
   ├────────────────────────────┤
   │           확인              │  ← 푸터 버튼
   └────────────────────────────┘
   - 너비 280px (이미지의 280 Fill 기준), 좁은 화면이라 max-w로 가드
   - 호스트는 이름 옆 👑 아이콘
   - 아바타 없으면 회색 원 + 이니셜 (1단계에서 합의된 placeholder 방식)

   모달 동작은 ConfirmPopup 패턴을 그대로 차용:
   - createPortal로 document.body에 렌더 → 부모 overflow/z-index 영향 없음
   - ESC / 백드롭 클릭 / "확인" 버튼으로 닫힘
   - 열릴 때 body 스크롤 잠금
*/

interface MemberListPopupProps {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 (확인 / 백드롭 / ESC) */
  onClose: () => void;
  /** 멤버 목록 */
  members: WorkspaceMember[];
}

/** 이니셜 추출 — MemberSidebar / MemberBar와 동일 규칙 */
function getInitial(name: string): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

/** 호스트 표시용 왕관 아이콘 */
function CrownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M2 5.5l2.5 2L8 3l3.5 4.5 2.5-2-1 7H3l-1-7z"
        fill="#f5d15a"
        stroke="#d4b23e"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 멤버 한 줄: 아바타 + 이름 + (호스트면 왕관) */
function MemberRow({ member }: { member: WorkspaceMember }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div
        className={[
          "w-9 h-9 rounded-full overflow-hidden shrink-0",
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
          <span className="font-pretendard text-body3 font-semibold text-gray-700">
            {getInitial(member.name)}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="font-pretendard text-body2 text-gray-900 truncate">
          {member.name}
        </span>
        {member.isHost && <CrownIcon />}
      </span>
    </li>
  );
}

export default function MemberListPopup({
  isOpen,
  onClose,
  members,
}: MemberListPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* 리스트가 스크롤 가능하고 + 아직 맨 아래가 아닐 때만 하단 페이드 표시.
     "아래에 멤버가 더 있다"는 시각적 단서. */
  const [showBottomFade, setShowBottomFade] = useState(false);

  /* 스크롤 위치/콘텐츠 높이를 보고 페이드 표시 여부를 갱신 */
  const updateFade = () => {
    const el = listRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight;
    /* 끝에서 1px 여유 — 소수점 오차로 페이드가 안 사라지는 것 방지 */
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setShowBottomFade(scrollable && !atBottom);
  };

  /* 팝업이 열리거나 멤버가 바뀌면 페이드 상태 초기 계산.
     레이아웃이 잡힌 뒤 측정해야 하므로 다음 프레임에 실행. */
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(updateFade);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, members]);

  /* ESC로 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  /* 열릴 때 body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  /* 열릴 때 "확인" 버튼에 포커스 */
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("[data-confirm-btn]")
        ?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  /* 백드롭 클릭 시 닫기 (본체 클릭은 무시) */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={[
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/40 backdrop-blur-sm",
        "animate-[fadeIn_0.15s_ease-out]",
      ].join(" ")}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-popup-title"
        className={[
          "relative w-[280px] max-w-[90vw]",
          "bg-white rounded-xl overflow-hidden",
          "flex flex-col",
          "animate-[popupFadeIn_0.2s_ease-out]",
        ].join(" ")}
      >
        {/* ── 헤더 ── */}
        <div className="px-5 pt-5 pb-3">
          <h2
            id="member-popup-title"
            className="font-pretendard text-body1 font-semibold text-gray-900 m-0"
          >
            함께하는 사람
          </h2>
        </div>

        {/* ── 멤버 리스트 영역 ──
            6명 이상이면 리스트만 세로 스크롤. 스크롤 여지가 있으면
            하단에 은은한 흰색 페이드로 "더 있음" 단서 제공. */}
        <div className="relative">
          {/* max-h 288px = 멤버 5행(아바타36 + py-2.5 ×2 = 56px, ×5 = 280)
              + ul 자체 py-1(상하 4px = 8px). 이미지 3~5의 "5명 딱 맞음" 기준. */}
          <ul
            ref={listRef}
            onScroll={updateFade}
            className="list-none m-0 px-5 py-1 overflow-y-auto max-h-[288px]"
          >
            {members.length === 0 ? (
              <li className="py-6 text-center font-pretendard text-body3 text-gray-400">
                아직 함께하는 사람이 없어요
              </li>
            ) : (
              members.map((m) => <MemberRow key={m.id} member={m} />)
            )}
          </ul>

          {/* 하단 페이드 — 스크롤 가능 + 끝이 아닐 때만 보임.
              pointer-events-none으로 스크롤/클릭을 방해하지 않음. */}
          <div
            aria-hidden="true"
            className={[
              "pointer-events-none absolute left-0 right-0 bottom-0 h-8",
              "bg-gradient-to-t from-white to-transparent",
              "transition-opacity duration-150",
              showBottomFade ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        </div>

        {/* ── 푸터: 확인 버튼 ── */}
        <div className="border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            data-confirm-btn
            className={[
              "w-full px-5 py-3.5",
              "bg-transparent border-none cursor-pointer",
              "font-pretendard text-body2 font-semibold text-gray-900",
              "hover:bg-gray-100 transition-colors",
            ].join(" ")}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
