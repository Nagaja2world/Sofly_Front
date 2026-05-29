import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import Button from "@/components/common/Button";
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out] p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-xl overflow-hidden w-full max-w-[640px] max-h-[88vh] flex flex-col animate-[popupFadeIn_0.2s_ease-out] shadow-2xl"
      >
        {/* 헤더 */}
        <header className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full shrink-0 bg-gray-200 overflow-hidden">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
                    <circle cx="11" cy="8" r="3.5" fill="#9A9A9A" />
                    <path d="M4 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#9A9A9A" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
            <span className="font-pretendard text-body1 font-semibold text-gray-900 truncate">
              {profile?.nickname ?? ''}
            </span>
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

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* 프로필 정보 */}
              <div className="px-6 py-6 flex items-center gap-8">
                {/* 아바타 */}
                <div className="w-24 h-24 rounded-full shrink-0 bg-gray-200 overflow-hidden ring-2 ring-gray-100">
                  {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
                        <circle cx="18" cy="13" r="6" fill="#C4C4C4" />
                        <path d="M6 32c0-6 5-11 12-11s12 5 12 11" stroke="#C4C4C4" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 우측 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-pretendard text-body1 font-bold text-gray-900 mb-4">{profile.nickname}</p>

                  {/* 통계 */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <p className="font-pretendard text-body1 font-bold text-gray-900">{profile.publicWorkspaces.totalElements}</p>
                      <p className="font-pretendard text-body4 text-gray-500 mt-0.5">게시물</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="font-pretendard text-body1 font-bold text-gray-900">{followerCount}</p>
                      <p className="font-pretendard text-body4 text-gray-500 mt-0.5">팔로워</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="font-pretendard text-body1 font-bold text-gray-900">{profile.followingCount}</p>
                      <p className="font-pretendard text-body4 text-gray-500 mt-0.5">팔로잉</p>
                    </div>
                  </div>

                  {/* 팔로우 버튼 */}
                  {isLoggedIn && !isSelf && (
                    <Button
                      btnType={isFollowing ? "outlined" : "solid"}
                      onClick={handleFollow}
                      disabled={followLoading}
                      className="min-w-[100px]"
                    >
                      {followLoading
                        ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : isFollowing ? '팔로잉' : '팔로우'}
                    </Button>
                  )}
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200 mx-0" />

              {/* 워크스페이스 그리드 */}
              <div className="px-6 py-4">
                <p className="font-pretendard text-body3 font-semibold text-gray-700 mb-3">
                  공개 워크스페이스
                  <span className="ml-1.5 text-gray-400 font-normal">{profile.publicWorkspaces.totalElements}</span>
                </p>

                {profile.publicWorkspaces.content.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
                      <rect x="4" y="4" width="36" height="36" rx="6" stroke="#D1D5DB" strokeWidth="2" />
                      <path d="M4 30l10-10 8 8 5-6 13 10" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="15" cy="16" r="3" fill="#D1D5DB" />
                    </svg>
                    <p className="font-pretendard text-body4">공개된 워크스페이스가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
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
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer border-none p-0 group"
                      >
                        {ws.coverImageUrl ? (
                          <img
                            src={ws.coverImageUrl}
                            alt={ws.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#D1D5DB" strokeWidth="1.5" />
                              <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                        {/* 호버 오버레이 */}
                        <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex flex-col items-start justify-end p-2.5 gap-0.5">
                          <p className="font-pretendard text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate w-full drop-shadow-sm">
                            {ws.title}
                          </p>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="flex items-center gap-0.5 text-white font-pretendard text-[11px] drop-shadow-sm">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden>
                                <path d="M6 10.5S1 7.3 1 4.5a2.5 2.5 0 0 1 5-0.36A2.5 2.5 0 0 1 11 4.5c0 2.8-5 6-5 6z" />
                              </svg>
                              {ws.likeCount}
                            </span>
                            <span className="flex items-center gap-0.5 text-white font-pretendard text-[11px] drop-shadow-sm">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden>
                                <path d="M10 1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3l1 2 1-2h3a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
                              </svg>
                              {ws.commentCount}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="font-pretendard text-body4 text-gray-400 text-center py-16">프로필을 불러올 수 없습니다</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
