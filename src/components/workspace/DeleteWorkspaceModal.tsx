import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface DeleteWorkspaceModalProps {
  workspaceName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * GitHub 리포지토리 삭제 방식과 동일 —
 * 워크스페이스 이름을 정확히 입력해야만 삭제 버튼이 활성화됨.
 */
export default function DeleteWorkspaceModal({
  workspaceName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteWorkspaceModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isMatch = inputValue === workspaceName;

  /* ESC 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isDeleting]);

  /* 열릴 때 input 포커스 */
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  /* 스크롤 잠금 */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 2.25L15.75 14.25H2.25L9 2.25Z"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M9 7.5v3" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="12" r="0.75" fill="#EF4444" />
              </svg>
            </div>
            <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
              워크스페이스 삭제
            </h2>
          </div>
          {!isDeleting && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="font-pretendard text-body3 text-gray-700 m-0 leading-relaxed">
            이 작업은 되돌릴 수 없습니다. 워크스페이스와 저장된 모든 데이터가
            영구적으로 삭제됩니다.
          </p>

          {/* 워크스페이스 이름 표시 */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
            <p className="font-pretendard text-body5 text-gray-500 m-0 mb-1">
              삭제할 워크스페이스
            </p>
            <p className="font-pretendard text-body3 font-semibold text-gray-900 m-0 break-all">
              {workspaceName}
            </p>
          </div>

          {/* 이름 입력 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="workspace-delete-confirm"
              className="font-pretendard text-body4 text-gray-700"
            >
              확인을 위해 워크스페이스 이름을 정확히 입력하세요.
            </label>
            <input
              id="workspace-delete-confirm"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isMatch && !isDeleting) onConfirm();
              }}
              disabled={isDeleting}
              placeholder={workspaceName}
              className={[
                "font-pretendard text-body3 text-gray-900 rounded-lg border px-3.5 py-2.5",
                "focus:outline-none transition-colors bg-white w-full",
                isMatch
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-gray-500",
                isDeleting ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            />
            {inputValue.length > 0 && !isMatch && (
              <p className="font-pretendard text-body5 text-red-500 m-0">
                워크스페이스 이름이 일치하지 않습니다.
              </p>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-6 pt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={[
              "flex-1 py-3 rounded-xl font-pretendard text-body3 font-medium",
              "border border-gray-300 text-gray-700 bg-transparent",
              "hover:bg-gray-50 transition-colors cursor-pointer",
              isDeleting ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || isDeleting}
            className={[
              "flex-1 py-3 rounded-xl font-pretendard text-body3 font-semibold",
              "border-none transition-all",
              isMatch && !isDeleting
                ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            {isDeleting ? "삭제 중..." : "워크스페이스 삭제"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
