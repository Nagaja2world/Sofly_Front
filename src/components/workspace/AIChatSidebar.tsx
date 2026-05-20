import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import ChatPanel from "@/components/chatting/ChatPanel";

interface AIChatSidebarProps {
  isOpen: boolean;
  chatWidth: number;
  workspaceId: number;
  roomCount: number;
  onResizeStart: (e: React.MouseEvent) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onScheduleSaved: () => void;
  onRoomCountChange: (count: number) => void;
}

export default function AIChatSidebar({
  isOpen,
  workspaceId,
  roomCount,
  onResizeStart,
  onCollapse,
  onExpand,
  onScheduleSaved,
  onRoomCountChange,
}: AIChatSidebarProps) {
  if (isOpen) {
    return (
      <aside className="self-stretch">
        <div
          className={[
            "h-full min-h-full relative",
            "bg-white",
            "rounded-bl-xl",
            "border border-r-0 border-t-0 border-gray-300",
          ].join(" ")}
        >
          <div
            className="sticky top-[80px] overflow-hidden"
            style={{ height: "calc(100vh - 80px)" }}
          >
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
              onRoomCountChange={onRoomCountChange}
              className="!rounded-none !border-none h-full"
            />
          </div>
        </div>
      </aside>
    );
  }

  return (
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
            "relative",
          ].join(" ")}
        >
          <LayoutLeftIcon className="w-4 h-4 -scale-x-100" />
          {roomCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
              {roomCount > 99 ? "99+" : roomCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
