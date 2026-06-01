import { useEffect } from "react";

interface FareActionModalProps {
  fareName: string;
  bookingUrl?: string;
  onReserve: () => void;
  onSaveToWorkspace: () => void;
  onClose: () => void;
}

/**
 * 운임 옵션 선택 시 나타나는 미니 모달
 * "예약하기" / "항공일정 저장하기" 두 버튼 제공
 */
export default function FareActionModal({
  fareName,
  bookingUrl,
  onReserve,
  onSaveToWorkspace,
  onClose,
}: FareActionModalProps) {
  /* ESC 키로 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* 오버레이 (반투명, 클릭으로 닫기) */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-[300px] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
            {fareName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 버튼 목록 */}
        <div className="flex flex-col gap-2 px-5 py-4">
          {/* 예약하기 */}
          {bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onReserve}
              className={[
                "w-full py-3 rounded-xl font-pretendard text-body2 font-semibold",
                "bg-primary text-gray-900 border-none cursor-pointer",
                "hover:brightness-95 transition-all",
                "flex items-center justify-center gap-1.5 no-underline",
              ].join(" ")}
            >
              Booking.com에서 예약하기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M5.5 3H3C2.448 3 2 3.448 2 4v7c0 .552.448 1 1 1h7c.552 0 1-.448 1-1V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M8 2h4v4M12 2L6.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ) : (
            <button
              type="button"
              onClick={onReserve}
              className={[
                "w-full py-3 rounded-xl font-pretendard text-body2 font-semibold",
                "bg-primary text-gray-900 border-none cursor-pointer",
                "hover:brightness-95 transition-all",
              ].join(" ")}
            >
              예약하기
            </button>
          )}

          {/* 항공일정 저장하기 */}
          <button
            type="button"
            onClick={onSaveToWorkspace}
            className={[
              "w-full py-3 rounded-xl font-pretendard text-body2 font-semibold",
              "bg-white text-gray-800 border border-gray-300 cursor-pointer",
              "hover:bg-gray-50 transition-all",
            ].join(" ")}
          >
            항공일정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
