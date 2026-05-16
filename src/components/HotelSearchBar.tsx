import { useState } from "react";
import Checkbox from "./common/Checkbox";

type HotelSearchMode = "destination" | "url";

interface HotelGuests {
  adults: number;
  rooms: number;
}

export default function HotelSearchBar({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<HotelSearchMode>("destination");
  const [query, setQuery] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<HotelGuests>({ adults: 2, rooms: 1 });
  const [freeCancel, setFreeCancel] = useState(false);
  const [fourStarPlus, setFourStarPlus] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const guestLabel = `성인 ${guests.adults}명, ${guests.rooms}개`;

  const inputBase = [
    "w-full bg-transparent outline-none font-pretendard text-body3 text-gray-900",
    "placeholder:text-gray-400",
  ].join(" ");

  return (
    <section
      className={[
        "bg-white px-4 pt-4 pb-6 rounded-2xl shadow-[0_0.5rem_1.875rem_0_rgba(0,0,0,0.1)]",
        className,
      ].join(" ")}
    >
      {/* 검색 기준 탭 */}
      <div className="mb-4">
        <p className="font-pretendard text-body4 text-gray-500 mb-2">검색 기준</p>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => setMode("destination")}
            className={[
              "flex-1 py-2.5 font-pretendard text-body3 font-medium transition-colors border-none cursor-pointer",
              mode === "destination"
                ? "bg-primary text-gray-900"
                : "bg-white text-gray-500 hover:bg-gray-50",
            ].join(" ")}
          >
            목적지
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={[
              "flex-1 py-2.5 font-pretendard text-body3 font-medium transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5",
              mode === "url"
                ? "bg-primary text-gray-900"
                : "bg-white text-gray-500 hover:bg-gray-50",
            ].join(" ")}
          >
            <span>🔗</span>
            <span>URL</span>
          </button>
        </div>
      </div>

      {/* 검색 입력 */}
      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden mb-3">
        {/* 목적지 / URL 입력 */}
        <div className="px-4 py-4 border-b border-gray-200">
          {mode === "destination" ? (
            <div>
              <p className="font-pretendard text-body4 font-semibold text-gray-700 mb-1">
                어디로 가고 싶으세요?
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="목적지 또는 호텔 이름을 입력하세요."
                className={inputBase}
              />
            </div>
          ) : (
            <div>
              <p className="font-pretendard text-body4 font-semibold text-gray-700 mb-1">
                호텔 URL
              </p>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="호텔 예약 페이지 URL을 입력하세요."
                className={inputBase}
              />
            </div>
          )}
        </div>

        {/* 체크인 / 체크아웃 / 투숙객 & 객실 */}
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          {/* 체크인 */}
          <div className="px-4 py-3">
            <p className="font-pretendard text-body5 text-gray-500 mb-1">체크인</p>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={[inputBase, "text-body3 font-semibold cursor-pointer"].join(" ")}
            />
          </div>

          {/* 체크아웃 */}
          <div className="px-4 py-3">
            <p className="font-pretendard text-body5 text-gray-500 mb-1">체크아웃</p>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={[inputBase, "text-body3 font-semibold cursor-pointer"].join(" ")}
            />
          </div>

          {/* 투숙객 및 객실 */}
          <div className="px-4 py-3 relative">
            <p className="font-pretendard text-body5 text-gray-500 mb-1">투숙객 및 객실</p>
            <button
              type="button"
              onClick={() => setGuestOpen((v) => !v)}
              className="font-pretendard text-body3 font-semibold text-gray-900 bg-transparent border-none cursor-pointer p-0 text-left w-full"
            >
              {guestLabel}
            </button>

            {/* 투숙객 드롭다운 */}
            {guestOpen && (
              <div className="absolute top-full left-0 mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-56 flex flex-col gap-3">
                {/* 성인 */}
                <div className="flex items-center justify-between">
                  <span className="font-pretendard text-body3 text-gray-700">성인</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-pretendard text-body3 text-gray-900 w-4 text-center">
                      {guests.adults}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => ({ ...g, adults: g.adults + 1 }))}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* 객실 */}
                <div className="flex items-center justify-between">
                  <span className="font-pretendard text-body3 text-gray-700">객실</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => ({ ...g, rooms: Math.max(1, g.rooms - 1) }))}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-pretendard text-body3 text-gray-900 w-4 text-center">
                      {guests.rooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => ({ ...g, rooms: g.rooms + 1 }))}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestOpen(false)}
                  className="mt-1 w-full py-2 rounded-lg bg-primary font-pretendard text-body4 font-semibold text-gray-900 border-none cursor-pointer hover:brightness-95"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 체크박스 옵션 */}
      <div className="flex items-center gap-5 mb-4">
        <Checkbox label="무료 취소" checked={freeCancel} onChange={setFreeCancel} />
        <Checkbox label="4성급+" checked={fourStarPlus} onChange={setFourStarPlus} />
      </div>

      {/* 검색 버튼 */}
      <button
        type="button"
        className={[
          "w-full py-3.5 rounded-xl font-pretendard text-body2 font-semibold",
          "bg-primary text-gray-900 border-none cursor-pointer hover:brightness-95 transition-all",
        ].join(" ")}
      >
        검색하기
      </button>
    </section>
  );
}
