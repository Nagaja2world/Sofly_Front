interface CheckboxProps {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Checkbox({
  label,
  checked = false,
  disabled = false,
  onChange,
}: CheckboxProps) {
  const handleClick = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <label
      onClick={handleClick}
      className={[
        "inline-flex items-center gap-1 select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "w-4 h-4 rounded-full flex items-center justify-center",
          "transition-all duration-150 border-2",
          checked
            ? disabled
              ? "bg-gray-300 border-gray-300"
              : "bg-primary border-primary"
            : disabled
              ? "bg-transparent border-gray-300"
              : "bg-transparent border-gray-400 hover:border-gray-600",
        ].join(" ")}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke={disabled ? "#9a9a9a" : "#2b2b2b"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label && (
        <span
          className={[
            "font-pretendard text-body3",
            // disabled
            //   ? "text-gray-500"
            //   : "text-gray-600 group-hover:text-gray-800",
            checked
              ? disabled
                ? "text-gray-500"
                : "text-gray-800"
              : disabled
                ? "text-gray-600"
                : "text-gray-800",
          ].join(" ")}
        >
          {label}
        </span>
      )}
    </label>
  );
}
