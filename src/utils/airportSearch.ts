// src/utils/airportSearch.ts

/** airports.json 한 행 (짧은 키) */
interface RawAirport {
  c: string; // IATA code
  en: string; // 영문 공항명
  kn: string; // 한글 공항명
  ec: string; // 영문 도시명
  kc: string; // 한글 도시명
  ko: string; // 한글 국가명
}

/** UI에서 쓰는 공항 검색 결과 */
export interface AirportEntry {
  code: string;
  enName: string;
  koName: string;
  enCity: string;
  koCity: string;
  koCountry: string;
}

let cache: AirportEntry[] | null = null;
let loadingPromise: Promise<AirportEntry[]> | null = null;

/** airports.json lazy 로드 (최초 1회만 fetch, 이후 메모리 캐시) */
export async function loadAirports(): Promise<AirportEntry[]> {
  if (cache) return cache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch("/data/airports.json")
    .then((res) => {
      if (!res.ok) throw new Error(`airports.json 로드 실패: ${res.status}`);
      return res.json() as Promise<RawAirport[]>;
    })
    .then((raw) => {
      cache = raw.map((r) => ({
        code: r.c,
        enName: r.en,
        koName: r.kn,
        enCity: r.ec,
        koCity: r.kc,
        koCountry: r.ko,
      }));
      return cache;
    })
    .catch((err) => {
      loadingPromise = null; // 실패 시 재시도 가능하게
      throw err;
    });

  return loadingPromise;
}

/** 검색어 정규화: 소문자 + 공백 제거 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * 로컬 공항 검색.
 * 한글명/영문명/도시명/IATA 코드 어느 것으로 입력해도 매칭.
 * - 코드 정확 일치 → 최상위
 * - 도시명/공항명 시작 일치 → 다음
 * - 부분 포함 → 그 다음
 */
export function searchAirports(
  list: AirportEntry[],
  query: string,
  limit = 20,
): AirportEntry[] {
  const q = normalize(query);
  if (!q) return [];

  const scored: Array<{ item: AirportEntry; score: number }> = [];

  for (const a of list) {
    const code = a.code.toLowerCase();
    const fields = [
      normalize(a.koCity),
      normalize(a.koName),
      normalize(a.enCity),
      normalize(a.enName),
    ];

    let score = -1;

    if (code === q) {
      score = 0; // IATA 정확 일치
    } else if (fields.some((f) => f.startsWith(q))) {
      score = 1; // 시작 일치
    } else if (code.startsWith(q)) {
      score = 2;
    } else if (fields.some((f) => f.includes(q))) {
      score = 3; // 부분 포함
    }

    if (score >= 0) scored.push({ item: a, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.item);
}
