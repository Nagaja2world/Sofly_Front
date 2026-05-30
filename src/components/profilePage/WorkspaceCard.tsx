import UsersIcon from "@/assets/users.svg?react";

interface WorkspaceCardProps {
  /** 워크스페이스 고유 ID */
  id: string;
  /** 워크스페이스 이름 */
  name: string;
  /** 여행 시작일 (ISO "YYYY-MM-DD", 예: "2026-07-01") */
  startDate?: string;
  /** 여행 종료일 (ISO "YYYY-MM-DD", 예: "2026-07-02") */
  endDate?: string;
  /** 인원 수 */
  memberCount?: number;
  /** 커버 이미지 URL */
  imageUrl?: string;
  /** 카드 클릭 시 콜백 (워크스페이스 페이지로 이동) */
  onClick?: (id: string) => void;
}

/* ── 날짜 포맷 ──
   API가 넘기는 ISO 문자열("2026-07-01")을 짧은 표기("26.07.01")로 변환.
   좁은 2열 카드에서도 "26.07.01 – 26.07.02"가 한 줄에 들어가도록.
   ISO 형식이 아니면(혹은 파싱 실패 시) 원본을 그대로 반환해 안전 처리. */
function formatShortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  return `${year.slice(2)}.${month}.${day}`;
}

/* 시작일·종료일을 합쳐 표시.
   같은 해면 종료일의 연도를 생략해 더 짧게: "26.07.01 – 07.02". */
function formatDateRange(start: string, end: string): string {
  const s = formatShortDate(start);
  const e = formatShortDate(end);
  // 같은 연도(앞 2자리 "YY.")면 종료일 연도 생략
  if (s.slice(0, 3) === e.slice(0, 3)) {
    return `${s} – ${e.slice(3)}`;
  }
  return `${s} – ${e}`;
}

export default function WorkspaceCard({
  id,
  name,
  startDate,
  endDate,
  memberCount,
  imageUrl,
  onClick,
}: WorkspaceCardProps) {
  const hasDate = startDate && endDate;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(id)}
      className={[
        "flex flex-col rounded-xl overflow-hidden",
        "bg-white border border-gray-300",
        "cursor-pointer transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
      ].join(" ")}
    >
      {/* ── 이미지 영역 ── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-200">
        {imageUrl ? (
          <img
            loading="lazy"
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-pretendard text-body3 text-gray-500">
              사진을 추가해 주세요
            </span>
          </div>
        )}
      </div>

      {/* ── 정보 영역 ── */}
      <div className="px-4 py-4 flex flex-col gap-1.5">
        {/* 워크스페이스명 */}
        <h4 className="font-pretendard text-body2 font-semibold text-gray-900 truncate m-0">
          {name}
        </h4>

        {/* 날짜 */}
        {hasDate && (
          <span className="font-pretendard text-body4 text-gray-600 whitespace-nowrap">
            {formatDateRange(startDate!, endDate!)}
          </span>
        )}

        {/* 인원 */}
        {memberCount !== undefined && memberCount > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <UsersIcon className="w-3.5 h-3.5" />
            <span className="font-pretendard text-body4">{memberCount}명</span>
          </div>
        )}
      </div>
    </div>
  );
}
