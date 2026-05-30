import {
  type PassengerSeatData,
  type SeatClass,
} from "@/components/searchbar/PassengerSeatDropdown";

/* ══════════════════════════════════════════
   PassengerSeatSheetBody
   ══════════════════════════════════════════
   BottomSheet 안에 들어가는 인원/좌석등급 본문.
   PassengerSeatDropdown의 카운터/좌석등급 선택 로직을 그대로 가져옴.
   값(temp)은 부모가 들고 있다가 "적용" 시 onApply로 확정. */

const SEAT_CLASSES: SeatClass[] = [
  "일반석",
  "프리미엄 일반석",
  "비즈니스석",
  "일등석",
];

interface PassengerSeatSheetBodyProps {
  value: PassengerSeatData;
  onChange: (data: PassengerSeatData) => void;
  onApply: () => void;
}

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
      aria-label={label === "+" ? "늘리기" : "줄이기"}
      className={[
        "w-10 h-10 rounded-full border border-gray-300",
        "flex items-center justify-center",
        "bg-white font-pretendard text-body1",
        "transition-all duration-150",
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 cursor-pointer active:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function PassengerSeatSheetBody({
  value,
  onChange,
  onApply,
}: PassengerSeatSheetBodyProps) {
  const update = (p: Partial<PassengerSeatData>) =>
    onChange({ ...value, ...p });

  const total = value.adults + value.children;

  return (
    <div className="flex flex-col">
      {/* 여행자 */}
      <div className="px-5 pt-4 pb-2">
        <p className="font-pretendard text-body2 font-semibold text-gray-800 mb-3">
          여행자
        </p>

        {/* 성인 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-pretendard text-body2 text-gray-900 m-0">성인</p>
            <p className="font-pretendard text-body5 text-gray-500 m-0 mt-0.5">
              만 12세 이상
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CounterButton
              disabled={value.adults <= 1}
              onClick={() => update({ adults: Math.max(1, value.adults - 1) })}
              label="−"
            />
            <span className="font-pretendard text-body1 font-semibold text-gray-900 w-6 text-center">
              {value.adults}
            </span>
            <CounterButton
              disabled={total >= 9}
              onClick={() => update({ adults: value.adults + 1 })}
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
              만 0 ~ 만 12세 미만
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CounterButton
              disabled={value.children <= 0}
              onClick={() =>
                update({ children: Math.max(0, value.children - 1) })
              }
              label="−"
            />
            <span className="font-pretendard text-body1 font-semibold text-gray-900 w-6 text-center">
              {value.children}
            </span>
            <CounterButton
              disabled={total >= 9}
              onClick={() => update({ children: value.children + 1 })}
              label="+"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <p className="font-pretendard text-body4 text-gray-600 m-0 leading-relaxed">
            유의사항 : 유/소아 탑승 시 보호자 동반이 필요하며, 나이에 따라 좌석
            요금이 다를 수 있습니다.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 mx-5 my-2" />

      {/* 좌석 등급 */}
      <div className="px-5 py-2">
        <p className="font-pretendard text-body2 font-semibold text-gray-800 mb-3">
          좌석 등급
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SEAT_CLASSES.map((seat) => {
            const active = value.seatClass === seat;
            return (
              <button
                key={seat}
                type="button"
                onClick={() => update({ seatClass: seat })}
                className={[
                  "flex items-center gap-2 px-3 py-3",
                  "rounded-lg border transition-all duration-150",
                  "font-pretendard text-body3 cursor-pointer",
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-4 h-4 rounded-full border-2 shrink-0",
                    "flex items-center justify-center",
                    active ? "border-white" : "border-gray-400",
                  ].join(" ")}
                >
                  {active && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {seat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 적용 버튼 (sticky 하단) */}
      <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onApply}
          className={[
            "w-full py-3.5 rounded-lg",
            "font-pretendard text-body2 font-semibold",
            "bg-gray-900 text-white border-none cursor-pointer",
            "transition-all duration-200 active:scale-[0.98]",
          ].join(" ")}
        >
          여행자 {total}명 적용
        </button>
      </div>
    </div>
  );
}
