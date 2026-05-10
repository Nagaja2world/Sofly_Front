import PlusIcon from "@/assets/plus.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface AddTravelLogCardProps {
  /** "일자별 카드 추가" 클릭 콜백 */
  onAddDailyCard: () => void;
  /** "SNS용 카드 추가" 클릭 콜백 */
  onAddSnsCard: () => void;
  /**
   * SNS 카드 추가 버튼을 비활성화할지 여부.
   * 한 워크스페이스에 SNS 카드는 1개만 만들 수 있으므로,
   * 이미 SNS 카드가 존재하면 부모가 true로 넘김.
   */
  disableSnsCard?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 여행 기록 영역의 "추가 카드"
 *
 * - 워크스페이스 "여행 기록" 섹션 헤더 옆 "+" 버튼 클릭 시 토글되어,
 *   TravelLogCard 배열의 맨 끝(맨 오른쪽)에 표시됨.
 * - 흰 배경의 카드 안에 두 개의 큰 선택 버튼:
 *   1) "일자별 카드 추가" → 현재 TravelLogCard와 같은 일기장 카드 생성
 *   2) "SNS용 카드 추가"  → 인스타 게시물 형식의 SNS 카드 생성 (워크스페이스당 1개)
 *
 * 디자인 스펙
 * - TravelLogCard와 동일한 396px 폭, rounded-xl, gray-300 border 사용
 * - 두 버튼은 같은 비중으로 세로 배치 (border-dashed로 placeholder 느낌)
 */
export default function AddTravelLogCard({
  onAddDailyCard,
  onAddSnsCard,
  disableSnsCard = false,
  className = "",
}: AddTravelLogCardProps) {
  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300",
        "w-[396px] shrink-0",
        "flex flex-col items-stretch justify-center",
        "p-4 gap-3",
        className,
      ].join(" ")}
      aria-label="여행 기록 카드 추가"
    >
      {/* 일자별 카드 추가 버튼 */}
      <AddOptionButton
        label="일자별 카드 추가"
        description="블로그/노션처럼 하루 일정을 기록할 수 있는 카드"
        onClick={onAddDailyCard}
      />

      {/* SNS용 카드 추가 버튼 (워크스페이스당 1개 제한) */}
      <AddOptionButton
        label="SNS용 카드 추가"
        description={
          disableSnsCard
            ? "이미 SNS 카드가 있어요 (워크스페이스당 1개)"
            : "사진/영상 업로드 후 SNS에 게시할 수 있는 카드"
        }
        onClick={onAddSnsCard}
        disabled={disableSnsCard}
      />
    </article>
  );
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 추가 옵션 버튼 (일자별 / SNS용 공용)
 * - dashed border + 가운데 + 아이콘 + 라벨 + 보조 설명
 * - hover 시 배경색 살짝 변화
 */
function AddOptionButton({
  label,
  description,
  onClick,
  disabled = false,
}: {
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex-1 flex flex-col items-center justify-center gap-2",
        "py-8 px-4 rounded-lg",
        "border-2 border-dashed border-gray-300",
        "transition-colors",
        disabled
          ? "bg-gray-50 cursor-not-allowed opacity-60"
          : [
              "bg-white cursor-pointer",
              "hover:bg-gray-50 hover:border-gray-400",
              "focus-visible:outline-none focus-visible:border-gray-700",
            ].join(" "),
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center justify-center",
          "w-10 h-10 rounded-full",
          disabled ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-700",
        ].join(" ")}
        aria-hidden="true"
      >
        <PlusIcon className="w-5 h-5" />
      </span>
      <span
        className={[
          "font-pretendard text-body1 font-semibold",
          disabled ? "text-gray-500" : "text-gray-900",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "font-pretendard text-body4 font-regular text-center",
          "px-2",
          disabled ? "text-gray-400" : "text-gray-500",
        ].join(" ")}
      >
        {description}
      </span>
    </button>
  );
}
