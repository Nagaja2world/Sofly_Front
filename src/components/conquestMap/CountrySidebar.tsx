import type { ConquestMapData, WorkspaceConquest } from "@/api/conquestApi";
import { C } from "./constants";
import { A3_A2 } from "./constants";
import type { ModalCtx, RouteFilter } from "./types";
import { pillBtn } from "./utils";
import { StatusPill } from "./StatusPill";

interface Props {
  open: boolean;
  onClose: () => void;
  selCountry: string | null;
  mapData: ConquestMapData | null;
  workspaces: WorkspaceConquest[];
  wsLoading: boolean;
  hlWsId: number | null;
  routeFilter: RouteFilter;
  onRouteFilter: (f: RouteFilter) => void;
  onOpenModal: (ctx: ModalCtx) => void;
}

export function CountrySidebar({
  open,
  onClose,
  selCountry,
  mapData,
  workspaces,
  wsLoading,
  hlWsId,
  onRouteFilter,
  onOpenModal,
}: Props) {
  const countryInfo = selCountry
    ? (mapData?.countries.find((c) => c.countryCode === A3_A2[selCountry]) ?? null)
    : null;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 340,
      background: C.white, borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      boxShadow: "-4px 0 16px rgba(43,43,43,0.04)",
      transform: open ? "translateX(0)" : "translateX(340px)",
      transition: "transform .3s ease",
      zIndex: 20,
    }}>
      {/* Header */}
      <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {countryInfo && (
              <div style={{ fontFamily: "Montserrat", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em" }}>
                {countryInfo.continentName?.toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 4 }}>
              {countryInfo?.countryName || (selCountry ? A3_A2[selCountry] || selCountry : "—")}
            </div>
            {countryInfo && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{countryInfo.countryCode}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center" }}
          >✕</button>
        </div>

        {countryInfo && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <StatusPill status={countryInfo.status} />
            <div style={{ fontSize: 12, color: C.muted }}>
              {countryInfo.visitCount > 0 ? `${countryInfo.visitCount}회 방문` : "기록 없음"}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ padding: "12px 18px", display: "flex", gap: 8, borderBottom: `1px solid ${C.border}` }}>
        {selCountry && countryInfo && (
          <button
            onClick={() => onOpenModal({
              type: "country",
              id: A3_A2[selCountry] || selCountry,
              name: countryInfo.countryName,
              status: countryInfo.status,
            })}
            style={{ ...pillBtn(), flex: 1, padding: "8px 10px" }}
          >
            상태 변경
          </button>
        )}
        <button
          onClick={() => onRouteFilter("all")}
          style={{ ...pillBtn(), flex: 1, padding: "8px 10px" }}
        >
          전체 경로
        </button>
      </div>

      {/* Trips list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", marginBottom: 10 }}>
          관련 여행 · {workspaces.length}
        </div>
        {wsLoading ? (
          <div style={{ textAlign: "center", padding: 28 }}>
            <div style={{
              width: 18, height: 18,
              border: `2px solid ${C.border}`,
              borderTopColor: C.text,
              borderRadius: "50%",
              animation: "spin .7s linear infinite",
              margin: "0 auto",
            }} />
          </div>
        ) : workspaces.length === 0 ? (
          <div style={{
            background: C.bg, borderRadius: 12, padding: 20,
            textAlign: "center", fontSize: 12, color: C.muted,
          }}>
            아직 이 국가의 여행이 없어요
          </div>
        ) : (
          workspaces.map((w) => (
            <div
              key={w.id}
              onClick={() => onRouteFilter(w.id)}
              style={{
                background: hlWsId === w.id ? `${C.primary}1a` : C.bg,
                border: `1px solid ${hlWsId === w.id ? C.primary : C.border}`,
                borderRadius: 12, padding: 14, marginBottom: 8,
                cursor: "pointer", transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{w.title}</div>
              <div style={{ fontSize: 12, color: C.subtle }}>📍 {w.destination}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: C.muted }}>{w.startDate} – {w.endDate}</div>
                <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 99, background: C.borderMid, display: "inline-block" }} />
                  멤버 {w.memberCount}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
