import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { searchUsers, type UserSearchResult } from "@/api/userApi";

interface InviteMemberModalProps {
  onInvite: (user: UserSearchResult) => void;
  onClose: () => void;
}

/**
 * 멤버 초대 모달.
 * 이메일을 입력하면 자동완성 드롭다운으로 사용자 목록을 보여주고,
 * 선택 시 onInvite 콜백을 호출 (실제 초대 확인은 부모에서 처리).
 */
export default function InviteMemberModal({ onInvite, onClose }: InviteMemberModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ESC 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  /* 열릴 때 input 포커스 */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  /* 스크롤 잠금 */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const data = await searchUsers(q.trim());
      setResults(data);
      setShowDropdown(true);
    } catch {
      setError("검색 중 오류가 발생했어요.");
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] mx-4 flex flex-col overflow-visible">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
            멤버 초대
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 flex flex-col gap-2 relative">
          <label className="font-pretendard text-body4 text-gray-700">
            이메일로 사용자 검색
          </label>

          {/* 검색 인풋 */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="이메일 앞부분을 입력하세요"
              className={[
                "w-full font-pretendard text-body3 text-gray-900 rounded-lg border border-gray-300",
                "px-3.5 py-2.5 pr-10 focus:outline-none focus:border-primary bg-white",
              ].join(" ")}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <p className="font-pretendard text-body5 text-red-500 m-0">{error}</p>
          )}

          {/* 드롭다운 결과 */}
          {showDropdown && (
            <div className="absolute left-6 right-6 top-full mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {results.length === 0 ? (
                <div className="px-4 py-4 font-pretendard text-body4 text-gray-500 text-center">
                  검색 결과가 없어요
                </div>
              ) : (
                <ul className="list-none p-0 m-0 max-h-[240px] overflow-y-auto">
                  {results.map((u) => (
                    <li key={u.userId}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          onInvite(u);
                        }}
                        className={[
                          "w-full flex items-center gap-3 px-4 py-3 text-left",
                          "hover:bg-gray-50 cursor-pointer border-none bg-transparent",
                          "border-b border-gray-100 last:border-b-0",
                        ].join(" ")}
                      >
                        {/* 이니셜 아바타 */}
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300">
                          <span className="font-pretendard text-body4 font-semibold text-gray-700">
                            {u.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-pretendard text-body3 font-semibold text-gray-900 m-0 truncate">
                            {u.nickname}
                          </p>
                          <p className="font-pretendard text-body5 text-gray-500 m-0 truncate">
                            {u.email}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-6 pt-1">
          <p className="font-pretendard text-body5 text-gray-400 m-0">
            이메일 앞부분으로 검색하면 최대 10명의 사용자가 표시됩니다.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
