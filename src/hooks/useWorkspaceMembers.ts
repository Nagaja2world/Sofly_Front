import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchWorkspaceMembers,
  inviteMember,
  leaveWorkspace,
  type WorkspaceMemberApi,
} from "@/api/workspaceApi";
import { type UserSearchResult } from "@/api/userApi";
import { fetchMessagingRooms, addRoomMembers } from "@/api/messagingApi";

export function useWorkspaceMembers(workspaceId: number, userId: number | undefined) {
  const navigate = useNavigate();
  const [apiMembers, setApiMembers] = useState<WorkspaceMemberApi[]>([]);

  const loadMembers = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setApiMembers(data);
    } catch (err) {
      console.warn("[useWorkspaceMembers] 멤버 로드 실패:", err);
    }
  }, [workspaceId]);

  const myMemberId = apiMembers.find((m) => m.userId === userId)?.memberId ?? null;
  const myRole = apiMembers.find((m) => m.userId === userId)?.role ?? null;

  const members = apiMembers.map((m) => ({
    id: m.memberId,
    userId: m.userId,
    name: m.nickname,
    email: m.userEmail,
    avatarUrl: m.profileImageUrl ?? undefined,
    isHost: m.role === "OWNER",
  }));

  /* ── 나가기 ── */
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveWorkspace = async () => {
    if (myMemberId === null) return;
    setIsLeaving(true);
    try {
      await leaveWorkspace(workspaceId, myMemberId);
      navigate("/");
    } catch (err) {
      console.warn("[useWorkspaceMembers] 나가기 실패:", err);
      setIsLeaving(false);
    }
  };

  /* ── 초대 ── */
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<UserSearchResult | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);

  const handleInviteSelect = (selectedUser: UserSearchResult) => {
    setShowInviteModal(false);
    setInviteTarget(selectedUser);
  };

  const handleInviteConfirm = async () => {
    if (!inviteTarget) return;
    setIsInviting(true);
    try {
      await inviteMember(workspaceId, inviteTarget.id);

      // 초대와 동시에 팀 채팅방 멤버에도 추가
      try {
        const allRooms = await fetchMessagingRooms();
        const wsRooms = allRooms
          .filter((r) => r.type === 'WORKSPACE' && Number(r.workspaceId) === Number(workspaceId))
          .sort((a, b) => a.roomId - b.roomId);
        if (wsRooms.length > 0) {
          await addRoomMembers(wsRooms[0].roomId, [inviteTarget.id]);
        }
      } catch {
        // 채팅방 추가 실패는 초대 자체에 영향을 주지 않도록 조용히 무시
      }

      setInviteToast(`${inviteTarget.nickname}님에게 초대 요청을 보냈습니다.`);
      setTimeout(() => setInviteToast(null), 3500);
    } catch (err) {
      console.warn("[useWorkspaceMembers] 초대 실패:", err);
      setInviteToast("초대 요청에 실패했습니다. 다시 시도해주세요.");
      setTimeout(() => setInviteToast(null), 3500);
    } finally {
      setIsInviting(false);
      setInviteTarget(null);
    }
  };

  return {
    apiMembers,
    members,
    myMemberId,
    myRole,
    loadMembers,
    showLeaveConfirm,
    setShowLeaveConfirm,
    isLeaving,
    handleLeaveWorkspace,
    showInviteModal,
    setShowInviteModal,
    inviteTarget,
    setInviteTarget,
    isInviting,
    inviteToast,
    handleInviteSelect,
    handleInviteConfirm,
  };
}
