import { type HotelFilterCategory } from "@/api/hotelApi";

interface HotelFilterPanelProps {
  filterOptions: HotelFilterCategory[];
  selectedFilters: string[];
  onFilterChange: (filterId: string) => void;
}

export default function HotelFilterPanel({
  filterOptions,
  selectedFilters,
  onFilterChange,
}: HotelFilterPanelProps) {
  if (filterOptions.length === 0) return null;

  return (
    <aside className="w-60 shrink-0 flex flex-col gap-6">
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
        필터
      </h2>
      {filterOptions.map((category) => (
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
