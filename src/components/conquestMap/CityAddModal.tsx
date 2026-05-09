import { useState } from "react";
import type { VisitStatus } from "@/api/conquestApi";
import { C, STATUS_COLOR, STATUS_LABEL } from "./constants";
import { pillBtn } from "./utils";

interface Props {
  countryCode: string;
  countryName: string;
  loading: boolean;
  onSubmit: (cityName: string, lat: number, lng: number, status: VisitStatus) => void;
  onClose: () => void;
}

export function CityAddModal({ countryCode, countryName, loading, onSubmit, onClose }: Props) {
  const [cityName, setCityName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<VisitStatus>("VISITED");

  const canSubmit = cityName.trim() && lat !== "" && lng !== "" && !isNaN(Number(lat)) && !isNaN(Number(lng));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(cityName.trim(), Number(lat), Number(lng), status);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: C.bg, border: `1px solid ${C.borderMid}`,
    borderRadius: 8, padding: "8px 10px",
    color: C.text, fontSize: 13,
    fontFamily: "Pretendard, -apple-system, sans-serif",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: C.muted,
    letterSpacing: "0.06em", marginBottom: 4, display: "block",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(43,43,43,0.4)",
        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.border}`, padding: 24,
        width: 340, display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 20px 60px rgba(43,43,43,0.12)",
        fontFamily: "Pretendard, -apple-system, sans-serif",
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>도시 추가</h3>
          <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
            {countryName} ({countryCode})
          </p>
        </div>

        {/* City name */}
        <div>
          <label style={labelStyle}>도시명</label>
          <input
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="예: Seoul"
            style={inputStyle}
          />
        </div>

        {/* Lat / Lng */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>위도 (Lat)</label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="37.5665"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>경도 (Lng)</label>
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="126.9780"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>방문 상태</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(["VISITED", "PLANNED", "UNVISITED"] as VisitStatus[]).map((s) => (
              <div
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  border: `2px solid ${status === s ? C.text : C.border}`,
                  cursor: "pointer",
                  background: status === s ? `${C.text}08` : C.bg,
                  transition: "all .15s",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[s], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={pillBtn()}>취소</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{ ...pillBtn(true), opacity: canSubmit && !loading ? 1 : 0.4 }}
          >
            {loading ? "추가 중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
