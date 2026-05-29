import { useState } from "react";
import PlusIcon from "@/assets/plus.svg?react";
import SectionHeader from "@/components/workspace/SectionHeader";
import TravelLogCard, {
  type WeatherType,
  type TravelLogData,
} from "@/components/workspace/TravelLogCard";
import SnsLogCard, { type SnsLogData } from "@/components/workspace/SnsLogCard";
import AddTravelLogCard from "@/components/workspace/AddTravelLogCard";
import type { JSONContent } from "@tiptap/core";

export interface TravelLog {
  id?: number;
  mainTitle: string | null;
  oneLineSummary?: string;
  weather?: WeatherType;
  content?: JSONContent;
  albumPhotos?: string[];
  _photoIds?: number[];
}

interface TravelLogSectionProps {
  travelLogs: TravelLog[];
  snsLog: SnsLogData | null;
  showAddCard: boolean;
  sharedAlbumPhotos: string[];
  onOpenAddCard: () => void;
  onCancelAddCard: () => void;
  onAddDailyCard: () => void;
  onAddSnsCard: () => void;
  onSaveTravelLog: (id: number, data: TravelLogData) => void;
  onUploadTravellogPhotos: (id: number, files: File[]) => void;
  onDetachPhoto: (logId: number, photoId: number) => void;
  onDeleteTravelLog: (id: number) => void;
  onUpdateMainTitle: (id: number, title: string) => void;
  onReorderLogs: (fromIdx: number, toIdx: number) => void;
  onSaveSnsLog: (data: SnsLogData) => void;
  onDeleteSnsLog: () => void;
  onUploadSnsLog: (data: SnsLogData) => void;
}

export default function TravelLogSection({
  travelLogs,
  snsLog,
  showAddCard,
  sharedAlbumPhotos,
  onOpenAddCard,
  onCancelAddCard,
  onAddDailyCard,
  onAddSnsCard,
  onSaveTravelLog,
  onUploadTravellogPhotos,
  onDetachPhoto,
  onDeleteTravelLog,
  onUpdateMainTitle,
  onReorderLogs,
  onSaveSnsLog,
  onDeleteSnsLog,
  onUploadSnsLog,
}: TravelLogSectionProps) {
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // 최신 카드가 왼쪽에 오도록 역순 렌더링
  const reversedLogs = [...travelLogs].reverse();
  const lastIdx = travelLogs.length - 1;

  const handleDragStart = (visualIdx: number) => setDragFromIdx(visualIdx);
  const handleDragOver = (e: React.DragEvent, visualIdx: number) => {
    e.preventDefault();
    setDragOverIdx(visualIdx);
  };
  const handleDrop = (visualIdx: number) => {
    if (dragFromIdx !== null && dragFromIdx !== visualIdx) {
      // 시각적 인덱스(역순) → 원래 배열 인덱스로 변환
      onReorderLogs(lastIdx - dragFromIdx, lastIdx - visualIdx);
    }
    setDragFromIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragFromIdx(null);
    setDragOverIdx(null);
  };

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
              showAddCard ? "여행 기록 카드 추가 (열림)" : "여행 기록 카드 추가"
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

      {/* 빈 상태 */}
      {!snsLog && travelLogs.length === 0 && !showAddCard && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 flex flex-col items-center gap-2 text-center">
          <p className="font-pretendard text-body3 text-gray-700 m-0">
            기록된 여행 이야기가 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-400 m-0">
            + 버튼을 눌러 여행 기록을 남겨보세요.
          </p>
        </div>
      )}

      {(snsLog || travelLogs.length > 0 || showAddCard) && (
        <div
          className={[
            "flex gap-3 overflow-x-auto pb-2",
            "[&::-webkit-scrollbar]:h-2",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300",
            "[&::-webkit-scrollbar-thumb]:rounded",
          ].join(" ")}
        >
          {/* 추가 카드: 맨 왼쪽에 표시 */}
          {showAddCard && (
            <AddTravelLogCard
              onAddDailyCard={onAddDailyCard}
              onAddSnsCard={onAddSnsCard}
              onCancel={onCancelAddCard}
              disableSnsCard={snsLog !== null || travelLogs.length === 0}
            />
          )}

          {/* SNS 카드 */}
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

          {/* 일자별 카드들 — 드래그 앤 드롭 (최신순: 왼쪽부터) */}
          {reversedLogs.map((log, visualIdx) => (
            <div
              key={log.id ?? visualIdx}
              className={[
                "shrink-0 transition-opacity duration-150",
                dragFromIdx === visualIdx ? "opacity-40" : "",
                dragOverIdx === visualIdx && dragFromIdx !== visualIdx
                  ? "ring-2 ring-primary ring-offset-1 rounded-xl"
                  : "",
              ].join(" ")}
              draggable
              onDragStart={() => handleDragStart(visualIdx)}
              onDragOver={(e) => handleDragOver(e, visualIdx)}
              onDrop={() => handleDrop(visualIdx)}
              onDragEnd={handleDragEnd}
            >
              <TravelLogCard
                mainTitle={log.mainTitle}
                oneLineSummary={log.oneLineSummary}
                weather={log.weather}
                content={log.content}
                albumPhotos={log.albumPhotos}
                photoIds={log._photoIds}
                sharedAlbumPhotos={sharedAlbumPhotos}
                onSaveMainTitle={(title) =>
                  log.id != null && onUpdateMainTitle(log.id, title)
                }
                onUploadPhotos={(files) =>
                  log.id != null && onUploadTravellogPhotos(log.id, files)
                }
                onDeletePhoto={(photoId) =>
                  log.id != null && onDetachPhoto(log.id, photoId)
                }
                onSave={(data) =>
                  log.id != null && onSaveTravelLog(log.id, data)
                }
                onDelete={() =>
                  log.id != null && onDeleteTravelLog(log.id)
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
