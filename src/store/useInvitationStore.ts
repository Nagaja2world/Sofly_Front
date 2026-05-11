import { create } from 'zustand';
import { fetchInvitations, acceptInvitation, rejectInvitation, type Invitation } from '@/api/invitationApi';

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;

  load: () => Promise<void>;
  accept: (invitationId: number) => Promise<number>; // workspaceId 반환
  reject: (invitationId: number) => Promise<void>;
}

const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  isLoading: false,

  load: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    set({ isLoading: true });
    try {
      const data = await fetchInvitations();
      /* 만료되지 않은 PENDING만 표시 */
      const valid = data.filter(
        (inv) => inv.status === 'PENDING' && new Date(inv.expiresAt) > new Date(),
      );
      set({ invitations: valid });
    } catch {
      /* 비로그인 등 조용히 무시 */
    } finally {
      set({ isLoading: false });
    }
  },

  accept: async (invitationId: number) => {
    const member = await acceptInvitation(invitationId);
    set((s) => ({
      invitations: s.invitations.filter((i) => i.invitationId !== invitationId),
    }));
    /* 수락된 초대의 workspaceId 반환 (navigate 용) */
    const inv = get().invitations.find((i) => i.invitationId === invitationId);
    return inv?.workspaceId ?? member.memberId; // fallback
  },

  reject: async (invitationId: number) => {
    await rejectInvitation(invitationId);
    set((s) => ({
      invitations: s.invitations.filter((i) => i.invitationId !== invitationId),
    }));
  },
}));

export default useInvitationStore;
