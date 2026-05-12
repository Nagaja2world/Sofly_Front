import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchLatestSchedule,
  fetchScheduleList,
  fetchScheduleById,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  moveScheduleItem,
  type ScheduleDetail,
  type ScheduleSummary,
  type ScheduleItem,
  type ScheduleCategory,
} from "@/api/scheduleApi";
import {
  fetchWorkspaceFlights,
  fetchWorkspaceById,
  fetchWorkspaceMembers,
  updateWorkspace,
  uploadCoverImage,
  deleteWorkspace,
  deleteFlightFromWorkspace,
  leaveWorkspace,
  inviteMember,
  type Workspace,
  type WorkspaceFlight,
  type WorkspaceMemberApi,
} from "@/api/workspaceApi";
import { type UserSearchResult } from "@/api/userApi";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import MemberSidebar from "@/components/workspace/MemberSidebar";
import { type ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import { type TravelLogData } from "@/components/workspace/TravelLogCard";
import { type SnsLogData } from "@/components/workspace/SnsLogCard";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import DeleteWorkspaceModal from "@/components/workspace/DeleteWorkspaceModal";
import FlightDetailModal from "@/components/workspace/FlightDetailModal";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import AIChatSidebar from "@/components/workspace/AIChatSidebar";
import WorkspaceInfoBar from "@/components/workspace/WorkspaceInfoBar";
import FlightSection, { type FlightInfo } from "@/components/workspace/FlightSection";
import ItinerarySection, { type ItineraryDay } from "@/components/workspace/ItinerarySection";
import TravelLogSection, { type TravelLog } from "@/components/workspace/TravelLogSection";
import DangerZone from "@/components/workspace/DangerZone";

/* ── Schedule API 데이터 변환 ── */

function scheduleItemToRow(item: ScheduleItem): ItineraryRow {
  return {
    id: String(item.id),
    title: item.name,
    visitTime: item.visitTime ?? undefined,
    cost:
      item.estimatedCost != null
        ? `${item.estimatedCost.toLocaleString("ko-KR")}원`
        : undefined,
    remark: item.memo ?? undefined,
    _category: item.category,
    _address: item.address,
    _latitude: item.latitude,
    _longitude: item.longitude,
    _placeId: item.placeId,
    _photoReference: item.photoReference,
    _estimatedCost: item.estimatedCost,
  };
}

function scheduleDetailToItineraryDays(schedule: ScheduleDetail): ItineraryDay[] {
  return Object.entries(schedule.itemsByDay)
    .map(([dayStr, items]) => ({
      dayNumber: parseInt(dayStr, 10),
      rows: [...items].sort((a, b) => a.orderIndex - b.orderIndex).map(scheduleItemToRow),
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

/** "13,000원" 또는 "15000" 문자열에서 숫자 파싱 */
function parseCostString(cost?: string): number | undefined {
  if (!cost) return undefined;
  const n = parseFloat(cost.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? undefined : n;
}

/* ══════════════════════════════════════════
   API 데이터 변환
   ══════════════════════════════════════════ */

function formatKoreanTime(iso: string): { meridiem: "오전" | "오후"; time: string } {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const meridiem: "오전" | "오후" = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { meridiem, time: `${hour}:${String(m).padStart(2, "0")}` };
}

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function mapWorkspaceFlightToFlightInfo(wf: WorkspaceFlight): FlightInfo {
  const dep = formatKoreanTime(wf.departureTime);
  const arr = formatKoreanTime(wf.arrivalTime);

  const durationStr = wf.durationMinutes != null
    ? `${Math.floor(wf.durationMinutes / 60)}시간${wf.durationMinutes % 60 > 0 ? ` ${wf.durationMinutes % 60}분` : ""}`
    : "";

  return {
    id: wf.id,
    direction: wf.flightType === "OUTBOUND" ? "가는편" : "오는편",
    date: formatKoreanDate(wf.departureTime),
    legs: [
      {
        meridiem: dep.meridiem,
        time: dep.time,
        airportCode: wf.departureAirport,
        airportName: wf.departureCity ?? wf.departureAirport,
        duration: durationStr,
        airline: wf.airline,
        airlineLogo: wf.airlineLogo ?? undefined,
        flightNo: wf.flightNumber,
      },
      {
        meridiem: arr.meridiem,
        time: arr.time,
        airportCode: wf.arrivalAirport,
        airportName: wf.arrivalCity ?? wf.arrivalAirport,
        duration: durationStr,
        airline: wf.airline,
        airlineLogo: wf.airlineLogo ?? undefined,
        flightNo: wf.flightNumber,
      },
    ],
  };
}

/* (목업 데이터 제거됨 — 멤버/항공편/일정 모두 API에서 로드) */

/** 기존 본문을 Tiptap JSON으로 변환한 목업.
 *  실제 API 연결 시: 서버가 보내주는 Tiptap JSON 객체를 그대로 사용.
 *  (각 paragraph가 한 문단, image 노드로 사진을 본문 사이사이 끼워넣을 수 있음) */
const MOCK_BODY_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "프랑크푸르트 공항에 도착해 본격적인 여행을 시작했다.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "간단히 이동 후 감자 레스토랑에 들러 가볍게 식사를 하고,",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "뢰머 광장을 둘러보며 첫 도시의 분위기를 느꼈다.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "이후 호텔에 체크인하며 하루를 마무리했다.",
        },
      ],
    },
  ],
};

const MOCK_TRAVEL_LOGS: TravelLog[] = [
  {
    dayNumber: 1,
    oneLineSummary: "프랑크푸르트 여행 1일차, 날씨가 다웠다.",
    weather: "sunny",
    content: MOCK_BODY_CONTENT,
    albumPhotos: [],
  },
  {
    dayNumber: 2,
    oneLineSummary: "프랑크푸르트 여행 1일차, 날씨가 다웠다.",
    weather: "sunny",
    content: MOCK_BODY_CONTENT,
    albumPhotos: [],
  },
  {
    dayNumber: 3,
    oneLineSummary: "프랑크푸르트 여행 1일차, 날씨가 다웠다.",
    weather: "sunny",
    content: MOCK_BODY_CONTENT,
    albumPhotos: [],
  },
];


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

  /* ── 멤버 목록 (API) ── */
  const [apiMembers, setApiMembers] = useState<WorkspaceMemberApi[]>([]);

  const loadMembers = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setApiMembers(data);
    } catch (err) {
      console.warn("[WorkspacePage] 멤버 로드 실패:", err);
    }
  }, [workspaceId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  /* 현재 로그인 유저의 memberId */
  const myMemberId = apiMembers.find((m) => m.userId === user?.id)?.memberId ?? null;
  const myRole = apiMembers.find((m) => m.userId === user?.id)?.role ?? null;

  /* ── 나가기(탈퇴) ── */
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveWorkspace = async () => {
    if (myMemberId === null) return;
    setIsLeaving(true);
    try {
      await leaveWorkspace(workspaceId, myMemberId);
      navigate("/");
    } catch (err) {
      console.warn("[WorkspacePage] 나가기 실패:", err);
      setIsLeaving(false);
    }
  };

  /* ── 멤버 초대 ── */
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<UserSearchResult | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);

  const handleInviteSelect = (selectedUser: UserSearchResult) => {
    setShowInviteModal(false);
    setInviteTarget(selectedUser);
  };

  const handleInviteConfirm = async () => {
    if (!inviteTarget) return;
    setIsInviting(true);
    try {
      await inviteMember(workspaceId, inviteTarget.id);
      setInviteToast(`${inviteTarget.nickname}님에게 초대 요청을 보냈습니다.`);
      setTimeout(() => setInviteToast(null), 3500);
    } catch (err) {
      console.warn("[WorkspacePage] 초대 실패:", err);
      setInviteToast("초대 요청에 실패했습니다. 다시 시도해주세요.");
      setTimeout(() => setInviteToast(null), 3500);
    } finally {
      setIsInviting(false);
      setInviteTarget(null);
    }
  };

  /* ── 워크스페이스 삭제 모달 ── */
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

  /* ── 항공편 삭제 확인 팝업 ── */
  const [deleteFlightTarget, setDeleteFlightTarget] = useState<{ id: number; label: string } | null>(null);

  const handleDeleteFlightConfirm = async () => {
    if (!deleteFlightTarget) return;
    try {
      await deleteFlightFromWorkspace(workspaceId, deleteFlightTarget.id);
      setApiFlight((prev) => prev.filter((f) => f.id !== deleteFlightTarget.id));
    } catch (err) {
      console.warn("[WorkspacePage] 항공편 삭제 실패:", err);
    } finally {
      setDeleteFlightTarget(null);
    }
  };

  /* ── 항공 일정 (API) ── */
  const [apiFlight, setApiFlight] = useState<FlightInfo[]>([]);
  const [rawFlights, setRawFlights] = useState<WorkspaceFlight[]>([]);

  /* 항공편 상세 모달 */
  const [selectedFlight, setSelectedFlight] = useState<WorkspaceFlight | null>(null);

  const loadFlights = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    try {
      const data = await fetchWorkspaceFlights(workspaceId);
      setRawFlights(data);
      setApiFlight(data.map(mapWorkspaceFlightToFlightInfo));
    } catch (err) {
      console.warn("[WorkspacePage] 항공 일정 로드 실패:", err);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);


  /* ── 사이드바 토글 상태 ── */
  const [isMemberOpen, setIsMemberOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  /* ── 채팅 패널 리사이즈 ──
   * 드래그 핸들을 좌우로 움직여 채팅 패널 폭을 조절.
   * 패널은 fixed 포지션으로 메인 컨텐츠 위에 덮이는 방식. */
  const CHAT_MIN_WIDTH = 280;
  const CHAT_MAX_WIDTH = 720;
  const [chatWidth, setChatWidth] = useState(420);
  const resizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = chatWidth;

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = resizeStartXRef.current - ev.clientX; // 왼쪽으로 드래그 → 폭 증가
      const next = Math.min(
        CHAT_MAX_WIDTH,
        Math.max(CHAT_MIN_WIDTH, resizeStartWidthRef.current + delta),
      );
      setChatWidth(next);
    };

    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [chatWidth]);

  /* ── 여행 일정 (Schedule API) ── */
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleDetail | null>(null);
  const [scheduleList, setScheduleList] = useState<ScheduleSummary[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  /** API ScheduleItem 원본 보존 (id → item). 저장 시 category 등 비편집 필드 유지에 사용. */
  const scheduleItemsRef = useRef<Map<number, ScheduleItem>>(new Map());

  const applySchedule = useCallback((schedule: ScheduleDetail) => {
    setCurrentSchedule(schedule);
    setItineraryDays(scheduleDetailToItineraryDays(schedule));
    // 원본 아이템 맵 갱신
    const map = new Map<number, ScheduleItem>();
    for (const items of Object.values(schedule.itemsByDay)) {
      for (const item of items) map.set(item.id, item);
    }
    scheduleItemsRef.current = map;
  }, []);

  /** 최신 일정 + 버전 목록 로드 */
  const loadSchedule = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    setIsLoadingSchedule(true);
    try {
      const [latest, list] = await Promise.all([
        fetchLatestSchedule(workspaceId),
        fetchScheduleList(workspaceId),
      ]);
      if (latest) applySchedule(latest);
      else setItineraryDays([]);
      setScheduleList(list);
    } catch (err) {
      console.warn("[WorkspacePage] 일정 로드 실패:", err);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [workspaceId, applySchedule]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  /** 버전 탭 선택 */
  const handleSelectScheduleVersion = async (scheduleId: number) => {
    try {
      const schedule = await fetchScheduleById(scheduleId);
      applySchedule(schedule);
    } catch (err) {
      console.warn("[WorkspacePage] 일정 버전 로드 실패:", err);
    }
  };

  /* ── 일정 / 여행 기록 상태 ── */
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>(MOCK_TRAVEL_LOGS);

  /* ── SNS 카드 상태 ──
   * 워크스페이스당 1개. null이면 아직 만들어지지 않은 상태.
   * 항상 여행 기록 배열의 맨 왼쪽(첫 번째)에 렌더됨. */
  const [snsLog, setSnsLog] = useState<SnsLogData | null>(null);

  /* ── "추가 카드" 표시 토글 ──
   * "여행 기록" 섹션 헤더 옆 "+" 버튼 클릭 시 토글.
   * true면 카드 배열 맨 끝에 AddTravelLogCard 렌더 (선택 카드).
   * 사용자가 옵션을 선택하면 실제 카드 추가 후 자동으로 false로 닫힘. */
  const [showAddCard, setShowAddCard] = useState(false);

  /** 특정 일차의 일정 행을 갱신 (API 연동) */
  const handleSaveItineraryDay = async (dayNumber: number, newRows: ItineraryRow[]) => {
    if (!currentSchedule) return;
    const scheduleId = currentSchedule.id;
    const originalRows =
      itineraryDays.find((d) => d.dayNumber === dayNumber)?.rows ?? [];

    setIsSavingSchedule(true);
    try {
      const originalIdSet = new Set(originalRows.map((r) => r.id));
      const newIdSet = new Set(newRows.map((r) => r.id));

      // 1. 삭제된 아이템
      for (const row of originalRows) {
        if (!newIdSet.has(row.id)) {
          const numId = parseInt(row.id, 10);
          if (!isNaN(numId)) await deleteScheduleItem(scheduleId, numId);
        }
      }

      // 2. 추가 / 수정 / 위치 변경
      for (let i = 0; i < newRows.length; i++) {
        const row = newRows[i];
        const isNew = row.id.startsWith("row-");

        if (isNew) {
          // 신규 아이템
          await addScheduleItem(scheduleId, {
            day: dayNumber,
            orderIndex: i,
            category: (row._category as ScheduleCategory) ?? "ATTRACTION",
            name: row.title,
            visitTime: row.visitTime || undefined,
            estimatedCost: parseCostString(row.cost),
            memo: row.remark || undefined,
          });
        } else {
          const itemId = parseInt(row.id, 10);
          if (isNaN(itemId)) continue;

          const origItem = scheduleItemsRef.current.get(itemId);
          const originalRow = originalRows.find((r) => r.id === row.id);

          // 위치(일차 or 순서) 변경
          const originalIndex = originalRows.findIndex((r) => r.id === row.id);
          if (originalIndex !== i) {
            await moveScheduleItem(scheduleId, itemId, dayNumber, i);
          }

          // 필드 변경
          const changed =
            !originalRow ||
            row.title !== originalRow.title ||
            row.visitTime !== originalRow.visitTime ||
            row.cost !== originalRow.cost ||
            row.remark !== originalRow.remark;

          if (changed || !originalIdSet.has(row.id)) {
            await updateScheduleItem(scheduleId, itemId, {
              category: (origItem?.category ?? row._category ?? "ATTRACTION") as ScheduleCategory,
              name: row.title,
              visitTime: row.visitTime || undefined,
              estimatedCost: parseCostString(row.cost),
              memo: row.remark || undefined,
              address: origItem?.address ?? undefined,
              latitude: origItem?.latitude ?? undefined,
              longitude: origItem?.longitude ?? undefined,
              placeId: origItem?.placeId ?? undefined,
              photoReference: origItem?.photoReference ?? undefined,
            });
          }
        }
      }

      // 저장 후 최신 데이터 반영
      const updated = await fetchScheduleById(scheduleId);
      applySchedule(updated);
    } catch (err) {
      console.warn("[WorkspacePage] 일정 저장 실패:", err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  /** 특정 일차의 여행 기록을 갱신 */
  const handleSaveTravelLog = (dayNumber: number, data: TravelLogData) => {
    setTravelLogs((prev) =>
      prev.map((log) =>
        log.dayNumber === dayNumber ? { ...log, ...data } : log,
      ),
    );
    // TODO(API): PATCH /workspaces/:id/travel-log/:day { ...data }
  };

  /** 특정 일차의 여행 기록 카드를 삭제.
   *  주의: 삭제 후에도 다른 카드의 dayNumber는 변경하지 않음 (3일차 삭제 → 1, 2, 4일차 그대로).
   *  이렇게 하는 이유:
   *    - 데이터 안정성: 다른 곳에서 dayNumber를 참조하고 있을 수 있음
   *    - UX: 갑자기 4일차가 3일차로 바뀌면 사용자 혼란
   *  추후 "일차 재정렬" 기능이 필요하면 별도로 추가. */
  const handleDeleteTravelLog = (dayNumber: number) => {
    setTravelLogs((prev) => prev.filter((log) => log.dayNumber !== dayNumber));
    // TODO(API): DELETE /workspaces/:id/travel-log/:day
  };

  /* ──────────────────────────────────────────
     이슈 #25: 여행 기록 추가 기능 관련 핸들러
     ────────────────────────────────────────── */

  /** "+" 버튼 클릭 → 추가 카드 열기.
   *  닫히는 경우는 두 가지:
   *    1) 사용자가 옵션(일자별/SNS)을 선택할 때 (handleAddDailyCard / handleAddSnsCard)
   *    2) 사용자가 추가 카드 우상단 "×" 버튼을 누를 때 (handleCancelAddCard) — 실행 취소
   *  버튼은 추가 카드가 열려있는 동안 비활성화되므로 중복 호출되지 않음. */
  const handleOpenAddCard = () => {
    setShowAddCard(true);
  };

  /** 추가 카드 우상단 "×" 버튼 클릭 → 카드 추가 실행 취소.
   *  아무 카드도 추가하지 않고 AddTravelLogCard만 닫음. → "+" 버튼 다시 활성화. */
  const handleCancelAddCard = () => {
    setShowAddCard(false);
  };

  /** 추가 카드에서 "일자별 카드 추가" 선택
   *  → travelLogs 배열 끝에 빈 일자별 카드 추가 (dayNumber는 자동 증가)
   *  → 추가 카드는 닫힘 */
  const handleAddDailyCard = () => {
    setTravelLogs((prev) => {
      const nextDayNumber =
        prev.length > 0 ? Math.max(...prev.map((l) => l.dayNumber)) + 1 : 1;
      return [
        ...prev,
        {
          dayNumber: nextDayNumber,
          oneLineSummary: undefined,
          weather: undefined,
          content: undefined,
          albumPhotos: [],
        },
      ];
    });
    setShowAddCard(false);
    // TODO(API): POST /workspaces/:id/travel-log { dayNumber: nextDayNumber }
  };

  /** 추가 카드에서 "SNS용 카드 추가" 선택
   *  → SNS 카드 1개 생성 (이미 있으면 무시 — UI에서 비활성화로 막음)
   *  → 추가 카드는 닫힘 */
  const handleAddSnsCard = () => {
    if (snsLog !== null) return;
    setSnsLog({ caption: undefined, media: [] });
    setShowAddCard(false);
    // TODO(API): POST /workspaces/:id/sns-log
  };

  /** SNS 카드 편집 저장 */
  const handleSaveSnsLog = (data: SnsLogData) => {
    setSnsLog(data);
    // TODO(API): PATCH /workspaces/:id/sns-log { ...data }
  };

  /** SNS 카드 삭제 */
  const handleDeleteSnsLog = () => {
    setSnsLog(null);
    // TODO(API): DELETE /workspaces/:id/sns-log
  };

  /** SNS 카드의 "업로드" 버튼 클릭 → SNS 페이지에 게시
   *  TODO: 라우터에 SNS 피드 페이지 추가 후 navigate + 게시물 전송 로직 구현 */
  const handleUploadSnsLog = (data: SnsLogData) => {
    // TODO(API/route): POST /sns/posts { ...data } → 성공 시 navigate("/sns")
    console.log("[Workspace] upload to SNS:", data);
    alert("SNS 페이지에 업로드되었습니다. (TODO: 실제 게시 로직 구현)");
  };

  /** 특정 일차의 지도 보기
   *  ItineraryDayCard 헤더 오른쪽 "지도" 버튼 클릭 시 호출됨.
   *  추후 지도 모달/페이지를 띄워 해당 일차의 장소들을 표시할 예정. */
  const handleMapClick = (dayNumber: number) => {
    // TODO: 해당 일차의 장소들을 지도에 표시하는 모달/페이지 띄우기
    console.log("[Workspace] open map for day:", dayNumber);
  };


  /* ── 멤버: API 데이터 → WorkspaceMember 변환 ── */
  const members = apiMembers.map((m) => ({
    id: m.memberId,
    userId: m.userId,
    name: m.nickname,
    email: m.userEmail,
    avatarUrl: m.profileImageUrl ?? undefined,
    isHost: m.role === 'OWNER',
  }));
  const flights = apiFlight;

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
        <div className="w-full bg-white border-b border-gray-300">
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
