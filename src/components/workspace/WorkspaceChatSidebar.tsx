import { useWorkspaceMessaging } from '@/hooks/useWorkspaceMessaging';
import WorkspaceChatPanel from './WorkspaceChatPanel';

interface WorkspaceChatSidebarProps {
  isOpen: boolean;
  workspaceId: number;
  memberUserIds: number[];
  currentUserId: number | undefined;
  onOpen: () => void;
  onClose: () => void;
}

export default function WorkspaceChatSidebar({
  isOpen,
  workspaceId,
  memberUserIds,
  currentUserId,
  onOpen,
  onClose,
}: WorkspaceChatSidebarProps) {
  const { messages, isConnected, isLoading, sendMessage } = useWorkspaceMessaging(
    workspaceId,
    memberUserIds,
    isOpen,
  );

  return (
    <>
      {/* Floating toggle button — bottom-left */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="팀 채팅 열기"
          className={[
            'fixed z-50',
            'bottom-5 left-5',
            'px-3 h-10 rounded-full',
            'bg-white shadow-md border border-gray-200',
            'flex items-center gap-1.5',
            'text-gray-600 hover:text-gray-900 hover:shadow-lg',
            'transition-shadow cursor-pointer',
          ].join(' ')}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 6h8M4 9.5h6M2 10c0 4 3 6.5 7 7l2.5 1-1-2.5C13.5 14 16 11.5 16 9c0-4-3-6-6.5-6S2 6 2 10Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-pretendard text-body4 font-medium whitespace-nowrap">팀 채팅</span>
        </button>
      )}

      {/* Floating chat popup panel */}
      {isOpen && (
        <div
          className="fixed z-50 messaging-popup-in"
          style={{
            bottom: '80px',
            left: '20px',
            width: '360px',
            height: '480px',
          }}
        >
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <WorkspaceChatPanel
              messages={messages}
              isConnected={isConnected}
              isLoading={isLoading}
              currentUserId={currentUserId}
              onSend={sendMessage}
              onClose={onClose}
            />
          </div>
          {/* Open button below panel */}
          <button
            type="button"
            onClick={onClose}
            aria-label="팀 채팅 접기"
            className={[
              'mt-2',
              'px-3 h-10 rounded-full',
              'bg-white shadow-md border border-gray-200',
              'flex items-center gap-1.5',
              'text-gray-600 hover:text-gray-900 hover:shadow-lg',
              'transition-shadow cursor-pointer',
            ].join(' ')}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M4 6h8M4 9.5h6M2 10c0 4 3 6.5 7 7l2.5 1-1-2.5C13.5 14 16 11.5 16 9c0-4-3-6-6.5-6S2 6 2 10Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-pretendard text-body4 font-medium whitespace-nowrap">팀 채팅</span>
          </button>
        </div>
      )}
    </>
  );
}
