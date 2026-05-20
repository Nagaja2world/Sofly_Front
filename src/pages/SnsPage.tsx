import { useMemo, useState } from "react";
import SnsSidebar from "@/components/sns/SnsSidebar";
import SnsPostGrid from "@/components/sns/SnsPostGrid";
import SnsPostDetailPopup from "@/components/sns/SnsPostDetailPopup";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import { useImportWorkspace } from "@/hooks/useImportWorkspace";
import type { SnsPost, TrendingDestination } from "@/types/snsType";

/* ══════════════════════════════════════════
   목업 데이터 (TODO: API 연결 시 제거)
   ══════════════════════════════════════════ */

const MOCK_TRENDING: TrendingDestination[] = [
  { rank: 1, city: "도쿄", country: "일본" },
  { rank: 2, city: "파리", country: "프랑스" },
  { rank: 3, city: "오사카", country: "일본" },
  { rank: 4, city: "방콕", country: "태국" },
  { rank: 5, city: "다낭", country: "베트남" },
  { rank: 6, city: "타이베이", country: "대만" },
  { rank: 7, city: "발리", country: "인도네시아" },
  { rank: 8, city: "싱가포르", country: "싱가포르" },
  { rank: 9, city: "로마", country: "이탈리아" },
  { rank: 10, city: "바르셀로나", country: "스페인" },
];

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

interface SnsPageProps {
  /** 표시할 게시물 목록 (옵션, 기본 빈 배열) */
  posts?: SnsPost[];
  /** 요즘 뜨는 여행지 (옵션, 기본 mock) */
  trending?: TrendingDestination[];
}

/**
 * SNS 페이지
 *
 * 와이어프레임 페이지 1 기준 레이아웃 (데스크톱):
 *  ┌──────────┬──────────────────────────────────────┐
 *  │ 검색     │  게시물                              │
 *  │ ──────   │  ┌──┐ ┌──┐ ┌──┐                      │
 *  │ 요즘     │  │  │ │  │ │  │  ← 3열 그리드        │
 *  │ 뜨는     │  └──┘ └──┘ └──┘                      │
 *  │ 여행지   │  ┌──┐ ┌──┐ ┌──┐                      │
 *  │ 1~10위   │  │  │ │  │ │  │                      │
 *  │          │  └──┘ └──┘ └──┘                      │
 *  └──────────┴──────────────────────────────────────┘
 *
 * - 좌측 사이드바: 220px 고정, sticky
 * - 우측 메인: 1fr, 게시물 그리드 (3열)
 * - 게시물 클릭 시 상세 팝업
 * - 상세 팝업의 "워크스페이스 가져오기" → ConfirmPopup → 새 워크스페이스로 이동
 *
 * Layout(Header 포함)에서 렌더되므로 자체 헤더 X.
 */
export default function SnsPage({
  posts = [],
  trending = MOCK_TRENDING,
}: SnsPageProps) {
  /** 선택된 게시물 (상세 팝업 열림 여부) */
  const [selectedPost, setSelectedPost] = useState<SnsPost | null>(null);
  /** 팔로우 상태 로컬 캐시
   *  TODO: API 연결 시 서버 상태로 대체. 지금은 클릭 즉시 UI 반영용. */
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  /** 검색어 / 트렌딩 선택 필터 (옵션 기능, 추후 확장 여지) */
  const [filterKeyword, setFilterKeyword] = useState("");

  /** 워크스페이스 가져오기 — 공통 훅으로 분리 */
  const importer = useImportWorkspace();

  /** 필터 적용된 게시물.
   *  현재는 작성자명/캡션에 키워드 포함 여부로 단순 필터링.
   *  TODO: 백엔드 검색 API로 교체. */
  const filteredPosts = useMemo(() => {
    if (!filterKeyword) return posts;
    const lower = filterKeyword.toLowerCase();
    return posts.filter(
      (p) =>
        p.author.username.toLowerCase().includes(lower) ||
        (p.caption?.toLowerCase().includes(lower) ?? false) ||
        (p.workspaceName?.toLowerCase().includes(lower) ?? false),
    );
  }, [posts, filterKeyword]);

  /* ══ 이벤트 핸들러 ══ */

  const handlePostClick = (post: SnsPost) => {
    setSelectedPost(post);
  };

  const handleClosePopup = () => {
    setSelectedPost(null);
  };

  const handleToggleFollow = (authorId: string) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (next.has(authorId)) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
    /* TODO: 백엔드 API 호출 */
  };

  const handleSearch = (keyword: string) => {
    setFilterKeyword(keyword);
  };

  const handleSelectTrending = (dest: TrendingDestination) => {
    setFilterKeyword(dest.city);
  };

  /* ══ 렌더 ══ */

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만)
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          ══════════════════════════════════════════ */}
      <div className="hidden md:block bg-background min-h-[calc(100vh-80px)]">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
          {/* 페이지 타이틀 */}
          <header className="mb-8">
            <h1 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
              SNS
            </h1>
            <p className="font-pretendard text-body3 text-gray-600 mt-2 m-0">
              여행자들의 여행 기록을 둘러보고, 마음에 드는 일정은 가져와보세요.
            </p>
          </header>

          {/* 사이드바 + 메인 그리드 */}
          <div className="flex gap-10 items-start">
            <SnsSidebar
              trending={trending}
              onSearch={handleSearch}
              onSelectTrending={handleSelectTrending}
            />

            <main className="flex-1 min-w-0">
              {/* 필터 활성화 시 안내 + 해제 */}
              {filterKeyword && (
                <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-300">
                  <p className="font-pretendard text-body3 text-gray-700 m-0">
                    <span className="font-semibold">"{filterKeyword}"</span>로
                    필터링 중 ({filteredPosts.length}개)
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterKeyword("")}
                    className={[
                      "font-pretendard text-body3 text-gray-600 hover:text-gray-900",
                      "bg-transparent border-none cursor-pointer",
                      "underline-offset-2 hover:underline",
                    ].join(" ")}
                  >
                    해제
                  </button>
                </div>
              )}

              <SnsPostGrid
                posts={filteredPosts}
                onPostClick={handlePostClick}
              />
            </main>
          </div>
        </div>
      </div>

      {/* ── 상세 팝업 ──
          key prop으로 게시물이 바뀔 때마다 컴포넌트를 새로 마운트시켜
          내부 state(mediaIndex, captionExpanded)가 자동 초기화되도록 함. */}
      <SnsPostDetailPopup
        key={selectedPost?.id ?? "closed"}
        post={selectedPost}
        onClose={handleClosePopup}
        onToggleFollow={handleToggleFollow}
        onImportWorkspaceRequest={importer.request}
        isFollowing={
          selectedPost ? followingIds.has(selectedPost.author.id) : false
        }
      />

      {/* ── 워크스페이스 가져오기 확인 팝업 ──
          상세 팝업 위에 z-index로 덮어쓰는 형태.
          ConfirmPopup은 z-50, SnsPostDetailPopup도 z-50이지만,
          ConfirmPopup이 나중에 portal에 append되므로 stacking context상 위에 옴. */}
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
    </>
  );
}
