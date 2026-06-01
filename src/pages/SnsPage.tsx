import { useEffect, useRef, useState, useCallback } from "react";
import SnsSidebar from "@/components/sns/SnsSidebar";
import SnsPostGrid from "@/components/sns/SnsPostGrid";
import SnsPostDetailPopup from "@/components/sns/SnsPostDetailPopup";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import { useImportWorkspace } from "@/hooks/useImportWorkspace";
import { fetchFeed, searchWorkspaces, fetchTrendingDestinations, toSnsPost } from "@/api/snsApi";
import type { SnsPost, TrendingDestination } from "@/types/snsType";

export default function SnsPage() {
  const [posts, setPosts] = useState<SnsPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedPost, setSelectedPost] = useState<SnsPost | null>(null);
  const [trending, setTrending] = useState<TrendingDestination[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const importer = useImportWorkspace();

  const loadFeed = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const data = await fetchFeed(pageNum);
      const mapped = data.content.map(toSnsPost);
      setPosts((prev) => pageNum === 0 ? mapped : [...prev, ...mapped]);
      setHasMore(!data.last);
      setPage(pageNum);
    } catch {
      // 조용히 실패 — 빈 상태 유지
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(0);
  }, [loadFeed]);

  useEffect(() => {
    fetchTrendingDestinations()
      .then((data) =>
        setTrending(
          data.map((d) => ({ rank: d.rank, city: d.destination, country: d.countryCode })),
        ),
      )
      .catch(() => {});
  }, []);

  const handleSearch = useCallback((keyword: string) => {
    setFilterKeyword(keyword);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!keyword.trim()) {
      loadFeed(0);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchWorkspaces({ keyword });
        setPosts(data.content.map(toSnsPost));
        setHasMore(false);
      } catch {
        // 검색 실패 시 빈 결과 유지
      } finally {
        setIsLoading(false);
      }
    }, 400);
  }, [loadFeed]);

  const handleSelectTrending = (dest: TrendingDestination) => {
    handleSearch(dest.city);
  };

  // 스크롤 하단 감지 → 자동 페이지 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore && !filterKeyword) {
          loadFeed(page + 1);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, hasMore, filterKeyword, page, loadFeed]);

  const handleLikeChange = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, isLiked: liked, likeCount: count } : p),
    );
    if (selectedPost?.id === postId) {
      setSelectedPost((p) => p ? { ...p, isLiked: liked, likeCount: count } : p);
    }
  };

  return (
    <>
      <div className="md:hidden px-4 py-6">
        <p className="text-gray-500 text-center text-body3">모바일 화면은 준비 중입니다.</p>
      </div>

      <div className="hidden md:block bg-background min-h-[calc(100vh-80px)]">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
          <header className="mb-8">
            <h1 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">SNS</h1>
            <p className="font-pretendard text-body3 text-gray-600 mt-2 m-0">
              여행자들의 여행 기록을 둘러보고, 마음에 드는 일정은 가져와보세요.
            </p>
          </header>

          <div className="flex gap-10 items-start">
            <SnsSidebar
              trending={trending}
              onSearch={handleSearch}
              onSelectTrending={handleSelectTrending}
            />

            <main className="flex-1 min-w-0">
              {filterKeyword && (
                <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-300">
                  <p className="font-pretendard text-body3 text-gray-700 m-0">
                    <span className="font-semibold">"{filterKeyword}"</span>로 필터링 중 ({posts.length}개)
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFilterKeyword(""); loadFeed(0); }}
                    className="font-pretendard text-body3 text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer underline-offset-2 hover:underline"
                  >
                    해제
                  </button>
                </div>
              )}

              {isLoading && posts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <SnsPostGrid posts={posts} onPostClick={setSelectedPost} />

                  {/* 스크롤 무한 로딩 sentinel */}
                  <div ref={sentinelRef} className="h-1" />
                  {isLoading && posts.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && !filterKeyword && (
                    <p className="text-center font-pretendard text-body4 text-gray-400 mt-6">모든 게시물을 불러왔어요.</p>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      <SnsPostDetailPopup
        key={selectedPost?.id ?? "closed"}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onImportWorkspaceRequest={importer.request}
        onLikeChange={handleLikeChange}
      />

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
