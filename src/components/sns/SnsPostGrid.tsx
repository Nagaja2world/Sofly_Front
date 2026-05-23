import type { SnsPost } from "@/types/snsType";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SnsPostGridProps {
  /** 표시할 게시물 목록 */
  posts: SnsPost[];
  /** 게시물 클릭 시 호출 (상세 팝업 열기) */
  onPostClick?: (post: SnsPost, index: number) => void;
  /** 표시할 컬럼 수 (기본 3) */
  columns?: number;
  /** 그리드 사이 간격 (px, 기본 4 — 와이어프레임 기준 거의 붙여서) */
  gap?: number;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS 게시물 그리드 (인스타그램 그리드 스타일)
 *
 * - 정사각형 썸네일, 기본 3열 (와이어프레임 기준)
 * - 첫 미디어만 노출, 영상이면 우상단에 영상 아이콘 표시
 * - 미디어 2장 이상이면 우상단에 "여러 장" 아이콘
 * - hover 시 캡션 일부를 어두운 오버레이로 표시
 *
 * 데이터 없을 때는 안내 메시지 표시.
 */
export default function SnsPostGrid({
  posts,
  onPostClick,
  columns = 3,
  gap = 4,
}: SnsPostGridProps) {
  if (posts.length === 0) {
    return (
      <div
        className={[
          "flex flex-col items-center justify-center",
          "py-20 rounded-xl border-2 border-dashed border-gray-300",
          "bg-gray-100/50",
        ].join(" ")}
      >
        <p className="font-pretendard text-body2 text-gray-500 mb-1">
          아직 게시물이 없어요
        </p>
        <p className="font-pretendard text-body3 text-gray-400">
          워크스페이스 SNS 카드에서 업로드해보세요
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
      role="list"
    >
      {posts.map((post, index) => {
        const firstMedia = post.media[0];
        const hasMultiple = post.media.length > 1;
        const isVideo = firstMedia?.type === "video";

        return (
          <button
            key={post.id}
            type="button"
            role="listitem"
            onClick={() => onPostClick?.(post, index)}
            className={[
              "relative w-full aspect-square overflow-hidden",
              "bg-gray-200 border-none p-0 cursor-pointer",
              "group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            ].join(" ")}
            aria-label={`${post.author.username}의 게시물 보기`}
          >
            {/* ── 미디어 (정사각형 썸네일) ── */}
            {firstMedia ? (
              firstMedia.type === "image" ? (
                <img
                  src={firstMedia.url}
                  alt={post.caption ?? `${post.author.username}의 게시물`}
                  className={[
                    "w-full h-full object-cover",
                    "transition-transform duration-300",
                    "group-hover:scale-105",
                  ].join(" ")}
                  loading="lazy"
                />
              ) : (
                <video
                  src={firstMedia.url}
                  className={[
                    "w-full h-full object-cover bg-black",
                    "transition-transform duration-300",
                    "group-hover:scale-105",
                  ].join(" ")}
                  muted
                  playsInline
                  title={post.caption ?? post.author.username + "의 게시물"}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-body3">
                미디어 없음
              </div>
            )}

            {/* ── 우상단 인디케이터 (영상 / 여러 장) ── */}
            {(isVideo || hasMultiple) && (
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                {hasMultiple && (
                  <span
                    aria-label="여러 장"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white"
                  >
                    {/* "여러 장" 아이콘 - 카드가 겹쳐있는 형태 */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="8"
                        height="8"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M5 1.5h6.5A1.5 1.5 0 0 1 13 3v6.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
                {isVideo && (
                  <span
                    aria-label="영상"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M2.5 1.5v9l8-4.5-8-4.5z" />
                    </svg>
                  </span>
                )}
              </div>
            )}

            {/* ── 호버 오버레이 (캡션 일부) ── */}
            <div
              className={[
                "absolute inset-0 z-20",
                "bg-black/40 flex flex-col items-center justify-center gap-1 px-3",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "pointer-events-none",
              ].join(" ")}
            >
              {post.caption && (
                <p
                  className={[
                    "font-pretendard text-body4 text-white text-center m-0",
                    "line-clamp-2 leading-snug",
                  ].join(" ")}
                >
                  {post.caption}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
