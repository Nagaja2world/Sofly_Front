import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SaveFlightPayload } from "@/api/workspaceApi";

interface AddFlightModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: SaveFlightPayload) => Promise<void>;
}

export default function AddFlightModal({
  isOpen,
  isSaving,
  onClose,
  onSave,
}: AddFlightModalProps) {
  const [flightType, setFlightType] = useState<"OUTBOUND" | "RETURN">("OUTBOUND");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFlightType("OUTBOUND");
      setFlightNumber("");
      setAirline("");
      setDepartureAirport("");
      setDepartureCity("");
      setArrivalAirport("");
      setArrivalCity("");
      setDepartureTime("");
      setArrivalTime("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave =
    flightNumber.trim() &&
    airline.trim() &&
    departureAirport.trim() &&
    arrivalAirport.trim() &&
    departureTime &&
    arrivalTime;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({
      flightType,
      flightNumber: flightNumber.trim(),
      airline: airline.trim(),
      departureAirport: departureAirport.trim(),
      departureCity: departureCity.trim() || null,
      arrivalAirport: arrivalAirport.trim(),
      arrivalCity: arrivalCity.trim() || null,
      departureTime: new Date(departureTime).toISOString(),
      arrivalTime: new Date(arrivalTime).toISOString(),
    });
  };

  const inputClass =
    "font-pretendard text-body3 text-gray-900 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-primary bg-white w-full";
  const labelClass = "font-pretendard text-body5 text-gray-500";

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-flight-title"
        className="bg-white rounded-2xl shadow-xl w-[540px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5"
      >
        <h2
          id="add-flight-title"
          className="font-pretendard text-title3 font-semibold text-gray-900 m-0"
        >
          항공편 추가
        </h2>

        {/* 가는편 / 오는편 선택 */}
        <div className="flex gap-3">
          {(["OUTBOUND", "RETURN"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFlightType(type)}
              className={[
                "flex-1 py-2 rounded-lg font-pretendard text-body3 border cursor-pointer transition-colors",
                flightType === type
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400",
              ].join(" ")}
            >
              {type === "OUTBOUND" ? "가는편" : "오는편"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>항공편 번호 *</label>
            <input
              className={inputClass}
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="예) OZ178"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>항공사 *</label>
            <input
              className={inputClass}
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder="예) Asiana Airlines"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>출발 공항 코드 *</label>
            <input
              className={inputClass}
              value={departureAirport}
              onChange={(e) =>
                setDepartureAirport(e.target.value.toUpperCase())
              }
              placeholder="예) ICN"
              maxLength={4}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>출발 도시</label>
            <input
              className={inputClass}
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              placeholder="예) Seoul"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>도착 공항 코드 *</label>
            <input
              className={inputClass}
              value={arrivalAirport}
              onChange={(e) =>
                setArrivalAirport(e.target.value.toUpperCase())
              }
              placeholder="예) HND"
              maxLength={4}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>도착 도시</label>
            <input
              className={inputClass}
              value={arrivalCity}
              onChange={(e) => setArrivalCity(e.target.value)}
              placeholder="예) Tokyo"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>출발 일시 *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>도착 일시 *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="font-pretendard text-body4 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer bg-transparent transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="font-pretendard text-body4 px-4 py-2 rounded-lg bg-primary text-gray-900 font-semibold cursor-pointer hover:brightness-95 transition-all border-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
