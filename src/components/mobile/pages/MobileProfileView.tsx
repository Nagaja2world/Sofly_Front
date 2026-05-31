//import MobileSearchModeBar from "@/components/mobile/searchbar/MobileSearchModeBar";
import MobileAmbientEffects from "@/components/mobile/common/MobileAmbientEffects";
import WorkspaceCard from "@/components/profilePage/WorkspaceCard";
import SnsPreviewSection from "@/components/profile/SnsPreviewSection";
import Button from "@/components/common/Button";
import { type FlightSearchParams } from "@/utils/flightSearchQuery";
import { type Workspace } from "@/api/workspaceApi";
import { resolveCoverImage } from "@/api/workspaceApi";
import type { SnsPost } from "@/types/snsType";

import GroupIcon from "@/assets/group.svg?react";
import PlusIcon from "@/assets/plus.svg?react";

/* ══════════════════════════════════════════
   MobileProfileView
   ══════════════════════════════════════════
   ProfilePage의 md:hidden 본문.
   NavBar/Footer는 NoHeaderLayout이 담당하므로 본문만 렌더.
   데이터/핸들러는 ProfilePage(부모)가 소유하고 props로 전달
   — 데스크톱과 동일 state를 공유 (CompactWorkspaceView 패턴).

   순서(데스크톱과 동일):
   인사말 → Conquest Map → 항공편 검색 → 워크스페이스 → SNS 미리보기

   인사말 영역은 데스크톱 hero 느낌을 모바일에 맞춰 재현:
   크림색 그라데이션 배경 위에 나비(bufferfly.svg)가 "Welcome, Traveler!"
   옆에서 날아드는 구도. (profile_hero.svg 대신 나비 에셋만 사용)
*/

interface MobileProfileViewProps {
  userName: string;
  profileImageUrl?: string | null;

  workspaces: Workspace[];
  wsLoading: boolean;
  wsError: string | null;
  isCreating: boolean;
  snsPosts: SnsPost[];

  onFlightSearch: (params: FlightSearchParams) => void;
  onCardClick: (id: string) => void;
  onCreateWorkspace: () => void;
  onRetryWorkspaces: () => void;
  onConquestMap: () => void;
}

export default function MobileProfileView({
  userName,
  profileImageUrl,
  workspaces,
  wsLoading,
  wsError,
  isCreating,
  snsPosts,
  //onFlightSearch,
  onCardClick,
  onCreateWorkspace,
  onRetryWorkspaces,
  //onConquestMap,
}: MobileProfileViewProps) {
  return (
    <div className="flex flex-col gap-8 pb-6 bg-background">
      {/* ── 인사말 + Conquest Map (크림 hero + 나비/꽃잎) ── */}
      <div className="relative overflow-hidden bg-background">
        {/* 데스크톱 hero처럼 나비가 날고 꽃잎이 떨어지는 효과 */}
        <MobileAmbientEffects particleCount={12} />

        {/* 콘텐츠 */}
        <div className="relative z-10 px-4 pt-6 pb-5">
          <div className="flex items-center gap-3">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={userName}
                className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-200"
              />
            ) : (
              <GroupIcon className="w-14 h-14 shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="font-montserrat text-title2 font-semibold text-gray-900 m-0">
                Welcome, Traveler!
              </h1>
              <p className="font-pretendard text-body3 text-gray-600 mt-1">
                {userName}님, 오늘은 어디로 떠나볼까요?
              </p>
            </div>
          </div>
          {/* <Button
            btnType="outlined"
            onClick={onConquestMap}
            className="w-full mt-4 justify-center bg-white/70 backdrop-blur-sm"
          >
            Conquest Map
          </Button> */}
        </div>
      </div>

      {/* ── 항공편 검색 ── */}
      {/* <div className="px-4">
        <h2 className="font-pretendard text-body1 font-semibold text-gray-900 mb-3">
          항공편 검색
        </h2>
        <MobileSearchModeBar onFlightSearch={onFlightSearch} />
      </div> */}

      {/* ── 워크스페이스 ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
            워크스페이스
          </h2>
          <Button
            btnType="text"
            icon={<PlusIcon />}
            onClick={onCreateWorkspace}
            disabled={isCreating}
          >
            {isCreating ? "생성 중..." : "New"}
          </Button>
        </div>

        {wsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : wsError ? (
          <div className="py-8 text-center">
            <p className="font-pretendard text-body3 text-red-500 mb-3">
              {wsError}
            </p>
            <Button btnType="outlined" onClick={onRetryWorkspaces}>
              다시 시도
            </Button>
          </div>
        ) : workspaces.length > 0 ? (
          /* 2행 고정 + 가로 스크롤. 페이지 단위 스냅, 스크롤바 숨김 */
          <div className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[calc(50%-6px)] gap-3">
              {workspaces.map((ws) => (
                <div key={ws.id} className="snap-start">
                  <WorkspaceCard
                    id={String(ws.id)}
                    name={ws.title}
                    startDate={ws.startDate}
                    endDate={ws.endDate}
                    memberCount={ws.memberCount}
                    imageUrl={resolveCoverImage(ws.coverImageUrl, ws.id)}
                    onClick={onCardClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={[
              "flex flex-col items-center justify-center text-center",
              "py-16 px-4 rounded-xl border-2 border-dashed border-gray-300",
              "bg-gray-100/50",
            ].join(" ")}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 48 48"
              fill="none"
              className="mb-3"
            >
              <path
                d="M24 10V38"
                stroke="#C4C4C4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M10 24H38"
                stroke="#C4C4C4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="font-pretendard text-body2 text-gray-500 mb-1">
              아직 워크스페이스가 없어요
            </p>
            <p className="font-pretendard text-body3 text-gray-400 mb-4">
              새로운 여행을 계획하고 함께 떠나보세요!
            </p>
            <Button
              btnType="solid"
              onClick={onCreateWorkspace}
              disabled={isCreating}
            >
              {isCreating ? "생성 중..." : "첫 워크스페이스 만들기"}
            </Button>
          </div>
        )}
      </div>

      {/* ── SNS 미리보기 (2열) ── */}
      <div className="px-4">
        <SnsPreviewSection posts={snsPosts} previewCount={4} gridColumns={2} />
      </div>
    </div>
  );
}
