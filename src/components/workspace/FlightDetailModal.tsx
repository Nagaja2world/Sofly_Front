import { useEffect } from "react";
import type { WorkspaceFlight } from "@/api/workspaceApi";

interface FlightDetailModalProps {
  flight: WorkspaceFlight;
  onClose: () => void;
}

/* ── 유틸 ── */
function formatKoreanDateTime(iso: string): string {
  const d = new Date(iso);
  const yy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const h = d.getHours();
  const min = d.getMinutes();
  const meridiem = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${yy}.${mm}.${dd} ${meridiem} ${hour}:${String(min).padStart(2, "0")}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function formatPrice(n: number | null, currency = "₩"): string {
  if (n == null) return "-";
  return `${currency}${n.toLocaleString("ko-KR")}`;
}

function cabinLabel(c: string | null): string {
  if (!c) return "-";
  const map: Record<string, string> = {
    ECONOMY: "일반석",
    PREMIUM_ECONOMY: "프리미엄 이코노미",
    BUSINESS: "비즈니스",
    FIRST: "퍼스트",
  };
  return map[c] ?? c;
}

/* ── 항공사 로고 ── */
function AirlineLogo({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-8 h-8 rounded-full object-contain bg-gray-50 border border-gray-100"
      />
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-gray-200 inline-block shrink-0" aria-hidden="true" />
  );
}

/* ── 정보 행 ── */
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-pretendard text-body4 text-gray-500 shrink-0">{label}</span>
      <span className="font-pretendard text-body4 text-gray-900 text-right">{value}</span>
    </div>
  );
}

/* ── 가격 행 ── */
function PriceRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number | null;
  bold?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className={["flex items-center justify-between gap-4", bold ? "pt-2 mt-1 border-t border-gray-200" : ""].join(" ")}>
      <span className={["font-pretendard text-gray-700", bold ? "text-body3 font-semibold" : "text-body4"].join(" ")}>
        {label}
      </span>
      <span className={["font-pretendard text-gray-900", bold ? "text-body3 font-semibold" : "text-body4"].join(" ")}>
        {formatPrice(value)}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function FlightDetailModal({ flight, onClose }: FlightDetailModalProps) {
  /* ESC 키로 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const directionLabel = flight.flightType === "OUTBOUND" ? "가는편" : "오는편";
  const hasPriceInfo = flight.totalPrice != null || flight.baseFare != null;
  const hasBaggageInfo =
    flight.personalItemIncluded != null ||
    flight.cabinBaggageKg != null ||
    flight.checkedBaggagePiece != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AirlineLogo src={flight.airlineLogo} alt={flight.airline} />
            <div className="flex flex-col">
              <span className="font-pretendard text-body2 font-semibold text-gray-900">
                {flight.airline}
              </span>
              <span className="font-pretendard text-body5 text-gray-500">
                {directionLabel} · {flight.flightNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── 본문 ── */}
        <div className="overflow-y-auto flex flex-col gap-4 px-6 py-5">

          {/* 경로 + 시간 */}
          <div className="bg-gray-50 rounded-xl px-4 py-4 flex flex-col gap-3">
            {/* 출발 */}
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-pretendard text-body2 font-semibold text-gray-900">
                  {flight.departureAirport}
                  {flight.departureCity ? ` · ${flight.departureCity}` : ""}
                </span>
                <span className="font-pretendard text-body4 text-gray-500">
                  {formatKoreanDateTime(flight.departureTime)}
                  {flight.departureTerminal ? ` · ${flight.departureTerminal}번 터미널` : ""}
                </span>
              </div>
            </div>

            {/* 비행시간 */}
            <div className="flex items-center gap-2 pl-4">
              <span className="flex-1 h-px border-t border-dashed border-gray-300" />
              <span className="font-pretendard text-body5 text-gray-400 shrink-0">
                {formatDuration(flight.durationMinutes)}
              </span>
              <span className="flex-1 h-px border-t border-dashed border-gray-300" />
            </div>

            {/* 도착 */}
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-pretendard text-body2 font-semibold text-gray-900">
                  {flight.arrivalAirport}
                  {flight.arrivalCity ? ` · ${flight.arrivalCity}` : ""}
                </span>
                <span className="font-pretendard text-body4 text-gray-500">
                  {formatKoreanDateTime(flight.arrivalTime)}
                  {flight.arrivalTerminal ? ` · ${flight.arrivalTerminal}번 터미널` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 운항 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
            <span className="font-pretendard text-body3 font-semibold text-gray-900 mb-1">
              운항 정보
            </span>
            <InfoRow label="좌석 등급" value={cabinLabel(flight.cabinClass)} />
            <InfoRow label="기종" value={flight.planeType} />
          </div>

          {/* 수하물 */}
          {hasBaggageInfo && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
              <span className="font-pretendard text-body3 font-semibold text-gray-900 mb-1">
                수하물
              </span>
              {flight.personalItemIncluded && (
                <InfoRow label="개인 소지품" value="포함" />
              )}
              {flight.cabinBaggageKg != null && (
                <InfoRow
                  label="기내 수하물"
                  value={`${flight.cabinBaggageKg}kg`}
                />
              )}
              {flight.checkedBaggagePiece != null && (
                <InfoRow
                  label="위탁 수하물"
                  value={
                    flight.checkedBaggageKg != null
                      ? `${flight.checkedBaggagePiece}개 (개당 ${flight.checkedBaggageKg}kg)`
                      : `${flight.checkedBaggagePiece}개`
                  }
                />
              )}
            </div>
          )}

          {/* 가격 */}
          {hasPriceInfo && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
              <span className="font-pretendard text-body3 font-semibold text-gray-900 mb-1">
                가격
              </span>
              <PriceRow label="기본 운임" value={flight.baseFare} />
              <PriceRow label="세금 및 수수료" value={flight.tax} />
              {flight.platformFee != null && (
                <PriceRow label="플랫폼 수수료" value={flight.platformFee} />
              )}
              <PriceRow label="합계" value={flight.totalPrice} bold />
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <div className="px-6 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={[
              "w-full py-3 rounded-xl font-pretendard text-body2 font-semibold",
              "bg-gray-100 text-gray-700 border-none cursor-pointer",
              "hover:bg-gray-200 transition-all",
            ].join(" ")}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
