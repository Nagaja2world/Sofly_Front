import type { VisitStatus } from "@/api/conquestApi";
import { C, STATUS_COLOR, STATUS_LABEL } from "./constants";
import type { ModalCtx } from "./types";
import { pillBtn } from "./utils";

interface Props {
  ctx: ModalCtx;
  selectedStatus: VisitStatus;
  loading: boolean;
  onSelectStatus: (s: VisitStatus) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function StatusModal({ ctx, selectedStatus, loading, onSelectStatus, onConfirm, onClose }: Props) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            {ctx.name} 상태 변경
          </h3>
          <p style={{ fontSize: 12, color: C.muted }}>현재: {STATUS_LABEL[ctx.status]}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["VISITED", "PLANNED", "UNVISITED"] as VisitStatus[]).map((s) => (
            <div
              key={s}
              onClick={() => onSelectStatus(s)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                border: `2px solid ${selectedStatus === s ? C.text : C.border}`,
                cursor: "pointer",
                background: selectedStatus === s ? `${C.text}08` : C.bg,
                transition: "all .15s",
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[s], flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{STATUS_LABEL[s]}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {s === "VISITED"
                    ? "이미 방문한 곳"
                    : s === "PLANNED"
                    ? "항공권 보유 또는 계획 중"
                    : "아직 방문하지 않은 곳"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={pillBtn()}>취소</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ ...pillBtn(true), opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "처리 중..." : "변경"}
          </button>
        </div>
      </div>
    </div>
  );
}
