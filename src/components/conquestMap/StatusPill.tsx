import type { VisitStatus } from "@/api/conquestApi";
import { C, STATUS_COLOR, STATUS_LABEL } from "./constants";

export function StatusPill({ status }: { status: VisitStatus }) {
  const bgMap: Record<VisitStatus, string> = {
    VISITED: `${C.visited}33`,
    PLANNED: `${C.planned}33`,
    UNVISITED: "#f2f2f2",
  };
  const colorMap: Record<VisitStatus, string> = {
    VISITED: "#caa12d",
    PLANNED: "#3f7396",
    UNVISITED: C.muted,
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: bgMap[status], color: colorMap[status],
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 99,
        background: STATUS_COLOR[status], flexShrink: 0,
      }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
