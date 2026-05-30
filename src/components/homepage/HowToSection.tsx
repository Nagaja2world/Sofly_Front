import { type ReactNode } from "react";
import { motion } from "framer-motion";

/* ══════════════════════════════════════════
   HowToSection
   ══════════════════════════════════════════
   홈페이지 Feature 카드 아래에 표시되는 "사용 방법" 섹션.
   5개 기능(항공검색·워크스페이스·AI채팅·정복도·SNS카드)을
   좌우 교차 레이아웃으로 소개한다.

   - 데스크톱: 텍스트 ↔ 미리보기가 좌우로 번갈아 배치
   - 모바일(md 미만): 자동으로 세로 1열 스택 (이미지 → 텍스트 순)

   ── 실제 스크린샷 넣는 법 ──
   src/assets/howto/ 에 이미지를 넣고 아래 import 주석을 해제한 뒤
   해당 step의 image 필드에 연결하면 된다.
   image가 없으면 아이콘 플레이스홀더(브라우저 프레임 안)가 표시된다.

   예)
   // import searchPreview from "@/assets/howto/search.png";
   // ... steps 배열에서 image: searchPreview
*/

/* 기능별 미리보기 이미지 (준비되면 위 주석 해제 후 연결) */
import searchPreview from "@/assets/search.png";
import workspacePreview from "@/assets/workspace.png";
import aiChatPreview from "@/assets/ai-chat.png";
import conquestPreview from "@/assets/conquest.png";
import snsPreview from "@/assets/sns.png";

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

/* ── 헤더 모션 variants ──
   페이드 + 블러 풀림. 위치 이동 없이 제자리에서 흐릿→선명하게 등장.
   라벨·제목·설명이 약간의 시차를 두고 차례로 나타난다.
   스크롤로 재진입하면 다시 재생(once 미사용). */
const headerContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const blurRevealVariants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

export default function HowToSection() {
  return (
    // <section className="w-full">
    //   {/* 섹션 헤더 */}
    //   <div className="text-center mb-10 md:mb-14">
    //     <p className="font-montserrat text-body4 md:text-body3 font-semibold tracking-wide text-gray-500 mb-2">
    //       HOW IT WORKS
    //     </p>
    //     <h2 className="font-montserrat text-[24px] md:text-[32px] font-bold text-gray-900">
    //       이렇게 사용하세요
    //     </h2>
    //     <p className="font-pretendard text-body3 md:text-body2 text-gray-600 mt-3">
    //       항공 검색부터 정복도까지, 5가지 기능으로 여행의 시작과 기록을 완성해요
    //     </p>
    //   </div>
    <section className="w-full">
      {/* 섹션 헤더 — 페이드 + 블러 풀림 (이동 없음, 제자리 등장) */}
      <motion.div
        className="text-center mb-10 md:mb-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "-80px" }}
        variants={headerContainerVariants}
      >
        <motion.p
          variants={blurRevealVariants}
          className="font-montserrat text-body4 md:text-body3 font-semibold tracking-wide text-gray-500 mb-2"
        >
          HOW IT WORKS
        </motion.p>
        <motion.h2
          variants={blurRevealVariants}
          className="font-montserrat text-[24px] md:text-[32px] font-bold text-gray-900"
        >
          이렇게 사용하세요
        </motion.h2>
        <motion.p
          variants={blurRevealVariants}
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

/* 텍스트 컬럼 내부 요소(배지·제목·설명) 순차 등장 */
const textItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

/* ── 한 단계 행 ──
   데스크톱: md:flex-row / md:flex-row-reverse 로 좌우 교차
   모바일: flex-col 로 이미지 위, 텍스트 아래 세로 스택 */
function HowToRow({ step, reverse }: { step: HowToStep; reverse: boolean }) {
  /* 홀수 행(reverse=false): 왼쪽(-1)에서, 짝수 행(reverse=true): 오른쪽(+1)에서 */
  const dir = reverse ? 1 : -1;

  return (
    <motion.div
      className={[
        "flex flex-col items-center gap-6 md:gap-12",
        reverse ? "md:flex-row-reverse" : "md:flex-row",
      ].join(" ")}
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: "-80px" }}
      variants={rowVariants(dir)}
    >
      {/* 텍스트 — 행과 함께 슬라이드, 내부 요소 순차 등장 */}
      <div className="flex-1 w-full min-w-0">
        <motion.span
          variants={textItemVariants}
          className="inline-block font-montserrat text-body5 md:text-body4 font-semibold text-gray-700 bg-gray-200 rounded-full px-3 py-1"
        >
          {step.index} · {step.tag}
        </motion.span>
        <motion.h3
          variants={textItemVariants}
          className="font-pretendard text-body1 md:text-title2 font-bold text-gray-900 mt-3 mb-2"
        >
          {step.title}
        </motion.h3>
        <motion.p
          variants={textItemVariants}
          className="font-pretendard text-body3 md:text-body2 text-gray-600 leading-relaxed max-w-[460px]"
        >
          {step.description}
        </motion.p>
      </div>

      {/* 미리보기 (브라우저 프레임) — hover 확대 */}
      <motion.div
        className="flex-1 w-full min-w-0"
        variants={textItemVariants}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <PreviewFrame step={step} />
      </motion.div>
    </motion.div>
  );
}

/* ── 브라우저 프레임 목업 ── */
function PreviewFrame({ step }: { step: HowToStep }) {
  return (
    <div className="rounded-xl border border-gray-300 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 bg-white">
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
