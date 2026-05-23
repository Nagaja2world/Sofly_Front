import type { ItineraryRow } from "@/components/workspace/ItineraryDayCard";

/* ══════════════════════════════════════════
   itineraryMapper
   ══════════════════════════════════════════
   AI 일정 생성 API 응답(itemsByDay)을 화면용 ItineraryRow로 변환.

   왜 매퍼가 필요한가:
   - API 필드명/타입과 UI 표시 모델이 다름. 백엔드를 바꾸지 않고
     프론트에서 흡수한다 (flightMapper와 동일한 패턴).
   - 매핑 규칙:
       name           → title
       memo           → remark
       estimatedCost  → cost     (number → "13,000원" 문자열, 0/null이면 빈 값)
       estimatedCost  → _estimatedCost (원본 숫자도 보존)
       visitTime      → visitTime ("14:30:00" → "14:30")
       category       → _category (내부 메타 필드, 배지 표시는 카드 쪽에서)
       address/lat/lng/placeId/photoReference → _address 등 (지도 연동용)
       id (number)    → id (string)
   - itemsByDay는 { [key]: ItineraryItemApi[] } 형태의 맵이라,
     day 번호 기준으로 정렬해 "일차 카드" 배열로 펼친다.

   데스크톱 ItineraryDayCard와 모바일 CompactItineraryCard가 공용으로 사용.
*/

/* ──────────────────────────────────────────
   API 타입 (응답 스펙)
   ────────────────────────────────────────── */

/** 일정 카테고리 — API enum */
export type ItineraryCategory =
  | "TRANSPORT"
  | "ACCOMMODATION"
  | "RESTAURANT"
  | "CAFE"
  | "ATTRACTION";

/** API의 일정 항목 1개 (itemsByDay 맵의 배열 원소) */
export interface ItineraryItemApi {
  id: number;
  day: number;
  orderIndex: number;
  visitTime: string; // "14:30:00"
  category: ItineraryCategory;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  photoReference?: string;
  memo?: string;
  deepLinkUrl?: string;
  estimatedCost?: number;
  deepLinkClickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** AI 일정 생성 API 응답 전체 */
export interface ScheduleApiResponse {
  id: number;
  workspaceId: number;
  title: string;
  version: number;
  /** 일차별 항목 맵. 키 이름은 의미 없음(additionalProp1 등) — 값 배열의 day로 묶음 */
  itemsByDay: Record<string, ItineraryItemApi[]>;
}

/* ──────────────────────────────────────────
   포맷 헬퍼
   ────────────────────────────────────────── */

/** "14:30:00" → "14:30" — 초 단위 절삭. 형식이 어긋나면 원본 그대로. */
export function formatVisitTime(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : raw;
}

/** 비용 number → "13,000원". 0·null·undefined·음수면 undefined(→ 카드에서 "-"). */
export function formatCost(value?: number | null): string | undefined {
  if (value == null || value <= 0) return undefined;
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/* ──────────────────────────────────────────
   변환
   ────────────────────────────────────────── */

/** API 항목 1개 → ItineraryRow */
export function mapItineraryItem(api: ItineraryItemApi): ItineraryRow {
  return {
    id: String(api.id),
    title: api.name ?? "",
    /* C-2 결정: 이동 교통편/이동시간은 API에 없고 AI 환각 위험이 커서 제외.
       대신 visitTime/_category를 사용. */
    visitTime: formatVisitTime(api.visitTime),
    cost: formatCost(api.estimatedCost),
    remark: api.memo?.trim() || undefined,
    /* 내부 메타데이터 — ItineraryRow의 `_` 프리픽스 컨벤션을 따름.
       _category는 표/카드의 "분류" 배지에 쓰이고,
       나머지(_placeId/좌표 등)는 지도·장소 연동용. */
    _category: api.category,
    _address: api.address ?? null,
    _latitude: api.latitude ?? null,
    _longitude: api.longitude ?? null,
    _placeId: api.placeId ?? null,
    _photoReference: api.photoReference ?? null,
    _estimatedCost: api.estimatedCost ?? null,
  };
}

/** 한 일차의 항목 배열 → orderIndex 순으로 정렬된 ItineraryRow 배열 */
function mapDayRows(items: ItineraryItemApi[]): ItineraryRow[] {
  return [...items]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(mapItineraryItem);
}

/** 한 일차 = 카드 하나에 필요한 데이터 */
export interface ItineraryDay {
  dayNumber: number;
  rows: ItineraryRow[];
}

/**
 * API 응답 전체 → 일차 카드 배열.
 * itemsByDay 맵을 펼쳐 day 번호로 묶고, day 오름차순 정렬.
 * 같은 day가 여러 맵 키에 흩어져 있어도 하나로 합친다.
 */
export function mapScheduleToDays(res: ScheduleApiResponse): ItineraryDay[] {
  /* day → 항목들 누적 */
  const byDay = new Map<number, ItineraryItemApi[]>();

  for (const items of Object.values(res.itemsByDay ?? {})) {
    for (const item of items) {
      const list = byDay.get(item.day) ?? [];
      list.push(item);
      byDay.set(item.day, list);
    }
  }

  return [...byDay.entries()]
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([dayNumber, items]) => ({
      dayNumber,
      rows: mapDayRows(items),
    }));
}
