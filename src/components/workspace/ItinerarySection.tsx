import SectionHeader from "@/components/workspace/SectionHeader";
import ItineraryDayCard, { type ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import { type ScheduleSummary, type ScheduleDetail } from "@/api/scheduleApi";

export interface ItineraryDay {
  dayNumber: number;
  rows: ItineraryRow[];
}

interface ItinerarySectionProps {
  itineraryDays: ItineraryDay[];
  scheduleList: ScheduleSummary[];
  currentSchedule: ScheduleDetail | null;
  isLoading: boolean;
  isSaving: boolean;
  onSelectVersion: (scheduleId: number) => void;
  onSaveDay: (dayNumber: number, rows: ItineraryRow[]) => void;
  onMapClick?: (dayNumber: number) => void;
  onDeleteItem?: (itemId: number) => void;
}

export default function ItinerarySection({
  itineraryDays,
  scheduleList,
  currentSchedule,
  isLoading,
  isSaving,
  onSelectVersion,
  onSaveDay,
  onMapClick,
  onDeleteItem,
}: ItinerarySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="여행 일정" />

      {/* 버전 탭 */}
      {scheduleList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {scheduleList.map((s) => {
            const isActive = currentSchedule?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectVersion(s.id)}
                className={[
                  "shrink-0 px-3 py-1.5 rounded-lg border",
                  "font-pretendard text-body4 transition-colors cursor-pointer",
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-500",
                ].join(" ")}
              >
                {s.title || `v${s.version}`}
                <span className="ml-1.5 text-xs opacity-60">
                  ({s.itemCount}개)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 저장 중 표시 */}
      {isSaving && (
        <div className="font-pretendard text-body5 text-gray-400 text-right">
          저장 중...
        </div>
      )}

      {/* 일정 카드들 */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 flex items-center justify-center">
          <span className="font-pretendard text-body3 text-gray-400">
            일정을 불러오는 중...
          </span>
        </div>
      ) : itineraryDays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 flex flex-col items-center gap-2 text-center">
          <p className="font-pretendard text-body3 text-gray-700 m-0">
            저장된 여행 일정이 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-400 m-0">
            AI 채팅에서 일정을 만들고 저장해 보세요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {itineraryDays.map((d) => (
            <ItineraryDayCard
              key={d.dayNumber}
              dayNumber={d.dayNumber}
              rows={d.rows}
              onSave={(rows) => onSaveDay(d.dayNumber, rows)}
              onMapClick={onMapClick}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}
