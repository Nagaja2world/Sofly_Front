import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import useAuthStore from "@/store/useAuthStore";
import type { SnsPost } from "@/types/snsType";
import {
  addLike, removeLike,
  fetchComments, postComment, deleteComment,
  followUser, unfollowUser,
  getSnsPost,
  type CommentResponse,
} from "@/api/snsApi";
import type { SnsMedia } from "@/types/snsType";
import UserPublicProfilePopup from "@/components/sns/UserPublicProfilePopup";

const CAPTION_MAX = 80;

interface SnsPostDetailPopupProps {
  post: SnsPost | null;
  onClose: () => void;
  onImportWorkspaceRequest?: (post: SnsPost) => void;
  onLikeChange?: (postId: string, liked: boolean, count: number) => void;
}

function timeAgo(iso: string) {
  const normalized = /Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z';
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function SnsPostDetailPopup({
  post,
  onClose,
  onImportWorkspaceRequest,
  onLikeChange,
}: SnsPostDetailPopupProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [mediaIndex, setMediaIndex] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [fullMedia, setFullMedia] = useState<SnsMedia[] | null>(null);

  // 팔로우
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 공개 프로필 팝업
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // 좋아요
  const [isLiked, setIsLiked] = useState<boolean | null>(post?.isLiked ?? null);
  const [likeCount, setLikeCount] = useState(post?.likeCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  // 댓글
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post?.commentCount ?? 0);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOpen = post !== null;
  const workspaceIdNum = post ? Number(post.workspaceId) : null;

  // 팝업이 열릴 때 전체 이미지 목록 로드 (피드 카드는 대표 이미지 1장만 갖고 있음)
  useEffect(() => {
    if (!workspaceIdNum) { setFullMedia(null); return; }
    setFullMedia(null);
    setMediaIndex(0);
    getSnsPost(workspaceIdNum)
      .then((snsPost) => {
        const media: SnsMedia[] = snsPost.images.map((img) => ({
          id: String(img.id),
          type: 'image' as const,
          url: img.url,
        }));
        setFullMedia(media);
      })
      .catch(() => { /* 실패 시 post.media 그대로 사용 */ });
  }, [workspaceIdNum]);

  const displayMedia = fullMedia ?? post?.media ?? [];
  const mediaLength = displayMedia.length;
  const safeIndex = mediaLength === 0 ? 0 : Math.min(mediaIndex, mediaLength - 1);
  const currentMedia = displayMedia[safeIndex];

  const goPrev = useCallback(() => {
    setMediaIndex((i) => (i <= 0 ? mediaLength - 1 : i - 1));
  }, [mediaLength]);

  const goNext = useCallback(() => {
    setMediaIndex((i) => (i >= mediaLength - 1 ? 0 : i + 1));
  }, [mediaLength]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, goPrev, goNext]);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [isOpen]);

  const loadComments = useCallback(async () => {
    if (!workspaceIdNum) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(workspaceIdNum);
      setComments(data.content);
      setLocalCommentCount(data.content.length);
    } catch {
      // 조용히 실패
    } finally {
      setCommentsLoading(false);
    }
  }, [workspaceIdNum]);

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((v) => !v);
  };

  const handleLike = async () => {
    if (!workspaceIdNum || likeLoading || !user) return;
    setLikeLoading(true);
    const prev = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prev;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    try {
      if (nextLiked) await addLike(workspaceIdNum);
      else await removeLike(workspaceIdNum);
      onLikeChange?.(post!.id, nextLiked, nextCount);
    } catch {
      setIsLiked(prev);
      setLikeCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    const content = commentInput.trim();
    if (!content || !workspaceIdNum || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await postComment(workspaceIdNum, content);
      setComments((prev) => [...prev, created]);
      setLocalCommentCount((c) => c + 1);
      setCommentInput('');
    } catch {
      // 실패 시 입력 유지
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollow = async () => {
    const authorIdNum = Number(post?.author.id);
    if (!authorIdNum || followLoading || !user) return;
    setFollowLoading(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) await followUser(authorIdNum);
      else await unfollowUser(authorIdNum);
    } catch {
      setIsFollowing(!next);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!workspaceIdNum) return;
    try {
      await deleteComment(workspaceIdNum, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setLocalCommentCount((c) => Math.max(0, c - 1));
    } catch {
      // 실패 조용히
    }
  };

  if (!post) return null;

  const hasMultiple = mediaLength > 1;
  const hasWorkspace = !!post.workspaceId;
  const isLoggedIn = !!user;

  const portal = createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out] p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-xl overflow-hidden w-full max-w-[920px] max-h-[92vh] flex flex-col animate-[popupFadeIn_0.2s_ease-out] shadow-2xl"
      >
        {/* 헤더 */}
        <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setProfileUserId(Number(post.author.id))}
              className="w-10 h-10 rounded-full shrink-0 bg-gray-200 overflow-hidden flex items-center justify-center cursor-pointer border-none p-0 hover:opacity-80 transition-opacity"
            >
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <circle cx="11" cy="8" r="3.5" fill="#9A9A9A" />
                  <path d="M4 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#9A9A9A" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setProfileUserId(Number(post.author.id))}
              className="font-pretendard text-body1 font-semibold text-gray-900 truncate cursor-pointer bg-transparent border-none p-0 hover:underline"
            >
              {post.author.username}
            </button>
            {isLoggedIn && user && String(user.id) !== post.author.id && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                className={[
                  "shrink-0 px-3 py-1 rounded-full text-body4 font-medium font-pretendard border transition-colors cursor-pointer",
                  followLoading ? "opacity-50" : "",
                  isFollowing
                    ? "border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
                    : "border-gray-900 text-gray-900 bg-white hover:bg-gray-100",
                ].join(" ")}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>
          <button
            type="button" onClick={onClose} aria-label="닫기"
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* 미디어 캐러셀 */}
        <div className="relative w-full bg-white flex items-center justify-center min-h-0 flex-1 max-h-[60vh] overflow-hidden">
          {currentMedia ? (
            currentMedia.type === 'image' ? (
              <img src={currentMedia.url} alt={post.caption ?? ''} className="max-w-full max-h-full object-contain" />
            ) : (
              <video src={currentMedia.url} controls className="max-w-full max-h-full" />
            )
          ) : (
            <div className="text-gray-400 font-pretendard text-body2 p-12">미디어가 없습니다</div>
          )}

          {hasMultiple && (
            <>
              <button type="button" onClick={goPrev} aria-label="이전" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-900 flex items-center justify-center shadow-md border-none cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" onClick={goNext} aria-label="다음" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-900 flex items-center justify-center shadow-md border-none cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {displayMedia.map((_, i) => (
                  <span key={i} className={`rounded-full transition-all ${i === safeIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/55'}`} aria-hidden />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 패널 */}
        <div className="shrink-0 flex flex-col border-t border-gray-200 bg-white max-h-[40vh] overflow-y-auto">
          {/* 좋아요/댓글 카운트 + 워크스페이스 버튼 */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              {/* 좋아요 */}
              <button
                type="button"
                onClick={handleLike}
                disabled={!isLoggedIn || likeLoading}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill={isLiked ? '#ef4444' : 'none'} aria-hidden>
                  <path d="M10 17s-7-4.35-7-9a4 4 0 0 1 7-2.646A4 4 0 0 1 17 8c0 4.65-7 9-7 9z"
                    stroke={isLiked ? '#ef4444' : '#6b7280'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-pretendard text-body4 text-gray-600">{likeCount}</span>
              </button>

              {/* 댓글 토글 */}
              <button
                type="button"
                onClick={handleToggleComments}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M15 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4l2 3 2-3h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-pretendard text-body4">{localCommentCount}</span>
              </button>
            </div>

            {hasWorkspace && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button btnType="outlined" onClick={() => { navigate(`/workspace/${post.workspaceId}`); onClose(); }}>
                  워크스페이스 보러가기
                </Button>
                <Button btnType="solid" onClick={() => onImportWorkspaceRequest?.(post)}>
                  워크스페이스 가져오기
                </Button>
              </div>
            )}
          </div>

          {/* SNS 본문 + 여행지 + 워크스페이스 제목 */}
          <div className="px-5 pb-3 flex flex-col gap-1.5">
            {/* 워크스페이스 제목 (인스타그램 스타일: 작성자 bold + 제목) */}
            {post.caption && (
              <div>
                <p className={`font-pretendard text-body2 text-gray-900 m-0 whitespace-pre-wrap break-words leading-relaxed ${captionExpanded ? '' : 'line-clamp-3'}`}>
                  <span className="font-semibold mr-2">{post.author.username}</span>
                  {post.caption}
                </p>
                {post.caption.length > CAPTION_MAX && (
                  <button type="button" onClick={() => setCaptionExpanded((v) => !v)}
                    className="mt-0.5 font-pretendard text-body3 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0">
                    {captionExpanded ? '접기' : '더보기'}
                  </button>
                )}
              </div>
            )}

            {/* 여행지 */}
            {post.destination && (
              <p className="font-pretendard text-body3 text-gray-500 m-0 flex items-center gap-1">
                <span aria-hidden>📍</span>
                {post.destination}
              </p>
            )}

            {/* SNS 게시글 본문 */}
            {post.snsContent && (
              <p className="font-pretendard text-body4 text-gray-900 m-0 whitespace-pre-wrap break-words">{post.snsContent}</p>
            )}
          </div>

          {/* 댓글 섹션 */}
          {showComments && (
            <div className="border-t border-gray-100 px-5 py-3 flex flex-col gap-3">
              {commentsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="font-pretendard text-body4 text-gray-400 text-center py-2">첫 댓글을 남겨보세요</p>
              ) : (
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {comments.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      {c.authorProfileImageUrl ? (
                        <img src={c.authorProfileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-pretendard text-body4 font-semibold text-gray-900 mr-1.5">{c.authorNickname}</span>
                        <span className="font-pretendard text-body4 text-gray-700 break-words">{c.content}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-pretendard text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                          {user && c.authorId === user.id && (
                            <button type="button" onClick={() => handleDeleteComment(c.id)}
                              className="font-pretendard text-[10px] text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-0">
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* 댓글 입력 */}
              {isLoggedIn && (
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <input
                    ref={commentInputRef}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    placeholder="댓글 달기..."
                    className="flex-1 font-pretendard text-body4 text-gray-900 placeholder:text-gray-400 border-none outline-none bg-transparent"
                  />
                  <button
                    type="button" onClick={handleSubmitComment}
                    disabled={!commentInput.trim() || isSubmitting}
                    className="font-pretendard text-body4 font-semibold text-primary disabled:opacity-40 bg-transparent border-none cursor-pointer p-0"
                  >
                    게시
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      {portal}
      <UserPublicProfilePopup
        targetUserId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </>
  );
}

