import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { type MessagingMessage } from '@/api/messagingApi';
import ChatIcon from '@/assets/chat.svg?react';
import useAuthStore from '@/store/useAuthStore';

interface WorkspaceMember {
  userId: number;
  avatarUrl?: string;
}

interface WorkspaceChatPanelProps {
  messages: MessagingMessage[];
  isConnected: boolean;
  isLoading: boolean;
  members: WorkspaceMember[];
  onSend: (content: string) => void;
  onClose: () => void;
}

function formatTime(iso: string) {
  // 백엔드가 타임존 없이 UTC 시간을 반환하는 경우 Z를 붙여 UTC로 파싱
  const normalized = /Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(normalized);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  return `${ampm} ${h % 12 || 12}:${m}`;
}

function AvatarCircle({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.slice(0, 1);
  const colors = [
    'bg-blue-400', 'bg-purple-400', 'bg-green-400',
    'bg-orange-400', 'bg-pink-400', 'bg-teal-400',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-medium flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </div>
  );
}

export default function WorkspaceChatPanel({
  messages,
  isConnected,
  isLoading,
  members,
  onSend,
  onClose,
}: WorkspaceChatPanelProps) {
  const avatarMap = new Map(members.map((m) => [m.userId, m.avatarUrl]));
  // auth store에서 직접 읽어야 새로고침 직후 user가 null이어도
  // 프로필 로드 완료 시 즉시 re-render되어 isMe 판단이 바로잡힘.
  const { user, fetchUserProfile } = useAuthStore();
  const currentUserId = user?.id;

  useEffect(() => {
    if (!user) fetchUserProfile();
  }, []);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = messages.reduce<{ senderId: number; senderNickname: string; items: MessagingMessage[] }[]>(
    (acc, msg) => {
      const last = acc[acc.length - 1];
      if (last && last.senderId === msg.senderId) {
        last.items.push(msg);
      } else {
        acc.push({ senderId: msg.senderId, senderNickname: msg.senderNickname, items: [msg] });
      }
      return acc;
    },
    [],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ChatIcon width={16} height={16} className="text-gray-700" aria-hidden />
          <span className="font-pretendard text-body3 font-semibold text-gray-900">팀 채팅</span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`}
            title={isConnected ? '연결됨' : '연결 중...'}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="채팅 닫기"
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2 14 14M14 2 2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <ChatIcon width={32} height={32} className="text-gray-300" aria-hidden />
            <span className="font-pretendard text-body4">팀원들과 대화를 시작하세요</span>
          </div>
        )}

        {grouped.map((group, gi) => {
          // Number() 캐스팅: API가 senderId를 string으로 내려줄 때도 올바르게 비교
          const isMe = !!currentUserId && Number(group.senderId) === Number(currentUserId);
          return (
            <div key={gi} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <div className="pt-0.5 flex-shrink-0">
                  {avatarMap.get(group.senderId) ? (
                    <img
                      src={avatarMap.get(group.senderId)}
                      alt={group.senderNickname}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarCircle name={group.senderNickname} />
                  )}
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="font-pretendard text-body5 text-gray-500 px-1">
                    {group.senderNickname}
                  </span>
                )}
                {group.items.map((msg, mi) => (
                  <div key={msg.id ?? `${gi}-${mi}`} className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={[
                        'px-3 py-2 rounded-2xl font-pretendard text-body4 leading-relaxed',
                        isMe
                          ? 'bg-primary text-gray-900 rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                      ].join(' ')}
                    >
                      {msg.content}
                    </div>
                    {mi === group.items.length - 1 && (
                      <span className="font-pretendard text-[10px] text-gray-400 flex-shrink-0">
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-3 py-2.5">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-gray-400 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder={isConnected ? '메시지 입력...' : '연결 중...'}
            disabled={!isConnected}
            rows={1}
            className={[
              'flex-1 resize-none bg-transparent font-pretendard text-body4 text-gray-900',
              'placeholder:text-gray-400 outline-none min-h-[20px] max-h-[80px]',
              'disabled:opacity-50',
            ].join(' ')}
            style={{ lineHeight: '1.5' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            aria-label="전송"
            className={[
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none',
              input.trim() && isConnected
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="font-pretendard text-[10px] text-gray-400 mt-1 px-1">Enter로 전송, Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  );
}
