import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ChatPanel from "@/components/chatting/ChatPanel";

/* ══════════════════════════════════════════
   CompactAIChatModal
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 "AI 채팅" 전체화면 모달.

   설계 배경 (이전 논의에서 확정된 A안):
   - 데스크톱은 우측 resize 가능한 사이드바(AIChatSidebar)로 채팅을 띄우지만,
     모바일 폭에서는 사이드바가 부적합 → 전체화면 모달/오버레이로 띄움.
   - 라우트는 분리하지 않음(깊은 링크 불필요). 워크스페이스 페이지 위에 떠서
     닫으면 원래 스크롤 위치로 복귀 → 채팅 ↔ 일정 확인 왕복이 끊기지 않음.
   - CompactDayMapModal과 동일하게 createPortal 기반 전체화면 모달 패턴을 재사용
     (ESC 닫기, body 스크롤 잠금).

   내용물:
   - 기존 ChatPanel을 그대로 사용. ChatPanel은 workspaceId / onScheduleSaved /
     onCollapse / onRoomCountChange만 받는 자족적 컴포넌트라 모달 안에
     넣기만 하면 동작함. 채팅방·메시지는 서버 저장(chatApi)이라 새로고침해도
     대화 내용은 보존됨.
   - 헤더는 ChatPanel이 자체적으로 가지고 있고, onCollapse를 넘기면
     헤더에 "접기" 버튼이 생겨 그것으로도 닫을 수 있음.

   ── 뒤로가기(하드웨어/브라우저) 처리 ──
   모바일에서 모달이 열렸을 때 사용자가 뒤로가기를 누르면 워크스페이스를
   벗어나는 게 아니라 "모달만 닫히는" 것이 자연스러움. 이를 위해:
   - 모달이 열릴 때 history.pushState로 더미 엔트리를 하나 쌓음.
   - popstate(뒤로가기) 이벤트가 오면 onClose를 호출해 모달만 닫음.
   - 모달이 ✕/ESC/접기 등 다른 경로로 닫힐 때는, 우리가 쌓아둔 더미
     엔트리를 history.back()으로 되감아 히스토리가 한 칸 새는 것을 막음.
   - 닫힘 경로가 "뒤로가기에 의한 것"인지 "그 외"인지 ref로 구분.

   ── 새로고침 유지 ──
   "모달이 열려 있었다는 사실"은 CompactWorkspaceView가 sessionStorage에
   저장/복원함. 이 컴포넌트는 isOpen만 받아 표시 여부를 결정하므로,
   복원 로직 자체는 부모(CompactWorkspaceView)가 담당.
*/

interface CompactAIChatModalProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 (✕ / ESC / 뒤로가기 / 접기 공통) */
  onClose: () => void;
  /** 워크스페이스 ID — ChatPanel로 전달 */
  workspaceId: number;
  /** AI가 일정을 저장했을 때 콜백 (useSchedule 재로딩 등) */
  onScheduleSaved?: () => void;
  /** 채팅방 개수 변경 콜백 — FAB 뱃지 갱신용 */
  onRoomCountChange?: (count: number) => void;
}

/** 닫기(✕) 아이콘 — CompactDayMapModal과 동일 스타일 */
function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CompactAIChatModal({
  isOpen,
  onClose,
  workspaceId,
  onScheduleSaved,
  onRoomCountChange,
}: CompactAIChatModalProps) {
  /* 닫힘이 "뒤로가기(popstate)"에 의한 것인지 구분하는 플래그.
     - popstate로 닫힐 때: 브라우저가 이미 더미 엔트리를 꺼냈으므로
       추가로 history.back()을 호출하면 안 됨.
     - 그 외(✕/ESC/접기)로 닫힐 때: 우리가 쌓은 더미 엔트리가 그대로
       남아 있으므로 history.back()으로 되감아야 함. */
  const closedByPopRef = useRef(false);

  /* ── 뒤로가기 처리: 열릴 때 더미 엔트리 push, popstate에서 닫기 ── */
  useEffect(() => {
    if (!isOpen) return;

    closedByPopRef.current = false;

    /* 모달용 더미 히스토리 엔트리. state에 표식을 남겨두면
       다른 popstate와 구분할 수 있지만, 여기서는 모달이 열려 있는
       동안의 popstate는 곧 "모달 닫기"이므로 단순 처리. */
    window.history.pushState({ compactChatModal: true }, "");

    const onPopState = () => {
      /* 뒤로가기로 더미 엔트리가 빠짐 → 모달을 닫되,
         cleanup에서 history.back()을 또 호출하지 않도록 표식. */
      closedByPopRef.current = true;
      onClose();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      /* 모달이 ✕/ESC/접기 등 비-뒤로가기 경로로 닫힌 경우:
         우리가 쌓아둔 더미 엔트리가 아직 남아 있으므로 되감음. */
      if (!closedByPopRef.current) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  /* ── ESC로 닫기 ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* ── 열릴 때 body 스크롤 잠금 ── */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white modal-slide-up"
      role="dialog"
      aria-modal="true"
      aria-label="AI 채팅"
    >
      {/* ── 상단 바 ──
          ChatPanel도 자체 헤더("AI 채팅" + 새 채팅방 버튼)를 가지고 있지만,
          그 헤더의 접기 버튼은 데스크톱 사이드바용(-scale-x-100 아이콘)이라
          모바일 전체화면에는 어울리지 않음. 전체화면 모달임을 분명히 하는
          별도 상단 바를 두고 ✕로 닫게 함. ChatPanel에는 onCollapse를
          넘기지 않아 중복 닫기 버튼이 생기지 않도록 함. */}
      <header className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-gray-200 bg-white">
        <h2 className="flex-1 min-w-0 font-pretendard text-body1 font-semibold text-gray-900 m-0 truncate">
          AI 채팅
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={[
            "p-1.5 rounded-lg border-none bg-transparent shrink-0",
            "text-gray-500 hover:bg-gray-100 active:bg-gray-200",
            "cursor-pointer transition-colors",
          ].join(" ")}
        >
          <CloseIcon />
        </button>
      </header>

      {/* ── 채팅 본체 ──
          ChatPanel을 남은 영역 전체에 채움. ChatPanel은 h-full 기준으로
          내부를 flex 배치하므로 부모가 높이를 확정해줘야 함 → flex-1 min-h-0.
          모달이 이미 전체화면 테두리를 그리므로 ChatPanel의 자체
          rounded/border는 제거(!rounded-none !border-none). */}
      <div className="flex-1 min-h-0">
        <ChatPanel
          workspaceId={workspaceId}
          onScheduleSaved={onScheduleSaved}
          onRoomCountChange={onRoomCountChange}
          className="!rounded-none !border-none h-full"
        />
      </div>
    </div>,
    document.body,
  );
}
