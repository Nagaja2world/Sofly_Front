import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchWorkspaceById,
  updateWorkspace,
  uploadCoverImage,
  deleteWorkspace,
  saveFlightToWorkspace,
  type Workspace,
  type SaveFlightPayload,
} from "@/api/workspaceApi";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import MemberSidebar from "@/components/workspace/MemberSidebar";
import { type SnsLogData } from "@/components/workspace/SnsLogCard";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import DeleteWorkspaceModal from "@/components/workspace/DeleteWorkspaceModal";
import FlightDetailModal from "@/components/workspace/FlightDetailModal";
import AddFlightModal from "@/components/workspace/AddFlightModal";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import AIChatSidebar from "@/components/workspace/AIChatSidebar";
import FlightSection from "@/components/workspace/FlightSection";
import ItinerarySection from "@/components/workspace/ItinerarySection";
import TravelLogSection from "@/components/workspace/TravelLogSection";
import SharedAlbumSection from "@/components/workspace/SharedAlbumSection";
import DangerZone from "@/components/workspace/DangerZone";
import { useSchedule } from "@/hooks/useSchedule";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useWorkspaceFlights } from "@/hooks/useWorkspaceFlights";
import { useTravelLogs } from "@/hooks/useTravelLogs";
import { resolveCoverImage, type WorkspaceFlight } from "@/api/workspaceApi";
import {
  fetchAlbum,
  uploadAlbumPhotos,
  deleteAlbumPhoto,
  getPhotoDownloadUrl,
  type AlbumPhoto,
} from "@/api/albumApi";

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
 *  │          │ 공유 앨범                   │              │
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
 *
 *  여행 일정의 지도 보기는 ItineraryDayCard 내부에서 인라인 패널로
 *  처리되므로 부모(WorkspacePage)에서 별도 콜백을 넘길 필요 없음.
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
  const [workspaceDetail, setWorkspaceDetail] = useState<Workspace | null>(
    null,
  );

  useEffect(() => {
    if (!workspaceId || isNaN(workspaceId)) return;
    fetchWorkspaceById(workspaceId)
      .then(setWorkspaceDetail)
      .catch((err) =>
        console.warn("[WorkspacePage] 워크스페이스 조회 실패:", err),
      );
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

  const handleRenameWorkspace = async (newName: string) => {
    if (!workspaceDetail) return;
    await handleWorkspaceUpdate(
      newName,
      workspaceDetail.destination,
      workspaceDetail.startDate,
      workspaceDetail.endDate,
    );
  };

  const handleChangeCountry = async (newCountry: string) => {
    if (!workspaceDetail) return;
    await handleWorkspaceUpdate(
      workspaceDetail.title,
      newCountry, // ← destination을 newCountry로 덮어씀
      workspaceDetail.startDate,
      workspaceDetail.endDate,
    );
  };

  const handleCoverImageUpload = async (file: File) => {
    const updated = await uploadCoverImage(workspaceId, file);
    setWorkspaceDetail(updated);
  };

  function extractCountryFromFlights(
    rawFlights: WorkspaceFlight[] | undefined,
  ): string {
    if (!rawFlights || rawFlights.length === 0) return "";

    /* 가는편(OUTBOUND)을 우선 찾고, 없으면 첫 항목 사용 */
    const outbound =
      rawFlights.find((f) => f.flightType === "OUTBOUND") ?? rawFlights[0];

    /* 도착 도시명이 있으면 도시명, 없으면 공항코드로 폴백 */
    return outbound.arrivalCity ?? outbound.arrivalAirport ?? "";
  }

  /* ── 커스텀 훅 ── */
  const {
    members,
    myRole,
    loadMembers,
    showLeaveConfirm,
    setShowLeaveConfirm,
    isLeaving,
    handleLeaveWorkspace,
    showInviteModal,
    setShowInviteModal,
    inviteTarget,
    setInviteTarget,
    isInviting,
    inviteToast,
    handleInviteSelect,
    handleInviteConfirm,
  } = useWorkspaceMembers(workspaceId, user?.id);

  const {
    flights,
    rawFlights,
    loadFlights,
    selectedFlight,
    setSelectedFlight,
    deleteFlightTarget,
    setDeleteFlightTarget,
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
    handleCategoryChange,
    handleDeleteItem,
    handleDeleteSchedule,
  } = useSchedule(workspaceId);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);
  useEffect(() => {
    loadFlights();
  }, [loadFlights]);
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const workspaceDetailRef = useRef<Workspace | null>(null);
  useEffect(() => {
    workspaceDetailRef.current = workspaceDetail;
  }, [workspaceDetail]);

  useEffect(() => {
    if (rawFlights.length === 0) return;
    const ws = workspaceDetailRef.current;
    if (!ws) return;

    const outbound = rawFlights.filter((f) => f.flightType === "OUTBOUND");
    const returns = rawFlights.filter((f) => f.flightType === "RETURN");

    const earliest = outbound.sort((a, b) =>
      a.departureTime.localeCompare(b.departureTime),
    )[0];
    const latest = returns.sort((a, b) =>
      b.departureTime.localeCompare(a.departureTime),
    )[0];

    const newStart = earliest
      ? earliest.departureTime.split("T")[0]
      : ws.startDate;
    const newEnd = latest ? latest.departureTime.split("T")[0] : ws.endDate;

    if (newStart !== ws.startDate || newEnd !== ws.endDate) {
      handleWorkspaceUpdate(ws.title, ws.destination, newStart, newEnd);
    }
  }, [rawFlights]);

  /* ── 항공편 수동 추가 ── */
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [isSavingFlight, setIsSavingFlight] = useState(false);

  const handleSaveFlight = async (payload: SaveFlightPayload) => {
    setIsSavingFlight(true);
    try {
      await saveFlightToWorkspace(workspaceId, payload);
      setShowAddFlightModal(false);
      await loadFlights();
    } catch (err) {
      console.warn("[WorkspacePage] 항공편 저장 실패:", err);
    } finally {
      setIsSavingFlight(false);
    }
  };

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
  const [chatRoomCount, setChatRoomCount] = useState(0);

  /* ── 여행 기록 ── */
  const {
    travelLogs,
    loadTravelLogs,
    handleAddDailyCard: addDailyCard,
    handleSaveTravelLog,
    handleDeleteTravelLog,
    handleUpdateMainTitle,
    handleReorderLogs,
  } = useTravelLogs(workspaceId);

  useEffect(() => {
    loadTravelLogs();
  }, [loadTravelLogs]);

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

  /* ── 공유 앨범 ── */
  const [sharedAlbumPhotos, setSharedAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [albumUploading, setAlbumUploading] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumPage, setAlbumPage] = useState(0);
  const [albumHasNext, setAlbumHasNext] = useState(false);

  const loadAlbum = useCallback(async (wsId: number, page: number, reset: boolean) => {
    setAlbumLoading(true);
    try {
      const data = await fetchAlbum(wsId, page);
      setSharedAlbumPhotos((prev) => reset ? (data.photos ?? []) : [...prev, ...(data.photos ?? [])]);
      setAlbumPage(page);
      setAlbumHasNext(data.hasNext ?? false);
    } catch {
      // 앨범 로드 실패 시 빈 상태 유지
    } finally {
      setAlbumLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!workspaceId || isNaN(workspaceId)) return;
    loadAlbum(workspaceId, 0, true);
  }, [workspaceId, loadAlbum]);

  const handleLoadMoreAlbum = () => {
    if (!workspaceId || albumLoading || !albumHasNext) return;
    loadAlbum(workspaceId, albumPage + 1, false);
  };

  const handleAddSharedPhotos = async (files: FileList) => {
    if (!workspaceId) return;
    setAlbumUploading(true);
    try {
      const uploaded = await uploadAlbumPhotos(Number(workspaceId), Array.from(files));
      setSharedAlbumPhotos((prev) => [...prev, ...uploaded]);
    } catch {
      alert("사진 업로드에 실패했습니다.");
    } finally {
      setAlbumUploading(false);
    }
  };

  const handleRemoveSharedPhoto = async (photoId: number) => {
    if (!workspaceId) return;
    try {
      await deleteAlbumPhoto(Number(workspaceId), photoId);
      setSharedAlbumPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch {
      alert("사진 삭제에 실패했습니다.");
    }
  };

  const handleDownloadPhoto = async (photoId: number) => {
    if (!workspaceId) return;
    try {
      const url = await getPhotoDownloadUrl(Number(workspaceId), photoId);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.target = "_blank";
      a.click();
    } catch {
      alert("다운로드 URL을 가져오는 데 실패했습니다.");
    }
  };

  /* ── 워크스페이스명 ── */
  const workspaceName = workspaceDetail?.title ?? "워크스페이스";

  const travelLocation =
    workspaceDetail?.destination?.trim() ||
    extractCountryFromFlights(rawFlights);
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
              gridTemplateColumns: `${isMemberOpen ? "240px" : "48px"} 1fr`,
            }}
          >
            {/* ══ 좌측: 멤버 사이드바 (펼침/접힘) ══ */}
            {isMemberOpen ? (
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
                      coverImageUrl={
                        workspaceDetail
                          ? resolveCoverImage(
                              workspaceDetail.coverImageUrl,
                              workspaceDetail.id,
                            )
                          : null
                      }
                      country={travelLocation}
                      onCollapse={() => setIsMemberOpen(false)}
                      onAddMember={() => setShowInviteModal(true)}
                      onRenameWorkspace={handleRenameWorkspace}
                      onChangeCountry={handleChangeCountry}
                      onChangeCoverImage={handleCoverImageUpload}
                    />
                  </div>
                </div>
              </aside>
            ) : (
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
            <main className="min-w-0 flex flex-col gap-8 pt-6 pr-6">
              {/* ── 항공 일정 ── */}
              <FlightSection
                flights={flights}
                rawFlights={rawFlights}
                onFlightClick={setSelectedFlight}
                onFlightDelete={(id, label) =>
                  setDeleteFlightTarget({ id, label })
                }
                onAdd={() => setShowAddFlightModal(true)}
              />

              {/* ── 여행 일정 ──
                  지도 보기는 ItineraryDayCard 내부에서 인라인으로 처리되므로
                  여기서 onMapClick을 넘기지 않음. */}
              <ItinerarySection
                itineraryDays={itineraryDays}
                scheduleList={scheduleList}
                currentSchedule={currentSchedule}
                isLoading={isLoadingSchedule}
                isSaving={isSavingSchedule}
                onSelectVersion={handleSelectScheduleVersion}
                onSaveDay={handleSaveItineraryDay}
                onDeleteItem={handleDeleteItem}
                onCategoryChange={handleCategoryChange}
                onDeleteSchedule={handleDeleteSchedule}
              />

              {/* ── 여행 기록 ── */}
              <TravelLogSection
                travelLogs={travelLogs}
                snsLog={snsLog}
                showAddCard={showAddCard}
                sharedAlbumPhotos={sharedAlbumPhotos.map((p) => p.url)}
                onOpenAddCard={handleOpenAddCard}
                onCancelAddCard={handleCancelAddCard}
                onAddDailyCard={handleAddDailyCard}
                onAddSnsCard={handleAddSnsCard}
                onSaveTravelLog={handleSaveTravelLog}
                onDeleteTravelLog={handleDeleteTravelLog}
                onUpdateMainTitle={handleUpdateMainTitle}
                onReorderLogs={handleReorderLogs}
                onSaveSnsLog={handleSaveSnsLog}
                onDeleteSnsLog={handleDeleteSnsLog}
                onUploadSnsLog={handleUploadSnsLog}
              />

              {/* ── 공유 앨범 ── */}
              <SharedAlbumSection
                photos={sharedAlbumPhotos}
                uploading={albumUploading}
                hasNext={albumHasNext}
                loadingMore={albumLoading}
                onAddPhotos={handleAddSharedPhotos}
                onRemovePhoto={handleRemoveSharedPhoto}
                onDownloadPhoto={handleDownloadPhoto}
                onLoadMore={handleLoadMoreAlbum}
              />

              {/* ── 위험 영역 (나가기 / 삭제) ── */}
              <DangerZone
                myRole={myRole}
                onLeave={() => setShowLeaveConfirm(true)}
                onDelete={() => setShowDeleteWorkspace(true)}
              />
            </main>

          </div>
        </div>

        {/* ══ AI 채팅 (floating 버튼 + 오른쪽 오버레이 패널) ══ */}
        <AIChatSidebar
          isOpen={isChatOpen}
          workspaceId={workspaceId}
          roomCount={chatRoomCount}
          onCollapse={() => setIsChatOpen(false)}
          onExpand={() => setIsChatOpen(true)}
          onScheduleSaved={loadSchedule}
          onRoomCountChange={setChatRoomCount}
        />
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
        description={
          isLeaving
            ? "처리 중..."
            : "나가면 다시 초대를 받아야 참여할 수 있습니다."
        }
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

      {/* ── 항공편 수동 추가 모달 ── */}
      <AddFlightModal
        isOpen={showAddFlightModal}
        isSaving={isSavingFlight}
        onClose={() => setShowAddFlightModal(false)}
        onSave={handleSaveFlight}
      />
    </>
  );
}
