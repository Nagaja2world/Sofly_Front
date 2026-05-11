import { useEffect, useState } from "react";
import {
  fetchWorkspaces,
  saveFlightToWorkspace,
  resolveCoverImage,
  type Workspace,
  type SaveFlightPayload,
} from "@/api/workspaceApi";

interface WorkspaceSelectModalProps {
  /** 저장할 항공편 페이로드 목록 (가는편, 오는편 등) */
  flights: SaveFlightPayload[];
  onClose: () => void;
}

export default function WorkspaceSelectModal({
  flights,
  onClose,
}: WorkspaceSelectModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    fetchWorkspaces()
      .then(setWorkspaces)
      .catch(() => setError("워크스페이스 목록을 불러오지 못했어요"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = async (workspace: Workspace) => {
    if (savingId !== null) return;
    setSavingId(workspace.id);
    setError(null);

    try {
      await Promise.all(
        flights.map((payload) => saveFlightToWorkspace(workspace.id, payload)),
      );
      setSavedId(workspace.id);
    } catch {
      setError("저장 중 오류가 발생했어요. 다시 시도해 주세요.");
      setSavingId(null);
    }
  };

  /* ESC 키로 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] mx-4 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
            워크스페이스에 저장
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : error && workspaces.length === 0 ? (
            <p className="font-pretendard text-body3 text-red-500 text-center py-8">
              {error}
            </p>
          ) : workspaces.length === 0 ? (
            <p className="font-pretendard text-body3 text-gray-500 text-center py-8">
              워크스페이스가 없어요. 먼저 워크스페이스를 만들어 주세요.
            </p>
          ) : (
            workspaces.map((ws) => {
              const isSaving = savingId === ws.id && savedId === null;
              const isSaved = savedId === ws.id;

              return (
                <button
                  key={ws.id}
                  type="button"
                  disabled={savingId !== null}
                  onClick={() => handleSelect(ws)}
                  className={[
                    "flex items-center gap-4 w-full px-4 py-3 rounded-xl",
                    "border transition-all duration-150 cursor-pointer text-left",
                    "bg-transparent",
                    isSaved
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50",
                    savingId !== null && !isSaving ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {/* 커버 이미지 */}
                  <img
                    src={resolveCoverImage(ws.coverImageUrl, ws.id)}
                    alt={ws.title}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-pretendard text-body2 font-semibold text-gray-900 m-0 truncate">
                      {ws.title}
                    </p>
                    <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
                      {ws.destination} · {ws.startDate} ~ {ws.endDate}
                    </p>
                    <p className="font-pretendard text-body5 text-gray-400 m-0 mt-0.5">
                      멤버 {ws.memberCount}명
                    </p>
                  </div>

                  {/* 상태 표시 */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    ) : isSaved ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#F5B800" />
                        <path
                          d="M5.5 10.5L8.5 13.5L14.5 7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}

          {/* 에러 메시지 (저장 실패) */}
          {error && workspaces.length > 0 && (
            <p className="font-pretendard text-body4 text-red-500 text-center">
              {error}
            </p>
          )}
        </div>

        {/* 푸터 */}
        {savedId !== null && (
          <div className="px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={[
                "w-full py-3 rounded-xl font-pretendard text-body2 font-semibold",
                "bg-primary text-gray-900 border-none cursor-pointer",
                "hover:brightness-95 transition-all",
              ].join(" ")}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
