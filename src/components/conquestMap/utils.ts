import { C } from "./constants";

export function genArc(
  from: [number, number],
  to: [number, number],
  n = 80
): [number, number][] {
  let [x1, y1] = from;
  let [x2, y2] = to;
  if (Math.abs(x2 - x1) > 180) x2 += x2 > x1 ? -360 : 360;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const cy = my + d * 0.28;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    pts.push([
      mt * mt * x1 + 2 * mt * t * mx + t * t * x2,
      mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
    ]);
  }
  return pts;
}

export const pillBtn = (primary = false): React.CSSProperties => ({
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "Pretendard, -apple-system, sans-serif",
  background: primary ? C.text : C.white,
  color: primary ? C.white : C.subtle,
  border: primary ? "none" : `1px solid ${C.borderMid}`,
  borderRadius: 99,
  cursor: "pointer",
});
