import { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { ItineraryRow } from '@/components/workspace/ItineraryDayCard';

/* ══════════════════════════════════════════
   환경변수
   ══════════════════════════════════════════ */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined;

/* ══════════════════════════════════════════
   지도 스타일
   ══════════════════════════════════════════ */
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f3ef' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f3ef' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f0e9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fef3c7' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fde68a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3b82f6' }] },
];

/* ══════════════════════════════════════════
   카테고리별 색상 / 라벨
   ══════════════════════════════════════════ */
const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  TRANSPORT:     { color: '#0EA5E9', label: '교통' },
  ACCOMMODATION: { color: '#8B5CF6', label: '숙소' },
  RESTAURANT:    { color: '#F59E0B', label: '식당' },
  CAFE:          { color: '#F59E0B', label: '카페' },
  ATTRACTION:    { color: '#10B981', label: '관광' },
  DEFAULT:       { color: '#9CA3AF', label: '장소' },
};

function getCategoryConfig(category?: string) {
  return CATEGORY_CONFIG[category ?? 'DEFAULT'] ?? CATEGORY_CONFIG.DEFAULT;
}

/* ══════════════════════════════════════════
   지오코딩
   ══════════════════════════════════════════ */
async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        resolve(null);
      }
    });
  });
}

/* ══════════════════════════════════════════
   마커 SVG
   ══════════════════════════════════════════ */
function buildMarkerSvg(color: string, index: number): string {
  const label = String(index + 1);
  const fontSize = label.length > 1 ? 10 : 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 1C7.4 1 2 6.4 2 13c0 9 12 22 12 22S26 22 26 13C26 6.4 20.6 1 14 1z" fill="${color}" stroke="${color}40" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="8" fill="#ffffff"/>
    <text x="14" y="${13 + fontSize * 0.38}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" font-weight="700" fill="${color}">${label}</text>
  </svg>`;
}

/* ══════════════════════════════════════════
   InfoWindow HTML
   ══════════════════════════════════════════ */
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInfoWindowContent(row: ItineraryRow, index: number, dayNumber: number): string {
  const cfg = getCategoryConfig(row._category);
  return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:3px solid ${cfg.color};border-radius:6px;padding:12px 14px;min-width:200px;max-width:260px;font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;color:#111827;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:.06em;color:${cfg.color};background:${cfg.color}18;padding:2px 6px;border-radius:3px;">${escapeHtml(cfg.label)}</span>
        <span style="font-size:10px;color:#9CA3AF;margin-left:auto;">${dayNumber}일차 · ${index + 1}번</span>
      </div>
      <div style="font-size:13px;font-weight:600;line-height:1.35;margin-bottom:4px;color:#111827;">${escapeHtml(row.title)}</div>
      ${row.visitTime ? `<div style="font-size:11px;color:#6B7280;">🕐 ${escapeHtml(row.visitTime)}</div>` : ''}
      ${row.remark ? `<div style="font-size:10px;color:#9CA3AF;margin-top:4px;line-height:1.4;">${escapeHtml(row.remark)}</div>` : ''}
      ${row.cost ? `<div style="font-size:11px;color:${cfg.color};font-weight:600;margin-top:6px;">${escapeHtml(row.cost)}</div>` : ''}
    </div>
  `;
}

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */
interface ResolvedRow extends ItineraryRow {
  resolvedLat: number | null;
  resolvedLng: number | null;
}

interface DayItineraryMapProps {
  rows: ItineraryRow[];
  dayNumber: number;
  /** 타임라인 행 클릭 시 외부에서 지정하는 활성 인덱스 */
  selectedIndex?: number | null;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */
export default function DayItineraryMap({ rows, dayNumber, selectedIndex }: DayItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsAvailableRef = useRef(true);

  const [resolvedRows, setResolvedRows] = useState<ResolvedRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'geocoding' | 'ready' | 'no-key'>('loading');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  /* ── API 키 없음 처리 ── */
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus('no-key');
    }
  }, []);

  /* ── 지도 초기화 + 지오코딩 ── */
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !containerRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        if (!window.__tripItineraryMapsConfigured) {
          setOptions({
            key: GOOGLE_MAPS_API_KEY!,
            v: 'weekly',
            mapIds: GOOGLE_MAP_ID ? [GOOGLE_MAP_ID] : undefined,
          });
          window.__tripItineraryMapsConfigured = true;
        }

        await importLibrary('maps');
        await importLibrary('geometry');
        if (cancelled) return;

        const map = new google.maps.Map(containerRef.current!, {
          center: { lat: 48.8566, lng: 2.3522 },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          gestureHandling: 'cooperative',
          backgroundColor: '#f5f3ef',
          mapId: GOOGLE_MAP_ID || undefined,
          styles: GOOGLE_MAP_ID ? undefined : DARK_MAP_STYLES,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow({ maxWidth: 280 });

        map.addListener('click', () => {
          infoWindowRef.current?.close();
          setActiveIndex(null);
        });

        /* 지오코딩 */
        setStatus('geocoding');
        const geocoder = new google.maps.Geocoder();
        const resolved: ResolvedRow[] = [];

        for (const row of rows) {
          if (cancelled) break;
          if (row._latitude && row._longitude) {
            resolved.push({ ...row, resolvedLat: row._latitude, resolvedLng: row._longitude });
          } else if (row._address) {
            const coords = await geocodeAddress(geocoder, row._address);
            resolved.push({ ...row, resolvedLat: coords?.lat ?? null, resolvedLng: coords?.lng ?? null });
          } else {
            resolved.push({ ...row, resolvedLat: null, resolvedLng: null });
          }
        }

        if (!cancelled) {
          setResolvedRows(resolved);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) console.error('[DayItineraryMap]', err);
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // rows가 바뀌면 아래 useEffect에서 처리

  /* ── 마커 + 경로 그리기 ── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || status !== 'ready') return;

    /* 이전 오버레이 제거 */
    markersRef.current.forEach((m) => m.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    infoWindowRef.current?.close();

    const validItems = resolvedRows.filter((r) => r.resolvedLat && r.resolvedLng);
    if (!validItems.length) return;

    /* 마커 생성 */
    validItems.forEach((row, index) => {
      const cfg = getCategoryConfig(row._category);
      const svgContent = buildMarkerSvg(cfg.color, index);
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const marker = new google.maps.Marker({
        position: { lat: row.resolvedLat!, lng: row.resolvedLng! },
        map,
        icon: {
          url,
          scaledSize: new google.maps.Size(28, 36),
          anchor: new google.maps.Point(14, 36),
        },
        title: row.title,
        zIndex: index + 1,
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(buildInfoWindowContent(row, index, dayNumber));
        infoWindowRef.current?.open(map, marker);
        setActiveIndex(index);
      });

      markersRef.current.push(marker);
    });

    /* bounds 맞추기 */
    const bounds = new google.maps.LatLngBounds();
    validItems.forEach((r) => bounds.extend({ lat: r.resolvedLat!, lng: r.resolvedLng! }));
    map.fitBounds(bounds, { top: 48, right: 32, bottom: 48, left: 32 });

    /* 경로 (DirectionsService → 실패 시 직선) */
    if (validItems.length >= 2 && directionsAvailableRef.current) {
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new google.maps.DirectionsService();
      }

      const origin = { lat: validItems[0].resolvedLat!, lng: validItems[0].resolvedLng! };
      const destination = {
        lat: validItems[validItems.length - 1].resolvedLat!,
        lng: validItems[validItems.length - 1].resolvedLng!,
      };
      const waypoints = validItems.slice(1, -1).map((r) => ({
        location: { lat: r.resolvedLat!, lng: r.resolvedLng! },
        stopover: false,
      }));

      function tryRoute(travelMode: google.maps.TravelMode) {
        directionsServiceRef.current!.route(
          { origin, destination, waypoints, travelMode, optimizeWaypoints: false },
          (result, routeStatus) => {
            if (routeStatus === 'REQUEST_DENIED') {
              directionsAvailableRef.current = false;
              drawFallback(map!, validItems);
              return;
            }
            if (routeStatus !== 'OK' || !result?.routes?.length) {
              if (travelMode === google.maps.TravelMode.DRIVING) {
                tryRoute(google.maps.TravelMode.WALKING);
              } else {
                drawFallback(map!, validItems);
              }
              return;
            }
            const path = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
            const poly = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#F59E0B',
              strokeOpacity: 0.65,
              strokeWeight: 3,
              icons: [
                {
                  icon: {
                    path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                    scale: 2,
                    strokeColor: '#F59E0B',
                    strokeOpacity: 0.9,
                  },
                  offset: '100%',
                  repeat: '80px',
                },
              ],
              map: map!,
            });
            polylinesRef.current.push(poly);
          },
        );
      }
      tryRoute(google.maps.TravelMode.DRIVING);
    } else if (validItems.length >= 2) {
      drawFallback(map, validItems);
    }
  }, [resolvedRows, status, dayNumber]);

  function drawFallback(map: google.maps.Map, items: ResolvedRow[]) {
    const poly = new google.maps.Polyline({
      path: items.map((r) => ({ lat: r.resolvedLat!, lng: r.resolvedLng! })),
      geodesic: true,
      strokeColor: '#F59E0B',
      strokeOpacity: 0.4,
      strokeWeight: 2,
      map,
    });
    polylinesRef.current.push(poly);
  }

  /* ── 사이드 목록에서 마커 클릭 ── */
  function handleListItemClick(index: number) {
    const map = mapInstanceRef.current;
    const marker = markersRef.current[index];
    const row = resolvedRows[index];
    if (!map || !marker || !row) return;
    infoWindowRef.current?.setContent(buildInfoWindowContent(row, index, dayNumber));
    infoWindowRef.current?.open(map, marker);
    const currentZoom = map.getZoom() ?? 0;
    if (currentZoom < 15) map.setZoom(15);
    map.panTo(marker.getPosition()!);
    setActiveIndex(index);
  }

  /* ── 외부 selectedIndex 변경 시 마커 InfoWindow 오픈 ── */
  useEffect(() => {
    if (selectedIndex == null) return;
    // 마커가 아직 없으면(지도 초기화 중) 잠시 후 재시도
    if (markersRef.current.length === 0) {
      const timer = setTimeout(() => handleListItemClick(selectedIndex), 800);
      return () => clearTimeout(timer);
    }
    handleListItemClick(selectedIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  /* ── API 키 없음 UI ── */
  if (status === 'no-key') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <p className="font-pretendard text-body4 text-gray-500 mb-1">지도를 표시하려면</p>
          <p className="font-pretendard text-body5 text-gray-400">VITE_GOOGLE_MAPS_API_KEY를 설정하세요</p>
        </div>
      </div>
    );
  }

  const validRows = resolvedRows.filter((r) => r.resolvedLat && r.resolvedLng);

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* 좌측: 장소 목록 */}
      <div className="w-44 flex-shrink-0 flex flex-col border-r border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="font-pretendard text-body5 font-semibold text-gray-700 m-0">{dayNumber}일차 경로</p>
          <p className="font-pretendard text-[10px] text-gray-400 m-0 mt-0.5">{rows.length}개 장소</p>
        </div>

        {/* 장소 리스트 */}
        <div className="overflow-y-auto flex-1">
          {(status === 'loading' || status === 'geocoding') ? (
            <div className="px-3 py-4 text-center">
              <p className="font-pretendard text-[10px] text-gray-400">
                {status === 'loading' ? '지도 불러오는 중…' : '위치 변환 중…'}
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="font-pretendard text-[10px] text-gray-400">장소가 없습니다</p>
            </div>
          ) : (
            rows.map((row, index) => {
              const cfg = getCategoryConfig(row._category);
              const resolved = resolvedRows[index];
              const hasCoords = resolved?.resolvedLat && resolved?.resolvedLng;
              const isActive = activeIndex === index;

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => hasCoords && handleListItemClick(index)}
                  className={[
                    'w-full text-left px-3 py-2.5',
                    'border-b border-gray-100 last:border-0',
                    'transition-colors',
                    isActive ? 'bg-amber-50' : 'hover:bg-gray-50',
                    hasCoords ? 'cursor-pointer' : 'cursor-default',
                    'border-none bg-transparent',
                  ].join(' ')}
                  style={{
                    borderLeft: `3px solid ${isActive ? cfg.color : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {/* 순번 원 */}
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}60` }}
                    >
                      <span
                        className="font-mono text-[8px] font-bold"
                        style={{ color: cfg.color }}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold tracking-wide"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {row.visitTime && (
                      <span className="text-[8px] text-gray-400 ml-auto font-mono">{row.visitTime}</span>
                    )}
                  </div>
                  <p className="font-pretendard text-[10px] font-medium text-gray-800 leading-tight truncate m-0">
                    {row.title}
                  </p>
                  {!hasCoords && (
                    <p className="font-pretendard text-[8px] text-gray-400 mt-0.5 m-0">주소 없음</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 범례 */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex flex-wrap gap-x-2 gap-y-1">
          {Object.entries(CATEGORY_CONFIG)
            .filter(([k]) => k !== 'DEFAULT')
            .map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[8px] text-gray-500">{cfg.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 우측: 지도 */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />

        {/* 지오코딩 오버레이 */}
        {(status === 'loading' || status === 'geocoding') && (
          <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-pretendard text-body5 text-gray-500">
                {status === 'loading' ? '지도 초기화 중…' : '장소 위치 검색 중…'}
              </p>
            </div>
          </div>
        )}

        {/* 유효 장소 없음 */}
        {status === 'ready' && validRows.length === 0 && (
          <div className="absolute inset-0 bg-gray-50/90 flex items-center justify-center">
            <p className="font-pretendard text-body4 text-gray-500">표시할 장소 정보가 없습니다</p>
          </div>
        )}

        {/* 일차 뱃지 */}
        <div className="absolute top-2 left-2 bg-white/90 border border-gray-200 rounded-md px-2 py-1 shadow-sm pointer-events-none">
          <span className="font-pretendard text-[10px] font-semibold text-gray-700">
            {dayNumber}일차 · {validRows.length}개 표시
          </span>
        </div>
      </div>
    </div>
  );
}
