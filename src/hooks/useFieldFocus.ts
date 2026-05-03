import { useState, useRef, useEffect } from "react";

/**
 * 클릭 시 focus 활성화, 외부 클릭 시 해제되는 공통 훅
 * SelectField, PairSelectField 등에서 사용
 *
 * @param isOpen - 외부에서 focus 상태를 제어할 때 전달 (드롭다운 열림 여부 등)
 */
export function useFieldFocus(isOpen?: boolean) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement | HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen !== undefined) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isFocused = isOpen !== undefined ? isOpen : focused;

  const activate = () => setFocused(true);
  const deactivate = () => setFocused(false);

  return { ref, isFocused, activate, deactivate };
}
