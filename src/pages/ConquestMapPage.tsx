import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  getConquestMap,
  getConquestStats,
  getConquestRoutes,
  getCountryWorkspaces,
  updateCountryStatus,
  updateCityStatus,
  bulkImport,
  type ConquestMapData,
  type ConquestStats,
  type TripRoute,
  type WorkspaceConquest,
  type VisitStatus,
} from "@/api/conquestApi";
import { A3_A2, WV_FILTER, BULK_TEMPLATE, C, STATUS_COLOR, panelBase } from "@/components/conquestMap/constants";
import { genArc } from "@/components/conquestMap/utils";
import type { RouteFilter, ModalCtx } from "@/components/conquestMap/types";
import { MapHeader } from "@/components/conquestMap/MapHeader";
import { StatsPanel } from "@/components/conquestMap/StatsPanel";
import { CountrySidebar } from "@/components/conquestMap/CountrySidebar";
import { StatusModal } from "@/components/conquestMap/StatusModal";
import { BulkImportModal } from "@/components/conquestMap/BulkImportModal";
import { LegendDot } from "@/components/conquestMap/LegendDot";
import { Toast } from "@/components/conquestMap/Toast";

export default function ConquestMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const cbRef = useRef({
    loadWorkspaces: (_iso2: string) => {},
    openCityModal: (_id: number, _status: VisitStatus, _name: string) => {},
  });

  // ── Token ──
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const [mbToken, setMbToken] = useState(envToken || localStorage.getItem("cq_mb") || "");
  const [tokenInput, setTokenInput] = useState("");

  // ── Data ──
  const [mapData, setMapData] = useState<ConquestMapData | null>(null);
  const [stats, setStats] = useState<ConquestStats | null>(null);
  const [allRoutes, setAllRoutes] = useState<TripRoute[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── UI ──
  const [selCountry, setSelCountry] = useState<string | null>(null); // alpha-3
  const [statsOpen, setStatsOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceConquest[]>([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("all");
  const [hlWsId, setHlWsId] = useState<number | null>(null);

  // ── Modal ──
  const [modalCtx, setModalCtx] = useState<ModalCtx | null>(null);
  const [modalStatus, setModalStatus] = useState<VisitStatus>("VISITED");
  const [modalLoading, setModalLoading] = useState(false);

  // ── Bulk ──
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState(BULK_TEMPLATE);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err"; id: number } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err") => {
    const id = Date.now();
    setToast({ msg, type, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800);
  }, []);

  // ── Data loading ──
  const loadAll = useCallback(async () => {
    setDataLoading(true);
    try {
      const [md, st, rt] = await Promise.all([
        getConquestMap(), getConquestStats(), getConquestRoutes(),
      ]);
      setMapData(md);
      setStats(st);
      setAllRoutes(rt);
      showToast("데이터 로드 완료", "ok");
    } catch (e: unknown) {
      showToast("로드 실패: " + (e instanceof Error ? e.message : "오류"), "err");
    } finally {
      setDataLoading(false);
    }
  }, [showToast]);

  const loadWorkspaces = useCallback(async (iso2: string) => {
    setWsLoading(true);
    setWorkspaces([]);
    try {
      const ws = await getCountryWorkspaces(iso2);
      setWorkspaces(ws);
    } catch {
      setWorkspaces([]);
    } finally {
      setWsLoading(false);
    }
  }, []);

  cbRef.current.loadWorkspaces = loadWorkspaces;
  cbRef.current.openCityModal = (id, status, name) => {
    setModalCtx({ type: "city", id, name, status });
    setModalStatus(status);
  };

  // ── Map init ──
  useEffect(() => {
    if (!containerRef.current || !mbToken) return;

    mapboxgl.accessToken = mbToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 15],
      zoom: 1.6,
      projection: "mercator" as unknown as mapboxgl.ProjectionSpecification,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("cb", { type: "vector", url: "mapbox://mapbox.country-boundaries-v1" });
      map.addSource("cities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true, clusterMaxZoom: 8, clusterRadius: 38,
      });
      map.addSource("routes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "c-hit", type: "fill", source: "cb", "source-layer": "country_boundaries",
        filter: ["has", "iso_3166_1_alpha_3"],
        paint: { "fill-opacity": 0 },
      });
      map.addLayer({
        id: "c-fill", type: "fill", source: "cb", "source-layer": "country_boundaries",
        filter: WV_FILTER,
        paint: { "fill-color": C.unvisited, "fill-opacity": 0 },
      });
      map.addLayer({
        id: "c-line", type: "line", source: "cb", "source-layer": "country_boundaries",
        filter: WV_FILTER,
        paint: { "line-color": "rgba(43,43,43,0.12)", "line-width": 0.5 },
      });
      map.addLayer({
        id: "c-hover", type: "fill", source: "cb", "source-layer": "country_boundaries",
        paint: {
          "fill-color": "rgba(43,43,43,0.06)",
          // filter 대신 feature-state로 opacity 제어
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0],
        },
      });
      map.addLayer({
        id: "c-sel", type: "line", source: "cb", "source-layer": "country_boundaries",
        filter: ["==", ["get", "iso_3166_1_alpha_3"], ""],
        paint: { "line-color": C.text, "line-width": 2.5 },
      });
      map.addLayer({
        id: "rt-line", type: "line", source: "routes",
        paint: { "line-color": C.muted, "line-width": 1.5, "line-opacity": 0.55, "line-dasharray": [2, 2] },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "rt-glow", type: "line", source: "routes",
        paint: { "line-color": C.muted, "line-width": 4, "line-opacity": 0.1, "line-blur": 3 },
      });
      map.addLayer({
        id: "cl-circle", type: "circle", source: "cities",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": C.visited,
          "circle-opacity": 0.9,
          "circle-radius": ["step", ["get", "point_count"], 13, 5, 17, 10, 21],
          "circle-stroke-width": 2,
          "circle-stroke-color": C.white,
        },
      });
      map.addLayer({
        id: "city-halo", type: "circle", source: "cities",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 12,
          "circle-opacity": 0.20,
          "circle-blur": 1.0,
        },
      });
      map.addLayer({
        id: "city-pt", type: "circle", source: "cities",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 5,
          "circle-stroke-color": C.white,
          "circle-stroke-width": 2,
        },
      });

      let hoveredFeatureId: string | number | null = null;

      map.on("mousemove", "c-hit", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";

        const f = e.features.find((f) => f.properties?.iso_3166_1_alpha_3?.length === 3);
        if (!f?.id) return;

        // 이전 hover 해제
        if (hoveredFeatureId !== null && hoveredFeatureId !== f.id) {
          map.setFeatureState(
            { source: "cb", sourceLayer: "country_boundaries", id: hoveredFeatureId },
            { hover: false }
          );
        }

        hoveredFeatureId = f.id;
        map.setFeatureState(
          { source: "cb", sourceLayer: "country_boundaries", id: hoveredFeatureId },
          { hover: true }
        );
      });

      map.on("mouseleave", "c-hit", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredFeatureId !== null) {
          map.setFeatureState(
            { source: "cb", sourceLayer: "country_boundaries", id: hoveredFeatureId },
            { hover: false }
          );
          hoveredFeatureId = null;
        }
      });

      map.on("click", "c-hit", (e) => {
        const f = e.features?.find((f) => f.properties?.iso_3166_1_alpha_3?.length === 3);
        const iso3 = f?.properties?.iso_3166_1_alpha_3 as string | undefined;
        if (!iso3) return;
        map.setFilter("c-sel", ["==", ["get", "iso_3166_1_alpha_3"], iso3]);
        setSelCountry(iso3);
        setSidebarOpen(true);
        const iso2 = A3_A2[iso3];
        if (iso2) cbRef.current.loadWorkspaces(iso2);
      });

      map.on("click", "cl-circle", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["cl-circle"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id as number;
        const src = map.getSource("cities") as mapboxgl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          const geom = features[0].geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom });
        });
      });

      map.on("click", "city-pt", (e) => {
        if (!e.features?.length) return;
        const p = e.features[0].properties!;
        cbRef.current.openCityModal(p.id as number, p.status as VisitStatus, p.name as string);
      });

      map.on("click", (e) => {
        const fs = map.queryRenderedFeatures(e.point, { layers: ["c-hit", "city-pt", "cl-circle"] });
        if (!fs.length) {
          setSelCountry(null);
          setSidebarOpen(false);
          map.setFilter("c-sel", ["==", ["get", "iso_3166_1_alpha_3"], ""]);
        }
      });

      ["cl-circle", "city-pt"].forEach((l) => {
        map.on("mouseenter", l, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", l, () => (map.getCanvas().style.cursor = ""));
      });

      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mbToken]);

  // ── Update country colors ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapData) return;

    const expr: (string | string[])[] = ["match", ["get", "iso_3166_1"]];
    for (const c of mapData.countries) {
      if (c.status === "VISITED") expr.push(c.countryCode, C.visited);
      else if (c.status === "PLANNED") expr.push(c.countryCode, C.planned);
    }
    expr.push("transparent");
    map.setPaintProperty("c-fill", "fill-color", expr as any);

    const opacityExpr: unknown[] = ["match", ["get", "iso_3166_1"]];
    const visitedCodes = mapData.countries.filter(c => c.status === "VISITED").map(c => c.countryCode);
    const plannedCodes = mapData.countries.filter(c => c.status === "PLANNED").map(c => c.countryCode);
    if (visitedCodes.length) opacityExpr.push(visitedCodes, 0.55);
    if (plannedCodes.length) opacityExpr.push(plannedCodes, 0.40);
    opacityExpr.push(0);
    map.setPaintProperty("c-fill", "fill-opacity", opacityExpr as any);

    const features = mapData.cities
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [c.longitude, c.latitude] },
        properties: {
          id: c.id, name: c.cityName, cc: c.countryCode, status: c.status,
          color: STATUS_COLOR[c.status],
        },
      }));
    (map.getSource("cities") as mapboxgl.GeoJSONSource).setData({ type: "FeatureCollection", features });
  }, [mapReady, mapData]);

  // ── Update routes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const list = routeFilter === "none"
      ? []
      : routeFilter === "all"
      ? allRoutes
      : allRoutes.filter((r) => r.workspaceId === routeFilter);

    const features = list
      .filter((r) => r.departureLng && r.departureLat && r.arrivalLng && r.arrivalLat)
      .map((r) => ({
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: genArc([r.departureLng, r.departureLat], [r.arrivalLng, r.arrivalLat]) },
        properties: {},
      }));
    (map.getSource("routes") as mapboxgl.GeoJSONSource).setData({ type: "FeatureCollection", features });
  }, [mapReady, allRoutes, routeFilter]);

  // ── Update selection outline ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setFilter("c-sel", ["==", ["get", "iso_3166_1_alpha_3"], selCountry || ""]);
  }, [mapReady, selCountry]);

  // ── Confirm status ──
  const confirmStatus = async () => {
    if (!modalCtx) return;
    setModalLoading(true);
    try {
      if (modalCtx.type === "country") await updateCountryStatus(modalCtx.id, modalStatus);
      else await updateCityStatus(modalCtx.id, modalStatus);
      setModalCtx(null);
      showToast("상태가 변경되었습니다", "ok");
      await loadAll();
      if (modalCtx.type === "country" && selCountry) {
        const iso2 = A3_A2[selCountry];
        if (iso2) await loadWorkspaces(iso2);
      }
    } catch (e: unknown) {
      showToast("변경 실패: " + (e instanceof Error ? e.message : "오류"), "err");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Bulk import ──
  const submitBulk = async () => {
    let body: unknown;
    try { body = JSON.parse(bulkJson); }
    catch (e: unknown) { showToast("JSON 오류: " + (e instanceof Error ? e.message : "파싱 실패"), "err"); return; }
    setBulkLoading(true);
    try {
      await bulkImport(body as Parameters<typeof bulkImport>[0]);
      setBulkOpen(false);
      showToast("일괄 등록 완료", "ok");
      await loadAll();
    } catch (e: unknown) {
      showToast("등록 실패: " + (e instanceof Error ? e.message : "오류"), "err");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRouteFilter = (f: RouteFilter) => {
    setRouteFilter(f);
    setHlWsId(typeof f === "number" ? f : null);
  };

  const handleTokenSubmit = () => {
    if (!tokenInput.trim()) return;
    localStorage.setItem("cq_mb", tokenInput.trim());
    setMbToken(tokenInput.trim());
  };

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: C.bg, color: C.text,
      fontFamily: "Pretendard, -apple-system, sans-serif", overflow: "hidden",
    }}>
      <MapHeader
        envToken={envToken}
        tokenInput={tokenInput}
        onTokenInputChange={setTokenInput}
        onTokenSubmit={handleTokenSubmit}
        mbToken={mbToken}
        dataLoading={dataLoading}
        onLoadData={loadAll}
        onBulkOpen={() => setBulkOpen(true)}
      />

      {/* ── Map area ──────────────────────────────── */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Init overlay (no token) */}
        {!mbToken && (
          <div style={{
            position: "absolute", inset: 0, background: C.bg, zIndex: 5,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `linear-gradient(135deg, ${C.primary}, #f0c043)`,
              display: "grid", placeItems: "center",
              boxShadow: `0 4px 20px rgba(245,209,90,0.40)`,
            }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth={1.8}>
                <circle cx={12} cy={12} r={9} />
                <path d="M3 12h18 M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
              Conquest Map
            </h2>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              상단의 Mapbox 토큰을 입력하고<br />
              <strong style={{ color: C.text }}>지도 로드</strong> 버튼을 눌러 시작하세요.
            </p>
          </div>
        )}

        {mbToken && (
          <>
            {/* Stats Panel */}
            <StatsPanel
              open={statsOpen}
              onClose={() => setStatsOpen(false)}
              onOpen={() => setStatsOpen(true)}
              stats={stats}
              allRoutes={allRoutes}
            />

            {/* Legend */}
            <div style={{
              ...panelBase,
              bottom: 56, left: 24,
              padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 7,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.07em" }}>범례</div>
              <LegendDot color={C.visited} label="방문 완료" />
              <LegendDot color={C.planned} label="방문 예정" />
              <LegendDot color={C.unvisited} label="미방문" outline />
              <div style={{ height: 1, background: C.border, margin: "2px 0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, borderTop: `1.5px dashed ${C.muted}` }} />
                <span style={{ fontSize: 11, color: C.subtle }}>항공 경로</span>
              </div>
            </div>

            {/* Route Filter Bar */}
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              background: C.surface, backdropFilter: "blur(12px)",
              border: `1px solid ${C.border}`, borderRadius: 999,
              padding: 4, display: "flex", gap: 2,
              boxShadow: "0 4px 16px rgba(43,43,43,0.08)", zIndex: 10,
            }}>
              {([
                { v: "all" as const, label: "전체 경로" },
                { v: "none" as const, label: "경로 숨김" },
              ]).map((o) => (
                <button
                  key={o.v}
                  onClick={() => handleRouteFilter(o.v)}
                  style={{
                    padding: "8px 18px", border: "none", borderRadius: 999,
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "Pretendard, -apple-system, sans-serif",
                    cursor: "pointer",
                    background: routeFilter === o.v ? C.text : "transparent",
                    color: routeFilter === o.v ? C.white : C.subtle,
                    transition: "all .15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Country Sidebar */}
        <CountrySidebar
          open={sidebarOpen}
          onClose={() => { setSidebarOpen(false); setSelCountry(null); }}
          selCountry={selCountry}
          mapData={mapData}
          workspaces={workspaces}
          wsLoading={wsLoading}
          hlWsId={hlWsId}
          routeFilter={routeFilter}
          onRouteFilter={handleRouteFilter}
          onOpenModal={(ctx) => { setModalCtx(ctx); setModalStatus(ctx.status); }}
        />
      </div>

      {/* Status Modal */}
      {modalCtx && (
        <StatusModal
          ctx={modalCtx}
          selectedStatus={modalStatus}
          loading={modalLoading}
          onSelectStatus={setModalStatus}
          onConfirm={confirmStatus}
          onClose={() => setModalCtx(null)}
        />
      )}

      {/* Bulk Import Modal */}
      {bulkOpen && (
        <BulkImportModal
          json={bulkJson}
          loading={bulkLoading}
          onJsonChange={setBulkJson}
          onSubmit={submitBulk}
          onClose={() => setBulkOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
