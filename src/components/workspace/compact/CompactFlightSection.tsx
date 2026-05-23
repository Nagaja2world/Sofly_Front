import CompactFlightCard from "./CompactFlightCard";
import { type FlightInfo } from "@/components/workspace/FlightSection";
import { type WorkspaceFlight } from "@/api/workspaceApi";

/* ══════════════════════════════════════════
   CompactFlightSection
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 항공 일정 섹션.

   데스크톱 FlightSection과의 차이:
   - 데스크톱: 가는편 전체 = 왼쪽 컬럼, 오는편 전체 = 오른쪽 컬럼 (2-col grid)
   - 좁은 화면: 세로 1컬럼으로 가는편 → 오는편 순서로 쌓음
   - 카드는 CompactFlightCard (접힘 기본 + 더보기 토글) 사용

   SectionHeader는 데스크톱과 동일하게 재사용해도 무방하나,
   좁은 화면 제목 크기 조정을 위해 자체 헤더를 둠 (text-body1 굵게).
*/

interface CompactFlightSectionProps {
  flights: FlightInfo[];
  rawFlights: WorkspaceFlight[];
  onFlightClick: (flight: WorkspaceFlight) => void;
  onFlightDelete: (id: number, label: string) => void;
}

export default function CompactFlightSection({
  flights,
  rawFlights,
  onFlightClick,
  onFlightDelete,
}: CompactFlightSectionProps) {
  /* 가는편 먼저, 오는편 나중. 같은 방향이 여러 개면 입력 순서 유지. */
  const outbound = flights.filter((f) => f.direction === "가는편");
  const inbound = flights.filter((f) => f.direction === "오는편");
  const ordered = [...outbound, ...inbound];

  return (
    <section className="flex flex-col gap-3">
      {/* ── 섹션 제목 ── */}
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
        항공 일정
      </h2>

      {flights.length === 0 ? (
        /* ── 빈 상태 ── */
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 flex flex-col items-center gap-2 text-center">
          <p className="font-pretendard text-body3 text-gray-700 m-0">
            저장된 항공편이 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-400 m-0">
            항공 검색에서 원하는 항공편을 찾아 이 워크스페이스에 저장해보세요.
          </p>
        </div>
      ) : (
        /* ── 세로 1컬럼 적층 ── */
        <div className="flex flex-col gap-3">
          {ordered.map((f) => (
            <CompactFlightCard
              key={f.id}
              direction={f.direction}
              date={f.date}
              legs={f.legs}
              bookingUrl={f.bookingUrl}
              bookingNumber={f.bookingNumber}
              onClick={() => {
                const raw = rawFlights.find((r) => r.id === f.id);
                if (raw) onFlightClick(raw);
              }}
              onDelete={() => onFlightDelete(f.id, `${f.direction} ${f.date}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
