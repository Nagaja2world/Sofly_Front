import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SaveFlightPayload, WorkspaceFlight } from "@/api/workspaceApi";

interface AddFlightModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: SaveFlightPayload) => Promise<void>;
  /** 수정 모드일 때 기존 항공편 데이터 */
  initialData?: WorkspaceFlight;
}

function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY = {
  flightType: "OUTBOUND" as "OUTBOUND" | "RETURN",
  flightNumber: "",
  airline: "",
  departureAirport: "",
  departureCity: "",
  departureTerminal: "",
  arrivalAirport: "",
  arrivalCity: "",
  arrivalTerminal: "",
  departureTime: "",
  arrivalTime: "",
  cabinClass: "",
  planeType: "",
  cabinBaggageKg: "",
  checkedBaggageKg: "",
  checkedBaggagePiece: "",
  baseFare: "",
  tax: "",
  platformFee: "",
  totalPrice: "",
};

export default function AddFlightModal({
  isOpen,
  isSaving,
  onClose,
  onSave,
  initialData,
}: AddFlightModalProps) {
  const isEditMode = !!initialData;
  const [form, setForm] = useState(EMPTY);

  const set = (field: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        flightType: initialData.flightType,
        flightNumber: initialData.flightNumber ?? '',
        airline: initialData.airline ?? '',
        departureAirport: initialData.departureAirport ?? '',
        departureCity: initialData.departureCity ?? '',
        departureTerminal: initialData.departureTerminal ?? '',
        arrivalAirport: initialData.arrivalAirport ?? '',
        arrivalCity: initialData.arrivalCity ?? '',
        arrivalTerminal: initialData.arrivalTerminal ?? '',
        departureTime: isoToDatetimeLocal(initialData.departureTime),
        arrivalTime: isoToDatetimeLocal(initialData.arrivalTime),
        cabinClass: initialData.cabinClass ?? '',
        planeType: initialData.planeType ?? '',
        cabinBaggageKg: initialData.cabinBaggageKg != null ? String(initialData.cabinBaggageKg) : '',
        checkedBaggageKg: initialData.checkedBaggageKg != null ? String(initialData.checkedBaggageKg) : '',
        checkedBaggagePiece: initialData.checkedBaggagePiece != null ? String(initialData.checkedBaggagePiece) : '',
        baseFare: initialData.baseFare != null ? String(initialData.baseFare) : '',
        tax: initialData.tax != null ? String(initialData.tax) : '',
        platformFee: initialData.platformFee != null ? String(initialData.platformFee) : '',
        totalPrice: initialData.totalPrice != null ? String(initialData.totalPrice) : '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
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
    form.flightNumber.trim() &&
    form.airline.trim() &&
    form.departureAirport.trim() &&
    form.arrivalAirport.trim() &&
    form.departureTime &&
    form.arrivalTime;

  const num = (v: string) => (v === "" ? null : Number(v));

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({
      flightType: form.flightType,
      flightNumber: form.flightNumber.trim(),
      airline: form.airline.trim(),
      departureAirport: form.departureAirport.trim(),
      departureCity: form.departureCity.trim() || null,
      departureTerminal: form.departureTerminal.trim() || null,
      arrivalAirport: form.arrivalAirport.trim(),
      arrivalCity: form.arrivalCity.trim() || null,
      arrivalTerminal: form.arrivalTerminal.trim() || null,
      departureTime: new Date(form.departureTime).toISOString(),
      arrivalTime: new Date(form.arrivalTime).toISOString(),
      cabinClass: form.cabinClass.trim() || null,
      planeType: form.planeType.trim() || null,
      cabinBaggageKg: num(form.cabinBaggageKg),
      checkedBaggageKg: num(form.checkedBaggageKg),
      checkedBaggagePiece: num(form.checkedBaggagePiece),
      baseFare: num(form.baseFare),
      tax: num(form.tax),
      platformFee: num(form.platformFee),
      totalPrice: num(form.totalPrice),
    });
  };

  const ic =
    "font-pretendard text-body3 text-gray-900 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-primary bg-white w-full";
  const lc = "font-pretendard text-body5 text-gray-500";
  const sh =
    "font-pretendard text-body3 font-semibold text-gray-800 pb-2 border-b border-gray-100";

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
        className="bg-white rounded-2xl shadow-xl w-[580px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6"
      >
        <h2
          id="add-flight-title"
          className="font-pretendard text-title3 font-semibold text-gray-900 m-0"
        >
          {isEditMode ? "항공편 수정" : "항공편 추가"}
        </h2>

        {/* 가는편 / 오는편 */}
        <div className="flex gap-3">
          {(["OUTBOUND", "RETURN"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((p) => ({ ...p, flightType: type }))}
              className={[
                "flex-1 py-2 rounded-lg font-pretendard text-body3 border cursor-pointer transition-colors",
                form.flightType === type
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400",
              ].join(" ")}
            >
              {type === "OUTBOUND" ? "가는편" : "오는편"}
            </button>
          ))}
        </div>

        {/* ── 기본 정보 ── */}
        <div className="flex flex-col gap-3">
          <p className={sh}>기본 정보</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lc}>항공편 번호 *</label>
              <input className={ic} value={form.flightNumber} onChange={set("flightNumber")} placeholder="예) OZ178" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>항공사 *</label>
              <input className={ic} value={form.airline} onChange={set("airline")} placeholder="예) Asiana Airlines" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>출발 공항 코드 *</label>
              <input
                className={ic}
                value={form.departureAirport}
                onChange={(e) =>
                  setForm((p) => ({ ...p, departureAirport: e.target.value.toUpperCase() }))
                }
                placeholder="예) ICN"
                maxLength={4}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>출발 도시</label>
              <input className={ic} value={form.departureCity} onChange={set("departureCity")} placeholder="예) Seoul" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>출발 터미널</label>
              <input className={ic} value={form.departureTerminal} onChange={set("departureTerminal")} placeholder="예) 1" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>출발 일시 *</label>
              <input type="datetime-local" className={ic} value={form.departureTime} onChange={set("departureTime")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>도착 공항 코드 *</label>
              <input
                className={ic}
                value={form.arrivalAirport}
                onChange={(e) =>
                  setForm((p) => ({ ...p, arrivalAirport: e.target.value.toUpperCase() }))
                }
                placeholder="예) HND"
                maxLength={4}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>도착 도시</label>
              <input className={ic} value={form.arrivalCity} onChange={set("arrivalCity")} placeholder="예) Tokyo" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>도착 터미널</label>
              <input className={ic} value={form.arrivalTerminal} onChange={set("arrivalTerminal")} placeholder="예) 3" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>도착 일시 *</label>
              <input type="datetime-local" className={ic} value={form.arrivalTime} onChange={set("arrivalTime")} />
            </div>
          </div>
        </div>

        {/* ── 운항 정보 ── */}
        <div className="flex flex-col gap-3">
          <p className={sh}>운항 정보</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lc}>좌석 등급</label>
              <input className={ic} value={form.cabinClass} onChange={set("cabinClass")} placeholder="예) ECONOMY" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>기종</label>
              <input className={ic} value={form.planeType} onChange={set("planeType")} placeholder="예) 359" />
            </div>
          </div>
        </div>

        {/* ── 수하물 ── */}
        <div className="flex flex-col gap-3">
          <p className={sh}>수하물</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lc}>기내 수하물 (kg)</label>
              <input type="number" min={0} className={ic} value={form.cabinBaggageKg} onChange={set("cabinBaggageKg")} placeholder="예) 17" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>위탁 수하물 (kg)</label>
              <input type="number" min={0} className={ic} value={form.checkedBaggageKg} onChange={set("checkedBaggageKg")} placeholder="예) 23" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>위탁 수하물 (개)</label>
              <input type="number" min={0} className={ic} value={form.checkedBaggagePiece} onChange={set("checkedBaggagePiece")} placeholder="예) 1" />
            </div>
          </div>
        </div>

        {/* ── 가격 ── */}
        <div className="flex flex-col gap-3">
          <p className={sh}>가격 (KRW)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lc}>기본 운임</label>
              <input type="number" min={0} className={ic} value={form.baseFare} onChange={set("baseFare")} placeholder="예) 319094" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>세금 및 수수료</label>
              <input type="number" min={0} className={ic} value={form.tax} onChange={set("tax")} placeholder="예) 318374" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>플랫폼 수수료</label>
              <input type="number" min={0} className={ic} value={form.platformFee} onChange={set("platformFee")} placeholder="예) 0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>합계</label>
              <input type="number" min={0} className={ic} value={form.totalPrice} onChange={set("totalPrice")} placeholder="예) 625351" />
            </div>
          </div>
        </div>

        {/* ── 버튼 ── */}
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
            {isSaving ? (isEditMode ? "수정 중..." : "저장 중...") : (isEditMode ? "수정" : "저장")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
