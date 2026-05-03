import FlightCard from "./FlightCard";
import {
  type FlightItem,
  type SortOption,
  SORT_LABELS,
} from "@/types/flightType";

interface FlightResultListProps {
  /** 항공편 목록 */
  flights: FlightItem[];
  /** 로딩 여부 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string | null;
  /** 현재 정렬 */
  sort: SortOption;
  /** 정렬 변경 */
  onSortChange: (sort: SortOption) => void;
  /** 카드 클릭 (상세) */
  onCardClick?: (id: string) => void;
}

const sortOptions: SortOption[] = ["cheapest", "fastest", "best"];

export default function FlightResultList({
  flights,
  isLoading = false,
  error = null,
  sort,
  onSortChange,
  onCardClick,
}: FlightResultListProps) {
  const count = flights.length;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      {/* ── 상단: 결과 개수 + 정렬 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
          가능한 항공편{" "}
          <span className="font-pretendard text-body2 font-normal text-gray-600">
            (결과 {count}건)
          </span>
        </h2>

        {/* 정렬 칩 */}
        <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-1">
          {sortOptions.map((opt) => {
            const isActive = sort === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onSortChange(opt)}
                className={[
                  "px-3 py-1.5 rounded-md cursor-pointer border-none",
                  "font-pretendard text-body4 transition-all duration-150",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "bg-transparent text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                {SORT_LABELS[opt]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 본문 상태별 렌더링 ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          <p className="font-pretendard text-body2 text-gray-600 m-0">
            항공편을 불러오는 중이에요...
          </p>
        </div>
      ) : error ? (
        <div
          className={[
            "flex flex-col items-center justify-center py-20 gap-2",
            "rounded-xl border border-gray-300 bg-white",
          ].join(" ")}
        >
          <p className="font-pretendard text-body2 text-gray-900 m-0">
            {error}
          </p>
          <p className="font-pretendard text-body4 text-gray-500 m-0">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      ) : count === 0 ? (
        <div
          className={[
            "flex flex-col items-center justify-center py-20 gap-2",
            "rounded-xl border-2 border-dashed border-gray-300 bg-gray-100/50",
          ].join(" ")}
        >
          <p className="font-pretendard text-body2 text-gray-700 m-0">
            조건에 맞는 항공편이 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-500 m-0">
            필터를 조정하거나 날짜를 바꿔 보세요.
          </p>
        </div>
      ) : (
        /* ── 카드 리스트 ── */
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {flights.map((flight) => (
            <li key={flight.id}>
              <FlightCard flight={flight} onClick={onCardClick} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
