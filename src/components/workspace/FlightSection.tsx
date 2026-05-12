import FlightInfoCard, { type FlightLegInfo } from "@/components/workspace/FlightInfoCard";
import SectionHeader from "@/components/workspace/SectionHeader";
import { type WorkspaceFlight } from "@/api/workspaceApi";

export interface FlightInfo {
  id: number;
  direction: "가는편" | "오는편";
  date: string;
  legs: FlightLegInfo[];
  bookingUrl?: string;
  bookingNumber?: string;
}

interface FlightSectionProps {
  flights: FlightInfo[];
  rawFlights: WorkspaceFlight[];
  onFlightClick: (flight: WorkspaceFlight) => void;
  onFlightDelete: (id: number, label: string) => void;
}

export default function FlightSection({
  flights,
  rawFlights,
  onFlightClick,
  onFlightDelete,
}: FlightSectionProps) {
  return (
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
        /* 가는편 전체 왼쪽 컬럼, 오는편 전체 오른쪽 컬럼 */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-3">
            {flights
              .filter((f) => f.direction === "가는편")
              .map((f) => (
                <FlightInfoCard
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
                  onDelete={() =>
                    onFlightDelete(f.id, `${f.direction} ${f.date}`)
                  }
                />
              ))}
          </div>
          <div className="flex flex-col gap-3">
            {flights
              .filter((f) => f.direction === "오는편")
              .map((f) => (
                <FlightInfoCard
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
                  onDelete={() =>
                    onFlightDelete(f.id, `${f.direction} ${f.date}`)
                  }
                />
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
