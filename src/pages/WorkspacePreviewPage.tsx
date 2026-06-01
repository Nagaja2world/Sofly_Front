import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NarrowLeftIcon from "@/assets/narrow-left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import {
  fetchWorkspaceById,
  fetchWorkspaceMembers,
  type Workspace,
} from "@/api/workspaceApi";
import FlightInfoCard from "@/components/workspace/FlightInfoCard";
import ItineraryDayCard from "@/components/workspace/ItineraryDayCard";
import TravelLogCard from "@/components/workspace/TravelLogCard";
import SectionHeader from "@/components/workspace/SectionHeader";
import { useWorkspaceFlights } from "@/hooks/useWorkspaceFlights";
import { useSchedule } from "@/hooks/useSchedule";
import { useTravelLogs } from "@/hooks/useTravelLogs";
import Button from "@/components/common/Button";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import { useImportWorkspace } from "@/hooks/useImportWorkspace";
import type { SnsPost } from "@/types/snsType";

/* ══════════════════════════════════════════
   SNS용 워크스페이스 미리보기 페이지 (이슈 #24)
   ══════════════════════════════════════════
   - SNS 게시물의 "워크스페이스 보러가기" → /workspace/:id/preview 진입.
   - 다른 사람의 (공개) 워크스페이스를 "구경"만 하는 읽기 전용 페이지.
   - 항공 일정 / 여행 일정 / 여행 기록을 실제 API에서 로드해 표시.
   - 모든 편집/삭제/추가 콜백을 넘기지 않고 readOnly로 렌더 → 변경 불가.
   - 데이터 로딩은 WorkspacePage와 동일한 훅(useWorkspaceFlights /
     useSchedule / useTravelLogs)을 그대로 재사용.

   권한(403)에 대한 설계 결정 — 중요
   - 현재 백엔드는 엔드포인트마다 권한 정책이 다르다.
     · /api/v1/schedules...           → 비참여자도 200 (열려 있음)
     · /api/workspaces/{id}           → 비참여자 403
     · /api/workspaces/{id}/flights   → 비참여자 403
     · /api/workspaces/{id}/members   → 비참여자 403
     · /api/workspaces/{id}/travellogs/full → 비참여자 403
   - 따라서 403을 "전체 차단(볼 수 없음)"으로 다루면 안 된다. 하나라도
     403이 나면 페이지 전체가 막혀버려, 정작 200으로 오는 일정조차 못 본다.
   - 대신 WorkspacePage와 동일하게 각 요청의 403을 "그 섹션만 빈 상태"로
     흡수한다. 상세/멤버 조회가 실패하면 제목·게시자명만 기본값으로 두고
     페이지는 그대로 렌더한다. (각 훅은 이미 내부 try/catch로 실패 시 빈
     배열을 유지하므로 항공/기록 섹션은 자동으로 빈 상태가 된다.)
   - 백엔드가 flights/travellogs/상세를 PUBLIC에 열어주면, 이 페이지는
     코드 변경 없이 해당 섹션들이 자동으로 채워진다.

   린트(Calling setState synchronously within an effect)
   - effect 본문에서 동기 setState를 하지 않도록, 상세 조회 결과는
     .then/.catch(비동기 콜백) 안에서만 setState 한다.
   ══════════════════════════════════════════ */

export default function WorkspacePreviewPage() {
  const navigate = useNavigate();
  const { id: workspaceIdParam } = useParams<{ id: string }>();
  const workspaceId = Number(workspaceIdParam);
  const isValidId = !!workspaceId && !isNaN(workspaceId);
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /** 뒤로가기 — SNS 페이지로 돌아가기 */
  const handleBack = () => {
    navigate("/sns");
  };

  /* ── 워크스페이스 상세(제목용) + 호스트명 ──
     비참여자에게는 403이 날 수 있다. 실패해도 페이지는 그대로 렌더하고
     제목/게시자명만 기본값으로 둔다(전체 차단 X). */
  const [workspaceDetail, setWorkspaceDetail] = useState<Workspace | null>(
    null,
  );
  const [hostName, setHostName] = useState<string>("");

  /* ── 섹션 데이터 (WorkspacePage와 동일 훅 재사용) ──
     각 훅은 내부에서 실패를 흡수하고 빈 배열을 유지하므로,
     403이 나는 섹션은 자연히 "빈 상태"로 표시된다. */
  const { flights, loadFlights } = useWorkspaceFlights(workspaceId);
  const { itineraryDays, isLoadingSchedule, loadSchedule } =
    useSchedule(workspaceId);
  const { travelLogs, loadTravelLogs } = useTravelLogs(workspaceId);

  /* ── 워크스페이스 가져오기 (SnsPostDetailPopup과 동일 동작) ──
     useImportWorkspace는 SnsPost를 받지만 실제로는 workspaceId/workspaceName만
     사용하므로, 이 페이지에서는 해당 필드만 채운 최소 객체를 넘긴다. */
  const importer = useImportWorkspace();

  const handleImport = () => {
    if (!isValidId) return;
    const minimalPost: SnsPost = {
      id: String(workspaceId),
      author: { id: "", username: "" },
      media: [],
      createdAt: new Date().toISOString(),
      workspaceId: String(workspaceId),
      workspaceName: workspaceDetail?.title ?? "",
    };
    importer.request(minimalPost);
  };

  /* 상세 조회 — 실패해도 조용히 무시 (WorkspacePage와 동일 방침) */
  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;

    fetchWorkspaceById(workspaceId)
      .then((ws) => {
        if (cancelled) return;
        setWorkspaceDetail(ws);
      })
      .catch((err) => {
        // 403(비참여) 등 — 제목만 기본값으로 두고 페이지는 그대로 표시
        console.warn(
          "[WorkspacePreviewPage] 워크스페이스 상세 조회 실패:",
          err,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, isValidId]);

  /* 호스트(OWNER) 이름 — 실패해도 게시자명만 비움 */
  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;

    fetchWorkspaceMembers(workspaceId)
      .then((members) => {
        if (cancelled) return;
        const owner = members.find((m) => m.role === "OWNER");
        setHostName(owner?.nickname ?? "");
      })
      .catch((err) =>
        console.warn("[WorkspacePreviewPage] 멤버 조회 실패:", err),
      );

    return () => {
      cancelled = true;
    };
  }, [workspaceId, isValidId]);

  /* 섹션 데이터 로드 — 상세 조회 성공 여부와 무관하게 항상 시도.
     (일정은 비참여자도 200으로 오므로 최소한 일정은 표시된다.) */
  useEffect(() => {
    if (!isValidId) return;
    loadFlights();
    loadSchedule();
    loadTravelLogs();
  }, [isValidId, loadFlights, loadSchedule, loadTravelLogs]);

  const workspaceName = workspaceDetail?.title ?? "워크스페이스";

  /* ── 뒤로가기 버튼 (공통) ── */
  const backButton = (
    <button
      type="button"
      onClick={handleBack}
      aria-label="SNS로 돌아가기"
      className={[
        "inline-flex items-center gap-1 px-2 py-1.5",
        "rounded-md",
        "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        "transition-colors cursor-pointer",
        "border-none bg-transparent",
        "font-pretendard text-body3",
      ].join(" ")}
    >
      <NarrowLeftIcon className="w-4 h-4 shrink-0" />
      <span>SNS로 돌아가기</span>
    </button>
  );

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만) — WorkspacePage와 일관성 유지
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        <p className="font-pretendard text-body3 text-gray-500 text-center m-0">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          ══════════════════════════════════════════ */}
      <div className="hidden md:block bg-background flex-1">
        {/* ── 풀폭 Header ── */}
        <div className="w-full bg-white border-b border-gray-300">
          <div className="px-4">
            <Header variant="login" onLogout={handleLogout} />
          </div>
        </div>

        {/* ── 페이지 컨텐츠 — 본문 폭 800px 중앙 정렬 ── */}
        <div className="w-full pb-12">
          <div className="max-w-[800px] mx-auto px-4 pt-6">
            {backButton}

            {/* 잘못된 id일 때만 안내, 그 외에는 항상 페이지 렌더 */}
            {!isValidId ? (
              <div className="mt-16 flex flex-col items-center gap-2 text-center">
                <p className="font-pretendard text-title3 font-semibold text-gray-900 m-0">
                  잘못된 주소예요
                </p>
                <p className="font-pretendard text-body3 text-gray-500 m-0">
                  올바른 워크스페이스 주소인지 확인해 주세요.
                </p>
              </div>
            ) : (
              <>
                {/* ── 페이지 헤더 (워크스페이스 이름 + 게시자 / 가져오기 버튼) ── */}
                <header className="mt-4 mb-8 flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h1 className="font-pretendard text-title1 font-semibold text-gray-900 m-0">
                      {workspaceName}
                    </h1>
                    {hostName && (
                      <p className="font-pretendard text-body3 text-gray-600 m-0">
                        {hostName}님이 공유한 여행
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Button btnType="solid" onClick={handleImport}>
                      워크스페이스 가져오기
                    </Button>
                  </div>
                </header>

                <main className="flex flex-col gap-8">
                  {/* ── 항공 일정 ──
                      (현재 비참여자는 403 → 빈 상태. 백엔드 개방 시 자동 표시) */}
                  <section className="flex flex-col gap-3">
                    <SectionHeader title="항공 일정" />
                    {flights.length === 0 ? (
                      <EmptyBox text="표시할 항공 일정이 없어요" />
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {flights.map((f) => (
                          <FlightInfoCard
                            key={f.id}
                            direction={f.direction}
                            date={f.date}
                            legs={f.legs}
                            bookingUrl={f.bookingUrl}
                            bookingNumber={f.bookingNumber}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ── 여행 일정 (readOnly) — 비참여자도 200으로 표시됨 ── */}
                  <section className="flex flex-col gap-3">
                    <SectionHeader title="여행 일정" />
                    {isLoadingSchedule ? (
                      <EmptyBox text="여행 일정을 불러오는 중..." />
                    ) : itineraryDays.length === 0 ? (
                      <EmptyBox text="등록된 여행 일정이 없어요" />
                    ) : (
                      <div className="flex flex-col gap-3">
                        {itineraryDays.map((d) => (
                          <ItineraryDayCard
                            key={d.dayNumber}
                            dayNumber={d.dayNumber}
                            rows={d.rows}
                            readOnly
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ── 여행 기록 (readOnly, 가로 스크롤) ──
                      (현재 비참여자는 403 → 빈 상태. 백엔드 개방 시 자동 표시) */}
                  <section className="flex flex-col gap-3">
                    <SectionHeader title="여행 기록" />
                    {travelLogs.length === 0 ? (
                      <EmptyBox text="기록된 여행 이야기가 없어요" />
                    ) : (
                      <div
                        className={[
                          "flex gap-3 overflow-x-auto pb-2",
                          "[&::-webkit-scrollbar]:h-2",
                          "[&::-webkit-scrollbar-thumb]:bg-gray-300",
                          "[&::-webkit-scrollbar-thumb]:rounded",
                        ].join(" ")}
                      >
                        {travelLogs.map((log, i) => (
                          <div key={log.id ?? i} className="shrink-0">
                            <TravelLogCard
                              mainTitle={log.mainTitle}
                              oneLineSummary={log.oneLineSummary}
                              weather={log.weather}
                              content={log.content}
                              albumPhotos={log.albumPhotos}
                              readOnly
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </main>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 워크스페이스 가져오기 확인 팝업 (SnsPostDetailPopup과 동일) ── */}
      <ConfirmPopup
        isOpen={importer.isConfirmOpen}
        onClose={importer.cancel}
        onConfirm={importer.confirm}
        title="이 워크스페이스의 여행 일정을 가져올까요?"
        description={importer.descriptionText}
        confirmLabel="가져오기"
        variant="primary"
      />
    </>
  );
}

/* ── 빈 상태 박스 (섹션 공용) ── */
function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 flex items-center justify-center text-center">
      <p className="font-pretendard text-body3 text-gray-500 m-0">{text}</p>
    </div>
  );
}
