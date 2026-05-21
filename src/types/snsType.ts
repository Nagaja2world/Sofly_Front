import type { SnsMedia } from "@/components/workspace/SnsLogCard";

/* ══════════════════════════════════════════
   SNS 페이지 타입 정의
   ══════════════════════════════════════════ */

/**
 * SNS 게시물 작성자 (게시 시점의 워크스페이스 멤버 또는 사용자)
 */
export interface SnsAuthor {
  /** 작성자 고유 id (유저 id) */
  id: string;
  /** 표시 아이디 (예: "haegok_traveler") */
  username: string;
  /** 프로필 이미지 URL (없으면 기본 아이콘) */
  avatarUrl?: string;
}

/**
 * SNS 게시물 (피드/그리드에 노출되는 1개의 카드)
 *
 * - 워크스페이스의 SnsLogCard에서 "업로드" 버튼을 누르면 SNS 페이지에 게시됨.
 * - 즉, SnsLogCard의 media + caption + (어떤 워크스페이스에 속했는지) 정보가
 *   하나의 SnsPost로 변환되는 구조.
 */
export interface SnsPost {
  /** 게시물 고유 id */
  id: string;
  /** 작성자 정보 */
  author: SnsAuthor;
  /** 미디어 목록 (재사용: SnsLogCard와 동일한 타입) */
  media: SnsMedia[];
  /** 캡션 (옵션) */
  caption?: string;
  /** 게시 시각 (ISO string, 정렬/표시용) */
  createdAt: string;
  /** 게시물이 속한 워크스페이스 id (있을 때만 — "워크스페이스 보러가기" 가능) */
  workspaceId?: string;
  /** 게시물이 속한 워크스페이스 이름 (표시용) */
  workspaceName?: string;
}

/**
 * "요즘 뜨는 여행지" 1~10위 데이터
 *
 * - 사이드바에 표시되는 트렌딩 리스트
 * - TODO: 백엔드 API에서 가져올 예정 (현재는 mock)
 */
export interface TrendingDestination {
  /** 순위 (1~10) */
  rank: number;
  /** 도시명 (예: "도쿄", "파리") */
  city: string;
  /** 국가명 (예: "일본", "프랑스") - 옵션 */
  country?: string;
}
