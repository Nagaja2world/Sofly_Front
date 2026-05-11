import { useNavigate } from "react-router-dom";
import NarrowLeftIcon from "@/assets/narrow-left.svg?react";
import Header from "@/components/common/Header";
import useAuthStore from "@/store/useAuthStore";
import type { WorkspaceMember } from "@/components/workspace/MemberSidebar";
import FlightInfoCard, {
  type FlightLegInfo,
} from "@/components/workspace/FlightInfoCard";
import ItineraryDayCard, {
  type ItineraryRow,
} from "@/components/workspace/ItineraryDayCard";
import TravelLogCard, {
  type WeatherType,
} from "@/components/workspace/TravelLogCard";
import type { JSONContent } from "@tiptap/core";

/* ══════════════════════════════════════════
   타입 (페이지 단위 데이터 모델)
   - WorkspacePage와 동일한 구조를 사용
   - 추후 공용 타입 파일로 분리 고려
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
  content?: JSONContent;
  albumPhotos?: string[];
}

/* ══════════════════════════════════════════
   목업 데이터
   - WorkspacePage와 동일한 mock을 사용 (이슈 #24의 "다른 사람의 워크스페이스를
     미리보기"라는 시맨틱 상, 실제 API 연결 시 :id에 맞는 워크스페이스를 fetch).
   - 추후 공통 mock 또는 API 호출 훅으로 분리.
   ══════════════════════════════════════════ */

const MOCK_WORKSPACE_NAME = "프랑크푸르트 여행";

const MOCK_MEMBERS: WorkspaceMember[] = [
  { id: "1", name: "홍길동", isHost: true },
  { id: "2", name: "이대화" },
  { id: "3", name: "김갑자" },
  { id: "4", name: "박조원" },
  { id: "5", name: "조마마" },
];

const MOCK_FLIGHTS: FlightInfo[] = [
  {
    direction: "가는편",
    date: "2026년 3월 11일",
    legs: [
      {
        meridiem: "오전",
        time: "11:10",
        airportCode: "ICN",
        airportName: "인천국제공항",
        duration: "2시간 20분",
        airline: "대한항공",
        flightNo: "FN0312",
      },
      {
        meridiem: "오후",
        time: "12:30",
        airportCode: "PEK",
        airportName: "베이징캐피탈",
        duration: "2시간 20분",
        airline: "대한항공",
        flightNo: "FN0313",
      },
    ],
    bookingUrl: "https://www.myrealtrip.com/dfsg...",
    bookingNumber: "2603140000007895321",
  },
  {
    direction: "오는편",
    date: "2026년 3월 14일",
    legs: [
      {
        meridiem: "오전",
        time: "11:10",
        airportCode: "FRA",
        airportName: "프랑크푸르트",
        duration: "2시간 20분",
        airline: "대한항공",
        flightNo: "FN0312",
      },
      {
        meridiem: "오후",
        time: "12:30",
        airportCode: "GMP",
        airportName: "김포공항",
        duration: "2시간 20분",
        airline: "대한항공",
        flightNo: "FN0313",
      },
    ],
    bookingUrl: "https://www.myrealtrip.com/dfsg...",
    bookingNumber: "2603140000007895321",
  },
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
    oneLineSummary: "프랑크푸르트 여행 2일차, 날씨가 다웠다.",
    weather: "sunny",
    content: MOCK_BODY_CONTENT,
    albumPhotos: [],
  },
  {
    dayNumber: 3,
    oneLineSummary: "프랑크푸르트 여행 3일차, 날씨가 다웠다.",
    weather: "sunny",
    content: MOCK_BODY_CONTENT,
    albumPhotos: [],
  },
];

/* ══════════════════════════════════════════
   섹션 헤더
   - WorkspacePage의 SectionHeader와 동일하지만 미리보기는 "+" 등의 action이 없으므로 단순화
   ══════════════════════════════════════════ */

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
      {title}
    </h2>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS용 워크스페이스 미리보기 페이지 (이슈 #24)
 *
 * - 다른 사람이 SNS 페이지에 게시한 워크스페이스를 "구경"만 하는 페이지.
 * - 편집/삭제/추가 등 모든 변경 동작이 비활성화됨 (각 카드에 readOnly={true}).
 * - 좌측 멤버 사이드바, 우측 AI 채팅 패널 모두 없음.
 *
 * 레이아웃 (데스크톱)
 *  ┌──────────────────────────────────────────┐
 *  │             Header (공통)                │
 *  ├──────────────────────────────────────────┤
 *  │  ← SNS로 돌아가기                        │
 *  │                                          │
 *  │       프랑크푸르트 여행                  │
 *  │       홍길동님이 공유한 여행             │
 *  │                                          │
 *  │       항공 일정                          │
 *  │       [가는편]  [오는편]                 │
 *  │                                          │
 *  │       여행 일정                          │
 *  │       [1일차]                            │
 *  │       [2일차]                            │
 *  │                                          │
 *  │       여행 기록                          │
 *  │       [1일차] [2일차] [3일차] →          │
 *  │                                          │
 *  └──────────────────────────────────────────┘
 *
 * - 본문 폭은 max-w-[800px] (인스타그램 게시물 느낌)
 * - SNS 카드는 표시하지 않음 (이미 SNS 페이지에서 본 카드를 클릭해서 들어왔으므로)
 *
 * 모바일 (md 미만)
 *  - WorkspacePage와 동일하게 "준비 중" 메시지만 표시. (별도 작업으로 분리)
 *
 * 데이터
 *  - 현재는 mock 데이터를 그대로 사용. URL의 :id는 라우팅을 위해 받지만 미사용.
 *  - API 연결 시 useEffect + fetch(`/workspaces/${id}/preview`)로 교체.
 */
export default function WorkspacePreviewPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /** 뒤로가기 (SNS 페이지로 돌아가기)
   *  - SNS 페이지가 아직 없으므로 일단 navigate(-1)로 브라우저 히스토리 사용.
   *  - 추후 SNS 라우트가 생기면 navigate("/sns")로 명시적으로 이동하도록 수정. */
  const handleBack = () => {
    navigate(-1);
  };

  /* ── mock 데이터 ── */
  const workspaceName = MOCK_WORKSPACE_NAME;
  const flights = MOCK_FLIGHTS;
  const itineraryDays = MOCK_ITINERARY_DAYS;
  const travelLogs = MOCK_TRAVEL_LOGS;

  /** 호스트(게시자) 이름 추출.
   *  - 워크스페이스 멤버 중 isHost === true인 멤버가 게시자.
   *  - 없는 경우는 데이터 무결성 상 발생하면 안 되지만, 안전하게 fallback 처리. */
  const hostName =
    MOCK_MEMBERS.find((m) => m.isHost)?.name ?? "알 수 없는 사용자";

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

        {/* ── 페이지 컨텐츠 ──
            본문 폭 800px 중앙 정렬, 좌우 사이드바 없음 */}
        <div className="w-full pb-12">
          <div className="max-w-[800px] mx-auto px-4 pt-6">
            {/* ── 1. 뒤로가기 버튼 ── */}
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

            {/* ── 2. 페이지 헤더 (워크스페이스 이름 + 게시자 정보) ── */}
            <header className="mt-4 mb-8 flex flex-col gap-1">
              <h1 className="font-pretendard text-title1 font-semibold text-gray-900 m-0">
                {workspaceName}
              </h1>
              <p className="font-pretendard text-body3 text-gray-600 m-0">
                {hostName}님이 공유한 여행
              </p>
            </header>

            {/* ── 3. 본문 (항공 일정 / 여행 일정 / 여행 기록) ── */}
            <main className="flex flex-col gap-8">
              {/* ── 항공 일정 ── */}
              <section className="flex flex-col gap-3">
                <SectionHeader title="항공 일정" />
                {/* 본문 폭 800px이라 lg(1024px) 미만에선 항상 1열로 펼쳐짐.
                    워크스페이스 페이지와 동일한 grid 패턴을 유지하되 미리보기에선 1열 고정해도 무방. */}
                <div className="grid grid-cols-1 gap-3">
                  {flights.map((f, i) => (
                    <FlightInfoCard
                      key={i}
                      direction={f.direction}
                      date={f.date}
                      legs={f.legs}
                      bookingUrl={f.bookingUrl}
                      bookingNumber={f.bookingNumber}
                    />
                  ))}
                </div>
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
                      readOnly
                      /* onMapClick은 의도적으로 넘기지 않음.
                         미리보기에서도 지도 보기는 의미가 있지만, 별도 이슈에서 결정 후 추가 예정.
                         (이슈 #24 범위에서는 편집/추가/삭제 등 변경 동작 차단에 집중.) */
                    />
                  ))}
                </div>
              </section>

              {/* ── 여행 기록 ──
                  - SNS 카드는 표시하지 않음 (이미 SNS 페이지에서 본 카드를 클릭해서 들어왔으므로).
                  - 일자별 카드만 렌더. 모두 readOnly.
                  - "+" 추가 버튼도 없음.
                  - 가로 스크롤은 워크스페이스 페이지와 동일하게 유지. */}
              <section className="flex flex-col gap-3">
                <SectionHeader title="여행 기록" />
                <div
                  className={[
                    "flex gap-3 overflow-x-auto pb-2",
                    "[&::-webkit-scrollbar]:h-2",
                    "[&::-webkit-scrollbar-thumb]:bg-gray-300",
                    "[&::-webkit-scrollbar-thumb]:rounded",
                  ].join(" ")}
                >
                  {travelLogs.map((log) => (
                    <div key={log.dayNumber} className="shrink-0">
                      <TravelLogCard
                        dayNumber={log.dayNumber}
                        oneLineSummary={log.oneLineSummary}
                        weather={log.weather}
                        content={log.content}
                        albumPhotos={log.albumPhotos}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
