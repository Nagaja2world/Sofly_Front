import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchWorkspaceFlights,
  fetchWorkspaceById,
  updateWorkspace,
  type Workspace,
  type WorkspaceFlight,
} from "@/api/workspaceApi";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import MemberSidebar, {
  type WorkspaceMember,
} from "@/components/workspace/MemberSidebar";
import FlightInfoCard, {
  type FlightLegInfo,
} from "@/components/workspace/FlightInfoCard";
import ItineraryDayCard, {
  type ItineraryRow,
} from "@/components/workspace/ItineraryDayCard";
import TravelLogCard, {
  type WeatherType,
  type TravelLogData,
} from "@/components/workspace/TravelLogCard";
import SnsLogCard, { type SnsLogData } from "@/components/workspace/SnsLogCard";
import AddTravelLogCard from "@/components/workspace/AddTravelLogCard";
import PlusIcon from "@/assets/plus.svg?react";
import type { JSONContent } from "@tiptap/core";
import ChatPanel, {
  type ChatMessageData,
} from "@/components/chatting/ChatPanel";

/* ══════════════════════════════════════════
   타입 (페이지 단위 데이터 모델)
   ══════════════════════════════════════════ */

interface FlightInfo {
  direction: "가는편" | "오는편";
  date: string;
  legs: FlightLegInfo[];
  bookingUrl?: string;
  bookingNumber?: string;
}

interface ItineraryDay {
  dayNumber: number;
  rows: ItineraryRow[];
}

interface TravelLog {
  dayNumber: number;
  oneLineSummary?: string;
  weather?: WeatherType;
  /** 본문 (Tiptap JSON 문서). API 연결 시 백엔드도 동일한 JSON 포맷으로 주고받음. */
  content?: JSONContent;
  albumPhotos?: string[];
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

/* ══════════════════════════════════════════
   목업 데이터
   ══════════════════════════════════════════ */

const MOCK_MEMBERS: WorkspaceMember[] = [
  { id: "1", name: "홍길동", isHost: true },
  { id: "2", name: "이대화" },
  { id: "3", name: "김갑자" },
  { id: "4", name: "박조원" },
  { id: "5", name: "조마마" },
];

const MOCK_ITINERARY_DAYS: ItineraryDay[] = [
  {
    dayNumber: 1,
    rows: [
      {
        id: "d1-1",
        title: "공항 도착",
        stayDuration: "30분",
        transport: "대중교통",
        moveDuration: "1시간",
        cost: "13,000원",
      },
      {
        id: "d1-2",
        title: "감자 레스토랑",
        stayDuration: "1시간",
        transport: "대중교통",
        moveDuration: "30분",
        cost: "7,000원",
      },
      {
        id: "d1-3",
        title: "뢰머 광장",
        stayDuration: "1시간 30분",
        transport: "대중교통",
        moveDuration: "1시간",
      },
      {
        id: "d1-4",
        title: "프랑크푸르트 호텔",
        transport: "대중교통",
        moveDuration: "1시간 30분",
      },
    ],
  },
  {
    dayNumber: 2,
    rows: [
      { id: "d2-1", title: "호텔 조식", stayDuration: "1시간" },
      { id: "d2-2", title: "프랑크푸르트 호텔 체크아웃" },
      {
        id: "d2-3",
        title: "뢰머 광장",
        stayDuration: "1시간 30분",
        transport: "대중교통",
        moveDuration: "1시간",
      },
      {
        id: "d2-4",
        title: "브렉퍼스트",
        stayDuration: "2시간",
        transport: "대중교통",
        moveDuration: "1시간 30분",
      },
    ],
  },
];

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

const MOCK_INITIAL_MESSAGES: ChatMessageData[] = [
  {
    id: "m1",
    role: "user",
    text: "여자 3명이서 오사카 여행가는데 일정 짜줘.",
    pageIndex: 1,
    pageTotal: 1,
  },
];

/* ══════════════════════════════════════════
   워크스페이스 정보 바 (조회 + 인라인 편집)
   ══════════════════════════════════════════ */

interface WorkspaceInfoBarProps {
  workspace: Workspace;
  onSave: (title: string, destination: string, startDate: string, endDate: string) => Promise<void>;
}

function WorkspaceInfoBar({ workspace, onSave }: WorkspaceInfoBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(workspace.title);
  const [destination, setDestination] = useState(workspace.destination);
  const [startDate, setStartDate] = useState(workspace.startDate);
  const [endDate, setEndDate] = useState(workspace.endDate);

  // workspace prop이 바뀌면 폼 초기화
  useEffect(() => {
    setTitle(workspace.title);
    setDestination(workspace.destination);
    setStartDate(workspace.startDate);
    setEndDate(workspace.endDate);
  }, [workspace]);

  const handleCancel = () => {
    setTitle(workspace.title);
    setDestination(workspace.destination);
    setStartDate(workspace.startDate);
    setEndDate(workspace.endDate);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(title, destination, startDate, endDate);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = [
    "font-pretendard text-body3 text-gray-900 rounded-lg border border-gray-300",
    "px-2.5 py-1.5 focus:outline-none focus:border-primary bg-white w-full",
  ].join(" ");

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">여행 제목</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="여행 제목"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">목적지</label>
            <input
              className={inputClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="목적지"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">출발일</label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-pretendard text-body5 text-gray-500">귀국일</label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={[
              "font-pretendard text-body4 px-4 py-1.5 rounded-lg border border-gray-300",
              "text-gray-600 hover:bg-gray-50 cursor-pointer bg-transparent transition-colors",
              isSaving ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={[
              "font-pretendard text-body4 px-4 py-1.5 rounded-lg border-none",
              "bg-primary text-gray-900 font-semibold cursor-pointer hover:brightness-95 transition-all",
              isSaving ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
          {workspace.title}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 shrink-0">
          {workspace.destination !== "string" ? workspace.destination : "목적지 미정"}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 shrink-0">
          {workspace.startDate} ~ {workspace.endDate}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={[
          "shrink-0 font-pretendard text-body5 text-gray-500 px-3 py-1.5 rounded-lg",
          "border border-gray-200 hover:border-gray-400 hover:text-gray-700",
          "bg-transparent cursor-pointer transition-colors",
        ].join(" ")}
      >
        편집
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   섹션 헤더 (항공 일정 / 여행 일정 / 여행 기록)
   ══════════════════════════════════════════ */

/**
 * 섹션 헤더.
 * `action` prop을 통해 헤더 제목 바로 오른쪽에 버튼 등을 추가할 수 있음.
 * (예: "여행 기록" 옆 "+" 버튼)
 */
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
        {title}
      </h2>
      {action}
    </div>
  );
}

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
  const { logout } = useAuthStore();

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

  /* ── 항공 일정 (API) ── */
  const [apiFlight, setApiFlight] = useState<FlightInfo[]>([]);

  const loadFlights = useCallback(async () => {
    if (!workspaceId || isNaN(workspaceId)) return;
    try {
      const data = await fetchWorkspaceFlights(workspaceId);
      setApiFlight(data.map(mapWorkspaceFlightToFlightInfo));
    } catch (err) {
      console.warn("[WorkspacePage] 항공 일정 로드 실패:", err);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  /* ── 채팅 상태 ── */
  const [messages, setMessages] = useState<ChatMessageData[]>(
    MOCK_INITIAL_MESSAGES,
  );
  const [isThinking, setIsThinking] = useState(false);

  /* ── 사이드바 토글 상태 ──
   * 좌(멤버) / 우(채팅) 각각 독립적으로 펼침/접힘 제어.
   * 접히면 collapsed bar(48px)만 남고, 그 안의 토글 버튼으로 다시 펼칠 수 있음. */
  const [isMemberOpen, setIsMemberOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  /* ── 일정 / 여행 기록 상태 ──
   * 카드별 편집 모드 → 저장 시 onSave 콜백으로 여기 state를 갱신.
   * API 연결 시: onSave 안에서 PATCH 호출 후 응답으로 state 갱신하면 됨. */
  const [itineraryDays, setItineraryDays] =
    useState<ItineraryDay[]>(MOCK_ITINERARY_DAYS);
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

  /** 특정 일차의 일정 행을 갱신 */
  const handleSaveItineraryDay = (dayNumber: number, rows: ItineraryRow[]) => {
    setItineraryDays((prev) =>
      prev.map((d) => (d.dayNumber === dayNumber ? { ...d, rows } : d)),
    );
    // TODO(API): PATCH /workspaces/:id/itinerary/:day { rows }
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

  /* ── 메시지 전송 (목업: 1초 뒤 가짜 AI 응답) ── */
  const handleSend = (text: string) => {
    const userMsg: ChatMessageData = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      pageIndex: 1,
      pageTotal: 1,
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsThinking(true);
    setTimeout(() => {
      const aiMsg: ChatMessageData = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: "요청하신 일정을 정리했어요. 마음에 드시면 아래에서 저장해 보세요.",
        isItinerarySuggestion: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1000);
  };

  /* ── 일정 저장 (목업) ── */
  const handleSaveItinerary = (messageId: string) => {
    // TODO: 해당 AI 메시지의 일정 데이터를 워크스페이스에 반영
    console.log("[Workspace] save itinerary from message:", messageId);
  };

  /* ── 멤버 (목업) ── */
  const members = MOCK_MEMBERS;
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
              gridTemplateColumns: `${
                isMemberOpen ? "240px" : "48px"
              } 1fr ${isChatOpen ? "380px" : "48px"}`,
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
                      onAddMember={() => {
                        // TODO: 멤버 추가 모달
                      }}
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
                />
              )}

              {/* ── 항공 일정 ── */}
              <section className="flex flex-col gap-3">
                <SectionHeader title="항공 일정" />
                {flights.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 flex flex-col items-center gap-2 text-center">
                    <p className="font-pretendard text-body3 text-gray-700 m-0">
                      저장된 항공편이 없어요
                    </p>
                    <p className="font-pretendard text-body4 text-gray-400 m-0">
                      항공 검색에서 원하는 항공편을 찾아 이 워크스페이스에 저장해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* 가는편(OUTBOUND) 왼쪽, 오는편(RETURN) 오른쪽 */}
                    {[
                      flights.find((f) => f.direction === "가는편"),
                      flights.find((f) => f.direction === "오는편"),
                    ]
                      .filter(Boolean)
                      .map((f, i) => (
                        <FlightInfoCard
                          key={i}
                          direction={f!.direction}
                          date={f!.date}
                          legs={f!.legs}
                          bookingUrl={f!.bookingUrl}
                          bookingNumber={f!.bookingNumber}
                        />
                      ))}
                    {flights
                      .filter((f) => f.direction !== "가는편" && f.direction !== "오는편")
                      .map((f, i) => (
                        <FlightInfoCard
                          key={`extra-${i}`}
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

              {/* ── 여행 일정 ── */}
              <section className="flex flex-col gap-3">
                <SectionHeader title="여행 일정" />
                <div className="flex flex-col gap-3">
                  {itineraryDays.map((d) => (
                    <ItineraryDayCard
                      key={d.dayNumber}
                      dayNumber={d.dayNumber}
                      rows={d.rows}
                      onSave={(rows) =>
                        handleSaveItineraryDay(d.dayNumber, rows)
                      }
                      onMapClick={handleMapClick}
                    />
                  ))}
                </div>
              </section>

              {/* ── 여행 기록 ──
                  이슈 #25: 섹션 헤더 옆 "+" 버튼으로 카드 추가 가능.
                  - SNS 카드: 항상 맨 왼쪽 (있을 때만 렌더)
                  - 일자별 카드: 1일차, 2일차, ... 순으로 정렬 (자동 dayNumber)
                  - "+" 클릭 시 맨 끝(맨 오른쪽)에 AddTravelLogCard 표시 */}
              <section className="flex flex-col gap-3">
                <SectionHeader
                  title="여행 기록"
                  action={
                    <button
                      type="button"
                      onClick={handleOpenAddCard}
                      disabled={showAddCard}
                      aria-label={
                        showAddCard
                          ? "여행 기록 카드 추가 (열림)"
                          : "여행 기록 카드 추가"
                      }
                      className={[
                        "inline-flex items-center justify-center",
                        "w-8 h-8 rounded-full transition-colors border-none bg-transparent",
                        showAddCard
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
                      ].join(" ")}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  }
                />
                {/* 가로 스크롤 컨테이너: 카드 폭이 396px이라 좁은 화면에선 1~2개,
                    넓은 화면에선 3개 정도 자연스럽게 보임 */}
                <div
                  className={[
                    "flex gap-3 overflow-x-auto pb-2",
                    "[&::-webkit-scrollbar]:h-2",
                    "[&::-webkit-scrollbar-thumb]:bg-gray-300",
                    "[&::-webkit-scrollbar-thumb]:rounded",
                  ].join(" ")}
                >
                  {/* SNS 카드: 항상 맨 왼쪽 (이슈 #25 명시) */}
                  {snsLog && (
                    <div className="shrink-0">
                      <SnsLogCard
                        caption={snsLog.caption}
                        media={snsLog.media}
                        onSave={handleSaveSnsLog}
                        onDelete={handleDeleteSnsLog}
                        onUpload={handleUploadSnsLog}
                      />
                    </div>
                  )}

                  {/* 일자별 카드들 */}
                  {travelLogs.map((log) => (
                    <div key={log.dayNumber} className="shrink-0">
                      <TravelLogCard
                        dayNumber={log.dayNumber}
                        oneLineSummary={log.oneLineSummary}
                        weather={log.weather}
                        content={log.content}
                        albumPhotos={log.albumPhotos}
                        onSave={(data) =>
                          handleSaveTravelLog(log.dayNumber, data)
                        }
                        onDelete={() => handleDeleteTravelLog(log.dayNumber)}
                      />
                    </div>
                  ))}

                  {/* 추가 카드: "+" 버튼 클릭 시 맨 끝에 표시.
                      우상단 "×"를 누르면 onCancel이 호출되어 그냥 닫힘 (실행 취소). */}
                  {showAddCard && (
                    <AddTravelLogCard
                      onAddDailyCard={handleAddDailyCard}
                      onAddSnsCard={handleAddSnsCard}
                      onCancel={handleCancelAddCard}
                      disableSnsCard={snsLog !== null}
                    />
                  )}
                </div>
              </section>
            </main>

            {/* ══ 우측: AI 채팅 패널 (펼침/접힘) ══
                - 우측/상단 테두리 없음 → 화면 오른쪽 끝/Header와 맞닿음
                - 좌하 모서리만 둥글게 (컨텐츠 쪽만 둥근 형태)
                - 펼침: sticky로 viewport 높이만큼 차지
                - 접힘: self-stretch로 메인 컨텐츠와 같은 높이까지 흰색 바가 길게 늘어남 */}
            {isChatOpen ? (
              <aside className="sticky top-0 self-start h-[calc(100vh-5rem)]">
                <ChatPanel
                  messages={messages}
                  onSend={handleSend}
                  onSaveItinerary={handleSaveItinerary}
                  onEditMessage={(id) => console.log("edit", id)}
                  onCopyMessage={(id) => console.log("copy", id)}
                  onPrevPage={(id) => console.log("prev", id)}
                  onNextPage={(id) => console.log("next", id)}
                  isThinking={isThinking}
                  onCollapse={() => setIsChatOpen(false)}
                  /* ChatPanel 기본 스타일을 덮어써서 좌하만 둥글고 우/상 테두리 제거 */
                  className="!rounded-none !rounded-bl-xl !border-0 border-l border-b border-gray-300 h-full"
                />
              </aside>
            ) : (
              /* 접힘 상태: 메인 컨텐츠 높이만큼 늘어나는 세로로 긴 흰색 바
                 (오른쪽 끝/Header와 맞닿음) */
              <aside className="self-stretch">
                <div
                  className={[
                    "h-full min-h-full",
                    "bg-white",
                    "rounded-bl-xl",
                    "border border-r-0 border-t-0 border-gray-300",
                    "flex flex-col items-center",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    aria-label="채팅 패널 펼치기"
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
                    {/* layout_left 아이콘을 좌우 반전: '오른쪽 패널 펼치기' 의미 */}
                    <LayoutLeftIcon className="w-4 h-4 -scale-x-100" />
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
