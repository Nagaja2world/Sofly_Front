import type { ConquestStats, TripRoute } from "@/api/conquestApi";
import { C, panelBase } from "./constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  stats: ConquestStats | null;
  allRoutes: TripRoute[];
}

export function StatsPanel({ open, onClose, onOpen, stats, allRoutes }: Props) {
  if (!open) {
    return (
      <button
        onClick={onOpen}
        style={{
          position: "absolute", top: 24, left: 24,
          width: 44, height: 44, borderRadius: 14,
          border: "none", background: C.surface,
          boxShadow: "0 4px 16px rgba(43,43,43,0.08)",
          cursor: "pointer", fontSize: 18,
          display: "grid", placeItems: "center",
          zIndex: 10,
        }}
      >
        📊
      </button>
    );
  }

  return (
    <div style={{ ...panelBase, top: 24, left: 24, width: 300, transform: "translateX(0)", transition: "transform .25s ease" }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "Montserrat", fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.08em" }}>
            YOUR JOURNEY
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 2 }}>여행 기록</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center" }}
        >✕</button>
      </div>

      {!stats ? (
        <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12, color: C.muted }}>
          데이터를 로드해주세요
        </div>
      ) : (
        <>
          {/* Country count */}
          <div style={{ padding: "18px 18px 14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontFamily: "Montserrat", fontSize: 44, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                {stats.visitedCountryCount}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>/ {stats.totalCountryCount} 개국</div>
            </div>
            <div style={{ marginTop: 10, height: 6, background: C.border, borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                width: `${stats.visitedCountryPercentage}%`, height: "100%",
                background: `linear-gradient(90deg, ${C.primary}, #ffd966)`,
                borderRadius: 999,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 6 }}>
              <span>전 세계</span>
              <span>{stats.visitedCountryPercentage?.toFixed(1)}%</span>
            </div>
          </div>

          {/* Mini stats grid */}
          <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "방문 도시", val: stats.visitedCityCount, unit: "곳" },
              { label: "여행 일수", val: stats.totalTravelDays, unit: "일" },
              { label: "이동 거리", val: Math.round((stats.totalDistanceKm ?? 0) / 1000), unit: "천km" },
              { label: "여행 횟수", val: allRoutes.length || "—", unit: "" },
            ].map((m) => (
              <div key={m.label} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontFamily: "Montserrat", fontSize: 18, fontWeight: 700, color: C.text }}>
                  {typeof m.val === "number" ? m.val.toLocaleString() : m.val}
                  <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginLeft: 3 }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Continent bars */}
          {stats.continentStats?.length > 0 && (
            <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", marginBottom: 10 }}>
                대륙별
              </div>
              {(() => {
                const max = Math.max(...stats.continentStats.map((c) => c.visitedCountryCount), 1);
                return stats.continentStats.map((c) => (
                  <div key={c.continent} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: C.subtle, width: 60 }}>{c.continentName}</div>
                    <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${c.visitedCountryCount > 0 ? Math.max((c.visitedCountryCount / max) * 100, 8) : 0}%`,
                        background: c.visitedCountryCount > 0 ? C.primary : C.borderMid,
                        borderRadius: 99,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.subtle, width: 18, textAlign: "right" }}>
                      {c.visitedCountryCount}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
