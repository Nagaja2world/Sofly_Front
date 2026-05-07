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

// ── sofly light theme tokens ──────────────────────────────────────────
const C = {
  bg: "#fcf9ef",
  white: "#ffffff",
  surface: "rgba(255,255,255,0.95)",
  border: "#f2f2f2",
  borderMid: "#e1e1e1",
  text: "#2b2b2b",
  muted: "#9a9a9a",
  subtle: "#757575",
  primary: "#f5d15a",
  primaryHover: "#d4b23e",
  secondary: "#a0c1d5",
  visited: "#f5d15a",
  planned: "#a0c1d5",
  unvisited: "#e1e1e1",
};

const STATUS_COLOR: Record<VisitStatus, string> = {
  VISITED: C.visited,
  PLANNED: C.planned,
  UNVISITED: C.unvisited,
};

// ── Shared panel style ─────────────────────────────────────────────────
const panelBase: React.CSSProperties = {
  position: "absolute",
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 24px rgba(43,43,43,0.06)",
  zIndex: 10,
  fontFamily: "Pretendard, -apple-system, sans-serif",
};

// ── Main Component ─────────────────────────────────────────────────────
export default function ConquestMapPage() {
  const navigate = useNavigate();
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
        filter: ["==", ["get", "iso_3166_1_alpha_3"], ""],
        paint: { "fill-color": "rgba(43,43,43,0.06)", "fill-opacity": 1 },
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

    const list = routeFilter === "none" ? [] : routeFilter === "all" ? allRoutes : allRoutes.filter((r) => r.workspaceId === routeFilter);
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

  // ── StatusPill ──
  const StatusPill = ({ status }: { status: VisitStatus }) => {
    const bgMap: Record<VisitStatus, string> = {
      VISITED: `${C.visited}33`, PLANNED: `${C.planned}33`, UNVISITED: "#f2f2f2",
    };
    const colorMap: Record<VisitStatus, string> = {
      VISITED: "#caa12d", PLANNED: "#3f7396", UNVISITED: C.muted,
    };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 99,
        fontSize: 11, fontWeight: 600,
        background: bgMap[status], color: colorMap[status],
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: STATUS_COLOR[status], flexShrink: 0 }} />
        {STATUS_LABEL[status]}
      </span>
    );
  };

  // ── LegendDot ──
  const LegendDot = ({ color, label, outline }: { color: string; label: string; outline?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.subtle }}>
      <div style={{
        width: 10, height: 10, borderRadius: 99,
        background: outline ? "transparent" : color,
        border: outline ? `1.5px solid ${color}` : "none",
        flexShrink: 0,
      }} />
      {label}
    </div>
  );

  // ── Pill button ──
  const pillBtn = (primary = false): React.CSSProperties => ({
    padding: "8px 14px", fontSize: 12, fontWeight: 600,
    fontFamily: "Pretendard, -apple-system, sans-serif",
    background: primary ? C.text : C.white,
    color: primary ? C.white : C.subtle,
    border: primary ? "none" : `1px solid ${C.borderMid}`,
    borderRadius: 99, cursor: "pointer",
  });

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: C.bg, color: C.text,
      fontFamily: "Pretendard, -apple-system, sans-serif", overflow: "hidden",
    }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        height: 64, background: C.white,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", alignItems: "center", gap: 16,
        flexShrink: 0, zIndex: 200,
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.primary}, #f0c043)`,
            display: "grid", placeItems: "center",
            boxShadow: `0 2px 8px rgba(245,209,90,0.35)`,
            flexShrink: 0,
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth={2.2}>
              <circle cx={12} cy={12} r={9} />
              <path d="M3 12h18 M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z" />
            </svg>
          </div>
          <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 18, color: C.text }}>
            sofly
          </span>
        </button>

        <div style={{ width: 1, height: 20, background: C.borderMid }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.subtle }}>Conquest Map</span>

        <div style={{ flex: 1 }} />

        {/* Token input (only if no env token) */}
        {!envToken && (
          <>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Mapbox Token (pk.eyJ1...)"
              style={{
                background: C.bg, border: `1px solid ${C.borderMid}`,
                borderRadius: 8, padding: "6px 10px",
                color: C.text, fontSize: 12, fontFamily: "monospace",
                width: 200, outline: "none",
              }}
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
              style={{ ...pillBtn(true), opacity: tokenInput.trim() ? 1 : 0.4 }}
            >
              지도 로드
            </button>
            <div style={{ width: 1, height: 20, background: C.borderMid }} />
          </>
        )}

        <button
          onClick={() => setBulkOpen(true)}
          style={pillBtn()}
        >
          일괄 등록
        </button>

        <button
          onClick={loadAll}
          disabled={!mbToken || dataLoading}
          style={{ ...pillBtn(true), background: "#059669", opacity: mbToken && !dataLoading ? 1 : 0.4 }}
        >
          {dataLoading ? "로딩 중..." : "데이터 로드"}
        </button>
      </header>

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

        {/* ── Stats Panel (top-left) ──────────────── */}
        {mbToken && (
          <>
            {statsOpen ? (
              <div style={{
                ...panelBase,
                top: 24, left: 24, width: 300,
                transform: "translateX(0)", transition: "transform .25s ease",
              }}>
                {/* Panel header */}
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
                    onClick={() => setStatsOpen(false)}
                    style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center" }}
                  >✕</button>
                </div>

                {!stats ? (
                  <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12, color: C.muted }}>
                    데이터를 로드해주세요
                  </div>
                ) : (
                  <>
                    {/* Big country count */}
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
            ) : (
              /* Stats toggle button */
              <button
                onClick={() => setStatsOpen(true)}
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
            )}
          </>
        )}

        {/* ── Legend (bottom-left) ─────────────────── */}
        {mbToken && (
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
        )}

        {/* ── Route Filter Bar (bottom-center) ────── */}
        {mbToken && (
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
        )}

        {/* ── Country Sidebar (right slide-in) ────── */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 340,
          background: C.white, borderLeft: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 16px rgba(43,43,43,0.04)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(340px)",
          transition: "transform .3s ease",
          zIndex: 20,
        }}>
          {/* Sidebar header */}
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
                onClick={() => { setSidebarOpen(false); setSelCountry(null); }}
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
                onClick={() => openModal({ type: "country", id: A3_A2[selCountry] || selCountry, name: countryInfo.countryName, status: countryInfo.status })}
                style={{ ...pillBtn(), flex: 1, padding: "8px 10px" }}
              >
                상태 변경
              </button>
            )}
            <button
              onClick={() => handleRouteFilter("all")}
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
                  onClick={() => handleRouteFilter(w.id)}
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
      </div>

      {/* ── Status Modal ─────────────────────────── */}
      {modalCtx && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalCtx(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(43,43,43,0.4)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: C.white, borderRadius: 16,
            border: `1px solid ${C.border}`, padding: 24,
            width: 320, display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "0 20px 60px rgba(43,43,43,0.12)",
            fontFamily: "Pretendard, -apple-system, sans-serif",
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.text }}>
                {modalCtx.name} 상태 변경
              </h3>
              <p style={{ fontSize: 12, color: C.muted }}>현재: {STATUS_LABEL[modalCtx.status]}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(["VISITED", "PLANNED", "UNVISITED"] as VisitStatus[]).map((s) => (
                <div
                  key={s}
                  onClick={() => setModalStatus(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    border: `2px solid ${modalStatus === s ? C.text : C.border}`,
                    cursor: "pointer",
                    background: modalStatus === s ? `${C.text}08` : C.bg,
                    transition: "all .15s",
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[s], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{STATUS_LABEL[s]}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {s === "VISITED" ? "이미 방문한 곳" : s === "PLANNED" ? "항공권 보유 또는 계획 중" : "아직 방문하지 않은 곳"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setModalCtx(null)} style={pillBtn()}>취소</button>
              <button
                onClick={confirmStatus}
                disabled={modalLoading}
                style={{ ...pillBtn(true), opacity: modalLoading ? 0.6 : 1 }}
              >
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
          style={{
            position: "fixed", inset: 0, background: "rgba(43,43,43,0.4)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: C.white, borderRadius: 16,
            border: `1px solid ${C.border}`, padding: 24,
            width: 480, display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "0 20px 60px rgba(43,43,43,0.12)",
            fontFamily: "Pretendard, -apple-system, sans-serif",
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.text }}>과거 방문 일괄 등록</h3>
              <p style={{ fontSize: 12, color: C.muted }}>JSON 형식으로 국가/도시를 한번에 등록합니다</p>
            </div>
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              style={{
                background: C.bg, border: `1px solid ${C.borderMid}`,
                borderRadius: 8, padding: 12, color: C.text,
                fontSize: 11, fontFamily: "monospace",
                resize: "vertical", minHeight: 200, width: "100%", outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setBulkOpen(false)} style={pillBtn()}>취소</button>
              <button
                onClick={submitBulk}
                disabled={bulkLoading}
                style={{ ...pillBtn(true), opacity: bulkLoading ? 0.6 : 1 }}
              >
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
          background: C.white,
          border: `1px solid ${toast.type === "ok" ? "rgba(5,150,105,0.3)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 10, padding: "10px 16px", fontSize: 12, zIndex: 300,
          color: toast.type === "ok" ? "#059669" : "#dc2626",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          boxShadow: "0 4px 16px rgba(43,43,43,0.08)",
          whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
