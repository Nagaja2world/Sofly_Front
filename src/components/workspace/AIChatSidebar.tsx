import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import ChatPanel from "@/components/chatting/ChatPanel";

interface AIChatSidebarProps {
  isOpen: boolean;
  chatWidth: number;
  workspaceId: number;
  onResizeStart: (e: React.MouseEvent) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onScheduleSaved: () => void;
}

export default function AIChatSidebar({
  isOpen,
  // chatWidth,
  workspaceId,
  onResizeStart,
  onCollapse,
  onExpand,
  onScheduleSaved,
}: AIChatSidebarProps) {
  if (isOpen) {
    return (
      <aside className="self-stretch">
        {/* 외부 div: self-stretch 높이만큼 늘어나 테두리/배경 역할 */}
        <div
          className={[
            "h-full min-h-full relative",
            "bg-white",
            "rounded-bl-xl",
            "border border-r-0 border-t-0 border-gray-300",
          ].join(" ")}
        >
          {/* sticky 래퍼: 헤더(h-20=80px) 아래에 고정, 나머지 뷰포트 채움.
              pt-6: 가운데 main의 pt-6과 상단 라인 맞춤.
              footer가 보이면 aside 끝에 걸려 자동으로 올라감. */}
          <div
            className="sticky top-20 overflow-hidden pt-6"
            style={{ height: "calc(100vh - 80px)" }}
          >
            {/* 드래그 핸들 — 커서만 제공, 별도 선 없음 */}
            <div
              onMouseDown={onResizeStart}
              className="absolute left-0 top-0 bottom-0 z-10 w-2"
              style={{ cursor: "ew-resize" }}
              aria-hidden
            />
            <ChatPanel
              workspaceId={workspaceId}
              onScheduleSaved={onScheduleSaved}
              onCollapse={onCollapse}
              className="!rounded-none !border-none h-full"
            />
          </div>
        </div>
      </aside>
    );
  }

  return (
    /* 접힘 상태: 좌측 사이드바와 동일한 구조 */
    <aside className="self-stretch">
      <div
        className={[
          "h-full min-h-full",
          "bg-white",
          "rounded-bl-xl",
          "border border-r-0 border-t-0 border-gray-300",
          "flex flex-col items-center",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onExpand}
          aria-label="채팅 패널 펼치기"
          className={[
            "sticky top-4",
            "mt-4",
            "p-1.5 rounded",
            "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
            "transition-colors cursor-pointer",
            "border-none bg-transparent",
            "inline-flex items-center justify-center",
          ].join(" ")}
        >
          <LayoutLeftIcon className="w-4 h-4 -scale-x-100" />
        </button>
      </div>
    </aside>
  );
}
