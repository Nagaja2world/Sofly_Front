import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import type { SnsPost } from "@/types/snsType";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */
const CAPTION_MAX_LENGTH_BEFORE_TRUNCATION = 80;

interface SnsPostDetailPopupProps {
  /** 표시할 게시물. null이면 닫혀 있음 */
  post: SnsPost | null;
  /** 닫기 콜백 (× 버튼 / 백드롭 클릭 / ESC) */
  onClose: () => void;
  /**
   * "워크스페이스 가져오기" 버튼 클릭 시 호출.
   * - 상위에서 ConfirmPopup을 띄우고, 확인되면 실제 가져오기 API를 호출하는 책임을 짐.
   * - 가져오기는 다른 사용자의 워크스페이스에서 "여행 일정"만 복제해 새 워크스페이스를 만드는 동작.
   *
   * ⚠️ 두 모달이 동시에 떠야 하므로 상세 팝업은 닫지 않음.
   *    상세 팝업 위에 ConfirmPopup이 z-index로 덮어쓰는 형태.
   */
  onImportWorkspaceRequest?: (post: SnsPost) => void;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS 게시물 상세 팝업
 *
 * 와이어프레임 기준 레이아웃 (920×600px 정도, 모바일에서는 풀스크린):
 *
 *  ┌────────────────────────────────────────────┐
 *  │ ◯ id                                   ×  │  ← 헤더
 *  ├────────────────────────────────────────────┤
 *  │                                            │
 *  │  ‹      [   이미지 캐러셀   ]      ›       │  ← 본문
 *  │                                            │
 *  ├────────────────────────────────────────────┤
 *  │     [워크스페이스 보러가기] [가져오기]     │  ← 액션 바
 *  │ ─── 캡션 텍스트 ────────────── 더보기 ↕   │
 *  └────────────────────────────────────────────┘
 *
 * 키보드 단축키:
 * - ESC: 닫기
 * - ← →: 이전/다음 미디어
 *
 * createPortal로 document.body에 렌더 → 부모 overflow/z-index 영향 없음
 *
 * 라우팅 동작:
 * - "워크스페이스 보러가기" → `/workspace/:id/preview` (이 컴포넌트 안에서 직접 navigate)
 * - "워크스페이스 가져오기" → onImportWorkspaceRequest 호출.
 *   상위(SnsPage/SnsPreviewSection)에서 ConfirmPopup을 띄우고 확인 시 실제 복제 API 호출.
 */
export default function SnsPostDetailPopup({
  post,
  onClose,
  onImportWorkspaceRequest,
}: SnsPostDetailPopupProps) {
  const navigate = useNavigate();
  const [mediaIndex, setMediaIndex] = useState(0);
  /** 캡션 펼쳐졌는지 (와이어프레임의 "→ 캡션" 토글) */
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const isOpen = post !== null;

  /* ⚠️ 새 게시물 열릴 때 mediaIndex / captionExpanded 상태 리셋이 필요하지만
   *    useEffect로 setState를 호출하면 cascading render가 발생함.
   *    → 부모에서 <SnsPostDetailPopup key={post?.id ?? "closed"} ... /> 형태로
   *      key prop을 넘기면 게시물이 바뀔 때마다 컴포넌트가 새로 마운트되어
   *      state가 자동으로 초기값으로 시작됨. (React 공식 권장 패턴)
   *    참고: https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes */

  /* 안전 인덱스 — 미디어 배열 길이 변동 대비 */
  const mediaLength = post?.media.length ?? 0;
  const safeMediaIndex =
    mediaLength === 0 ? 0 : Math.min(mediaIndex, mediaLength - 1);

  const goPrev = useCallback(() => {
    if (mediaLength === 0) return;
    setMediaIndex((i) => (i <= 0 ? mediaLength - 1 : i - 1));
  }, [mediaLength]);

  const goNext = useCallback(() => {
    if (mediaLength === 0) return;
    setMediaIndex((i) => (i >= mediaLength - 1 ? 0 : i + 1));
  }, [mediaLength]);

  /* 키보드 단축키 */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, goPrev, goNext]);

  /* 페이지 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!post) return null;

  const currentMedia = post.media[safeMediaIndex];
  const hasMultipleMedia = mediaLength > 1;
  const hasWorkspace = !!post.workspaceId;

  /* 백드롭 클릭 시 닫기 (단, 팝업 본체 클릭은 무시) */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /** "워크스페이스 보러가기" → /workspace/:id/preview */
  const handleViewWorkspace = () => {
    if (post.workspaceId) {
      navigate(`/workspace/${post.workspaceId}/preview`);
      onClose();
    }
  };

  /** "워크스페이스 가져오기" → 상위에 요청 전달.
   *  상위는 ConfirmPopup을 띄우고 확인되면 실제 복제 처리. */
  const handleImportWorkspace = () => {
    onImportWorkspaceRequest?.(post);
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={[
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        "animate-[fadeIn_0.15s_ease-out]",
        "p-4",
      ].join(" ")}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sns-post-detail-title"
        className={[
          "relative bg-white rounded-xl overflow-hidden",
          "w-full max-w-[920px] max-h-[92vh]",
          "flex flex-col",
          "animate-[popupFadeIn_0.2s_ease-out]",
          "shadow-2xl",
        ].join(" ")}
      >
        {/* ══ 헤더 ══ */}
        <header
          className={[
            "shrink-0 flex items-center justify-between gap-3",
            "px-5 py-3 border-b border-gray-200",
          ].join(" ")}
        >
          {/* 좌측: 아바타 + 아이디 */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={[
                "w-10 h-10 rounded-full shrink-0",
                "bg-gray-200 overflow-hidden",
                "flex items-center justify-center",
              ].join(" ")}
            >
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="8" r="3.5" fill="#9A9A9A" />
                  <path
                    d="M4 19c0-3.5 3-6 7-6s7 2.5 7 6"
                    stroke="#9A9A9A"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <h2
              id="sns-post-detail-title"
              className="font-pretendard text-body1 font-semibold text-gray-900 m-0 truncate"
            >
              {post.author.username}
            </h2>
          </div>

          {/* 우측: 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className={[
              "shrink-0 inline-flex items-center justify-center",
              "w-9 h-9 rounded-full",
              "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              "bg-transparent border-none cursor-pointer transition-colors",
            ].join(" ")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 4L14 14M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* ══ 본문: 이미지 캐러셀 ══ */}
        <div className="relative w-full bg-black flex items-center justify-center min-h-0 flex-1">
          {currentMedia ? (
            currentMedia.type === "image" ? (
              <img
                src={currentMedia.url}
                alt={post.caption ?? `${post.author.username}의 게시물`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full"
                title={post.caption ?? post.author.username + "의 게시물"}
              />
            )
          ) : (
            <div className="text-gray-400 font-pretendard text-body2 p-12">
              미디어가 없습니다
            </div>
          )}

          {/* 좌우 화살표 (미디어 2개 이상일 때만) */}
          {hasMultipleMedia && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 미디어"
                className={[
                  "absolute left-3 top-1/2 -translate-y-1/2",
                  "w-10 h-10 rounded-full",
                  "bg-white/85 hover:bg-white text-gray-900",
                  "flex items-center justify-center",
                  "shadow-md border-none cursor-pointer",
                  "transition-colors",
                ].join(" ")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 3L5 8L10 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="다음 미디어"
                className={[
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "w-10 h-10 rounded-full",
                  "bg-white/85 hover:bg-white text-gray-900",
                  "flex items-center justify-center",
                  "shadow-md border-none cursor-pointer",
                  "transition-colors",
                ].join(" ")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 3L11 8L6 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* 인디케이터 점 */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {post.media.map((_, i) => (
                  <span
                    key={i}
                    className={[
                      "rounded-full transition-all",
                      i === safeMediaIndex
                        ? "w-2 h-2 bg-white"
                        : "w-1.5 h-1.5 bg-white/55",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ══ 액션 바 + 캡션 ══ */}
        <div
          className={[
            "shrink-0 flex flex-col gap-3",
            "px-5 py-4 border-t border-gray-200",
            "bg-white",
          ].join(" ")}
        >
          {/* 액션 바: 워크스페이스 버튼들 (워크스페이스 정보가 있을 때만) */}
          {hasWorkspace && (
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button btnType="outlined" onClick={handleViewWorkspace}>
                워크스페이스 보러가기
              </Button>
              <Button btnType="solid" onClick={handleImportWorkspace}>
                워크스페이스 가져오기
              </Button>
            </div>
          )}

          {/* 캡션 — "더보기" 토글 */}
          {post.caption && (
            <div className="w-full">
              <p
                className={[
                  "font-pretendard text-body2 text-gray-900 m-0",
                  "whitespace-pre-wrap break-words leading-relaxed",
                  captionExpanded ? "" : "line-clamp-3",
                ].join(" ")}
              >
                <span className="font-semibold mr-2">
                  {post.author.username}
                </span>
                {post.caption}
              </p>
              {/* 캡션이 길 가능성 — 항상 토글 노출하되, 충분히 짧으면 효과 없음 */}
              {post.caption.length > CAPTION_MAX_LENGTH_BEFORE_TRUNCATION && (
                <button
                  type="button"
                  onClick={() => setCaptionExpanded((v) => !v)}
                  className={[
                    "mt-1 font-pretendard text-body3 text-gray-500",
                    "hover:text-gray-700 underline-offset-2 hover:underline",
                    "bg-transparent border-none cursor-pointer p-0",
                  ].join(" ")}
                >
                  {captionExpanded ? "접기" : "더보기"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
