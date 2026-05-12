import PlusIcon from "@/assets/plus.svg?react";
import SectionHeader from "@/components/workspace/SectionHeader";
import TravelLogCard, { type WeatherType, type TravelLogData } from "@/components/workspace/TravelLogCard";
import SnsLogCard, { type SnsLogData } from "@/components/workspace/SnsLogCard";
import AddTravelLogCard from "@/components/workspace/AddTravelLogCard";
import type { JSONContent } from "@tiptap/core";

export interface TravelLog {
  dayNumber: number;
  oneLineSummary?: string;
  weather?: WeatherType;
  content?: JSONContent;
  albumPhotos?: string[];
}

interface TravelLogSectionProps {
  travelLogs: TravelLog[];
  snsLog: SnsLogData | null;
  showAddCard: boolean;
  onOpenAddCard: () => void;
  onCancelAddCard: () => void;
  onAddDailyCard: () => void;
  onAddSnsCard: () => void;
  onSaveTravelLog: (dayNumber: number, data: TravelLogData) => void;
  onDeleteTravelLog: (dayNumber: number) => void;
  onSaveSnsLog: (data: SnsLogData) => void;
  onDeleteSnsLog: () => void;
  onUploadSnsLog: (data: SnsLogData) => void;
}

export default function TravelLogSection({
  travelLogs,
  snsLog,
  showAddCard,
  onOpenAddCard,
  onCancelAddCard,
  onAddDailyCard,
  onAddSnsCard,
  onSaveTravelLog,
  onDeleteTravelLog,
  onSaveSnsLog,
  onDeleteSnsLog,
  onUploadSnsLog,
}: TravelLogSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="여행 기록"
        action={
          <button
            type="button"
            onClick={onOpenAddCard}
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
        {/* SNS 카드: 항상 맨 왼쪽 */}
        {snsLog && (
          <div className="shrink-0">
            <SnsLogCard
              caption={snsLog.caption}
              media={snsLog.media}
              onSave={onSaveSnsLog}
              onDelete={onDeleteSnsLog}
              onUpload={onUploadSnsLog}
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
              onSave={(data) => onSaveTravelLog(log.dayNumber, data)}
              onDelete={() => onDeleteTravelLog(log.dayNumber)}
            />
          </div>
        ))}

        {/* 추가 카드: "+" 버튼 클릭 시 맨 끝에 표시 */}
        {showAddCard && (
          <AddTravelLogCard
            onAddDailyCard={onAddDailyCard}
            onAddSnsCard={onAddSnsCard}
            onCancel={onCancelAddCard}
            disableSnsCard={snsLog !== null}
          />
        )}
      </div>
    </section>
  );
}
