import { useState, useEffect } from "react";
import NavBar from "@/components/common/NavBar";
import MobileFooter from "@/components/common/MobileFooter";
import MemberBar from "@/components/workspace/compact/MemberBar";
import MemberListPopup from "@/components/workspace/compact/MemberListPopup";
import CompactAIChatModal from "@/components/workspace/compact/CompactAIChatModal";
import CompactFlightSection from "@/components/workspace/compact/CompactFlightSection";
import CompactItinerarySection from "@/components/workspace/compact/CompactItinerarySection";
import CompactTravelLogSection from "@/components/workspace/compact/CompactTravelLogSection";
import CompactSharedAlbumSection from "@/components/workspace/compact/CompactSharedAlbumSection";
import CompactDangerZone from "@/components/workspace/compact/CompactDangerZone";
import { type WorkspaceMember } from "@/components/workspace/MemberSidebar";
import { type FlightInfo } from "@/components/workspace/FlightSection";
import { type ItineraryDay } from "@/utils/itineraryMapper";
import { type ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import { type ScheduleCategory } from "@/api/scheduleApi";
import {
  type CompactTravelLog,
  type CompactTravelLogData,
  type CompactSnsLogData,
} from "@/components/workspace/compact/CompactTravelLogSection";
import { type WorkspaceFlight } from "@/api/workspaceApi";
import { type AlbumPhoto } from "@/api/albumApi";

import MoBottomIllust from "@/assets/mo_bottom_illust.svg?react";

/* ══════════════════════════════════════════
   CompactWorkspaceView
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 워크스페이스 화면 골격.

   설계 결정 (안 A — 부모가 훅 호출, props로 전달):
   - 데이터/콜백은 WorkspacePage가 가진 훅(useWorkspaceMembers 등)에서 내려받음.
     이 컴포넌트는 훅을 직접 호출하지 않음.
   - 이유: WorkspacePage의 모달 7개(초대/삭제/나가기/항공편 등)가 데스크톱·모바일
     공용이라 페이지 레벨에 있어야 함. 훅을 여기서 다시 부르면 데이터·모달 상태가
     양쪽으로 갈라짐. useIsCompact로 한쪽만 렌더되더라도, 768px 경계를 넘나들 때
     언마운트→리마운트로 훅이 재실행(API 재요청)되는 문제도 있음.
   - props가 많아지는 단점은 "연관된 것끼리 객체로 묶어" 해소
     (member / flight / 추후 schedule / travelLog 그룹).

   레이아웃 (위 → 아래):
   - NavBar (variant="back")        — 뒤로가기 + 워크스페이스명 + 공유
   - MemberBar                      — 함께하는 사람 바 (탭하면 멤버 팝업)
   - 항공 일정 (CompactFlightSection) — 실데이터 연결
   - 여행 일정 (CompactItinerarySection) — 실데이터 연결 (지도/편집 포함)
   - 여행 기록 (CompactTravelLogSection) — 실데이터 연결
   - 공유 앨범 (CompactSharedAlbumSection) — 실데이터 연결
   - 위험 영역 (CompactDangerZone)   — 워크스페이스 나가기/삭제
   - MobileFooter
   - AI 채팅 FAB + CompactAIChatModal — 우하단 떠있는 버튼 → 전체화면 채팅

   현재 단계 완성도:
   - 멤버 팝업: 실동작
   - 항공 섹션: 실동작
   - 여행 일정 섹션: 실동작 (가로 스크롤 카드).
     · 지도 보기: 카드 "지도" 버튼 → CompactDayMapModal 전체화면 지도.
     · 편집: 카드별 편집 모드 — 항목 추가/수정/삭제.
   - 여행 기록 섹션: 실동작 (가로 스크롤 카드).
     · SNS 카드(맨 앞) + 일자별 카드. 둘 다 편집/추가/삭제 가능.
     · 일자별 카드 본문은 Tiptap 에디터 — 사진을 내 기기 또는
       공유앨범에서 본문에 인라인 삽입.
   - 공유 앨범 섹션: 실동작 (3열 그리드 + 더보기).
     · 사진 추가/삭제/다운로드, 라이트박스 확대, 서버 페이지네이션.
   - 위험 영역: 실동작. OWNER → 삭제 / 그 외 → 나가기.
     실제 확인 모달은 WorkspacePage가 페이지 레벨에서 관리.
   - AI 채팅: 실동작. 우하단 FAB(채팅방 수 뱃지) → CompactAIChatModal
     전체화면 채팅(기존 ChatPanel 재사용). 열림 여부는 sessionStorage에
     저장돼 새로고침해도 복원됨. 대화 내용은 서버 저장이라 자동 보존.
*/

/* ── props 그룹 타입 ── */

/** 멤버 관련 데이터/콜백 묶음 */
export interface CompactMemberProps {
  members: WorkspaceMember[];
  /** 멤버 초대 모달 열기 (WorkspacePage의 setShowInviteModal(true)) */
  onAddMember: () => void;
}

/** 항공편 관련 데이터/콜백 묶음 — CompactFlightSection으로 그대로 전달 */
export interface CompactFlightProps {
  flights: FlightInfo[];
  rawFlights: WorkspaceFlight[];
  onFlightClick: (flight: WorkspaceFlight) => void;
  onFlightDelete: (id: number, label: string) => void;
  /** 항공편 추가 — WorkspacePage의 setShowAddFlightModal(true) */
  onAdd?: () => void;
}

/** 여행 일정 관련 데이터/콜백 묶음 — CompactItinerarySection으로 전달.
    onSaveDay/onCategoryChange가 있으면 카드가 편집 가능 모드가 됨. */
export interface CompactItineraryProps {
  days: ItineraryDay[];
  /** 일차 편집 저장 (useSchedule.handleSaveItineraryDay) */
  onSaveDay?: (dayNumber: number, rows: ItineraryRow[]) => void;
  /** 항목 분류 변경 (useSchedule.handleCategoryChange) */
  onCategoryChange?: (itemId: number, category: ScheduleCategory) => void;
}

/** 여행 기록 관련 데이터/콜백 묶음 — CompactTravelLogSection으로 전달.
    travelLogs 타입은 CompactTravelLog (데스크톱 TravelLog와 동일 구조이며,
    useTravelLogs가 반환하는 TravelLog[]가 구조적으로 그대로 호환됨). */
export interface CompactTravelLogProps {
  travelLogs: CompactTravelLog[];
  snsLog: CompactSnsLogData | null;
  /** 워크스페이스 공유 앨범 사진 URL 배열 — 여행 기록 카드 본문에
      "공유앨범에서 찾기"로 사진을 삽입할 때 사용 */
  sharedAlbumPhotos?: string[];
  /** 카드 제목(mainTitle) 인라인 편집 저장 (useTravelLogs.handleUpdateMainTitle) */
  onUpdateMainTitle?: (id: number, title: string) => void;
  /** 카드 본문/날씨/한줄요약 편집 저장 (useTravelLogs.handleSaveTravelLog) */
  onSaveTravelLog?: (id: number, data: CompactTravelLogData) => void;
  /** 앨범 사진 즉시 업로드 (useTravelLogs.handleUploadTravellogPhotos).
      데스크톱 TravelLogSection과 props 표면을 맞추기 위한 채널 —
      현재 데스크톱·compact 모두 카드 내부에서 호출하지 않는 예약 채널. */
  onUploadTravellogPhotos?: (id: number, files: File[]) => void;
  /** 카드 삭제 (useTravelLogs.handleDeleteTravelLog) */
  onDeleteTravelLog?: (id: number) => void;
  /** 새 카드 추가 (useTravelLogs.handleAddDailyCard) */
  onAddDailyCard?: () => void;
  /** 카드 순서 변경 (useTravelLogs.handleReorderLogs) */
  onReorderLogs?: (fromIdx: number, toIdx: number) => void;
  /** SNS 게시물 편집 저장. 미지정 시 SNS 카드는 보기 전용. */
  onSaveSnsLog?: (data: CompactSnsLogData) => void;
  /** SNS 게시물 삭제. */
  onDeleteSnsLog?: () => void;
  /** SNS 게시물 새로 추가 (snsLog가 null일 때만 동작). */
  onAddSnsCard?: () => void;
}

/** 공유 앨범 관련 데이터/콜백 묶음 — CompactSharedAlbumSection으로 전달.
    WorkspacePage의 앨범 상태/핸들러를 그대로 내려받음 (데스크톱과 공유). */
export interface CompactAlbumProps {
  photos: AlbumPhoto[];
  uploading: boolean;
  hasNext: boolean;
  loadingMore: boolean;
  onAddPhotos: (files: FileList) => void;
  /** photoId 기반 삭제 (index 아님) */
  onRemovePhoto: (photoId: number) => void;
  /** photoId 기반 다운로드 */
  onDownloadPhoto: (photoId: number) => void;
  /** 다음 페이지 요청 */
  onLoadMore: () => void;
}

/** 위험 영역 관련 데이터/콜백 묶음 — CompactDangerZone으로 전달.
    실제 확인 모달은 WorkspacePage가 페이지 레벨에서 관리. */
export interface CompactDangerZoneProps {
  /** 현재 사용자 역할 (null이면 영역 미표시) */
  myRole: string | null;
  /** 워크스페이스 나가기 */
  onLeave: () => void;
  /** 워크스페이스 삭제 */
  onDelete: () => void;
}

/** AI 채팅 관련 데이터/콜백 묶음 — CompactAIChatModal로 전달.
    데스크톱 AIChatSidebar가 받는 것과 동일한 값들을 WorkspacePage가
    그대로 내려줌(채팅 상태는 데스크톱·모바일 공용). */
export interface CompactChatProps {
  /** 채팅방 개수 — FAB 뱃지 표시용 (데스크톱 chatRoomCount와 공유) */
  roomCount: number;
  /** AI가 일정을 저장했을 때 콜백 (useSchedule 재로딩 트리거) */
  onScheduleSaved: () => void;
  /** 채팅방 개수 변경 콜백 (WorkspacePage의 setChatRoomCount) */
  onRoomCountChange: (count: number) => void;
}

interface CompactWorkspaceViewProps {
  /** 워크스페이스 ID — AI 채팅(ChatPanel)으로 전달 */
  workspaceId: number;
  /** 워크스페이스 이름 (헤더 타이틀) */
  workspaceName: string;
  /** 뒤로가기 클릭 */
  onBack: () => void;
  /** 공유 클릭 */
  onShare?: () => void;
  /** 멤버 그룹 */
  member: CompactMemberProps;
  /** 항공편 그룹 */
  flight: CompactFlightProps;
  /** 여행 일정 그룹 */
  itinerary: CompactItineraryProps;
  /** 여행 기록 그룹 */
  travelLog: CompactTravelLogProps;
  /** 공유 앨범 그룹 */
  album: CompactAlbumProps;
  /** 위험 영역 그룹 */
  dangerZone: CompactDangerZoneProps;
  /** AI 채팅 그룹 */
  chat: CompactChatProps;
}

export default function CompactWorkspaceView({
  workspaceId,
  workspaceName,
  onBack,
  onShare,
  member,
  flight,
  itinerary,
  travelLog,
  album,
  dangerZone,
  chat,
}: CompactWorkspaceViewProps) {
  /* 멤버 목록 팝업 — 이 컴포넌트 로컬 상태 (페이지 모달과 무관) */
  const [isMemberPopupOpen, setIsMemberPopupOpen] = useState(false);

  /* ── AI 채팅 모달 ──
     열림 여부를 sessionStorage에 저장해 새로고침 후에도 복원.
     - 워크스페이스별로 분리되도록 키에 workspaceId를 포함.
     - localStorage가 아닌 sessionStorage를 쓰는 이유: 탭을 완전히 닫았다
       새로 연 경우까지 채팅이 열려 있는 건 어색함. 새로고침까지만
       살아남으면 충분함.
     - lazy initializer로 첫 렌더에 즉시 복원값을 읽음(깜빡임 방지). */
  const chatStorageKey = `workspace:${workspaceId}:chatOpen`;

  const [isChatOpen, setIsChatOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(chatStorageKey) === "1";
    } catch {
      /* 프라이빗 모드 등 sessionStorage 접근 불가 — 닫힌 상태로 시작 */
      return false;
    }
  });

  /* isChatOpen이 바뀔 때마다 sessionStorage에 반영.
     닫힘(false)일 때는 키를 지워 저장소를 깔끔하게 유지. */
  useEffect(() => {
    try {
      if (isChatOpen) {
        window.sessionStorage.setItem(chatStorageKey, "1");
      } else {
        window.sessionStorage.removeItem(chatStorageKey);
      }
    } catch {
      /* 저장 실패는 무시 — 복원이 안 될 뿐 동작에는 지장 없음 */
    }
  }, [isChatOpen, chatStorageKey]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── 헤더: NavBar back variant 재사용 ── */}
      <NavBar
        variant="back"
        title={workspaceName}
        onBack={onBack}
        onShare={onShare}
      />

      {/* ── 함께하는 사람 바 ── */}
      <MemberBar
        members={member.members}
        onOpen={() => setIsMemberPopupOpen(true)}
      />

      {/* ── 본문 섹션들 ── */}
      <main className="flex-1 flex flex-col gap-8 px-4 py-5">
        {/* 항공 일정 — 실데이터 연결 */}
        <CompactFlightSection
          flights={flight.flights}
          rawFlights={flight.rawFlights}
          onFlightClick={flight.onFlightClick}
          onFlightDelete={flight.onFlightDelete}
          onAdd={flight.onAdd}
        />

        {/* 여행 일정 — 실데이터 연결 (가로 스크롤 카드).
            지도 버튼 → CompactDayMapModal, 편집 → onSaveDay. */}
        <CompactItinerarySection
          days={itinerary.days}
          onSaveDay={itinerary.onSaveDay}
          onCategoryChange={itinerary.onCategoryChange}
        />

        {/* 여행 기록 — 실데이터 연결 (가로 스크롤 카드).
            SNS 카드(맨 앞, 편집 가능) + 일자별 카드(편집/추가/삭제).
            본문 사진은 내 기기 / 공유앨범에서 삽입 가능. */}
        <CompactTravelLogSection
          travelLogs={travelLog.travelLogs}
          snsLog={travelLog.snsLog}
          sharedAlbumPhotos={travelLog.sharedAlbumPhotos}
          onUpdateMainTitle={travelLog.onUpdateMainTitle}
          onSaveTravelLog={travelLog.onSaveTravelLog}
          onUploadTravellogPhotos={travelLog.onUploadTravellogPhotos}
          onDeleteTravelLog={travelLog.onDeleteTravelLog}
          onAddDailyCard={travelLog.onAddDailyCard}
          onReorderLogs={travelLog.onReorderLogs}
          onSaveSnsLog={travelLog.onSaveSnsLog}
          onDeleteSnsLog={travelLog.onDeleteSnsLog}
          onAddSnsCard={travelLog.onAddSnsCard}
        />

        {/* 공유 앨범 — 실데이터 연결 (3열 그리드 + 더보기) */}
        <CompactSharedAlbumSection
          photos={album.photos}
          uploading={album.uploading}
          hasNext={album.hasNext}
          loadingMore={album.loadingMore}
          onAddPhotos={album.onAddPhotos}
          onRemovePhoto={album.onRemovePhoto}
          onDownloadPhoto={album.onDownloadPhoto}
          onLoadMore={album.onLoadMore}
        />

        {/* 위험 영역 — 워크스페이스 나가기/삭제.
            myRole === null이면 컴포넌트 내부에서 렌더 보류. */}
        <CompactDangerZone
          myRole={dangerZone.myRole}
          onLeave={dangerZone.onLeave}
          onDelete={dangerZone.onDelete}
        />
        {/* ── 데코레이션: 본문 하단 (Footer 바로 위) ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none px-4 -mt-2 -mb-5"
        >
          <MoBottomIllust className="w-full h-auto" />
        </div>
      </main>

      {/* ── 푸터 ── */}
      <MobileFooter />

      {/* ── 멤버 목록 팝업 ── */}
      <MemberListPopup
        isOpen={isMemberPopupOpen}
        onClose={() => setIsMemberPopupOpen(false)}
        members={member.members}
      />

      {/* ── AI 채팅 FAB (우하단 고정) ──
          채팅 모달이 닫혀 있을 때만 노출. 데스크톱 AIChatSidebar의
          떠있는 버튼과 시각적으로 일관 — 말풍선 아이콘 + "AI 채팅" 라벨,
          채팅방이 있으면 개수 뱃지.
          bottom 위치는 MobileFooter 위로 충분히 띄움(footer는 페이지
          맨 아래에 있고 FAB는 fixed라 스크롤과 무관하게 항상 보임).
          right-4는 본문 좌우 패딩(px-4)과 정렬을 맞춤. */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          aria-label="AI 채팅 열기"
          className={[
            "fixed z-50 bottom-6 right-4",
            "px-4 h-12 rounded-full",
            "bg-white shadow-lg border border-gray-200",
            "flex items-center gap-2",
            "text-gray-700 active:bg-gray-50",
            "transition-colors cursor-pointer",
          ].join(" ")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 10c0 4.418-3.582 8-8 8a8.07 8.07 0 0 1-2.5-.398L3 19l1.398-4.5A7.97 7.97 0 0 1 2 10c0-4.418 3.582-8 8-8s8 3.582 8 8Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-pretendard text-body3 font-semibold whitespace-nowrap">
            AI 채팅
          </span>
          {chat.roomCount > 0 && (
            <span
              className={[
                "absolute -top-1.5 -right-1.5",
                "min-w-[20px] h-5 px-1",
                "bg-blue-500 text-white rounded-full",
                "text-[11px] font-bold leading-none",
                "flex items-center justify-center",
              ].join(" ")}
            >
              {chat.roomCount > 99 ? "99+" : chat.roomCount}
            </span>
          )}
        </button>
      )}

      {/* ── AI 채팅 전체화면 모달 ──
          기존 ChatPanel을 전체화면으로 띄움. 열림 여부는 위 isChatOpen,
          새로고침 복원은 sessionStorage가 담당. */}
      <CompactAIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        workspaceId={workspaceId}
        onScheduleSaved={chat.onScheduleSaved}
        onRoomCountChange={chat.onRoomCountChange}
      />
    </div>
  );
}
