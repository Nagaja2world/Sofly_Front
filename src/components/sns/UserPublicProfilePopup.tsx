import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import {
  fetchPublicProfile,
  fetchFollowStats,
  followUser,
  unfollowUser,
  type PublicProfileResponse,
  type PublicWorkspacePost,
} from "@/api/snsApi";

interface UserPublicProfilePopupProps {
  targetUserId: number | null;
  onClose: () => void;
  onPostClick?: (post: PublicWorkspacePost) => void;
}

export default function UserPublicProfilePopup({
  targetUserId,
  onClose,
  onPostClick,
}: UserPublicProfilePopupProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const isOpen = targetUserId !== null;
  const isLoggedIn = !!user;
  const isSelf = user && profile ? String(user.id) === String(profile.userId) : false;

  const load = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const data = await fetchPublicProfile(targetUserId);
      setProfile(data);
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (isOpen) load();
    else setProfile(null);
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [isOpen]);

  const handleFollow = async () => {
    if (!targetUserId || followLoading || !user) return;
    setFollowLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowerCount((c) => !prev ? c + 1 : Math.max(0, c - 1));
    try {
      if (!prev) await followUser(targetUserId);
      else await unfollowUser(targetUserId);
      const stats = await fetchFollowStats(targetUserId);
      setIsFollowing(stats.isFollowing);
      setFollowerCount(stats.followerCount);
    } catch {
      setIsFollowing(prev);
      setFollowerCount((c) => prev ? c + 1 : Math.max(0, c - 1));
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out] p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white w-full max-w-[480px] max-h-[90vh] flex flex-col animate-[popupFadeIn_0.2s_ease-out] shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* 헤더 — 인스타그램식 username 중앙 */}
        <header className="shrink-0 relative flex items-center justify-center h-12 border-b border-gray-200">
          <span className="font-pretendard text-[15px] font-semibold text-gray-900 tracking-tight">
            {profile?.nickname ?? ''}
          </span>
          <button
            type="button" onClick={onClose} aria-label="닫기"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-700 hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* 프로필 섹션 */}
              <div className="px-6 pt-6 pb-5">
                {/* 아바타 + 통계 */}
                <div className="flex items-center gap-6 mb-4">
                  {/* 아바타 — 인스타그램식 그라데이션 링 */}
                  <div className={[
                    "shrink-0 p-[2.5px] rounded-full",
                    !isSelf && isFollowing ? "bg-gray-300" : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
                  ].join(" ")}>
                    <div className="w-[76px] h-[76px] rounded-full bg-white p-[2px] overflow-hidden">
                      {profile.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt={profile.nickname} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                            <circle cx="16" cy="12" r="5" fill="#9A9A9A" />
                            <path d="M6 28c0-5 4.5-9 10-9s10 4 10 9" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 통계 3개 */}
                  <div className="flex flex-1 justify-around text-center">
                    <div>
                      <p className="font-pretendard text-[15px] font-bold text-gray-900 leading-tight">
                        {profile.publicWorkspaces.totalElements}
                      </p>
                      <p className="font-pretendard text-[12px] text-gray-500 leading-tight mt-0.5">게시물</p>
                    </div>
                    <div>
                      <p className="font-pretendard text-[15px] font-bold text-gray-900 leading-tight">
                        {followerCount}
                      </p>
                      <p className="font-pretendard text-[12px] text-gray-500 leading-tight mt-0.5">팔로워</p>
                    </div>
                    <div>
                      <p className="font-pretendard text-[15px] font-bold text-gray-900 leading-tight">
                        {profile.followingCount}
                      </p>
                      <p className="font-pretendard text-[12px] text-gray-500 leading-tight mt-0.5">팔로잉</p>
                    </div>
                  </div>
                </div>

                {/* 닉네임 */}
                <p className="font-pretendard text-[14px] font-semibold text-gray-900 mb-3">
                  {profile.nickname}
                </p>

                {/* 팔로우 버튼 */}
                {isLoggedIn && !isSelf && (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={[
                      "w-full py-[7px] rounded-lg text-[14px] font-semibold font-pretendard transition-all cursor-pointer border",
                      followLoading ? "opacity-60" : "",
                      isFollowing
                        ? "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        : "bg-[#0095f6] border-[#0095f6] text-white hover:bg-[#1877f2]",
                    ].join(" ")}
                  >
                    {followLoading
                      ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-middle" />
                      : isFollowing ? '팔로잉' : '팔로우'}
                  </button>
                )}
              </div>

              {/* 구분선 + 그리드 아이콘 탭 */}
              <div className="border-t border-gray-200 flex justify-center py-2.5">
                <div className="flex items-center gap-1.5 text-gray-900">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden>
                    <rect x="0" y="0" width="5.5" height="5.5" rx="0.5" />
                    <rect x="7.5" y="0" width="5.5" height="5.5" rx="0.5" />
                    <rect x="0" y="7.5" width="5.5" height="5.5" rx="0.5" />
                    <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="0.5" />
                  </svg>
                  <span className="font-pretendard text-[12px] font-semibold tracking-widest uppercase">게시물</span>
                </div>
              </div>

              {/* 포스트 그리드 */}
              {profile.publicWorkspaces.content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
                    <circle cx="24" cy="24" r="22" stroke="#d1d5db" strokeWidth="2" />
                    <path d="M16 30l6-8 5 6 3-4 6 6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="19" cy="20" r="2" fill="#d1d5db" />
                  </svg>
                  <p className="font-pretendard text-[14px] text-gray-400">공개된 게시물이 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[2px]">
                  {profile.publicWorkspaces.content.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        if (onPostClick) {
                          onPostClick(ws);
                        } else {
                          navigate(`/workspace/${ws.id}`);
                          onClose();
                        }
                      }}
                      className="relative aspect-square bg-gray-100 cursor-pointer border-none p-0 group overflow-hidden"
                    >
                      {ws.coverImageUrl ? (
                        <img
                          src={ws.coverImageUrl}
                          alt={ws.title}
                          className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                            <rect x="2" y="2" width="18" height="18" rx="2" stroke="#c0c0c0" strokeWidth="1.5" />
                            <path d="M2 14l5-5 4 4 3-3 6 6" stroke="#c0c0c0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      {/* 호버 오버레이 — 좋아요·댓글 수 */}
                      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="flex items-center gap-1 text-white font-pretendard text-[13px] font-bold drop-shadow-sm">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="white" aria-hidden>
                            <path d="M8 14s-5.5-3.5-5.5-7.5a3.5 3.5 0 0 1 5.5-2.86A3.5 3.5 0 0 1 13.5 6.5C13.5 10.5 8 14 8 14z" />
                          </svg>
                          {ws.likeCount}
                        </span>
                        <span className="flex items-center gap-1 text-white font-pretendard text-[13px] font-bold drop-shadow-sm">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="white" aria-hidden>
                            <path d="M13 1H2a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h3l2.5 3L10 10.5h3a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
                          </svg>
                          {ws.commentCount}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="font-pretendard text-[14px] text-gray-400 text-center py-16">프로필을 불러올 수 없습니다</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
