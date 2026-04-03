interface TabProps {
  items: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function Tab({ items, activeIndex, onChange }: TabProps) {
  return (
    <div className="flex gap-x-3">
      {items.map((item, i) => {
        const isActive = i === activeIndex;

        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={[
              "font-pretendard",
              "text-body2",
              "bg-transparent border-0 cursor-pointer",
              "transition-all duration-200 -mb-px",
              isActive
                ? "text-gray-800 border-b-2 border-primary"
                : "text-gray-500 border-b-2 border-transparent hover:text-gray-700",
            ].join(" ")}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
