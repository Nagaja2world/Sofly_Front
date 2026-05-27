import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import SnsPostGrid from "@/components/sns/SnsPostGrid";
import SnsPostDetailPopup from "@/components/sns/SnsPostDetailPopup";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import { useImportWorkspace } from "@/hooks/useImportWorkspace";
import type { SnsPost } from "@/types/snsType";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SnsPreviewSectionProps {
  /** 전체 게시물 목록 (이 중 앞쪽 일부만 미리보기로 표시) */
  posts: SnsPost[];
  /** 미리보기로 표시할 게시물 개수 (기본 6 = 3열 × 2행) */
  previewCount?: number;
  /** "더보기" 클릭 시 이동할 라우트 (기본 "/sns") */
  moreHref?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS 미리보기 섹션
 *
 * - 프로필 페이지의 워크스페이스 카드들 아래에 위치
 * - 전체 SNS 게시물 중 앞쪽 N개만 그리드로 표시
 * - 우상단에 "더보기" 버튼 (항상 노출) → `/sns` 라우트로 이동
 * - 미리보기에서 게시물 클릭 시 상세 팝업 (SNS 페이지와 동일 컴포넌트 재사용)
 * - "워크스페이스 가져오기" 흐름은 useImportWorkspace 훅으로 공통화
 *
 * 게시물이 0개일 때는 SnsPostGrid 자체에서 빈 상태 안내 처리.
 */
export default function SnsPreviewSection({
  posts,
  previewCount = 6,
  moreHref = "/sns",
}: SnsPreviewSectionProps) {
  const navigate = useNavigate();

  /** 좋아요 변경을 로컬에서 추적하기 위한 posts 복사본 */
  const [localPosts, setLocalPosts] = useState<SnsPost[]>(posts);
  useEffect(() => { setLocalPosts(posts); }, [posts]);

  const previewPosts = localPosts.slice(0, previewCount);

  const [selectedPost, setSelectedPost] = useState<SnsPost | null>(null);

  /** 워크스페이스 가져오기 — 공통 훅 */
  const importer = useImportWorkspace();

  const handlePostClick = (post: SnsPost) => {
    // 최신 로컬 상태(좋아요 반영)로 팝업 열기
    const latest = localPosts.find((p) => p.id === post.id) ?? post;
    setSelectedPost(latest);
  };

  const handleClosePopup = () => {
    setSelectedPost(null);
  };

  const handleLikeChange = (postId: string, liked: boolean, count: number) => {
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: liked, likeCount: count } : p))
    );
    setSelectedPost((prev) =>
      prev?.id === postId ? { ...prev, isLiked: liked, likeCount: count } : prev
    );
  };

  const handleSeeMore = () => {
    navigate(moreHref);
  };

  return (
    <section className="w-full" aria-labelledby="sns-preview-heading">
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center justify-between mb-6">
        <h2
          id="sns-preview-heading"
          className="font-pretendard text-title2 font-semibold text-gray-900 m-0"
        >
          SNS
        </h2>
        {/* 더보기 — 항상 노출 */}
        <Button btnType="text" onClick={handleSeeMore}>
          더보기
        </Button>
      </div>

      {/* ── 그리드 (미리보기) ── */}
      <SnsPostGrid posts={previewPosts} onPostClick={handlePostClick} />

      {/* ── 상세 팝업 ──
          key prop으로 게시물이 바뀔 때마다 컴포넌트를 새로 마운트시켜
          내부 state(mediaIndex, captionExpanded)가 자동 초기화되도록 함. */}
      <SnsPostDetailPopup
        key={selectedPost?.id ?? "closed"}
        post={selectedPost}
        onClose={handleClosePopup}
        onImportWorkspaceRequest={importer.request}
        onLikeChange={handleLikeChange}
      />

      {/* ── 워크스페이스 가져오기 확인 팝업 ── */}
      <ConfirmPopup
        isOpen={importer.isConfirmOpen}
        onClose={importer.cancel}
        onConfirm={importer.confirm}
        title="여행 일정을 가져올까요?"
        description={importer.descriptionText}
        confirmLabel={importer.isImporting ? "가져오는 중..." : "가져오기"}
        cancelLabel="취소"
        variant="primary"
      />
    </section>
  );
}
