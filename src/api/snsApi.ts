const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ── 타입 ──────────────────────────────────────────

export type WorkspaceVisibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

export interface SnsAuthorInfo {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface PublicWorkspacePost {
  id: number;
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  headcount: number | null;
  coverImageUrl: string | null;
  visibility: WorkspaceVisibility;
  author: SnsAuthorInfo;
  likeCount: number;
  commentCount: number;
  isLiked: boolean | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CommentResponse {
  id: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatsResponse {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

// ── 트렌딩 여행지 ─────────────────────────────────

export interface TrendingDestinationApi {
  rank: number;
  destination: string;
  countryCode: string;
  workspaceCount: number;
}

export async function fetchTrendingDestinations(): Promise<TrendingDestinationApi[]> {
  const res = await fetch(`${API_BASE}/api/sns/workspaces/trending-destinations`);
  return unwrap(res);
}

// ── 피드 ──────────────────────────────────────────

export async function fetchFeed(page = 0, size = 20): Promise<PageResponse<PublicWorkspacePost>> {
  return unwrap(await fetch(`${API_BASE}/api/sns/feed?page=${page}&size=${size}`, { headers: authHeaders() }));
}

// ── 검색 ──────────────────────────────────────────

export async function searchWorkspaces(params: {
  keyword?: string;
  countryCode?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<PublicWorkspacePost>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.countryCode) q.set('countryCode', params.countryCode);
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 20));
  return unwrap(await fetch(`${API_BASE}/api/sns/workspaces/search?${q}`, { headers: authHeaders() }));
}

// ── 좋아요 ────────────────────────────────────────

export async function addLike(workspaceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sns/workspaces/${workspaceId}/likes`, {
    method: 'POST', headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`좋아요 실패: ${res.status}`);
}

export async function removeLike(workspaceId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sns/workspaces/${workspaceId}/likes`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`좋아요 취소 실패: ${res.status}`);
}

// ── 댓글 ──────────────────────────────────────────

export async function fetchComments(workspaceId: number, page = 0, size = 20): Promise<PageResponse<CommentResponse>> {
  return unwrap(await fetch(
    `${API_BASE}/api/sns/workspaces/${workspaceId}/comments?page=${page}&size=${size}`,
    { headers: authHeaders() },
  ));
}

export async function postComment(workspaceId: number, content: string): Promise<CommentResponse> {
  return unwrap(await fetch(`${API_BASE}/api/sns/workspaces/${workspaceId}/comments`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ content }),
  }));
}

export async function deleteComment(workspaceId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sns/workspaces/${workspaceId}/comments/${commentId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`댓글 삭제 실패: ${res.status}`);
}

// ── 팔로우 ────────────────────────────────────────

export async function followUser(targetUserId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sns/users/${targetUserId}/follow`, {
    method: 'POST', headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`팔로우 실패: ${res.status}`);
}

export async function unfollowUser(targetUserId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sns/users/${targetUserId}/follow`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`언팔로우 실패: ${res.status}`);
}

export async function fetchFollowStats(targetUserId: number): Promise<FollowStatsResponse> {
  return unwrap(await fetch(
    `${API_BASE}/api/sns/users/${targetUserId}/follow-stats`,
    { headers: authHeaders() },
  ));
}

// ── 워크스페이스 가져오기 ──────────────────────────

export async function importWorkspace(workspaceId: number): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/api/sns/workspaces/${workspaceId}/import`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('LOGIN_REQUIRED');
    if (res.status === 403) throw new Error('NOT_PUBLIC');
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error(`가져오기 실패: ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// ── 공개 프로필 ────────────────────────────────────

export interface PublicProfileResponse {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  publicWorkspaces: PageResponse<PublicWorkspacePost>;
}

export async function fetchPublicProfile(
  targetUserId: number,
  page = 0,
  size = 12,
): Promise<PublicProfileResponse> {
  return unwrap(await fetch(
    `${API_BASE}/api/sns/users/${targetUserId}/profile?page=${page}&size=${size}`,
    { headers: authHeaders() },
  ));
}

// ── 유틸 ──────────────────────────────────────────

/** API 응답 → 기존 SnsPost 포맷 변환 */
export function toSnsPost(p: PublicWorkspacePost) {
  return {
    id: String(p.id),
    author: {
      id: String(p.author.userId),
      username: p.author.nickname,
      avatarUrl: p.author.profileImageUrl ?? undefined,
    },
    media: p.coverImageUrl
      ? [{ id: '0', type: 'image' as const, url: p.coverImageUrl }]
      : [],
    caption: p.title + (p.destination ? ` · ${p.destination}` : ''),
    createdAt: p.createdAt,
    workspaceId: String(p.id),
    workspaceName: p.title,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isLiked: p.isLiked,
  };
}
