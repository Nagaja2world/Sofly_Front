import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate } from "react-router-dom";
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

// ── ISO alpha-2 ↔ alpha-3 ─────────────────────────────────────────────
const A2_A3: Record<string, string> = {
  AF:"AFG",AX:"ALA",AL:"ALB",DZ:"DZA",AS:"ASM",AD:"AND",AO:"AGO",AI:"AIA",
  AQ:"ATA",AG:"ATG",AR:"ARG",AM:"ARM",AW:"ABW",AU:"AUS",AT:"AUT",AZ:"AZE",
  BS:"BHS",BH:"BHR",BD:"BGD",BB:"BRB",BY:"BLR",BE:"BEL",BZ:"BLZ",BJ:"BEN",
  BM:"BMU",BT:"BTN",BO:"BOL",BQ:"BES",BA:"BIH",BW:"BWA",BV:"BVT",BR:"BRA",
  IO:"IOT",BN:"BRN",BG:"BGR",BF:"BFA",BI:"BDI",CV:"CPV",KH:"KHM",CM:"CMR",
  CA:"CAN",KY:"CYM",CF:"CAF",TD:"TCD",CL:"CHL",CN:"CHN",CX:"CXR",CC:"CCK",
  CO:"COL",KM:"COM",CG:"COG",CD:"COD",CK:"COK",CR:"CRI",CI:"CIV",HR:"HRV",
  CU:"CUB",CW:"CUW",CY:"CYP",CZ:"CZE",DK:"DNK",DJ:"DJI",DM:"DMA",DO:"DOM",
  EC:"ECU",EG:"EGY",SV:"SLV",GQ:"GNQ",ER:"ERI",EE:"EST",SZ:"SWZ",ET:"ETH",
  FK:"FLK",FO:"FRO",FJ:"FJI",FI:"FIN",FR:"FRA",GF:"GUF",PF:"PYF",TF:"ATF",
  GA:"GAB",GM:"GMB",GE:"GEO",DE:"DEU",GH:"GHA",GI:"GIB",GR:"GRC",GL:"GRL",
  GD:"GRD",GP:"GLP",GU:"GUM",GT:"GTM",GG:"GGY",GN:"GIN",GW:"GNB",GY:"GUY",
  HT:"HTI",HM:"HMD",VA:"VAT",HN:"HND",HK:"HKG",HU:"HUN",IS:"ISL",IN:"IND",
  ID:"IDN",IR:"IRN",IQ:"IRQ",IE:"IRL",IM:"IMN",IL:"ISR",IT:"ITA",JM:"JAM",
  JP:"JPN",JE:"JEY",JO:"JOR",KZ:"KAZ",KE:"KEN",KI:"KIR",KP:"PRK",KR:"KOR",
  KW:"KWT",KG:"KGZ",LA:"LAO",LV:"LVA",LB:"LBN",LS:"LSO",LR:"LBR",LY:"LBY",
  LI:"LIE",LT:"LTU",LU:"LUX",MO:"MAC",MG:"MDG",MW:"MWI",MY:"MYS",MV:"MDV",
  ML:"MLI",MT:"MLT",MH:"MHL",MQ:"MTQ",MR:"MRT",MU:"MUS",YT:"MYT",MX:"MEX",
  FM:"FSM",MD:"MDA",MC:"MCO",MN:"MNG",ME:"MNE",MS:"MSR",MA:"MAR",MZ:"MOZ",
  MM:"MMR",NA:"NAM",NR:"NRU",NP:"NPL",NL:"NLD",NC:"NCL",NZ:"NZL",NI:"NIC",
  NE:"NER",NG:"NGA",NU:"NIU",NF:"NFK",MK:"MKD",MP:"MNP",NO:"NOR",OM:"OMN",
  PK:"PAK",PW:"PLW",PS:"PSE",PA:"PAN",PG:"PNG",PY:"PRY",PE:"PER",PH:"PHL",
  PN:"PCN",PL:"POL",PT:"PRT",PR:"PRI",QA:"QAT",RE:"REU",RO:"ROU",RU:"RUS",
  RW:"RWA",BL:"BLM",SH:"SHN",KN:"KNA",LC:"LCA",MF:"MAF",PM:"SPM",VC:"VCT",
  WS:"WSM",SM:"SMR",ST:"STP",SA:"SAU",SN:"SEN",RS:"SRB",SC:"SYC",SL:"SLE",
  SG:"SGP",SX:"SXM",SK:"SVK",SI:"SVN",SB:"SLB",SO:"SOM",ZA:"ZAF",GS:"SGS",
  SS:"SSD",ES:"ESP",LK:"LKA",SD:"SDN",SR:"SUR",SJ:"SJM",SE:"SWE",CH:"CHE",
  SY:"SYR",TW:"TWN",TJ:"TJK",TZ:"TZA",TH:"THA",TL:"TLS",TG:"TGO",TK:"TKL",
  TO:"TON",TT:"TTO",TN:"TUN",TR:"TUR",TM:"TKM",TC:"TCA",TV:"TUV",UG:"UGA",
  UA:"UKR",AE:"ARE",GB:"GBR",US:"USA",UM:"UMI",UY:"URY",UZ:"UZB",VU:"VUT",
  VE:"VEN",VN:"VNM",VG:"VGB",VI:"VIR",WF:"WLF",EH:"ESH",YE:"YEM",ZM:"ZMB",
  ZW:"ZWE",
};
const A3_A2: Record<string, string> = Object.fromEntries(
  Object.entries(A2_A3).map(([k, v]) => [v, k])
);

// ── Utilities ─────────────────────────────────────────────────────────
const WV_FILTER = ["in", ["get", "worldview"], ["literal", ["all", "US"]]] as mapboxgl.FilterSpecification;

function genArc(from: [number, number], to: [number, number], n = 80): [number, number][] {
  let [x1, y1] = from;
  let [x2, y2] = to;
  if (Math.abs(x2 - x1) > 180) x2 += x2 > x1 ? -360 : 360;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const cy = my + d * 0.28;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    pts.push([mt * mt * x1 + 2 * mt * t * mx + t * t * x2, mt * mt * y1 + 2 * mt * t * cy + t * t * y2]);
  }
  return pts;
}

const STATUS_LABEL: Record<VisitStatus, string> = {
  VISITED: "방문 완료", PLANNED: "방문 예정", UNVISITED: "미방문",
};
const STATUS_COLOR: Record<VisitStatus, string> = {
  VISITED: "#8b5cf6", PLANNED: "#f59e0b", UNVISITED: "#374151",
};

const BULK_TEMPLATE = `{
  "countries": [
    { "countryCode": "JP", "status": "VISITED" },
    { "countryCode": "FR", "status": "PLANNED" }
  ],
  "cities": [
    { "cityName": "Tokyo", "countryCode": "JP", "latitude": 35.6762, "longitude": 139.6503, "status": "VISITED" }
  ]
}`;

type RouteFilter = "all" | "none" | number;
type ModalCtx = {
  type: "country"; id: string; name: string; status: VisitStatus;
} | {
  type: "city"; id: number; name: string; status: VisitStatus;
};

// ── CSS-in-JS theme tokens ─────────────────────────────────────────────
const C = {
  bg: "#0a0c14",
  surface: "rgba(15,18,30,0.96)",
  border: "rgba(255,255,255,0.08)",
  text: "#e2e8f0",
  muted: "#718096",
  accent: "#7c3aed",
  visited: "#8b5cf6",
  planned: "#f59e0b",
};

// ── Shared panel style ─────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  position: "absolute", background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 12, backdropFilter: "blur(16px)", zIndex: 10,
  fontFamily: "Pretendard, -apple-system, sans-serif",
};

// ── Main Component ─────────────────────────────────────────────────────
export default function ConquestMapPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Mutable callback ref (avoids stale closures in mapbox event handlers)
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

  // Keep cbRef up-to-date
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20, 15],
      zoom: 1.6,
    projection: "mercator" as unknown as mapboxgl.ProjectionSpecification,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Sources
      map.addSource("cb", { type: "vector", url: "mapbox://mapbox.country-boundaries-v1" });
      map.addSource("cities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true, clusterMaxZoom: 8, clusterRadius: 38,
      });
      map.addSource("routes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      // Layers
      map.addLayer({
        id: "c-hit", type: "fill", source: "cb", "source-layer": "country_boundaries",
        filter: ["has", "iso_3166_1_alpha_3"],
        paint: { "fill-opacity": 0 },
      });
      map.addLayer({
        id: "c-fill", type: "fill", source: "cb", "source-layer": "country_boundaries",
        filter: WV_FILTER,
        paint: { "fill-color": "#1e293b", "fill-opacity": 0 },
      });
      map.addLayer({
        id: "c-line", type: "line", source: "cb", "source-layer": "country_boundaries",
        filter: WV_FILTER,
        paint: { "line-color": "rgba(255,255,255,0.07)", "line-width": 0.5 },
      });
      map.addLayer({
        id: "c-hover", type: "fill", source: "cb", "source-layer": "country_boundaries",
        filter: ["==", ["get", "iso_3166_1_alpha_3"], ""],
        paint: { "fill-color": "rgba(255,255,255,0.08)", "fill-opacity": 1 },
      });
      map.addLayer({
        id: "c-sel", type: "line", source: "cb", "source-layer": "country_boundaries",
        filter: ["==", ["get", "iso_3166_1_alpha_3"], ""],
        paint: { "line-color": "#a78bfa", "line-width": 2 },
      });
      map.addLayer({
        id: "rt-line", type: "line", source: "routes",
        paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.65 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "rt-glow", type: "line", source: "routes",
        paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.12, "line-blur": 3 },
      });
      map.addLayer({
        id: "cl-circle", type: "circle", source: "cities",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#7c3aed", "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 13, 5, 17, 10, 21],
          "circle-stroke-width": 2, "circle-stroke-color": "rgba(167,139,250,0.35)",
        },
      });
      map.addLayer({
        id: "cl-count", type: "symbol", source: "cities",
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 11, "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"] },
        paint: { "text-color": "#fff" },
      });
      map.addLayer({
        id: "city-pt", type: "circle", source: "cities",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"], "circle-radius": 6, "circle-opacity": 0.9,
          "circle-stroke-width": 2, "circle-stroke-color": ["get", "stroke"],
        },
      });

      // Events
      map.on("mousemove", "c-hit", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const f = e.features.find((f) => f.properties?.iso_3166_1_alpha_3?.length === 3);
        map.setFilter("c-hover", ["==", ["get", "iso_3166_1_alpha_3"], f?.properties?.iso_3166_1_alpha_3 || ""]);
      });
      map.on("mouseleave", "c-hit", () => {
        map.getCanvas().style.cursor = "";
        map.setFilter("c-hover", ["==", ["get", "iso_3166_1_alpha_3"], ""]);
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
      if (c.status === "VISITED") { expr.push(c.countryCode, "#8b5cf6"); }
      else if (c.status === "PLANNED") { expr.push(c.countryCode, "#f59e0b"); }
    }
    expr.push("transparent");
    map.setPaintProperty("c-fill", "fill-color", expr as any);
    map.setPaintProperty("c-fill", "fill-opacity", 0.72);

    const features = mapData.cities
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [c.longitude, c.latitude] },
        properties: {
          id: c.id, name: c.cityName, cc: c.countryCode, status: c.status, vc: c.visitCount ?? 0,
          color: STATUS_COLOR[c.status],
          stroke: c.status === "VISITED" ? "rgba(167,139,250,.5)" : c.status === "PLANNED" ? "rgba(251,191,36,.5)" : "rgba(107,114,128,.3)",
        },
      }));
    (map.getSource("cities") as mapboxgl.GeoJSONSource).setData({ type: "FeatureCollection", features });
  }, [mapReady, mapData]);

  // ── Update routes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const list = routeFilter === "none" ? [] : routeFilter === "all" ? allRoutes : allRoutes.filter((r) => r.workspaceId === routeFilter);
    const features = list
      .filter((r) => r.departureLng && r.departureLat && r.arrivalLng && r.arrivalLat)
      .map((r) => ({
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: genArc([r.departureLng, r.departureLat], [r.arrivalLng, r.arrivalLat]) },
        properties: { color: routeFilter === "all" ? "#a78bfa" : "#f59e0b" },
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

  // ── Helpers ──
  const countryInfo = selCountry ? (mapData?.countries.find((c) => c.countryCode === A3_A2[selCountry]) ?? null) : null;

  const handleRouteFilter = (f: RouteFilter) => {
    setRouteFilter(f);
    setHlWsId(typeof f === "number" ? f : null);
  };

  const openModal = (ctx: ModalCtx) => {
    setModalCtx(ctx);
    setModalStatus(ctx.status);
  };

  // ── Badge helper ──
  const StatusBadge = ({ status }: { status: VisitStatus }) => {
    const bgs: Record<VisitStatus, string> = {
      VISITED: "rgba(139,92,246,.2)", PLANNED: "rgba(245,158,11,.2)", UNVISITED: "rgba(107,114,128,.2)",
    };
    const colors: Record<VisitStatus, string> = {
      VISITED: "#a78bfa", PLANNED: "#fbbf24", UNVISITED: "#9ca3af",
    };
    const borders: Record<VisitStatus, string> = {
      VISITED: "rgba(139,92,246,.3)", PLANNED: "rgba(245,158,11,.3)", UNVISITED: "rgba(107,114,128,.2)",
    };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "2px 7px",
        borderRadius: 10, fontSize: 10, fontWeight: 600,
        background: bgs[status], color: colors[status], border: `1px solid ${borders[status]}`,
      }}>
        {STATUS_LABEL[status]}
      </span>
    );
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, fontFamily: "Pretendard, -apple-system, sans-serif", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 14px", height: 52, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, backdropFilter: "blur(10px)", zIndex: 200, flexWrap: "wrap" }}>
        {/* Logo / back */}
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 15, fontWeight: 700, padding: "4px 0", fontFamily: "inherit" }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} /><line x1={2} y1={12} x2={22} y2={12} />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Sofly
        </button>

        <div style={{ width: 1, height: 22, background: C.border }} />

        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Conquest Map</span>

        <div style={{ flex: 1 }} />

        {/* Token input (only if no env token) */}
        {!envToken && (
          <>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Mapbox Token (pk.eyJ1...)"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 9px", color: C.text, fontSize: 12, fontFamily: "monospace", width: 200, outline: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tokenInput.trim()) {
                  localStorage.setItem("cq_mb", tokenInput.trim());
                  setMbToken(tokenInput.trim());
                }
              }}
            />
            <button
              onClick={() => { if (tokenInput.trim()) { localStorage.setItem("cq_mb", tokenInput.trim()); setMbToken(tokenInput.trim()); } }}
              disabled={!tokenInput.trim()}
              style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: tokenInput.trim() ? "pointer" : "not-allowed", background: C.accent, color: "#fff", opacity: tokenInput.trim() ? 1 : 0.45 }}
            >
              지도 로드
            </button>
            <div style={{ width: 1, height: 22, background: C.border }} />
          </>
        )}

        <button
          onClick={() => setStatsOpen((o) => !o)}
          style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}
        >
          {statsOpen ? "통계 숨김" : "통계 보기"}
        </button>

        <button
          onClick={loadAll}
          disabled={!mbToken || dataLoading}
          style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: mbToken && !dataLoading ? "pointer" : "not-allowed", background: "#059669", color: "#fff", opacity: mbToken && !dataLoading ? 1 : 0.45 }}
        >
          {dataLoading ? "로딩 중..." : "데이터 로드"}
        </button>
      </header>

      {/* ── Map area ──────────────────────────────── */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Map container */}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Init overlay (no token) */}
        {!mbToken && (
          <div style={{ position: "absolute", inset: 0, background: C.bg, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.5}>
              <circle cx={12} cy={12} r={10} /><line x1={2} y1={12} x2={22} y2={12} />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>Conquest Map</h2>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
              상단의 Mapbox 토큰을 입력하고<br />
              <strong style={{ color: C.text }}>지도 로드</strong> 버튼을 눌러 시작하세요.
            </p>
          </div>
        )}

        {/* ── Stats Panel ──────────────────────────── */}
        {mbToken && (
          <div style={{ ...panelStyle, top: 14, left: 14, width: 252, transition: "transform 0.3s", transform: statsOpen ? "translateX(0)" : "translateX(-280px)" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>📊 여행 통계</span>
              <button onClick={() => setStatsOpen(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {!stats ? (
                <div style={{ textAlign: "center", padding: "14px 0", color: C.muted, fontSize: 12 }}>데이터를 로드해주세요</div>
              ) : (
                <>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>방문 국가</span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>
                        {stats.visitedCountryCount}
                        <span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}> / {stats.totalCountryCount}</span>
                      </span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", width: `${stats.visitedCountryPercentage}%`, transition: "width .5s", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, textAlign: "right", marginTop: 2 }}>{stats.visitedCountryPercentage?.toFixed(1)}%</div>
                  </div>
                  {[
                    { label: "방문 도시", val: stats.visitedCityCount, unit: "" },
                    { label: "총 여행일", val: stats.totalTravelDays, unit: "일" },
                    { label: "총 이동거리", val: Math.round(stats.totalDistanceKm ?? 0).toLocaleString(), unit: "km" },
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{r.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{r.val}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>{r.unit}</span></span>
                    </div>
                  ))}
                  {stats.continentStats?.length > 0 && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 9 }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: C.muted, marginBottom: 6 }}>대륙별 방문</div>
                      {(() => {
                        const maxC = Math.max(...stats.continentStats.map((c) => c.visitedCountryCount), 1);
                        return stats.continentStats.map((c) => (
                          <div key={c.continent} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                            <div style={{ fontSize: 11, color: C.text, width: 70, flexShrink: 0 }}>{c.continentName}</div>
                            <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: "#8b5cf6", borderRadius: 3, width: `${c.visitedCountryCount > 0 ? Math.max((c.visitedCountryCount / maxC) * 100, 6) : 0}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, width: 18, textAlign: "right" }}>{c.visitedCountryCount}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 9, display: "flex", gap: 5 }}>
                    <button onClick={() => setBulkOpen(true)} style={{ flex: 1, padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}>일괄 등록</button>
                    <button onClick={loadAll} disabled={dataLoading} style={{ flex: 1, padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}>새로고침</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Legend ──────────────────────────────── */}
        {mbToken && (
          <div style={{ ...panelStyle, bottom: 60, left: 14, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".07em", color: C.muted, marginBottom: 3 }}>방문 상태</div>
            {[
              { color: "#8b5cf6", label: "방문 완료" },
              { color: "#f59e0b", label: "방문 예정" },
              { color: "#374151", label: "미방문" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, marginTop: 4 }}>
              <div style={{ width: 10, height: 3, borderRadius: 1, background: "rgba(167,139,250,.5)", flexShrink: 0 }} />
              항공 경로
            </div>
          </div>
        )}

        {/* ── Route bar ───────────────────────────── */}
        {mbToken && allRoutes.length > 0 && (
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, backdropFilter: "blur(16px)", zIndex: 10, display: "flex", alignItems: "center", gap: 3, padding: "4px 6px" }}>
            {(["all", "none"] as RouteFilter[]).map((f) => (
              <button
                key={String(f)}
                onClick={() => handleRouteFilter(f)}
                style={{ padding: "5px 13px", borderRadius: 16, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer", transition: "all .15s", color: routeFilter === f ? "#a78bfa" : C.muted, background: routeFilter === f ? "rgba(124,58,237,0.2)" : "transparent" }}
              >
                {f === "all" ? "전체 경로" : "경로 숨김"}
              </button>
            ))}
          </div>
        )}

        {/* ── Workspace Sidebar ────────────────────── */}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 310, background: C.surface, borderLeft: `1px solid ${C.border}`, backdropFilter: "blur(16px)", zIndex: 20, transform: sidebarOpen ? "translateX(0)" : "translateX(310px)", transition: "transform .3s ease", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sidebar head */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {countryInfo?.countryName || (selCountry ? A3_A2[selCountry] || selCountry : "—")}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {countryInfo && <StatusBadge status={countryInfo.status} />}
                {countryInfo?.continentName && <span>{countryInfo.continentName}</span>}
                {countryInfo && countryInfo.visitCount > 0 && <span>{countryInfo.visitCount}회 방문</span>}
              </div>
            </div>
            <button onClick={() => { setSidebarOpen(false); setSelCountry(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Sidebar actions */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
            {selCountry && countryInfo && (
              <button
                onClick={() => openModal({ type: "country", id: A3_A2[selCountry] || selCountry, name: countryInfo.countryName, status: countryInfo.status })}
                style={{ flex: 1, padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}
              >
                상태 변경
              </button>
            )}
            <button
              onClick={() => { handleRouteFilter("all"); }}
              style={{ flex: 1, padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}
            >
              전체 경로
            </button>
          </div>

          {/* Workspace list */}
          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {wsLoading ? (
              <div style={{ textAlign: "center", padding: 28 }}>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.1)", borderTopColor: C.accent, borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
              </div>
            ) : workspaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 14px", color: C.muted, fontSize: 12 }}>이 국가와 연결된 워크스페이스가 없습니다</div>
            ) : (
              workspaces.map((w) => (
                <div
                  key={w.id}
                  onClick={() => { handleRouteFilter(w.id); }}
                  style={{ background: hlWsId === w.id ? "rgba(139,92,246,.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${hlWsId === w.id ? "rgba(139,92,246,.5)" : C.border}`, borderRadius: 8, padding: 11, marginBottom: 7, cursor: "pointer", transition: "all .15s" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{w.title}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{w.destination} · 멤버 {w.memberCount}명</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{w.startDate} ~ {w.endDate}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Status Modal ─────────────────────────── */}
      {modalCtx && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalCtx(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ background: "#1a1d2e", border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, width: 300, display: "flex", flexDirection: "column", gap: 14, fontFamily: "Pretendard, -apple-system, sans-serif" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {modalCtx.name} 상태 변경
              </h3>
              <p style={{ fontSize: 12, color: C.muted }}>현재: {STATUS_LABEL[modalCtx.status]}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {(["VISITED", "PLANNED", "UNVISITED"] as VisitStatus[]).map((s) => (
                <div
                  key={s}
                  onClick={() => setModalStatus(s)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `2px solid ${modalStatus === s ? C.accent : "transparent"}`, cursor: "pointer", background: modalStatus === s ? "rgba(124,58,237,.1)" : "rgba(255,255,255,0.03)", transition: "all .15s" }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[s], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{STATUS_LABEL[s]}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>
                      {s === "VISITED" ? "이미 방문한 곳" : s === "PLANNED" ? "항공권 보유 또는 계획 중" : "아직 방문하지 않은 곳"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
              <button onClick={() => setModalCtx(null)} style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}>취소</button>
              <button onClick={confirmStatus} disabled={modalLoading} style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: modalLoading ? "not-allowed" : "pointer", background: C.accent, color: "#fff", opacity: modalLoading ? 0.6 : 1 }}>
                {modalLoading ? "처리 중..." : "변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Import Modal ───────────────────── */}
      {bulkOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setBulkOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ background: "#1a1d2e", border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, width: 460, display: "flex", flexDirection: "column", gap: 14, fontFamily: "Pretendard, -apple-system, sans-serif" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>과거 방문 일괄 등록</h3>
              <p style={{ fontSize: 12, color: C.muted }}>JSON 형식으로 국가/도시를 한번에 등록합니다</p>
            </div>
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              style={{ background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 6, padding: 10, color: C.text, fontSize: 11, fontFamily: "monospace", resize: "vertical", minHeight: 200, width: "100%", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
              <button onClick={() => setBulkOpen(false)} style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: C.text }}>취소</button>
              <button onClick={submitBulk} disabled={bulkLoading} style={{ padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: bulkLoading ? "not-allowed" : "pointer", background: C.accent, color: "#fff", opacity: bulkLoading ? 0.6 : 1 }}>
                {bulkLoading ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
          background: "#1e2235", border: `1px solid ${toast.type === "ok" ? "rgba(16,185,129,.45)" : "rgba(239,68,68,.4)"}`,
          borderRadius: 8, padding: "9px 15px", fontSize: 12, zIndex: 300,
          color: toast.type === "ok" ? "#6ee7b7" : "#fca5a5",
          fontFamily: "Pretendard, -apple-system, sans-serif", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Cluster spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
