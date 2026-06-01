import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsCompact } from "@/hooks/useMediaQuery";

/* ══════════════════════════════════════════
   HowToSection
   ══════════════════════════════════════════
   홈페이지 Feature 카드 아래에 표시되는 "사용 방법" 섹션.
   5개 기능(항공검색·워크스페이스·AI채팅·정복도·SNS카드)을
   좌우 교차 레이아웃으로 소개한다.

   - 데스크톱: 텍스트 ↔ 미리보기가 좌우로 번갈아 배치
   - 모바일(md 미만): 자동으로 세로 1열 스택 (이미지 → 텍스트 순)

   ── 펼침(expand) 동작 ──
   일부 행(워크스페이스·AI채팅)은 미리보기 이미지에 마우스를 올리면
   해당 행 아래로 "펼침 영역"이 열린다. 그 안에 세부 기능들을
   데스크톱 2열 2행 / 모바일 1열 그리드로 이미지+설명과 함께 보여준다.
   펼침이 열리면 아래 행들은 자연스럽게 밀려 내려간다.

   - 펼침은 step.expand 배열이 있을 때만 동작한다.
   - hover 영역은 (미리보기 이미지 + 펼침 영역) 전체를 묶어서,
     이미지 → 펼침 내용으로 마우스를 옮기는 동안 닫히지 않도록 했다.

   ── 실제 스크린샷 넣는 법 ──
   src/assets/howto/ 에 이미지를 넣고 아래 import 주석을 해제한 뒤
   해당 step / expand 항목의 image 필드에 연결하면 된다.
   image가 없으면 아이콘 플레이스홀더(브라우저 프레임 안)가 표시된다.

   예)
   // import flightSchedule from "@/assets/howto/flight-schedule.png";
   // ... expand 배열에서 image: flightSchedule
*/

/* 기능별 미리보기 이미지 (준비되면 위 주석 해제 후 연결) */
import searchPreview from "@/assets/search.png";
import workspacePreview from "@/assets/workspace.png";
import aiChatPreview from "@/assets/ai-chat.png";
import conquestPreview from "@/assets/conquest.png";
import snsPreview from "@/assets/sns.png";

/* ── 펼침 영역 안의 세부 기능 한 칸 ── */
interface ExpandItem {
  /** 세부 기능명 (제목) */
  title: string;
  /** 세부 기능 설명 */
  description: string;
  /** 미리보기 스크린샷. 없으면 아이콘 플레이스홀더 표시 */
  image?: string;
  /** 이미지가 없을 때 표시할 placeholder 아이콘 */
  placeholderIcon: ReactNode;
}

interface HowToStep {
  /** 단계 번호 라벨 (예: "01") */
  index: string;
  /** 기능명 (배지) */
  tag: string;
  /** 한 줄 제목 */
  title: string;
  /** 설명 문구 */
  description: string;
  /** 미리보기 스크린샷. 없으면 아이콘 플레이스홀더 표시 */
  image?: string;
  /** 이미지가 없을 때 표시할 placeholder 아이콘 */
  placeholderIcon: ReactNode;
  /** 미리보기 프레임 배경색 (브랜드 카드 톤과 맞춤) */
  accentBg: string;
  /**
   * 미리보기 이미지에 hover 시 행 아래로 펼쳐질 세부 기능 목록.
   * 있으면 펼침 동작 활성화 (데스크톱 2열 그리드 / 모바일 1열).
   */
  expand?: ExpandItem[];
}

/* ── 목업 데이터 ── */
const steps: HowToStep[] = [
  {
    index: "01",
    tag: "항공 검색",
    title: "원하는 항공편을 한눈에",
    description:
      "출발지와 날짜만 입력하면 조건에 맞는 항공권을 빠르게 비교할 수 있어요.",
    placeholderIcon: <PlaneIcon />,
    accentBg: "#FFF6D6",
    image: searchPreview,
  },
  {
    index: "02",
    tag: "워크스페이스",
    title: "함께 계획하는 여행 공간",
    description:
      "친구를 초대해 일정·항공·숙소를 한곳에서 함께 관리하고 의견을 나눠요.",
    placeholderIcon: <UsersIcon />,
    accentBg: "#EEF5F9",
    image: workspacePreview,
    /* ── 워크스페이스 세부 기능 4개 (데스크톱 2열 2행) ── */
    expand: [
      {
        title: "항공 일정",
        description:
          "가는 편·오는 편 항공권을 카드로 정리해 출발/도착 시간을 한눈에 확인해요.",
        placeholderIcon: <PlaneIcon />,
        // image: flightSchedule,
      },
      {
        title: "여행 일정",
        description:
          "날짜별 동선을 지도와 함께 정리하고 팀원과 실시간으로 의견을 나눠요.",
        placeholderIcon: <RouteIcon />,
        // image: travelSchedule,
      },
      {
        title: "여행 기록",
        description:
          "다녀온 순간을 기록으로 남겨 워크스페이스 안에 차곡차곡 모아둬요.",
        placeholderIcon: <NoteIcon />,
        // image: travelLog,
      },
      {
        title: "공유 앨범",
        description:
          "함께 찍은 사진을 한곳에 모아 팀원 모두가 추억을 공유할 수 있어요.",
        placeholderIcon: <AlbumIcon />,
        // image: sharedAlbum,
      },
    ],
  },
  {
    index: "03",
    tag: "AI 채팅",
    title: "AI가 짜주는 맞춤 일정",
    description:
      "가고 싶은 곳을 말하면 AI가 동선까지 고려한 여행 일정을 제안해줘요.",
    placeholderIcon: <ChatIcon />,
    accentBg: "#F3EFFA",
    image: aiChatPreview,
    /* ── AI 채팅 세부 기능 3개 (데스크톱 2열 2행) ── */
    expand: [
      {
        title: "AI 채팅 프롬프트",
        description:
          "가고 싶은 곳·여행 스타일을 자연스럽게 말하면 AI가 알아들어요.",
        placeholderIcon: <ChatIcon />,
        // image: aiPrompt,
      },
      {
        title: "AI 답변",
        description:
          "동선과 시간까지 고려한 맞춤 여행 일정을 AI가 바로 제안해줘요.",
        placeholderIcon: <SparkleIcon />,
        // image: aiAnswer,
      },
      {
        title: "일정 저장하기",
        description:
          "마음에 든 AI 일정을 클릭 한 번으로 워크스페이스에 저장해요.",
        placeholderIcon: <SaveIcon />,
        // image: aiSave,
      },
    ],
  },
  {
    index: "04",
    tag: "정복도",
    title: "지도로 보는 나의 여행",
    description:
      "다녀온 도시를 지도에 채우며 나만의 여행 정복 지도를 완성해요.",
    placeholderIcon: <MapPinIcon />,
    accentBg: "#E9F5F4",
    image: conquestPreview,
  },
  {
    index: "05",
    tag: "SNS 카드",
    title: "추억을 카드로 공유",
    description:
      "여행 사진을 감성 카드로 만들어 친구들과 손쉽게 나눌 수 있어요.",
    placeholderIcon: <PhotoIcon />,
    accentBg: "#FBEAF0",
    image: snsPreview,
  },
];

export default function HowToSection() {
  return (
    <section className="w-full">
      {/* 섹션 헤더 — 세 줄이 위에서 순차적으로 부드럽게 떠오름(fade-up stagger) */}
      <motion.div
        className="text-center mb-10 md:mb-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "-80px" }}
        variants={headerContainerVariants}
      >
        <motion.p
          variants={headerItemVariants}
          className="font-montserrat text-body4 md:text-body3 font-semibold tracking-wide text-gray-500 mb-2"
        >
          HOW IT WORKS
        </motion.p>
        <motion.h2
          variants={headerItemVariants}
          className="font-montserrat text-[24px] md:text-[32px] font-bold text-gray-900"
        >
          이렇게 사용하세요
        </motion.h2>
        <motion.p
          variants={headerItemVariants}
          className="font-pretendard text-body3 md:text-body2 text-gray-600 mt-3"
        >
          항공 검색부터 정복도까지, 5가지 기능으로 여행의 시작과 기록을 완성해요
        </motion.p>
      </motion.div>

      {/* 단계 목록 */}
      <div className="flex flex-col gap-12 md:gap-20">
        {steps.map((step, idx) => (
          <HowToRow key={step.index} step={step} reverse={idx % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

/* ── 섹션 헤더 모션 variants ──
   세 줄(HOW IT WORKS · 제목 · 설명)이 위에서 아래로 0.12초 간격으로
   부드럽게 떠오른다(fade-up stagger). 아래 항목들의 좌우 슬라이드와
   방향을 달리해 "도입부 → 본문" 리듬을 만든다. */
const headerContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const headerItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ── 모션 variants ──
   좌우 교차 레이아웃에 맞춰, 행 전체가 한 방향에서 "슉" 들어온다.
   - 홀수 행(항공검색·AI채팅·SNS): 왼쪽 → 오른쪽
   - 짝수 행(워크스페이스·정복도): 오른쪽 → 왼쪽
   스크롤로 화면을 벗어났다 다시 들어오면 모션이 재생된다(once 미사용). */

/* 행 전체 슬라이드 (dir: -1 = 왼쪽에서, 1 = 오른쪽에서) + 내부 stagger */
function rowVariants(dir: number) {
  return {
    hidden: { opacity: 0, x: 90 * dir },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        when: "beforeChildren" as const,
        staggerChildren: 0.1,
      },
    },
  };
}

/* 텍스트 컬럼 내부 요소(배지·제목·설명) 순차 등장 — 행과 동일하게 좌우 슬라이드 */
function textItemVariants(dir: number) {
  return {
    hidden: { opacity: 0, x: 40 * dir },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };
}

/* ── 한 단계 행 ──
   데스크톱: md:flex-row / md:flex-row-reverse 로 좌우 교차
   모바일: flex-col 로 이미지 위, 텍스트 아래 세로 스택

   step.expand 가 있으면 미리보기 이미지에 hover 시 행 아래로 펼침 영역이 열린다.
   hover 영역은 (미리보기 + 펼침 영역) 전체이므로, 이미지에서 펼침 내용으로
   마우스를 옮기는 동안에는 닫히지 않는다. */
function HowToRow({ step, reverse }: { step: HowToStep; reverse: boolean }) {
  /* 홀수 행(reverse=false): 왼쪽(-1)에서, 짝수 행(reverse=true): 오른쪽(+1)에서 */
  const dir = reverse ? 1 : -1;

  const hasExpand = !!step.expand && step.expand.length > 0;
  const [hovered, setHovered] = useState(false);

  /* 모바일(compact)에는 hover가 없으므로 펼침 영역을 항상 열어둔다.
     데스크톱에서는 미리보기 hover 상태(hovered)에 따라 열고 닫는다. */
  const isCompact = useIsCompact();
  const isOpen = hasExpand && (isCompact || hovered);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: "-80px" }}
      variants={rowVariants(dir)}
    >
      {/* 상단: 텍스트 ↔ 미리보기 좌우 교차 */}
      <div
        className={[
          "flex flex-col items-center gap-6 md:gap-12",
          reverse ? "md:flex-row-reverse" : "md:flex-row",
        ].join(" ")}
      >
        {/* 텍스트 — 행과 함께 슬라이드, 내부 요소 순차 등장 */}
        <div className="flex-1 w-full min-w-0">
          <motion.span
            variants={textItemVariants(dir)}
            className="inline-block font-montserrat text-body5 md:text-body4 font-semibold text-gray-700 bg-gray-200 rounded-full px-3 py-1"
          >
            {step.index} · {step.tag}
          </motion.span>
          <motion.h3
            variants={textItemVariants(dir)}
            className="font-pretendard text-body1 md:text-title2 font-bold text-gray-900 mt-3 mb-2"
          >
            {step.title}
          </motion.h3>
          <motion.p
            variants={textItemVariants(dir)}
            className="font-pretendard text-body3 md:text-body2 text-gray-600 leading-relaxed max-w-[460px]"
          >
            {step.description}
          </motion.p>
          {/* 펼침 가능한 행에는 안내 힌트 표시 (hover가 있는 데스크톱에서만).
              모바일은 이미 펼쳐져 있으므로 안내가 불필요. */}
          {hasExpand && !isCompact && (
            <motion.p
              variants={textItemVariants(dir)}
              className="font-pretendard text-body4 md:text-body3 text-gray-400 mt-4 flex items-center gap-1"
            >
              <ArrowDownIcon />
              미리보기에 마우스를 올리면 세부 기능이 펼쳐져요
            </motion.p>
          )}
        </div>

        {/* 미리보기 — hover 영역의 일부.
            펼침이 없는 행은 기존처럼 hover 확대만.
            펼침이 있는 행은 데스크톱에서만 hover로 펼침을 트리거한다
            (모바일은 항상 펼쳐져 있으므로 hover 불필요). */}
        <motion.div
          className="flex-1 w-full min-w-0"
          variants={textItemVariants(dir)}
          onHoverStart={
            hasExpand && !isCompact ? () => setHovered(true) : undefined
          }
          onHoverEnd={
            hasExpand && !isCompact ? () => setHovered(false) : undefined
          }
          whileHover={hasExpand ? undefined : { scale: 1.12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <PreviewFrame step={step} active={isOpen} />
        </motion.div>
      </div>

      {/* ── 펼침 영역 ──
          데스크톱: 미리보기 hover 시 행 아래로 열린다.
          모바일: 항상 열려 있다(isOpen = true).
          데스크톱에서 hover 유지를 위해 영역 자체에도 onHover 핸들러를 둔다. */}
      {hasExpand && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="expand"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onHoverStart={!isCompact ? () => setHovered(true) : undefined}
              onHoverEnd={!isCompact ? () => setHovered(false) : undefined}
              className="overflow-hidden"
            >
              <ExpandPanel items={step.expand!} accentBg={step.accentBg} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

/* ── 펼침 패널 ──
   데스크톱: 2열 그리드 (4개 → 2열 2행, 3개 → 2열 2행에서 마지막 칸 비움)
   모바일: 1열 세로 스택 */
function ExpandPanel({
  items,
  accentBg,
}: {
  items: ExpandItem[];
  accentBg: string;
}) {
  return (
    <div className="pt-8 md:pt-10">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.08 * i,
                ease: "easeOut",
              }}
              className="flex flex-col gap-3"
            >
              {/* 세부 기능 미리보기 (브라우저 프레임 목업) */}
              <ExpandPreviewFrame item={item} accentBg={accentBg} />
              {/* 제목 + 설명 */}
              <div>
                <h4 className="font-pretendard text-body2 md:text-body1 font-bold text-gray-900 mb-1">
                  {item.title}
                </h4>
                <p className="font-pretendard text-body4 md:text-body3 text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 펼침 패널 내부 미리보기 프레임 ── */
function ExpandPreviewFrame({
  item,
  accentBg,
}: {
  item: ExpandItem;
  accentBg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-300 overflow-hidden shadow-sm bg-white">
      {/* 상단 바 (브라우저 점 3개) */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="w-2 h-2 rounded-full bg-[#F09595]" />
        <span className="w-2 h-2 rounded-full bg-[#FAC775]" />
        <span className="w-2 h-2 rounded-full bg-[#97C459]" />
      </div>

      {/* 본문: 이미지 있으면 표시, 없으면 아이콘 플레이스홀더 */}
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-auto block object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center min-h-[140px] md:min-h-[160px]"
          style={{ backgroundColor: accentBg }}
        >
          <div className="text-gray-500 opacity-70">{item.placeholderIcon}</div>
        </div>
      )}
    </div>
  );
}

/* ── 브라우저 프레임 목업 (메인 미리보기) ──
   active(펼침 활성)일 때는 테두리/그림자를 강조해 "지금 펼쳐졌다"를 표현 */
function PreviewFrame({ step, active }: { step: HowToStep; active: boolean }) {
  return (
    <div
      className={[
        "rounded-xl border overflow-hidden bg-white transition-all duration-200",
        active
          ? "border-primary shadow-lg ring-2 ring-primary/30"
          : "border-gray-300 shadow-sm hover:shadow-lg",
      ].join(" ")}
    >
      {/* 상단 바 (브라우저 점 3개) */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F09595]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FAC775]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#97C459]" />
      </div>

      {/* 본문: 이미지 있으면 표시, 없으면 아이콘 플레이스홀더 */}
      {step.image ? (
        <img
          src={step.image}
          alt={step.title}
          className="w-full h-auto block object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center min-h-[180px] md:min-h-[220px]"
          style={{ backgroundColor: step.accentBg }}
        >
          <div className="text-gray-500 opacity-70">{step.placeholderIcon}</div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   인라인 SVG 아이콘 (플레이스홀더용)
   외부 의존성 없이 동작하도록 직접 정의
   ────────────────────────────────────────── */
function iconProps() {
  return {
    width: 48,
    height: 48,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function PlaneIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M16 10l5.5-2a1.5 1.5 0 1 1 1 2.8L18 13l-2 8h-2l-1.5-6L7 16v3l-2 1-1-3 2-1.5L3 9.5 5 8l5 2 5-2-3-5 2-.5L16 10z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M16 4a3 3 0 0 1 0 6" />
      <path d="M21 21v-1a6 6 0 0 0-3-5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 9 9 0 0 1-4-1L3 20l1.1-4A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  );
}

/* ── 펼침 세부 기능용 추가 아이콘 ── */
function RouteIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 4h11l5 5v11H4z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h7M8 17h5" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 5V3h12a2 2 0 0 1 2 2v12h-2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="M3 16l4-3 4 3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3l1.8 4.8L18 9.6l-4.2 1.8L12 16l-1.8-4.6L6 9.6l4.2-1.8z" />
      <path d="M19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M7 3v5h8V3" />
      <path d="M7 15h10v6H7z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );
}
