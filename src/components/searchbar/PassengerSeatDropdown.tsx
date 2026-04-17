import { useState, useRef, useEffect } from "react";
import SelectField from "@/components/common/SelectField";
import UsersIcon from "@/assets/users.svg?react";

/* ── 타입 ── */
export type SeatClass = "일반석" | "프리미엄 일반석" | "비즈니스석" | "일등석";

export interface PassengerSeatData {
  adults: number;
  children: number;
  seatClass: SeatClass;
}

interface PassengerSeatDropdownProps {
  /** 현재 값 */
  value: PassengerSeatData;
  /** 현재 열린 패널: "pax" | null */
  activePanel: string | null;
  /** 트리거 클릭 */
  onOpen: () => void;
  /** 변경 콜백 */
  onChange: (data: PassengerSeatData) => void;
  /** 드롭다운 닫기 */
  onClose: () => void;
  /** 추가 클래스 */
  className?: string;
}

const SEAT_CLASSES: SeatClass[] = [
  "일반석",
  "프리미엄 일반석",
  "비즈니스석",
  "일등석",
];

export default function PassengerSeatDropdown({
  value,
  activePanel,
  onOpen,
  onChange,
  onClose,
  className = "",
}: PassengerSeatDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = activePanel === "pax";
  const [temp, setTemp] = useState(value);

  /* 외부 클릭 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const update = (p: Partial<PassengerSeatData>) =>
    setTemp((v) => ({ ...v, ...p }));

  const apply = () => {
    onChange(temp);
    onClose();
  };

  const total = value.adults + value.children;

  return (
    <div ref={ref} className={["relative flex-1 min-w-0", className].join(" ")}>
      {/* 트리거: SelectField */}
      <SelectField
        bg="gray"
        value={`여행자 ${total}명, ${value.seatClass}`}
        placeholder="인원/좌석등급"
        leftIcon={<UsersIcon />}
        onClick={() => {
          setTemp(value);
          onOpen();
        }}
        isOpen={isOpen}
      />

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div
          className={[
            "absolute top-full right-0 mt-2 z-50",
            "bg-white border border-gray-300 rounded-xl",
            "shadow-[0_8px_30px_0_rgba(0,0,0,0.1)]",
            "w-[360px]",
          ].join(" ")}
        >
          {/* 헤더 */}
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
              여행자 및 좌석 등급
            </h3>
          </div>

          {/* 여행자 섹션 */}
          <div className="px-5 pb-4">
            <p className="font-pretendard text-body2 font-semibold text-gray-800 mb-3">
              여행자
            </p>

            {/* 성인 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-pretendard text-body2 text-gray-900 m-0">
                  성인
                </p>
                <p className="font-pretendard text-body5 text-gray-500 m-0 mt-0.5">
                  만 12세 이상 (최대 만 19세 이상)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CounterButton
                  disabled={temp.adults <= 1}
                  onClick={() =>
                    update({ adults: Math.max(1, temp.adults - 1) })
                  }
                  label="−"
                />
                <span className="font-pretendard text-body1 font-semibold text-gray-900 w-6 text-center">
                  {temp.adults}
                </span>
                <CounterButton
                  disabled={temp.adults + temp.children >= 9}
                  onClick={() => update({ adults: temp.adults + 1 })}
                  label="+"
                />
              </div>
            </div>

            {/* 유/소아 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-pretendard text-body2 text-gray-900 m-0">
                  유/소아
                </p>
                <p className="font-pretendard text-body5 text-gray-500 m-0 mt-0.5">
                  만 0 ~ 만 12세 미만 (좌석 만 13세 미만)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CounterButton
                  disabled={temp.children <= 0}
                  onClick={() =>
                    update({ children: Math.max(0, temp.children - 1) })
                  }
                  label="−"
                />
                <span className="font-pretendard text-body1 font-semibold text-gray-900 w-6 text-center">
                  {temp.children}
                </span>
                <CounterButton
                  disabled={temp.adults + temp.children >= 9}
                  onClick={() => update({ children: temp.children + 1 })}
                  label="+"
                />
              </div>
            </div>

            {/* 유의사항 */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="font-pretendard text-body4 text-gray-600 m-0 leading-relaxed">
                유의사항 : 유/소아 탑승 시 보호자 동반이 필요하며, 나이에 따라
                좌석 요금이 다를 수 있습니다.
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 mx-5" />

          {/* 좌석 등급 */}
          <div className="px-5 py-4">
            <p className="font-pretendard text-body2 font-semibold text-gray-800 mb-3">
              좌석 등급
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SEAT_CLASSES.map((seat) => {
                const active = temp.seatClass === seat;
                return (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => update({ seatClass: seat })}
                    className={[
                      "flex items-center gap-2 px-3 py-2.5",
                      "rounded-lg border transition-all duration-150",
                      "font-pretendard text-body3 cursor-pointer",
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-500",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-4 h-4 rounded-full border-2 shrink-0",
                        "flex items-center justify-center",
                        active ? "border-white" : "border-gray-400",
                      ].join(" ")}
                    >
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                    {seat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 적용 버튼 */}
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={apply}
              className={[
                "w-full py-3 rounded-lg",
                "font-pretendard text-body2 font-semibold",
                "bg-gray-900 text-white border-none",
                "cursor-pointer hover:bg-gray-800",
                "transition-all duration-200 active:scale-[0.98]",
              ].join(" ")}
            >
              적 용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 카운터 버튼 ── */
function CounterButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-8 h-8 rounded-full border border-gray-300",
        "flex items-center justify-center",
        "bg-white font-pretendard text-body1",
        "transition-all duration-150",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 cursor-pointer hover:border-gray-500 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
