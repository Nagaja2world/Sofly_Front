import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useInvitationStore from "@/store/useInvitationStore";
import { acceptInvitation } from "@/api/invitationApi";

interface InvitationPanelProps {
  onClose: () => void;
}

function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "만료됨";
  if (days === 1) return "내일 만료";
  return `${days}일 후 만료`;
}

export default function InvitationPanel({ onClose }: InvitationPanelProps) {
  const { invitations, reject } = useInvitationStore();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  /* 외부 클릭 시 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleAccept = async (invitationId: number, workspaceId: number) => {
    setProcessingId(invitationId);
    try {
      await acceptInvitation(invitationId);
      useInvitationStore.setState((s) => ({
        invitations: s.invitations.filter((i) => i.invitationId !== invitationId),
      }));
      onClose();
      navigate(`/workspace/${workspaceId}`);
    } catch (err) {
      console.warn("[InvitationPanel] 수락 실패:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    setProcessingId(invitationId);
    try {
      await reject(invitationId);
    } catch (err) {
      console.warn("[InvitationPanel] 거절 실패:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      ref={panelRef}
      className={[
        "absolute right-0 top-full mt-2 z-50",
        "w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200",
        "flex flex-col overflow-hidden",
      ].join(" ")}
    >
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-pretendard text-body2 font-semibold text-gray-900 m-0">
          워크스페이스 초대
        </h3>
        {invitations.length > 0 && (
          <span className="font-pretendard text-body5 text-gray-500">
            {invitations.length}건 대기 중
          </span>
        )}
      </div>

      {/* 초대 목록 */}
      <div className="overflow-y-auto max-h-[400px]">
        {invitations.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-pretendard text-body3 text-gray-500 m-0">
              새로운 초대가 없어요
            </p>
          </div>
        ) : (
          <ul className="list-none p-0 m-0">
            {invitations.map((inv) => {
              const isProcessing = processingId === inv.invitationId;
              return (
                <li
                  key={inv.invitationId}
                  className="px-5 py-4 border-b border-gray-100 last:border-b-0 flex flex-col gap-3"
                >
                  {/* 초대 정보 */}
                  <div className="flex flex-col gap-1">
                    <p className="font-pretendard text-body3 text-gray-900 m-0">
                      <span className="font-semibold">{inv.inviterNickname}</span>
                      님이{" "}
                      <span className="font-semibold text-primary">
                        {inv.workspaceTitle}
                      </span>
                      {" "}워크스페이스에 초대했습니다.
                    </p>
                    <p className="font-pretendard text-body5 text-gray-400 m-0">
                      {inv.inviterEmail} · {formatRelative(inv.expiresAt)}
                    </p>
                  </div>

                  {/* 수락 / 거절 버튼 */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAccept(inv.invitationId, inv.workspaceId)}
                      className={[
                        "flex-1 py-2 rounded-lg font-pretendard text-body4 font-semibold",
                        "border-none transition-all",
                        isProcessing
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-primary text-gray-900 hover:brightness-95 cursor-pointer",
                      ].join(" ")}
                    >
                      {isProcessing ? "처리 중..." : "수락"}
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReject(inv.invitationId)}
                      className={[
                        "flex-1 py-2 rounded-lg font-pretendard text-body4 font-medium",
                        "border border-gray-300 bg-transparent transition-colors",
                        isProcessing
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-50 cursor-pointer",
                      ].join(" ")}
                    >
                      거절
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
