import { useEffect, useState } from "react";
import { type HotelFilterCategory } from "@/api/hotelApi";

interface HotelFilterPanelProps {
  filterOptions: HotelFilterCategory[];
  selectedFilters: string[];
  priceMin: number;
  priceMax: number;
  onFilterChange: (filterId: string) => void;
  onPriceChange: (priceMin: number, priceMax: number) => void;
  onClear: () => void;
}

export default function HotelFilterPanel({
  filterOptions,
  selectedFilters,
  priceMin,
  priceMax,
  onFilterChange,
  onPriceChange,
  onClear,
}: HotelFilterPanelProps) {
  const [minInput, setMinInput] = useState(String(priceMin || ""));
  const [maxInput, setMaxInput] = useState(String(priceMax || ""));

  useEffect(() => {
    setMinInput(String(priceMin || ""));
    setMaxInput(String(priceMax || ""));
  }, [priceMin, priceMax]);

  const visibleCategories = filterOptions.filter(
    (category) => Array.isArray(category.filters) && category.filters.length > 0,
  );
  const hasSelectedFilters = selectedFilters.length > 0 || priceMin > 0 || priceMax > 0;

  const applyPrice = () => {
    onPriceChange(Number(minInput) || 0, Number(maxInput) || 0);
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
          필터
        </h2>
        {hasSelectedFilters && (
          <button
            type="button"
            onClick={onClear}
            className="border-none bg-transparent p-0 font-pretendard text-body5 text-gray-500 underline cursor-pointer"
          >
            초기화
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-pretendard text-body3 font-semibold text-gray-800 m-0">
          가격
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder="최소"
            className="w-full rounded-lg border border-gray-300 px-2 py-2 font-pretendard text-body4 text-gray-800 outline-none focus:border-gray-700"
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder="최대"
            className="w-full rounded-lg border border-gray-300 px-2 py-2 font-pretendard text-body4 text-gray-800 outline-none focus:border-gray-700"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-pretendard text-body4 text-gray-800 cursor-pointer hover:border-gray-700"
        >
          적용
        </button>
      </div>

      {visibleCategories.map((category) => (
        <div key={category.id} className="flex flex-col gap-2">
          <h3 className="font-pretendard text-body3 font-semibold text-gray-800 m-0">
            {category.title}
          </h3>
          <div className="flex flex-col gap-1.5">
            {category.filters.map((filter) => {
              const checked = selectedFilters.includes(filter.id);
              return (
                <label
                  key={filter.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onFilterChange(filter.id)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="font-pretendard text-body3 text-gray-700 group-hover:text-gray-900 flex-1">
                    {filter.title}
                  </span>
                  <span className="font-pretendard text-body5 text-gray-400">
                    {filter.count.toLocaleString()}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
