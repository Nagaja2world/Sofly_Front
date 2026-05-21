import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { SnsPost } from "@/types/snsType";

/* ══════════════════════════════════════════
   워크스페이스 가져오기 훅
   ══════════════════════════════════════════ */

/**
 * SNS 게시물에서 "워크스페이스 가져오기" 버튼을 처리하는 공통 훅.
 *
 * 흐름:
 *   1. SnsPostDetailPopup이 onImportWorkspaceRequest(post) 호출
 *   2. 이 훅이 pendingPost 상태를 세팅 → ConfirmPopup이 열림
 *   3. 사용자가 확인 → importWorkspace API 호출 (TODO)
 *   4. 새 워크스페이스 id를 받아 `/workspace/<새 id>`로 navigate
 *   5. ConfirmPopup 닫고 pendingPost 초기화
 *
 * SnsPage / SnsPreviewSection 양쪽에서 동일한 동작이 필요하므로
 * 훅으로 분리해 둠.
 *
 * 사용 예:
 *   const importer = useImportWorkspace();
 *
 *   <SnsPostDetailPopup
 *     ...
 *     onImportWorkspaceRequest={importer.request}
 *   />
 *   <ConfirmPopup
 *     isOpen={importer.isConfirmOpen}
 *     onClose={importer.cancel}
 *     onConfirm={importer.confirm}
 *     title="이 워크스페이스의 여행 일정을 가져올까요?"
 *     description={importer.descriptionText}
 *     confirmLabel="가져오기"
 *     variant="primary"
 *   />
 */
export function useImportWorkspace() {
  const navigate = useNavigate();

  /** 확인 대기 중인 게시물. null이면 확인 팝업 닫힘 */
  const [pendingPost, setPendingPost] = useState<SnsPost | null>(null);
  /** 가져오기 진행 중 (중복 클릭 방지) */
  const [isImporting, setIsImporting] = useState(false);

  /** SnsPostDetailPopup에서 가져오기 버튼을 누를 때 호출 */
  const request = useCallback((post: SnsPost) => {
    if (!post.workspaceId) return;
    setPendingPost(post);
  }, []);

  /** 확인 팝업에서 취소 / 닫기 */
  const cancel = useCallback(() => {
    if (isImporting) return; /* 진행 중에는 닫지 못하도록 */
    setPendingPost(null);
  }, [isImporting]);

  /** 확인 팝업에서 확인 — 실제 복제 처리 */
  const confirm = useCallback(async () => {
    if (!pendingPost?.workspaceId || isImporting) return;

    setIsImporting(true);
    try {
      /* TODO: 백엔드 API 연동
       *
       * 예상 시그니처:
       *   POST /api/workspace/import
       *   body: { sourceWorkspaceId: string, includeSections: ["schedule"] }
       *   response: { id: string }   // 새 워크스페이스 id
       *
       * "여행 일정"만 가져오므로 includeSections에 "schedule"만 포함.
       * (멤버, 항공편, 여행 기록, 공유 앨범, SNS 카드는 가져오지 않음)
       */
      console.warn(
        "[useImportWorkspace] TODO: 실제 import API 호출 필요. 현재는 mock id로 이동만 처리합니다.",
        { sourceWorkspaceId: pendingPost.workspaceId },
      );

      /* 임시: API 응답 흉내내기 위한 mock id.
       * 실 구현에서는 위 TODO의 API 응답에서 받아옴. */
      const newWorkspaceId = `imported-${Date.now()}`;

      /* 새 워크스페이스로 이동 */
      navigate(`/workspace/${newWorkspaceId}`);

      /* 상태 정리 */
      setPendingPost(null);
    } catch (err) {
      console.error("워크스페이스 가져오기 실패:", err);
      alert("워크스페이스를 가져오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsImporting(false);
    }
  }, [pendingPost, isImporting, navigate]);

  /** ConfirmPopup의 description에 띄울 텍스트 (워크스페이스 이름 포함) */
  const descriptionText = pendingPost
    ? `${
        pendingPost.workspaceName ? `"${pendingPost.workspaceName}"의 ` : ""
      }여행 일정만 복제되어\n내 계정에 새로운 워크스페이스가 만들어져요.`
    : "";

  return {
    /** SnsPostDetailPopup에 넘길 요청 핸들러 */
    request,
    /** ConfirmPopup isOpen */
    isConfirmOpen: pendingPost !== null,
    /** ConfirmPopup onClose */
    cancel,
    /** ConfirmPopup onConfirm */
    confirm,
    /** 가져오기 처리 중 여부 (스피너/버튼 비활성화 용) */
    isImporting,
    /** ConfirmPopup description으로 전달할 텍스트 */
    descriptionText,
  };
}
