import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchWorkspaceById,
  updateWorkspace,
  uploadCoverImage,
  deleteWorkspace,
  type Workspace,
} from "@/api/workspaceApi";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import MemberSidebar from "@/components/workspace/MemberSidebar";
import { type SnsLogData } from "@/components/workspace/SnsLogCard";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import DeleteWorkspaceModal from "@/components/workspace/DeleteWorkspaceModal";
import FlightDetailModal from "@/components/workspace/FlightDetailModal";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import AIChatSidebar from "@/components/workspace/AIChatSidebar";
import WorkspaceInfoBar from "@/components/workspace/WorkspaceInfoBar";
import FlightSection from "@/components/workspace/FlightSection";
import ItinerarySection from "@/components/workspace/ItinerarySection";
import TravelLogSection from "@/components/workspace/TravelLogSection";
import DangerZone from "@/components/workspace/DangerZone";
import { useSchedule } from "@/hooks/useSchedule";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useWorkspaceFlights } from "@/hooks/useWorkspaceFlights";
import { useChatResize } from "@/hooks/useChatResize";
import { useTravelLogs } from "@/hooks/useTravelLogs";

/* (목업 데이터 제거됨 — 멤버/항공편/일정/여행기록 모두 API에서 로드) */


/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지
 *
 * 레이아웃 (데스크톱)
 *  ┌──────────┬─────────────────────────────┬──────────────┐
 *  │          │ 항공 일정 (가는편 / 오는편) │              │
 *  │ Member   │ 여행 일정 (1일차, 2일차...) │  AI Chat     │
 *  │ Sidebar  │ 여행 기록 (1일차, 2일차...) │  Panel       │
 *  │          │                             │              │
 *  └──────────┴─────────────────────────────┴──────────────┘
 *
 *  - 좌측 사이드바: 펼침 220px / 접힘 48px (collapsed bar)
 *  - 가운데 메인: 1fr (가변, 좌/우 사이드바 폭에 따라 자동 확장)
 *  - 우측 채팅: 펼침 360px / 접힘 48px (collapsed bar)
 *
 *  · 좌측 사이드바: 펼침 상태 헤더의 layout_left 아이콘으로 접고,
 *    접힘 상태의 동일 아이콘으로 다시 펼침.
 *  · 우측 채팅: 펼침 상태 헤더의 (좌우반전된) layout_left 아이콘으로 접고,
 *    접힘 상태의 동일 아이콘으로 다시 펼침.
 *
 *  컨텐츠 전체 폭은 max-w-[1440px]로 제한 (워크스페이스는 1200px보다 더 넓게).
 *  Layout의 Header/Footer 안에서 렌더되므로 여기서는 자체 헤더 X.
 */
export default function WorkspacePage() {
  const navigate = useNavigate();
  const { id: workspaceIdParam } = useParams<{ id: string }>();
  const workspaceId = Number(workspaceIdParam);
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* ── 워크스페이스 상세 (API) ── */
  const [workspaceDetail, setWorkspaceDetail] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!workspaceId || isNaN(workspaceId)) return;
    fetchWorkspaceById(workspaceId)
      .then(setWorkspaceDetail)
      .catch((err) => console.warn("[WorkspacePage] 워크스페이스 조회 실패:", err));
  }, [workspaceId]);

  const handleWorkspaceUpdate = async (
    title: string,
    destination: string,
    startDate: string,
    endDate: string,
  ) => {
    if (!workspaceDetail) return;
    const updated = await updateWorkspace(workspaceId, {
      title,
      destination,
      startDate,
      endDate,
      headcount: workspaceDetail.headcount,
      coverImageUrl: workspaceDetail.coverImageUrl,
      countryCode: workspaceDetail.countryCode,
    });
    setWorkspaceDetail(updated);
  };

  const handleCoverImageUpload = async (file: File) => {
    const updated = await uploadCoverImage(workspaceId, file);
    setWorkspaceDetail(updated);
  };

  /* ── 커스텀 훅 ── */
  const {
    members,
    myRole,
    loadMembers,
    showLeaveConfirm, setShowLeaveConfirm,
    isLeaving,
    handleLeaveWorkspace,
    showInviteModal, setShowInviteModal,
    inviteTarget, setInviteTarget,
    isInviting,
    inviteToast,
    handleInviteSelect,
    handleInviteConfirm,
  } = useWorkspaceMembers(workspaceId, user?.id);

  const {
    flights,
    rawFlights,
    loadFlights,
    selectedFlight, setSelectedFlight,
    deleteFlightTarget, setDeleteFlightTarget,
    handleDeleteFlightConfirm,
  } = useWorkspaceFlights(workspaceId);

  const {
    currentSchedule,
    scheduleList,
    itineraryDays,
    isLoadingSchedule,
    isSavingSchedule,
    loadSchedule,
    handleSelectScheduleVersion,
    handleSaveItineraryDay,
    handleDeleteItem,
    handleDeleteSchedule,
  } = useSchedule(workspaceId);

  const { chatWidth, handleResizeStart } = useChatResize();

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { loadFlights(); }, [loadFlights]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  /* ── 워크스페이스 삭제 ── */
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
    try {
      await deleteWorkspace(workspaceId);
      navigate("/");
    } catch (err) {
      console.warn("[WorkspacePage] 워크스페이스 삭제 실패:", err);
      setIsDeletingWorkspace(false);
    }
  };

  /* ── 사이드바 토글 ── */
  const [isMemberOpen, setIsMemberOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  /* ── 여행 기록 ── */
  const {
    travelLogs,
    loadTravelLogs,
    handleAddDailyCard: addDailyCard,
    handleSaveTravelLog,
    handleDeleteTravelLog,
  } = useTravelLogs(workspaceId);

  useEffect(() => { loadTravelLogs(); }, [loadTravelLogs]);

  const [snsLog, setSnsLog] = useState<SnsLogData | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  const handleOpenAddCard = () => setShowAddCard(true);
  const handleCancelAddCard = () => setShowAddCard(false);

  const handleAddDailyCard = () => {
    addDailyCard();
    setShowAddCard(false);
  };
  const handleAddSnsCard = () => {
    if (snsLog !== null) return;
    setSnsLog({ caption: undefined, media: [] });
    setShowAddCard(false);
  };
  const handleSaveSnsLog = (data: SnsLogData) => setSnsLog(data);
  const handleDeleteSnsLog = () => setSnsLog(null);
  const handleUploadSnsLog = (data: SnsLogData) => {
    console.log("[Workspace] upload to SNS:", data);
    alert("SNS 페이지에 업로드되었습니다. (TODO: 실제 게시 로직 구현)");
  };
  const handleMapClick = (dayNumber: number) => {
    console.log("[Workspace] open map for day:", dayNumber);
  };

  /* ── 워크스페이스명 ── */
  const workspaceName = workspaceDetail?.title ?? '워크스페이스';

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만) — 추후 별도 모바일 디자인 들어올 예정
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        <p className="font-pretendard text-body3 text-gray-500 text-center m-0">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          - 자체 Header를 풀폭으로 렌더링 (Layout/NoHeaderLayout의 헤더 대신)
          - 컨테이너는 좌우 패딩 없음 → 사이드바가 화면 양 끝까지 맞닿음
          - 위 패딩 없음 → 사이드바가 Header와 맞닿음
          ══════════════════════════════════════════ */}
      <div className="hidden md:block bg-background flex-1">
        {/* ── 풀폭 Header ── */}
        <div className="w-full bg-white border-b border-gray-300 sticky top-0 z-50">
          <div className="px-4">
            <Header variant="login" onLogout={handleLogout} />
          </div>
        </div>

        {/* ── 페이지 컨텐츠 ── */}
        <div className="w-full pb-6">
          <div
            className="grid items-start gap-6"
            style={{
              gridTemplateColumns: `${isMemberOpen ? "240px" : "48px"} 1fr ${isChatOpen ? `${chatWidth}px` : "48px"}`,
            }}
          >
            {/* ══ 좌측: 멤버 사이드바 (펼침/접힘) ══
                - 좌측/상단 테두리 없음 → 화면 왼쪽 끝/Header와 맞닿음
                - 우하 모서리만 둥글게 (컨텐츠 쪽만 둥근 형태)
                - 펼침: sticky로 상단에 고정
                - 접힘: self-stretch로 메인 컨텐츠와 같은 높이까지 흰색 바가 길게 늘어남 */}
            {isMemberOpen ? (
              /* 펼침 상태:
                 - 바깥 aside는 self-stretch로 메인 컨텐츠 높이만큼 늘어남
                   → 흰색 배경 바가 화면 세로로 길게 채워짐 (Image3 처럼)
                 - 안쪽 콘텐츠는 sticky top-0 으로 상단에 고정 */
              <aside className="self-stretch">
                <div
                  className={[
                    "h-full min-h-full",
                    "bg-white",
                    "rounded-br-xl",
                    "border border-l-0 border-t-0 border-gray-300",
                  ].join(" ")}
                >
                  <div className="sticky top-0">
                    <MemberSidebar
                      workspaceName={workspaceName}
                      members={members}
                      onCollapse={() => setIsMemberOpen(false)}
                      onAddMember={() => setShowInviteModal(true)}
                    />
                  </div>
                </div>
              </aside>
            ) : (
              /* 접힘 상태: 메인 컨텐츠 높이만큼 늘어나는 세로로 긴 흰색 바
                 (왼쪽 끝/Header와 맞닿음) */
              <aside className="self-stretch">
                <div
                  className={[
                    "h-full min-h-full",
                    "bg-white",
                    "rounded-br-xl",
                    "border border-l-0 border-t-0 border-gray-300",
                    "flex flex-col items-center",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setIsMemberOpen(true)}
                    aria-label="멤버 사이드바 펼치기"
                    className={[
                      "sticky top-4",
                      "mt-4",
                      "p-1.5 rounded",
                      "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                      "transition-colors cursor-pointer",
                      "border-none bg-transparent",
                      "inline-flex items-center justify-center",
                    ].join(" ")}
                  >
                    <LayoutLeftIcon className="w-4 h-4" />
                  </button>
                </div>
              </aside>
            )}

            {/* ══ 가운데: 메인 컨텐츠 ══ */}
            <main className="min-w-0 flex flex-col gap-8 pt-6">
              {/* ── 워크스페이스 정보 ── */}
              {workspaceDetail && (
                <WorkspaceInfoBar
                  workspace={workspaceDetail}
                  onSave={handleWorkspaceUpdate}
                  onSaveImage={handleCoverImageUpload}
                />
              )}

              {/* ── 항공 일정 ── */}
              <FlightSection
                flights={flights}
                rawFlights={rawFlights}
                onFlightClick={setSelectedFlight}
                onFlightDelete={(id, label) => setDeleteFlightTarget({ id, label })}
              />

              {/* ── 여행 일정 ── */}
              <ItinerarySection
                itineraryDays={itineraryDays}
                scheduleList={scheduleList}
                currentSchedule={currentSchedule}
                isLoading={isLoadingSchedule}
                isSaving={isSavingSchedule}
                onSelectVersion={handleSelectScheduleVersion}
                onSaveDay={handleSaveItineraryDay}
                onMapClick={handleMapClick}
                onDeleteItem={handleDeleteItem}
                onDeleteSchedule={handleDeleteSchedule}
              />

              {/* ── 여행 기록 ── */}
              <TravelLogSection
                travelLogs={travelLogs}
                snsLog={snsLog}
                showAddCard={showAddCard}
                onOpenAddCard={handleOpenAddCard}
                onCancelAddCard={handleCancelAddCard}
                onAddDailyCard={handleAddDailyCard}
                onAddSnsCard={handleAddSnsCard}
                onSaveTravelLog={handleSaveTravelLog}
                onDeleteTravelLog={handleDeleteTravelLog}
                onSaveSnsLog={handleSaveSnsLog}
                onDeleteSnsLog={handleDeleteSnsLog}
                onUploadSnsLog={handleUploadSnsLog}
              />

              {/* ── 위험 영역 (나가기 / 삭제) ── */}
              <DangerZone
                myRole={myRole}
                onLeave={() => setShowLeaveConfirm(true)}
                onDelete={() => setShowDeleteWorkspace(true)}
              />
            </main>

            {/* ══ 우측: AI 채팅 사이드바 (그리드 컬럼, 드래그로 폭 조절) ══ */}
            <AIChatSidebar
              isOpen={isChatOpen}
              chatWidth={chatWidth}
              workspaceId={workspaceId}
              onResizeStart={handleResizeStart}
              onCollapse={() => setIsChatOpen(false)}
              onExpand={() => setIsChatOpen(true)}
              onScheduleSaved={loadSchedule}
            />
          </div>
        </div>
      </div>

      {/* ── 멤버 초대 모달 ── */}
      {showInviteModal && (
        <InviteMemberModal
          onInvite={handleInviteSelect}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ── 초대 확인 팝업 ── */}
      <ConfirmPopup
        isOpen={inviteTarget !== null}
        onClose={() => setInviteTarget(null)}
        onConfirm={handleInviteConfirm}
        title={`${inviteTarget?.nickname}님을 초대하시겠어요?`}
        description={`${inviteTarget?.email}\n초대 요청을 보내면 상대방이 수락해야 참여됩니다.`}
        confirmLabel={isInviting ? "전송 중..." : "초대 요청 보내기"}
        cancelLabel="취소"
        variant="primary"
      />

      {/* ── 초대 토스트 ── */}
      {inviteToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-gray-900 text-white font-pretendard text-body4 px-5 py-3 rounded-xl shadow-lg">
            {inviteToast}
          </div>
        </div>
      )}

      {/* ── 나가기 확인 팝업 ── */}
      <ConfirmPopup
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveWorkspace}
        title="워크스페이스를 나가시겠어요?"
        description={isLeaving ? "처리 중..." : "나가면 다시 초대를 받아야 참여할 수 있습니다."}
        confirmLabel="나가기"
        cancelLabel="취소"
        variant="danger"
      />

      {/* ── 워크스페이스 삭제 모달 ── */}
      {showDeleteWorkspace && workspaceDetail && (
        <DeleteWorkspaceModal
          workspaceName={workspaceDetail.title}
          isDeleting={isDeletingWorkspace}
          onConfirm={handleDeleteWorkspace}
          onClose={() => setShowDeleteWorkspace(false)}
        />
      )}

      {/* ── 항공편 삭제 확인 팝업 ── */}
      <ConfirmPopup
        isOpen={deleteFlightTarget !== null}
        onClose={() => setDeleteFlightTarget(null)}
        onConfirm={handleDeleteFlightConfirm}
        title="항공편을 삭제하시겠어요?"
        description={deleteFlightTarget?.label}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />

      {/* ── 항공편 상세 모달 ── */}
      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}
    </>
  );
}
