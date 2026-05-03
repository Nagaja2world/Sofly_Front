import {
  useState,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  /** 우측 아이콘 (src/assets에서 import하여 전달) */
  icon?: ReactNode;
  /** 값 변경 콜백 */
  onChange?: (value: string) => void;
}

export default function TextField({
  icon,
  className = "",
  onChange,
  disabled,
  value,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = String(currentValue).length > 0;

  const getContainerStyle = () => {
    if (focused) return "bg-white border-gray-900";
    if (hasValue) return "bg-white border-gray-300";
    return "bg-gray-100 border-gray-200";
  };

  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      <div
        className={[
          "flex items-center gap-2 px-3.5 py-2.5",
          "border rounded-lg transition-all duration-200",
          getContainerStyle(),
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          value={currentValue}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.(e.target.value);
          }}
          className={[
            "flex-1 border-none outline-none bg-transparent",
            "font-pretendard text-body3 text-gray-900",
            "placeholder:text-gray-500",
          ].join(" ")}
          {...props}
        />
        {icon && <span className="inline-flex text-gray-500">{icon}</span>}
      </div>
    </div>
  );
}
