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
import WorkspaceChatSidebar from "@/components/workspace/WorkspaceChatSidebar";
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
import { useIsCompact } from "@/hooks/useMediaQuery";
import CompactWorkspaceView from "@/components/workspace/compact/CompactWorkspaceView";
import BottomIllust from "@/assets/bottom_illust.svg?react";

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
      newCountry,
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
    const outbound =
      rawFlights.find((f) => f.flightType === "OUTBOUND") ?? rawFlights[0];
    return outbound.arrivalCity ?? outbound.arrivalAirport ?? "";
  }

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

  /* 좁은 화면(<768px) 여부 — true면 CompactWorkspaceView 렌더 */
  const isCompact = useIsCompact();

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

  const [isMemberOpen, setIsMemberOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatRoomCount, setChatRoomCount] = useState(0);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const memberUserIds = members.map((m) => m.userId);

  /* ── 워크스페이스 공유 ──
     NavBar(variant="back")의 공유 버튼에서 호출. 공유 동작 스펙이
     확정되기 전까지는 현재 URL을 클립보드에 복사하고, 결과를
     하단 토스트로 알린다. (inviteToast와 동일한 토스트 UI 패턴)

     navigator.clipboard는 보안 컨텍스트(HTTPS/localhost)에서만
     동작하고 권한 거부 시 reject되므로, 실패 시에도 사용자에게
     명확히 안내한다. */
  const [shareToast, setShareToast] = useState<string | null>(null);
  const shareToastTimerRef = useRef<number | null>(null);

  const showShareToast = (message: string) => {
    setShareToast(message);
    if (shareToastTimerRef.current) {
      window.clearTimeout(shareToastTimerRef.current);
    }
    shareToastTimerRef.current = window.setTimeout(() => {
      setShareToast(null);
      shareToastTimerRef.current = null;
    }, 2000);
  };

  /* 언마운트 시 토스트 타이머 정리 */
  useEffect(() => {
    return () => {
      if (shareToastTimerRef.current) {
        window.clearTimeout(shareToastTimerRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(url);
      showShareToast("워크스페이스 링크를 복사했어요.");
    } catch {
      showShareToast("링크 복사에 실패했어요. 주소창의 URL을 복사해 주세요.");
    }
  };

  const {
    travelLogs,
    loadTravelLogs,
    handleAddDailyCard: addDailyCard,
    handleSaveTravelLog,
    handleUploadTravellogPhotos,
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

  const [sharedAlbumPhotos, setSharedAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [albumUploading, setAlbumUploading] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumPage, setAlbumPage] = useState(0);
  const [albumHasNext, setAlbumHasNext] = useState(false);

  const loadAlbum = useCallback(
    async (wsId: number, page: number, reset: boolean) => {
      setAlbumLoading(true);
      try {
        const data = await fetchAlbum(wsId, page);
        setSharedAlbumPhotos((prev) =>
          reset ? (data.photos ?? []) : [...prev, ...(data.photos ?? [])],
        );
        setAlbumPage(page);
        setAlbumHasNext(data.hasNext ?? false);
      } catch {
        // 앨범 로드 실패 시 빈 상태 유지
      } finally {
        setAlbumLoading(false);
      }
    },
    [],
  );

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
      const uploaded = await uploadAlbumPhotos(
        Number(workspaceId),
        Array.from(files),
      );
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

  const workspaceName = workspaceDetail?.title ?? "워크스페이스";

  const travelLocation =
    workspaceDetail?.destination?.trim() ||
    extractCountryFromFlights(rawFlights);
  return (
    <>
      {isCompact ? (
        /* ══ 좁은 화면 (< 768px) ══ */
        <CompactWorkspaceView
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onBack={() => navigate(-1)}
          onShare={handleShare}
          member={{
            members,
            onAddMember: () => setShowInviteModal(true),
          }}
          flight={{
            flights,
            rawFlights,
            onFlightClick: setSelectedFlight,
            onFlightDelete: (id, label) => setDeleteFlightTarget({ id, label }),
            onAdd: () => setShowAddFlightModal(true),
          }}
          itinerary={{
            days: itineraryDays,
            onSaveDay: handleSaveItineraryDay,
            onCategoryChange: handleCategoryChange,
          }}
          travelLog={{
            travelLogs,
            snsLog,
            sharedAlbumPhotos: sharedAlbumPhotos.map((p) => p.url),
            onUpdateMainTitle: handleUpdateMainTitle,
            onSaveTravelLog: handleSaveTravelLog,
            onUploadTravellogPhotos: handleUploadTravellogPhotos,
            onDeleteTravelLog: handleDeleteTravelLog,
            onAddDailyCard: handleAddDailyCard,
            onReorderLogs: handleReorderLogs,
            onSaveSnsLog: handleSaveSnsLog,
            onDeleteSnsLog: handleDeleteSnsLog,
            onAddSnsCard: handleAddSnsCard,
          }}
          album={{
            photos: sharedAlbumPhotos,
            uploading: albumUploading,
            hasNext: albumHasNext,
            loadingMore: albumLoading,
            onAddPhotos: handleAddSharedPhotos,
            onRemovePhoto: handleRemoveSharedPhoto,
            onDownloadPhoto: handleDownloadPhoto,
            onLoadMore: handleLoadMoreAlbum,
          }}
          dangerZone={{
            myRole,
            onLeave: () => setShowLeaveConfirm(true),
            onDelete: () => setShowDeleteWorkspace(true),
          }}
          chat={{
            roomCount: chatRoomCount,
            onScheduleSaved: loadSchedule,
            onRoomCountChange: setChatRoomCount,
          }}
        />
      ) : (
        /* ══ 넓은 화면 (>= 768px) — 기존 데스크톱 ══ */
        <div className="bg-background flex-1">
          <div className="w-full bg-white border-b border-gray-300 sticky top-0 z-50">
            <div className="px-4">
              <Header variant="login" onLogout={handleLogout} />
            </div>
          </div>

          <div className="w-full pb-6">
            <div
              className="grid items-start gap-6"
              style={{
                gridTemplateColumns: `${isMemberOpen ? "240px" : "48px"} 1fr`,
              }}
            >
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

              <main className="min-w-0 flex flex-col gap-8 pt-6 pr-6">
                <FlightSection
                  flights={flights}
                  rawFlights={rawFlights}
                  onFlightClick={setSelectedFlight}
                  onFlightDelete={(id, label) =>
                    setDeleteFlightTarget({ id, label })
                  }
                  onAdd={() => setShowAddFlightModal(true)}
                />

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
                  onUploadTravellogPhotos={handleUploadTravellogPhotos}
                  onDeleteTravelLog={handleDeleteTravelLog}
                  onUpdateMainTitle={handleUpdateMainTitle}
                  onReorderLogs={handleReorderLogs}
                  onSaveSnsLog={handleSaveSnsLog}
                  onDeleteSnsLog={handleDeleteSnsLog}
                  onUploadSnsLog={handleUploadSnsLog}
                />

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

                <DangerZone
                  myRole={myRole}
                  onLeave={() => setShowLeaveConfirm(true)}
                  onDelete={() => setShowDeleteWorkspace(true)}
                />

                {/* ── 데코레이션: 메인 콘텐츠 하단 (Footer 바로 위) ── */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none select-none -mb-5"
                >
                  <BottomIllust className="w-full h-auto" />
                </div>
              </main>
            </div>
          </div>

          <AIChatSidebar
            isOpen={isChatOpen}
            workspaceId={workspaceId}
            roomCount={chatRoomCount}
            onCollapse={() => setIsChatOpen(false)}
            onExpand={() => setIsChatOpen(true)}
            onScheduleSaved={loadSchedule}
            onRoomCountChange={setChatRoomCount}
          />

          <WorkspaceChatSidebar
            isOpen={isTeamChatOpen}
            workspaceId={workspaceId}
            memberUserIds={memberUserIds}
            currentUserId={user?.id}
            onOpen={() => setIsTeamChatOpen(true)}
            onClose={() => setIsTeamChatOpen(false)}
          />
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onInvite={handleInviteSelect}
          onClose={() => setShowInviteModal(false)}
        />
      )}

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

      {inviteToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-gray-900 text-white font-pretendard text-body4 px-5 py-3 rounded-xl shadow-lg">
            {inviteToast}
          </div>
        </div>
      )}

      {/* 공유 링크 복사 결과 토스트.
          inviteToast와 동시에 뜰 일은 거의 없지만, 겹쳐도 읽히도록
          inviteToast(bottom-6)보다 한 단 위에 배치. */}
      {shareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-gray-900 text-white font-pretendard text-body4 px-5 py-3 rounded-xl shadow-lg">
            {shareToast}
          </div>
        </div>
      )}

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

      {showDeleteWorkspace && workspaceDetail && (
        <DeleteWorkspaceModal
          workspaceName={workspaceDetail.title}
          isDeleting={isDeletingWorkspace}
          onConfirm={handleDeleteWorkspace}
          onClose={() => setShowDeleteWorkspace(false)}
        />
      )}

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

      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}

      <AddFlightModal
        isOpen={showAddFlightModal}
        isSaving={isSavingFlight}
        onClose={() => setShowAddFlightModal(false)}
        onSave={handleSaveFlight}
      />
    </>
  );
}
