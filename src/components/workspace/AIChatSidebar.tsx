import ChatPanel from "@/components/chatting/ChatPanel";

interface AIChatSidebarProps {
  isOpen: boolean;
  workspaceId: number;
  roomCount: number;
  onCollapse: () => void;
  onExpand: () => void;
  onScheduleSaved: () => void;
  onRoomCountChange: (count: number) => void;
}

export default function AIChatSidebar({
  isOpen,
  workspaceId,
  roomCount,
  onCollapse,
  onExpand,
  onScheduleSaved,
  onRoomCountChange,
}: AIChatSidebarProps) {
  return (
    <>
      {/* Floating button — shown when chat panel is closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="AI 채팅 열기"
          className={[
            "fixed z-50",
            "top-[92px] right-5",
            "px-3 h-10 rounded-full",
            "bg-white shadow-md border border-gray-200",
            "flex items-center gap-1.5",
            "text-gray-600 hover:text-gray-900 hover:shadow-lg",
            "transition-shadow cursor-pointer",
          ].join(" ")}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M18 10c0 4.418-3.582 8-8 8a8.07 8.07 0 0 1-2.5-.398L3 19l1.398-4.5A7.97 7.97 0 0 1 2 10c0-4.418 3.582-8 8-8s8 3.582 8 8Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-pretendard text-body4 font-medium whitespace-nowrap">AI 채팅</span>
          {roomCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-blue-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
              {roomCount > 99 ? "99+" : roomCount}
            </span>
          )}
        </button>
      )}

      {/* Overlay panel — Instagram DM style, slides in from right */}
      {isOpen && (
        <div
          className="fixed right-0 z-40 bg-white shadow-2xl border-l border-gray-200 flex flex-col chat-slide-in"
          style={{
            top: "80px",
            height: "calc(100vh - 80px)",
            width: "420px",
          }}
        >
          <ChatPanel
            workspaceId={workspaceId}
            onScheduleSaved={onScheduleSaved}
            onCollapse={onCollapse}
            onRoomCountChange={onRoomCountChange}
            className="!rounded-none !border-none h-full"
          />
        </div>
      )}
    </>
  );
}
