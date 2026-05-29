import { useWorkspaceMessaging } from '@/hooks/useWorkspaceMessaging';
import WorkspaceChatPanel from './WorkspaceChatPanel';
import ChatIcon from '@/assets/chat.svg?react';

interface WorkspaceMember {
  userId: number;
  avatarUrl?: string;
}

interface WorkspaceChatSidebarProps {
  isOpen: boolean;
  workspaceId: number;
  memberUserIds: number[];
  members: WorkspaceMember[];
  onOpen: () => void;
  onClose: () => void;
}

export default function WorkspaceChatSidebar({
  isOpen,
  workspaceId,
  memberUserIds,
  members,
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
          <ChatIcon width={18} height={18} aria-hidden />
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
              members={members}
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
            <ChatIcon width={18} height={18} aria-hidden />
            <span className="font-pretendard text-body4 font-medium whitespace-nowrap">팀 채팅</span>
          </button>
        </div>
      )}
    </>
  );
}
