import { useCallback, useSyncExternalStore } from "react";

/* ══════════════════════════════════════════
   useMediaQuery
   ══════════════════════════════════════════
   CSS 미디어 쿼리 조건을 JavaScript에서 실시간으로 구독하는 훅.

   왜 필요한가:
   - 기존 WorkspacePage는 `md:hidden` / `hidden md:block` CSS 분기를 사용해
     모바일/데스크톱 마크업을 둘 다 DOM에 렌더링해 두고 display로만 한쪽을 숨김.
   - 그 방식은 안 보이는 쪽의 컴포넌트 트리도 React가 마운트하고
     useEffect / API 호출이 전부 실행됨 → 불필요한 작업.
   - 이 훅을 쓰면 조건에 맞는 한쪽 트리만 실제로 렌더 → effect/요청도 한 번만.

   왜 useSyncExternalStore 인가:
   - 이전 구현은 useState + useEffect 조합이었는데, effect 본문에서
     setMatches(...)를 동기 호출해 "Calling setState synchronously within an
     effect can trigger cascading renders" 경고가 발생했음.
   - useSyncExternalStore는 React가 "외부 스토어 구독" 전용으로 제공하는 훅.
     · subscribe          : 변화 구독 등록/해제
     · getSnapshot        : 현재 값 읽기 (클라이언트)
     · getServerSnapshot  : SSR 시 값 (이 프로젝트는 CSR이므로 false 고정)
   - effect 내 동기 setState가 구조적으로 존재하지 않으므로 위 경고가 원천 차단되고,
     query가 바뀌어도 React가 알아서 재구독 + 최신 스냅샷을 읽어 일관성을 보장함.

   참조 안정성:
   - useSyncExternalStore는 subscribe 참조가 바뀌면 재구독한다.
   - subscribe / getSnapshot을 useCallback([query])으로 감싸 query가 같으면
     동일 참조를 유지 → 불필요한 재구독 방지.

   주의:
   - window가 없는 환경(SSR/테스트)에서는 getServerSnapshot이 false를 반환.
*/
export function useMediaQuery(query: string): boolean {
  /* 구독 함수: matchMedia의 change 이벤트에 콜백을 연결하고 해제 함수를 반환.
     query가 같은 동안에는 같은 함수 참조를 유지(useCallback). */
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {};
      }
      const mql = window.matchMedia(query);

      /* addEventListener는 비교적 최신 API. 구형 Safari 대비 fallback 포함. */
      if (mql.addEventListener) {
        mql.addEventListener("change", onStoreChange);
        return () => mql.removeEventListener("change", onStoreChange);
      } else {
        /* @deprecated 구형 브라우저 호환 */
        mql.addListener(onStoreChange);
        return () => mql.removeListener(onStoreChange);
      }
    },
    [query],
  );

  /* 현재 스냅샷(클라이언트): 지금 이 순간 query가 매치되는지. */
  const getSnapshot = useCallback((): boolean => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  /* SSR 스냅샷: 서버에는 화면 크기 개념이 없으므로 false 고정.
     이 프로젝트는 Vite CSR이라 실제로는 거의 호출되지 않음. */
  const getServerSnapshot = (): boolean => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ──────────────────────────────────────────
   프로젝트 공용 브레이크포인트 헬퍼
   ──────────────────────────────────────────
   Tailwind의 md = 768px. 기존 CSS 분기(`md:hidden`)와 정확히 일치시키려면
   "좁은 화면"은 max-width: 767px 로 잡아야 함.

   - md:hidden        → 화면 < 768px 일 때 보임  → useIsCompact() === true
   - hidden md:block  → 화면 >= 768px 일 때 보임 → useIsCompact() === false
*/
const COMPACT_QUERY = "(max-width: 767px)";

/** 화면이 좁은(compact) 상태인지 여부. 모바일뿐 아니라 창을 좁힌 데스크톱/탭도 포함. */
export function useIsCompact(): boolean {
  return useMediaQuery(COMPACT_QUERY);
}

export default useMediaQuery;
