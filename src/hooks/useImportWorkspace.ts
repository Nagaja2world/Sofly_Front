import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { SnsPost } from "@/types/snsType";
import { importWorkspace } from "@/api/snsApi";

export function useImportWorkspace() {
  const navigate = useNavigate();
  const [pendingPost, setPendingPost] = useState<SnsPost | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const request = useCallback((post: SnsPost) => {
    if (!post.workspaceId) return;
    setPendingPost(post);
  }, []);

  const cancel = useCallback(() => {
    if (isImporting) return;
    setPendingPost(null);
  }, [isImporting]);

  const confirm = useCallback(async () => {
    if (!pendingPost?.workspaceId || isImporting) return;
    setIsImporting(true);
    try {
      const result = await importWorkspace(Number(pendingPost.workspaceId));
      setPendingPost(null);
      navigate(`/workspace/${result.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'LOGIN_REQUIRED') {
        alert('로그인이 필요합니다.');
      } else if (msg === 'NOT_FOUND') {
        alert('워크스페이스를 찾을 수 없어요. 삭제되었을 수 있습니다.');
      } else {
        alert('워크스페이스를 가져오지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsImporting(false);
    }
  }, [pendingPost, isImporting, navigate]);

  const descriptionText = pendingPost
    ? `${pendingPost.workspaceName ? `"${pendingPost.workspaceName}"의 ` : ''}여행 일정만 복제되어\n내 계정에 새로운 워크스페이스가 만들어져요.`
    : '';

  return {
    request,
    isConfirmOpen: pendingPost !== null,
    cancel,
    confirm,
    isImporting,
    descriptionText,
  };
}
